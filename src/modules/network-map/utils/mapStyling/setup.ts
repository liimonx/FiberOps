import {
  AVAILABLE_STYLES,
  BUILDINGS_LAYER_ID,
  LAYER_AUXILIARY,
  MAP_COLORS,
  NETWORK_SOURCE_IDS,
} from "./constants";
import { LAYER_STACK } from "./layers";

function findLabelLayerId(map: mapboxgl.Map): string | undefined {
  if (!map.isStyleLoaded()) return undefined;
  const styleLayers = map.getStyle()?.layers ?? [];
  return styleLayers.find((layer) => layer.type === "symbol" && layer.layout)?.id;
}

function add3DBuildings(map: mapboxgl.Map, beforeId?: string) {
  if (map.getLayer(BUILDINGS_LAYER_ID)) return;

  map.addLayer(
    {
      id: BUILDINGS_LAYER_ID,
      source: "composite",
      "source-layer": "building",
      filter: ["==", "extrude", "true"],
      type: "fill-extrusion",
      minzoom: 14,
      paint: {
        "fill-extrusion-color": MAP_COLORS.surface.building,
        "fill-extrusion-height": [
          "interpolate",
          ["linear"],
          ["zoom"],
          14,
          0,
          14.05,
          ["get", "height"],
        ],
        "fill-extrusion-base": [
          "interpolate",
          ["linear"],
          ["zoom"],
          14,
          0,
          14.05,
          ["get", "min_height"],
        ],
        "fill-extrusion-opacity": 0.35,
        "fill-extrusion-color-transition": { duration: 500 },
      },
    },
    beforeId
  );
}

/** Initialize network GeoJSON sources and custom Mapbox layers. */
export const addCustomLayers = (map: mapboxgl.Map) => {
  if (map.getLayer("background")) {
    map.setPaintProperty("background", "background-color", MAP_COLORS.surface.background);
  }

  const labelLayerId = findLabelLayerId(map);
  add3DBuildings(map, labelLayerId);

  for (const sourceId of NETWORK_SOURCE_IDS) {
    if (!map.getSource(sourceId)) {
      map.addSource(sourceId, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
        // Required for setFeatureState hover highlighting (properties.id → feature id)
        promoteId: "id",
      });
    }
  }

  for (const layer of LAYER_STACK) {
    if (!map.getLayer(layer.id)) {
      map.addLayer(layer, labelLayerId);
      continue;
    }
    const min = layer.minzoom ?? 0;
    const max = layer.maxzoom ?? 24;
    map.setLayerZoomRange(layer.id, min, max);
  }
};

export const updateLayerVisibility = (
  map: mapboxgl.Map,
  layerId: string,
  visible: boolean
) => {
  const visibility = visible ? "visible" : "none";
  const layersToUpdate = [layerId, ...(LAYER_AUXILIARY[layerId] ?? [])];

  for (const id of layersToUpdate) {
    if (map.getLayer(id)) {
      map.setLayoutProperty(id, "visibility", visibility);
    }
  }
};

export const setFeatureState = (
  map: mapboxgl.Map,
  source: string,
  id: string | number,
  state: Record<string, unknown>
) => {
  map.setFeatureState({ source, id }, state);
};

export const clearFeatureState = (
  map: mapboxgl.Map,
  source: string,
  id?: string | number
) => {
  if (id !== undefined) {
    map.setFeatureState({ source, id }, {});
    return;
  }

  if (!map.getSource(source)) return;
  const features = map.querySourceFeatures(source);
  for (const feature of features) {
    map.setFeatureState({ source, id: feature.id as number }, {});
  }
};

export const applyTheme = (map: mapboxgl.Map, themeId: string) => {
  const style = AVAILABLE_STYLES.find((s) => s.id === themeId) ?? AVAILABLE_STYLES[0];
  map.setStyle(style.url);
  map.once("style.load", () => addCustomLayers(map));
};
