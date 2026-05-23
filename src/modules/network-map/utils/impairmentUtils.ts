import type { NetworkConnection, NetworkNode } from "../types";
import { LatLng, NetworkNodeType } from "../types";

/** Haversine distance in meters between two WGS84 points. */
export function distanceMeters(a: LatLng, b: LatLng): number {
  const R = 6371e3;
  const phi1 = (a.lat * Math.PI) / 180;
  const phi2 = (b.lat * Math.PI) / 180;
  const dPhi = ((b.lat - a.lat) * Math.PI) / 180;
  const dLambda = ((b.lng - a.lng) * Math.PI) / 180;

  const sinHalf =
    Math.sin(dPhi / 2) * Math.sin(dPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLambda / 2) * Math.sin(dLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(sinHalf), Math.sqrt(1 - sinHalf));

  return R * c;
}

export interface ImpairmentArea {
  center: LatLng;
  radius: number;
}

export interface ImpairmentImpact {
  nodes: NetworkNode[];
  connections: NetworkConnection[];
  customersCount: number;
}

/**
 * Nodes inside the blast radius, plus any node on a connection touching that set
 * (drop cables often extend outside the circle).
 */
export function computeImpairmentImpact(
  area: ImpairmentArea,
  nodes: NetworkNode[],
  connections: NetworkConnection[]
): ImpairmentImpact {
  const inRadius = nodes.filter(
    (n) => distanceMeters(area.center, n.position) <= area.radius
  );
  const impactedNodeIds = new Set(inRadius.map((n) => n.id));

  const impactedConnections = connections.filter(
    (c) =>
      impactedNodeIds.has(c.sourceNodeId) || impactedNodeIds.has(c.targetNodeId)
  );

  for (const conn of impactedConnections) {
    impactedNodeIds.add(conn.sourceNodeId);
    impactedNodeIds.add(conn.targetNodeId);
  }

  const impactedNodes = nodes.filter((n) => impactedNodeIds.has(n.id));
  const customersCount = impactedNodes.filter(
    (n) => n.type === NetworkNodeType.CUSTOMER
  ).length;

  return {
    nodes: impactedNodes,
    connections: impactedConnections,
    customersCount,
  };
}

/** GeoJSON circle matching {@link distanceMeters} (not a flat-degree approximation). */
export function createImpairmentCircleGeoJSON(
  center: LatLng,
  radiusMeters: number,
  points = 64
): GeoJSON.FeatureCollection {
  const coords: [number, number][] = [];

  for (let i = 0; i < points; i++) {
    const bearing = (i * 360) / points;
    const dest = destinationPoint(center, radiusMeters, bearing);
    coords.push([dest.lng, dest.lat]);
  }
  coords.push(coords[0]);

  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: { type: "Polygon", coordinates: [coords] },
        properties: { role: "blast" },
      },
      {
        type: "Feature",
        geometry: { type: "Point", coordinates: [center.lng, center.lat] },
        properties: { role: "center" },
      },
    ],
  };
}

function destinationPoint(
  origin: LatLng,
  distanceM: number,
  bearingDeg: number
): LatLng {
  const R = 6371e3;
  const brng = (bearingDeg * Math.PI) / 180;
  const lat1 = (origin.lat * Math.PI) / 180;
  const lng1 = (origin.lng * Math.PI) / 180;
  const angDist = distanceM / R;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(angDist) +
      Math.cos(lat1) * Math.sin(angDist) * Math.cos(brng)
  );
  const lng2 =
    lng1 +
    Math.atan2(
      Math.sin(brng) * Math.sin(angDist) * Math.cos(lat1),
      Math.cos(angDist) - Math.sin(lat1) * Math.sin(lat2)
    );

  return {
    lat: (lat2 * 180) / Math.PI,
    lng: (lng2 * 180) / Math.PI,
  };
}
