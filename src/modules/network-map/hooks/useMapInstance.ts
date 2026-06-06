"use client";

import { useNetworkMapStore } from "../stores/useNetworkMapStore";

/** Returns the live Mapbox map once MapCanvas has mounted and registered it. */
export function useMapInstance() {
  return useNetworkMapStore((state) => state.mapInstance);
}
