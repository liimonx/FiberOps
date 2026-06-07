"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { OrganizationSettings } from "@/types/domain";
import type { OrganizationSettingsFormValues } from "@/modules/settings/schemas/organizationSettings.schema";

export const organizationSettingsQueryKey = ["settings", "organization"] as const;

async function fetchOrganizationSettings(): Promise<OrganizationSettings> {
  const res = await fetch("/api/settings/organization");
  if (!res.ok) {
    throw new Error("Failed to fetch organization settings");
  }
  return res.json();
}

async function patchOrganizationSettings(
  data: OrganizationSettingsFormValues
): Promise<OrganizationSettings> {
  const res = await fetch("/api/settings/organization", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Failed to update organization settings");
  }

  return res.json();
}

export function useOrganizationSettings() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: organizationSettingsQueryKey,
    queryFn: fetchOrganizationSettings,
  });

  const mutation = useMutation({
    mutationFn: patchOrganizationSettings,
    onSuccess: (data) => {
      queryClient.setQueryData(organizationSettingsQueryKey, data);
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    updateSettings: mutation.mutate,
    updateSettingsAsync: mutation.mutateAsync,
    isSaving: mutation.isPending,
    isSuccess: mutation.isSuccess,
    saveError: mutation.error,
    resetSaveState: mutation.reset,
  };
}
