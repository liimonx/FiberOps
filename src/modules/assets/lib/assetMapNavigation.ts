export const ASSET_MAP_QUERY_PARAM = "asset";

export function getAssetMapUrl(assetId: string): string {
  return `/network-map?${ASSET_MAP_QUERY_PARAM}=${encodeURIComponent(assetId)}`;
}
