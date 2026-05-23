import type mapboxgl from "mapbox-gl";
import { ZOOM_NODES_3D_MIN } from "./constants";

const NODE_LAYER_2D = "network-nodes-layer";
const NODE_LAYER_3D = "network-nodes-3d-layer";
const CONNECTION_LAYER = "network-connections-layer";

/** Layer ids to use for hit-testing — matches the 2D/3D zoom handoff. */
export function getNetworkQueryableLayers(
  map: mapboxgl.Map,
  hasLayer: (map: mapboxgl.Map, id: string) => boolean,
  zoom = map.getZoom()
): string[] {
  const layers: string[] = [];

  if (zoom >= ZOOM_NODES_3D_MIN) {
    if (hasLayer(map, NODE_LAYER_3D)) layers.push(NODE_LAYER_3D);
  } else if (hasLayer(map, NODE_LAYER_2D)) {
    layers.push(NODE_LAYER_2D);
  }

  if (hasLayer(map, CONNECTION_LAYER)) layers.push(CONNECTION_LAYER);

  return layers;
}

export function isNodeLayerId(layerId: string | undefined): boolean {
  return layerId === NODE_LAYER_2D || layerId === NODE_LAYER_3D;
}

export function isConnectionLayerId(layerId: string | undefined): boolean {
  return layerId === CONNECTION_LAYER;
}
