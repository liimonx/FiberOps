"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import type mapboxgl from "mapbox-gl";
import { CUSTOMER_MAP_QUERY_PARAM } from "@/modules/customers/lib/customerMapNavigation";
import { useNetworkMapStore } from "../stores/useNetworkMapStore";
import { flyToLocation } from "../utils/mapUtils";
import type { NetworkNode } from "../types";
import { NetworkNodeType } from "../types";

type UseMapCustomerDeepLinkOptions = {
  nodes: NetworkNode[];
  mapInstance: mapboxgl.Map | null;
};

/**
 * Focuses the map on a customer when arriving via /network-map?customer=<id>.
 */
export function useMapCustomerDeepLink({
  nodes,
  mapInstance,
}: UseMapCustomerDeepLinkOptions) {
  const searchParams = useSearchParams();
  const customerId = searchParams.get(CUSTOMER_MAP_QUERY_PARAM);
  const handledIdRef = useRef<string | null>(null);

  const setSelectedElement = useNetworkMapStore((state) => state.setSelectedElement);
  const addToSelectionHistory = useNetworkMapStore(
    (state) => state.addToSelectionHistory
  );
  const setLayerVisibility = useNetworkMapStore((state) => state.setLayerVisibility);
  const setActiveTool = useNetworkMapStore((state) => state.setActiveTool);

  useEffect(() => {
    if (!customerId || nodes.length === 0) return;
    if (handledIdRef.current === customerId) return;

    const node = nodes.find(
      (item) => item.id === customerId && item.type === NetworkNodeType.CUSTOMER
    );
    if (!node) return;

    handledIdRef.current = customerId;

    setLayerVisibility("customers", true);
    setLayerVisibility("customer-connections", true);
    setActiveTool("select");
    setSelectedElement(customerId);
    addToSelectionHistory(customerId);

    if (mapInstance) {
      flyToLocation(mapInstance, [node.position.lng, node.position.lat], 16);
    }
  }, [
    customerId,
    nodes,
    mapInstance,
    setSelectedElement,
    addToSelectionHistory,
    setLayerVisibility,
    setActiveTool,
  ]);
}
