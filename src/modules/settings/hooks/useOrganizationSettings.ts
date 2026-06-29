"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { OrganizationSettings } from "@/types/domain";
import type { OrganizationSettingsFormValues } from "@/modules/settings/schemas/organizationSettings.schema";
import { apiClient } from "@/lib/apiClient";

export const organizationSettingsQueryKey = ["settings", "organization"] as const;

export function useOrganizationSettings() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: organizationSettingsQueryKey,
    queryFn: () => apiClient<OrganizationSettings>("/api/settings/organization"),
  });

  const mutation = useMutation({
    mutationFn: (data: OrganizationSettingsFormValues) =>
      apiClient<OrganizationSettings>("/api/settings/organization", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
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
