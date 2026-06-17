"use client";

import { useEffect, useMemo } from "react";
import type mapboxgl from "mapbox-gl";
import { useNetworkMapStore, useLayers } from "../stores/useNetworkMapStore";
import { isPlanningLayerVisible } from "../utils/layerVisibility";
import {
  areasToGeoJSON,
  proposalsToPlanningGeoJSON,
  routeWaypointsToGeoJSON,
  routesToGeoJSON,
} from "../utils/planningGeoUtils";
import { createImpairmentCircleGeoJSON } from "../utils/impairmentUtils";
import {
  ensureMapLayer,
  removeMapLayers,
  removeMapLayersAndSource,
  setOrCreateGeoJsonSource,
} from "../utils/mapGeoJsonSync";
import { getThemeColors } from "@/lib/themeColors";

type PlanningVisualizationProps = {
  mapInstance: mapboxgl.Map | null;
};

const AREAS_SOURCE_ID = "planning-areas";
const ROUTES_SOURCE_ID = "planning-routes";
const AREAS_FILL_LAYER_ID = "planning-areas-fill";
const AREAS_LINE_LAYER_ID = "planning-areas-line";
const ROUTES_LAYER_ID = "planning-routes-line";
const DRAFT_AREAS_SOURCE_ID = "planning-draft-areas";
const DRAFT_ROUTES_SOURCE_ID = "planning-draft-routes";
const DRAFT_AREAS_FILL_LAYER_ID = "planning-draft-areas-fill";
const DRAFT_AREAS_LINE_LAYER_ID = "planning-draft-areas-line";
const DRAFT_ROUTES_LAYER_ID = "planning-draft-routes-line";
const DRAFT_ROUTE_POINTS_LAYER_ID = "planning-draft-routes-points";
const DRAFT_PENDING_SOURCE_ID = "planning-draft-pending";
const DRAFT_PENDING_FILL_LAYER_ID = `${DRAFT_AREAS_FILL_LAYER_ID}-pending`;
const DRAFT_PENDING_LINE_LAYER_ID = `${DRAFT_AREAS_LINE_LAYER_ID}-pending`;
const DRAFT_PENDING_CENTER_LAYER_ID = `${DRAFT_AREAS_FILL_LAYER_ID}-pending-center`;

const BLAST_FILTER: mapboxgl.Expression = ["==", ["get", "role"], "blast"];
const CENTER_FILTER: mapboxgl.Expression = ["==", ["get", "role"], "center"];
const ROUTE_LINE_FILTER: mapboxgl.Expression = [
  "!=",
  ["get", "kind"],
  "planning-route-waypoint",
];
const ROUTE_POINT_FILTER: mapboxgl.Expression = [
  "==",
  ["get", "kind"],
  "planning-route-waypoint",
];

const ALL_LAYER_IDS = [
  ROUTES_LAYER_ID,
  AREAS_LINE_LAYER_ID,
  AREAS_FILL_LAYER_ID,
  DRAFT_ROUTE_POINTS_LAYER_ID,
  DRAFT_ROUTES_LAYER_ID,
  DRAFT_AREAS_LINE_LAYER_ID,
  DRAFT_AREAS_FILL_LAYER_ID,
  DRAFT_PENDING_CENTER_LAYER_ID,
  DRAFT_PENDING_LINE_LAYER_ID,
  DRAFT_PENDING_FILL_LAYER_ID,
];

function removePlanningLayers(map: mapboxgl.Map) {
  removeMapLayers(map, ALL_LAYER_IDS);
  for (const id of [
    AREAS_SOURCE_ID,
    ROUTES_SOURCE_ID,
    DRAFT_AREAS_SOURCE_ID,
    DRAFT_ROUTES_SOURCE_ID,
    DRAFT_PENDING_SOURCE_ID,
  ]) {
    if (map.getSource(id)) map.removeSource(id);
  }
}

