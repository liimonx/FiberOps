import mapboxgl from "mapbox-gl";

/**
 * Utility function to fit map bounds to a set of coordinates or bounds
 */
export const fitMapBounds = (
  map: mapboxgl.Map | null,
  bounds: mapboxgl.LngLatBoundsLike,
  padding: number = 50
) => {
  if (!map) return;

  map.fitBounds(bounds, {
    padding,
    duration: 1000,
    essential: true,
  });
};

/**
 * Utility function to fly to a location on the map
 */
export const flyToLocation = (
  map: mapboxgl.Map | null,
  center: mapboxgl.LngLatLike,
  zoom?: number,
  bearing?: number,
  pitch?: number
) => {
  if (!map) return;

  map.flyTo({
    center,
    zoom: zoom ?? map.getZoom(),
    bearing: bearing ?? map.getBearing(),
    pitch: pitch ?? map.getPitch(),
    duration: 1500,
    essential: true,
  });
};

/**
 * Safely check if a layer exists on the map
 */
export const safeHasLayer = (map: mapboxgl.Map | null, id: string) => {
  try {
    return !!(map && map.getStyle() && map.getLayer(id));
  } catch (e) {
    return false;
  }
};

/**
 * Get rendered features at a point
 */
export const getFeaturesAtPoint = (
  map: mapboxgl.Map | null,
  point: mapboxgl.Point,
  layerIds: string[] = ["network-nodes-3d-layer", "network-connections-layer"]
) => {
  if (!map || !map.getStyle()) return [];

  const existingLayers = layerIds.filter((id) => safeHasLayer(map, id));
  if (existingLayers.length === 0) return [];

  return map.queryRenderedFeatures(point, {
    layers: existingLayers,
  });
};
