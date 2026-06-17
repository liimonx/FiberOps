import type mapboxgl from "mapbox-gl";

export function setOrCreateGeoJsonSource(
  map: mapboxgl.Map,
  sourceId: string,
  data: GeoJSON.FeatureCollection
): void {
  const existing = map.getSource(sourceId) as mapboxgl.GeoJSONSource | undefined;
  if (existing) {
    existing.setData(data);
    return;
  }
  map.addSource(sourceId, { type: "geojson", data });
}

export function removeMapLayers(map: mapboxgl.Map, layerIds: string[]): void {
  for (const id of layerIds) {
    if (map.getLayer(id)) map.removeLayer(id);
  }
}

export function removeMapLayersAndSource(
  map: mapboxgl.Map,
  layerIds: string[],
  sourceId: string
): void {
  removeMapLayers(map, layerIds);
  if (map.getSource(sourceId)) map.removeSource(sourceId);
}

type EnsureLayerOptions = {
  id: string;
  type: "fill" | "line" | "circle";
  source: string;
  paint?: mapboxgl.FillPaint | mapboxgl.LinePaint | mapboxgl.CirclePaint;
  layout?: mapboxgl.SymbolLayout;
  filter?: mapboxgl.Expression;
};

export function ensureMapLayer(map: mapboxgl.Map, options: EnsureLayerOptions): void {
  const { id, type, source, paint, layout, filter } = options;

  if (map.getLayer(id)) {
    const dasharray = (paint as mapboxgl.LinePaint | undefined)?.["line-dasharray"];
    if (dasharray) {
      map.setPaintProperty(id, "line-dasharray", dasharray);
    }
    return;
  }

  map.addLayer({
    id,
    type,
    source,
    ...(paint ? { paint } : {}),
    ...(layout ? { layout } : {}),
    ...(filter ? { filter } : {}),
  });
}