function syncPlanningLayers(
  map: mapboxgl.Map,
  visible: boolean,
  areasData: GeoJSON.FeatureCollection,
  routesData: GeoJSON.FeatureCollection,
  draftAreasData: GeoJSON.FeatureCollection,
  draftRoutesData: GeoJSON.FeatureCollection,
  pendingAreaData: GeoJSON.FeatureCollection | null
) {
  if (!map.isStyleLoaded()) return;

  const colors = getThemeColors();

  if (!visible) {
    removePlanningLayers(map);
    return;
  }

  setOrCreateGeoJsonSource(map, AREAS_SOURCE_ID, areasData);
  setOrCreateGeoJsonSource(map, ROUTES_SOURCE_ID, routesData);
  setOrCreateGeoJsonSource(map, DRAFT_AREAS_SOURCE_ID, draftAreasData);
  setOrCreateGeoJsonSource(map, DRAFT_ROUTES_SOURCE_ID, draftRoutesData);

  if (pendingAreaData) {
    setOrCreateGeoJsonSource(map, DRAFT_PENDING_SOURCE_ID, pendingAreaData);
  } else if (map.getSource(DRAFT_PENDING_SOURCE_ID)) {
    removeMapLayersAndSource(
      map,
      [
        DRAFT_PENDING_FILL_LAYER_ID,
        DRAFT_PENDING_LINE_LAYER_ID,
        DRAFT_PENDING_CENTER_LAYER_ID,
      ],
      DRAFT_PENDING_SOURCE_ID
    );
  }

  ensureMapLayer(map, {
    id: AREAS_FILL_LAYER_ID,
    type: "fill",
    source: AREAS_SOURCE_ID,
    paint: {
      "fill-color": colors.success,
      "fill-opacity": 0.12,
    },
  });
  ensureMapLayer(map, {
    id: AREAS_LINE_LAYER_ID,
    type: "line",
    source: AREAS_SOURCE_ID,
    paint: {
      "line-color": colors.success,
      "line-width": 2,
      "line-dasharray": ["literal", [4, 3]],
    },
  });
  ensureMapLayer(map, {
    id: ROUTES_LAYER_ID,
    type: "line",
    source: ROUTES_SOURCE_ID,
    paint: {
      "line-color": colors.secondary,
      "line-width": 3,
      "line-dasharray": ["literal", [4, 3]],
    },
  });
  ensureMapLayer(map, {
    id: DRAFT_AREAS_FILL_LAYER_ID,
    type: "fill",
    source: DRAFT_AREAS_SOURCE_ID,
    paint: {
      "fill-color": colors.primary,
      "fill-opacity": 0.2,
    },
  });
  ensureMapLayer(map, {
    id: DRAFT_AREAS_LINE_LAYER_ID,
    type: "line",
    source: DRAFT_AREAS_SOURCE_ID,
    paint: {
      "line-color": colors.primary,
      "line-width": 2,
    },
  });
  ensureMapLayer(map, {
    id: DRAFT_ROUTES_LAYER_ID,
    type: "line",
    source: DRAFT_ROUTES_SOURCE_ID,
    filter: ROUTE_LINE_FILTER,
    paint: {
      "line-color": colors.warning,
      "line-width": 3,
    },
  });
  ensureMapLayer(map, {
    id: DRAFT_ROUTE_POINTS_LAYER_ID,
    type: "circle",
    source: DRAFT_ROUTES_SOURCE_ID,
    filter: ROUTE_POINT_FILTER,
    paint: {
      "circle-radius": 5,
      "circle-color": colors.warning,
      "circle-stroke-width": 2,
      "circle-stroke-color": "#FFFFFF",
    },
  });

  if (pendingAreaData && map.getSource(DRAFT_PENDING_SOURCE_ID)) {
    ensureMapLayer(map, {
      id: DRAFT_PENDING_FILL_LAYER_ID,
      type: "fill",
      source: DRAFT_PENDING_SOURCE_ID,
      filter: BLAST_FILTER,
      paint: {
        "fill-color": colors.warning,
        "fill-opacity": 0.22,
      },
    });
    ensureMapLayer(map, {
      id: DRAFT_PENDING_LINE_LAYER_ID,
      type: "line",
      source: DRAFT_PENDING_SOURCE_ID,
      filter: BLAST_FILTER,
      paint: {
        "line-color": colors.warning,
        "line-width": 2,
        "line-dasharray": ["literal", [2, 2]],
      },
    });
    ensureMapLayer(map, {
      id: DRAFT_PENDING_CENTER_LAYER_ID,
      type: "circle",
      source: DRAFT_PENDING_SOURCE_ID,
      filter: CENTER_FILTER,
      paint: {
        "circle-radius": 5,
        "circle-color": colors.warning,
        "circle-stroke-width": 2,
        "circle-stroke-color": "#FFFFFF",
      },
    });
  }
}

