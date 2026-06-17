import type {
  LatLng,
  PlanningAreaGeometry,
  PlanningProposal,
  PlanningRouteGeometry,
} from "@/types/domain";
import { createImpairmentCircleGeoJSON } from "./impairmentUtils";

function polygonToFeature(
  coordinates: LatLng[],
  properties: Record<string, unknown>
): GeoJSON.Feature {
  const ring = coordinates.map((c) => [c.lng, c.lat] as [number, number]);
  if (ring.length > 0) {
    const first = ring[0];
    const last = ring[ring.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      ring.push(first);
    }
  }

  return {
    type: "Feature",
    properties,
    geometry: {
      type: "Polygon",
      coordinates: [ring],
    },
  };
}

function circleToFeature(
  area: Extract<PlanningAreaGeometry, { type: "circle" }>,
  properties: Record<string, unknown>
): GeoJSON.Feature {
  const collection = createImpairmentCircleGeoJSON(
    area.center,
    area.radiusMeters
  );
  const blast = collection.features.find((f) => f.properties?.role === "blast");
  if (!blast) {
    return {
      type: "Feature",
      properties,
      geometry: { type: "Polygon", coordinates: [[]] },
    };
  }
  return {
    type: "Feature",
    properties: { ...blast.properties, ...properties },
    geometry: blast.geometry as GeoJSON.Polygon,
  };
}

export function areasToGeoJSON(
  areas: PlanningAreaGeometry[],
  idPrefix: string
): GeoJSON.FeatureCollection {
  const features = areas.map((area, index) => {
    const props = { id: `${idPrefix}-area-${index}`, kind: "planning-area" };
    if (area.type === "circle") {
      return circleToFeature(area, props);
    }
    return polygonToFeature(area.coordinates, props);
  });

  return { type: "FeatureCollection", features };
}

export function routesToGeoJSON(
  routes: PlanningRouteGeometry[],
  idPrefix: string
): GeoJSON.FeatureCollection {
  const features = routes
    .filter((route) => route.waypoints.length >= 2)
    .map((route, index) => ({
      type: "Feature" as const,
      properties: { id: `${idPrefix}-route-${index}`, kind: "planning-route" },
      geometry: {
        type: "LineString" as const,
        coordinates: route.waypoints.map(
          (p) => [p.lng, p.lat] as [number, number]
        ),
      },
    }));

  return { type: "FeatureCollection", features };
}

export function proposalsToPlanningGeoJSON(
  proposals: PlanningProposal[]
): {
  areas: GeoJSON.FeatureCollection;
  routes: GeoJSON.FeatureCollection;
} {
  const areaFeatures: GeoJSON.Feature[] = [];
  const routeFeatures: GeoJSON.Feature[] = [];

  for (const proposal of proposals) {
    const areas = areasToGeoJSON(proposal.areas, proposal.id);
    const routes = routesToGeoJSON(proposal.routes, proposal.id);
    areaFeatures.push(...areas.features);
    routeFeatures.push(...routes.features);
  }

  return {
    areas: { type: "FeatureCollection", features: areaFeatures },
    routes: { type: "FeatureCollection", features: routeFeatures },
  };
}

export function routeWaypointsToGeoJSON(
  waypoints: LatLng[],
  idPrefix: string
): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = waypoints.map((point, index) => ({
    type: "Feature",
    properties: {
      id: `${idPrefix}-wp-${index}`,
      kind: "planning-route-waypoint",
      index: index + 1,
    },
    geometry: {
      type: "Point",
      coordinates: [point.lng, point.lat],
    },
  }));

  if (waypoints.length >= 2) {
    features.push({
      type: "Feature",
      properties: { id: `${idPrefix}-line`, kind: "planning-route-draft" },
      geometry: {
        type: "LineString",
        coordinates: waypoints.map((p) => [p.lng, p.lat] as [number, number]),
      },
    });
  }

  return { type: "FeatureCollection", features };
}

export function isPlanGeometryDirty(
  draftAreas: PlanningAreaGeometry[],
  draftRoutes: PlanningRouteGeometry[],
  savedAreas: PlanningAreaGeometry[],
  savedRoutes: PlanningRouteGeometry[]
): boolean {
  return (
    JSON.stringify({ areas: draftAreas, routes: draftRoutes }) !==
    JSON.stringify({ areas: savedAreas, routes: savedRoutes })
  );
}

export function collectLatLngPoints(
  proposals: PlanningProposal[],
  draftAreas: PlanningAreaGeometry[],
  draftRoutes: PlanningRouteGeometry[],
  pendingArea: { center: LatLng; radiusMeters: number } | null,
  pendingRouteWaypoints: LatLng[]
): LatLng[] {
  const points: LatLng[] = [];

  const addAreas = (areas: PlanningAreaGeometry[]) => {
    for (const area of areas) {
      if (area.type === "circle") {
        points.push(area.center);
      } else {
        points.push(...area.coordinates);
      }
    }
  };

  const addRoutes = (routes: PlanningRouteGeometry[]) => {
    for (const route of routes) {
      points.push(...route.waypoints);
    }
  };

  for (const proposal of proposals) {
    addAreas(proposal.areas);
    addRoutes(proposal.routes);
  }

  addAreas(draftAreas);
  addRoutes(draftRoutes);

  if (pendingArea) {
    points.push(pendingArea.center);
  }
  points.push(...pendingRouteWaypoints);

  return points;
}
