"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Asset } from "@/types/domain";
import { networkQueryKeys } from "@/modules/network-map/hooks/useNetworkData";
import { parseSettingsError } from "@/modules/settings/lib/parseSettingsError";
import type { CreateAssetFormValues } from "@/modules/assets/schemas/asset.schema";

async function postAsset(data: CreateAssetFormValues): Promise<Asset> {
  const res = await fetch("/api/assets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    await parseSettingsError(res, "Failed to register asset");
  }

  return res.json();
}

export function useCreateAsset() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postAsset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: networkQueryKeys.assets.all });
      queryClient.invalidateQueries({ queryKey: networkQueryKeys.nodes.all });
      queryClient.invalidateQueries({ queryKey: networkQueryKeys.connections.all });
    },
  });
}
