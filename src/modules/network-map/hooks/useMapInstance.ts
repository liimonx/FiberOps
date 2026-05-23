"use client";

import { useEffect, useState } from "react";
import type mapboxgl from "mapbox-gl";
import { getMapInstance } from "../components/MapCanvas";

const DEFAULT_POLL_MS = 200;

/**
 * Resolves the Mapbox map once MapCanvas has mounted it.
 * Polls until `getMapInstance()` returns a map, then stops.
 */
export function useMapInstance(pollIntervalMs = DEFAULT_POLL_MS): mapboxgl.Map | null {
  const [map, setMap] = useState<mapboxgl.Map | null>(() => getMapInstance());

  useEffect(() => {
    if (map) return;

    const interval = setInterval(() => {
      const instance = getMapInstance();
      if (instance) {
        setMap(instance);
        clearInterval(interval);
      }
    }, pollIntervalMs);

    return () => clearInterval(interval);
  }, [map, pollIntervalMs]);

  return map;
}
