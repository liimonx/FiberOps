"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { BillingSettingsPayload } from "@/types/domain";
import type { BillingSettingsFormValues } from "@/modules/settings/schemas/billingSettings.schema";
import { parseSettingsError } from "@/modules/settings/lib/parseSettingsError";

export const billingSettingsQueryKey = ["settings", "billing"] as const;

async function fetchBillingSettings(): Promise<BillingSettingsPayload> {
  const res = await fetch("/api/settings/billing");
  if (!res.ok) {
    throw new Error("Failed to fetch billing settings");
  }
  return res.json();
}

async function patchBillingSettings(
  data: BillingSettingsFormValues
): Promise<BillingSettingsPayload> {
  const res = await fetch("/api/settings/billing", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    await parseSettingsError(res, "Failed to update billing settings");
  }

  return res.json();
}

async function postBillingSync(): Promise<BillingSettingsPayload> {
  const res = await fetch("/api/settings/billing/sync", {
    method: "POST",
  });

  if (!res.ok) {
    await parseSettingsError(res, "Failed to sync billing data");
  }

  return res.json();
}

export function useBillingSettings() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: billingSettingsQueryKey,
    queryFn: fetchBillingSettings,
  });

  const saveMutation = useMutation({
    mutationFn: patchBillingSettings,
    onSuccess: (data) => {
      queryClient.setQueryData(billingSettingsQueryKey, data);
    },
  });

  const syncMutation = useMutation({
    mutationFn: postBillingSync,
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
