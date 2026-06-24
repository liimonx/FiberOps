"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import type mapboxgl from "mapbox-gl";
import { ASSET_MAP_QUERY_PARAM } from "@/modules/assets/lib/assetMapNavigation";
import { useNetworkMapStore } from "../stores/useNetworkMapStore";
import { flyToLocation } from "../utils/mapUtils";
import type { NetworkNode } from "../types";
import { NetworkNodeType } from "../types";

type UseMapAssetDeepLinkOptions = {
  nodes: NetworkNode[];
  mapInstance: mapboxgl.Map | null;
};

const assetNodeTypes = new Set<NetworkNodeType>([
  NetworkNodeType.POP,
  NetworkNodeType.POLE,
  NetworkNodeType.JUNCTION_BOX,
  NetworkNodeType.SPLITTER,
  NetworkNodeType.ONU,
  NetworkNodeType.ACCESS_NODE,
  NetworkNodeType.DISTRIBUTION_NODE,
  NetworkNodeType.CORE_NODE,
]);

/**
 * Focuses the map on an infrastructure asset when arriving via /network-map?asset=<id>.
 */
export function useMapAssetDeepLink({
  nodes,
  mapInstance,
}: UseMapAssetDeepLinkOptions) {
  const searchParams = useSearchParams();
  const assetId = searchParams.get(ASSET_MAP_QUERY_PARAM);
  const handledIdRef = useRef<string | null>(null);

  const setSelectedElement = useNetworkMapStore((state) => state.setSelectedElement);
  const addToSelectionHistory = useNetworkMapStore(
    (state) => state.addToSelectionHistory
  );
  const setActiveTool = useNetworkMapStore((state) => state.setActiveTool);

  useEffect(() => {
    if (!assetId || nodes.length === 0) return;
    if (handledIdRef.current === assetId) return;

    const node = nodes.find(
      (item) => item.id === assetId && assetNodeTypes.has(item.type)
    );
    if (!node) return;

    handledIdRef.current = assetId;

    setActiveTool("select");
    setSelectedElement(assetId);
    addToSelectionHistory(assetId);

    if (mapInstance) {
      flyToLocation(mapInstance, [node.position.lng, node.position.lat], 17);
    }
  }, [
    assetId,
    nodes,
    mapInstance,
    setSelectedElement,
    addToSelectionHistory,
    setActiveTool,
  ]);
}
