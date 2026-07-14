"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { MAPBOX_CONFIG } from "@/modules/network-map/constants";

type MapboxTokenResponse = {
  accessToken: string | null;
  source: "integration" | "env" | "none";
};

export const mapboxTokenQueryKey = ["maps", "mapbox-token"] as const;

async function resolveMapboxToken(): Promise<MapboxTokenResponse> {
  try {
    const data = await apiClient<MapboxTokenResponse>(
      "/api/maps/mapbox-token"
    );
    if (data.accessToken) {
      return data;
    }
  } catch {
    // Fall through to env for unauthenticated/public preview contexts.
  }

  const envToken = MAPBOX_CONFIG.ACCESS_TOKEN;
  if (envToken) {
    return { accessToken: envToken, source: "env" };
  }

  return { accessToken: null, source: "none" };
}

export function useMapboxAccessToken() {
  const query = useQuery({
    queryKey: mapboxTokenQueryKey,
    queryFn: resolveMapboxToken,
    staleTime: 60_000,
  });

  const accessToken =
    (query.data?.accessToken ?? MAPBOX_CONFIG.ACCESS_TOKEN) || null;

  return {
    accessToken: accessToken || null,
    source: query.data?.source ?? (MAPBOX_CONFIG.ACCESS_TOKEN ? "env" : "none"),
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
