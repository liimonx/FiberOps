"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Asset } from "@/types/domain";
import { networkQueryKeys } from "@/modules/network-map/hooks/useNetworkData";
import type { CreateAssetFormValues } from "@/modules/assets/schemas/asset.schema";
import { apiClient } from "@/lib/apiClient";

async function postAsset(data: CreateAssetFormValues): Promise<Asset> {
  return apiClient<Asset>("/api/assets", {
    method: "POST",
    body: JSON.stringify(data),
  });
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
