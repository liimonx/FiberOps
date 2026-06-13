"use client";

import { useEffect, useMemo } from "react";
import type mapboxgl from "mapbox-gl";
import { useNetworkMapStore, useLayers } from "../stores/useNetworkMapStore";
import { isPlanningLayerVisible } from "../utils/layerVisibility";
import {
  areasToGeoJSON,
  proposalsToPlanningGeoJSON,
  routesToGeoJSON,
} from "../utils/planningGeoUtils";
import { createImpairmentCircleGeoJSON } from "../utils/impairmentUtils";
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
const DRAFT_PENDING_SOURCE_ID = "planning-draft-pending";

function removePlanningLayers(map: mapboxgl.Map) {
  for (const id of [
    ROUTES_LAYER_ID,
    AREAS_LINE_LAYER_ID,
    AREAS_FILL_LAYER_ID,
    DRAFT_ROUTES_LAYER_ID,
    DRAFT_AREAS_LINE_LAYER_ID,
    DRAFT_AREAS_FILL_LAYER_ID,
    `${DRAFT_AREAS_FILL_LAYER_ID}-pending`,
    `${DRAFT_AREAS_LINE_LAYER_ID}-pending`,
  ]) {
    if (map.getLayer(id)) map.removeLayer(id);
  }
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

function setOrCreateSource(
  map: mapboxgl.Map,
  sourceId: string,
  data: GeoJSON.FeatureCollection
) {
  const existing = map.getSource(sourceId) as mapboxgl.GeoJSONSource | undefined;
  if (existing) {
    existing.setData(data);
    return;
  }
  map.addSource(sourceId, { type: "geojson", data });
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

  setOrCreateSource(map, AREAS_SOURCE_ID, areasData);
  setOrCreateSource(map, ROUTES_SOURCE_ID, routesData);
  setOrCreateSource(map, DRAFT_AREAS_SOURCE_ID, draftAreasData);
  setOrCreateSource(map, DRAFT_ROUTES_SOURCE_ID, draftRoutesData);

  if (pendingAreaData) {
    setOrCreateSource(map, DRAFT_PENDING_SOURCE_ID, pendingAreaData);
  } else if (map.getSource(DRAFT_PENDING_SOURCE_ID)) {
    if (map.getLayer(DRAFT_AREAS_FILL_LAYER_ID + "-pending")) {
      map.removeLayer(DRAFT_AREAS_FILL_LAYER_ID + "-pending");
    }
    if (map.getLayer(DRAFT_AREAS_LINE_LAYER_ID + "-pending")) {
      map.removeLayer(DRAFT_AREAS_LINE_LAYER_ID + "-pending");
    }
    map.removeSource(DRAFT_PENDING_SOURCE_ID);
  }

  const ensureLayer = (
    id: string,
    type: "fill" | "line",
    source: string,
    paint: mapboxgl.FillPaint | mapboxgl.LinePaint
  ) => {
    if (map.getLayer(id)) {
      const dasharray = (paint as mapboxgl.LinePaint | undefined)?.["line-dasharray"];
      if (dasharray) {
        map.setPaintProperty(id, "line-dasharray", dasharray);
      }
      return;
    }
    map.addLayer({ id, type, source, paint });
  };

  ensureLayer(AREAS_FILL_LAYER_ID, "fill", AREAS_SOURCE_ID, {
    "fill-color": colors.success,
    "fill-opacity": 0.12,
  });
  ensureLayer(AREAS_LINE_LAYER_ID, "line", AREAS_SOURCE_ID, {
    "line-color": colors.success,
    "line-width": 2,
    "line-dasharray": ["literal", [4, 3]],
  });
  ensureLayer(ROUTES_LAYER_ID, "line", ROUTES_SOURCE_ID, {
    "line-color": colors.secondary,
    "line-width": 3,
    "line-dasharray": ["literal", [4, 3]],
  });
  ensureLayer(DRAFT_AREAS_FILL_LAYER_ID, "fill", DRAFT_AREAS_SOURCE_ID, {
    "fill-color": colors.primary,
    "fill-opacity": 0.2,
  });
  ensureLayer(DRAFT_AREAS_LINE_LAYER_ID, "line", DRAFT_AREAS_SOURCE_ID, {
    "line-color": colors.primary,
    "line-width": 2,
  });
  ensureLayer(DRAFT_ROUTES_LAYER_ID, "line", DRAFT_ROUTES_SOURCE_ID, {
    "line-color": colors.warning,
    "line-width": 3,
  });

  if (pendingAreaData && map.getSource(DRAFT_PENDING_SOURCE_ID)) {
    const fillId = `${DRAFT_AREAS_FILL_LAYER_ID}-pending`;
    const lineId = `${DRAFT_AREAS_LINE_LAYER_ID}-pending`;
    if (!map.getLayer(fillId)) {
      map.addLayer({
        id: fillId,
        type: "fill",
        source: DRAFT_PENDING_SOURCE_ID,
        filter: ["==", ["get", "role"], "blast"],
        paint: {
          "fill-color": colors.warning,
          "fill-opacity": 0.22,
        },
      });
    }
    if (!map.getLayer(lineId)) {
      map.addLayer({
        id: lineId,
        type: "line",
        source: DRAFT_PENDING_SOURCE_ID,
        filter: ["==", ["get", "role"], "blast"],
        paint: {
          "line-color": colors.warning,
          "line-width": 2,
          "line-dasharray": ["literal", [2, 2]],
        },
      });
    }
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
        activeTool === "plan" && planRouteWaypoints.length >= 2
          ? {
              type: "FeatureCollection" as const,
              features: [
                {
                  type: "Feature" as const,
                  properties: { kind: "planning-route-draft" },
                  geometry: {
                    type: "LineString" as const,
                    coordinates: planRouteWaypoints.map(
                      (p) => [p.lng, p.lat] as [number, number]
                    ),
                  },
                },
              ],
            }
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
