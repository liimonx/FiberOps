import type { NetworkNode } from "../../types";

export interface Offset {
  dlng: number;
  dlat: number;
}

/** Closed rectangular ring in WGS84 (axis-aligned footprint). */
export function rectRing(
  lng: number,
  lat: number,
  halfW: number,
  halfL: number,
  offset: Offset = { dlng: 0, dlat: 0 }
): [number, number][] {
  const cx = lng + offset.dlng;
  const cy = lat + offset.dlat;
  return [
    [cx - halfW, cy - halfL],
    [cx + halfW, cy - halfL],
    [cx + halfW, cy + halfL],
    [cx - halfW, cy + halfL],
    [cx - halfW, cy - halfL],
  ];
}

export function nodeFeatureProperties(
  node: NetworkNode,
  partId: string,
  height: number,
  minHeight = 0,
  extra?: Record<string, unknown>
): GeoJSON.GeoJsonProperties {
  return {
    ...node,
    id: partId,
    type: String(node.type),
    status: String(node.status),
    height,
    min_height: minHeight,
    ...extra,
  };
}

export function extrusionPart(
  node: NetworkNode,
  partId: string,
  ring: [number, number][],
  height: number,
  minHeight = 0
): GeoJSON.Feature {
  return {
    type: "Feature",
    geometry: { type: "Polygon", coordinates: [ring] },
    properties: nodeFeatureProperties(node, partId, height, minHeight),
  };
}

export function resolveNodes(
  nodes: NetworkNode[] | Map<string, NetworkNode>
): Map<string, NetworkNode> {
  return nodes instanceof Map ? nodes : new Map(nodes.map((n) => [n.id, n]));
}