export function PlanningVisualization({ mapInstance }: PlanningVisualizationProps) {
  const layers = useLayers();
  const visible = isPlanningLayerVisible(layers);
  const planningOverlays = useNetworkMapStore((state) => state.planningOverlays);
  const planDraftAreas = useNetworkMapStore((state) => state.planDraftAreas);
  const planDraftRoutes = useNetworkMapStore((state) => state.planDraftRoutes);
  const planPendingArea = useNetworkMapStore((state) => state.planPendingArea);
  const planRouteWaypoints = useNetworkMapStore((state) => state.planRouteWaypoints);
  const planDrawMode = useNetworkMapStore((state) => state.planDrawMode);
  const activeTool = useNetworkMapStore((state) => state.interaction.activeTool);

  const { areasData, routesData, draftAreasData, draftRoutesData, pendingAreaData } =
    useMemo(() => {
      const saved = proposalsToPlanningGeoJSON(planningOverlays);
      const draftAreas = areasToGeoJSON(planDraftAreas, "draft");
      const draftRoutes = routesToGeoJSON(planDraftRoutes, "draft");

      let pending: GeoJSON.FeatureCollection | null = null;
      if (planPendingArea) {
        pending = createImpairmentCircleGeoJSON(
          planPendingArea.center,
          planPendingArea.radiusMeters
        );
      }

      const pendingRoute =
        activeTool === "plan" &&
        planDrawMode === "route" &&
        planRouteWaypoints.length > 0
          ? routeWaypointsToGeoJSON(planRouteWaypoints, "pending")
          : null;

      const mergedDraftRoutes = pendingRoute
        ? {
            type: "FeatureCollection" as const,
            features: [...draftRoutes.features, ...pendingRoute.features],
          }
        : draftRoutes;

      return {
        areasData: saved.areas,
        routesData: saved.routes,
        draftAreasData: draftAreas,
        draftRoutesData: mergedDraftRoutes,
        pendingAreaData: pending,
      };
    }, [
      planningOverlays,
      planDraftAreas,
      planDraftRoutes,
      planPendingArea,
      planRouteWaypoints,
      planDrawMode,
      activeTool,
    ]);

  useEffect(() => {
    if (!mapInstance) return;

    const apply = () =>
      syncPlanningLayers(
        mapInstance,
        visible,
        areasData,
        routesData,
        draftAreasData,
        draftRoutesData,
        pendingAreaData
      );

    if (mapInstance.isStyleLoaded()) {
      apply();
    } else {
      mapInstance.once("style.load", apply);
    }

    mapInstance.on("style.load", apply);
    return () => {
      mapInstance.off("style.load", apply);
    };
  }, [
    mapInstance,
    visible,
    areasData,
    routesData,
    draftAreasData,
    draftRoutesData,
    pendingAreaData,
  ]);

  useEffect(() => {
    return () => {
      if (mapInstance?.isStyleLoaded()) {
        removePlanningLayers(mapInstance);
      }
    };
  }, [mapInstance]);

  return null;
}
