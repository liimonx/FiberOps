"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { BillingSettingsPayload } from "@/types/domain";
import type { BillingSettingsFormValues } from "@/modules/settings/schemas/billingSettings.schema";
import { apiClient } from "@/lib/apiClient";

export const billingSettingsQueryKey = ["settings", "billing"] as const;

export function useBillingSettings() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: billingSettingsQueryKey,
    queryFn: () => apiClient<BillingSettingsPayload>("/api/settings/billing"),
  });

  const saveMutation = useMutation({
    mutationFn: (data: BillingSettingsFormValues) =>
      apiClient<BillingSettingsPayload>("/api/settings/billing", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(billingSettingsQueryKey, data);
    },
  });

  const syncMutation = useMutation({
    mutationFn: () =>
      apiClient<BillingSettingsPayload>("/api/settings/billing/sync", {
        method: "POST",
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(billingSettingsQueryKey, data);
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    updateSettingsAsync: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    isSaveSuccess: saveMutation.isSuccess,
    saveError: saveMutation.error,
    resetSaveState: saveMutation.reset,
    syncWithStripeAsync: syncMutation.mutateAsync,
    isSyncing: syncMutation.isPending,
    isSyncSuccess: syncMutation.isSuccess,
    syncError: syncMutation.error,
    resetSyncState: syncMutation.reset,
  };
}
