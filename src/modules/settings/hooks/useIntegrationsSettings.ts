"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Integration,
  IntegrationProviderId,
  IntegrationsSettings,
  OutboundWebhook,
} from "@/types/domain";
import type {
  IntegrationUpdateFormValues,
  OutboundWebhookFormValues,
} from "@/modules/settings/schemas/integrationsSettings.schema";
import { apiClient } from "@/lib/apiClient";
import { billingSettingsQueryKey } from "@/modules/settings/hooks/useBillingSettings";

export const integrationsSettingsQueryKey = ["settings", "integrations"] as const;

type MikrotikTestPayload = {
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  useSsl?: boolean;
  verifySsl?: boolean;
  apiMode?: "rest" | "classic";
};

type MikrotikTestResult = {
  ok: boolean;
  message: string;
  identity?: string;
};

export function useIntegrationsSettings() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: integrationsSettingsQueryKey,
    queryFn: () => apiClient<IntegrationsSettings>("/api/settings/integrations"),
  });

  const integrationMutation = useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: IntegrationProviderId;
      values: IntegrationUpdateFormValues;
    }) =>
      apiClient<Integration>(`/api/settings/integrations/${id}`, {
        method: "PATCH",
        body: JSON.stringify(values),
      }),
    onSuccess: (updatedIntegration) => {
      queryClient.setQueryData<IntegrationsSettings>(
        integrationsSettingsQueryKey,
        (current) => {
          if (!current) {
            return current;
          }

          return {
            ...current,
            integrations: current.integrations.map((integration) =>
              integration.id === updatedIntegration.id
                ? updatedIntegration
                : integration
            ),
          };
        }
      );

      if (updatedIntegration.id === "stripe") {
        queryClient.invalidateQueries({ queryKey: billingSettingsQueryKey });
      }
      if (updatedIntegration.id === "mapbox") {
        queryClient.invalidateQueries({ queryKey: ["maps", "mapbox-token"] });
      }
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: (payload: MikrotikTestPayload) =>
      apiClient<MikrotikTestResult>("/api/settings/integrations/mikrotik/test", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: (result) => {
      if (result.ok) {
        queryClient.invalidateQueries({ queryKey: integrationsSettingsQueryKey });
      }
    },
  });

  const webhookMutation = useMutation({
    mutationFn: (data: OutboundWebhookFormValues) =>
      apiClient<OutboundWebhook>("/api/settings/integrations/webhook", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: (outboundWebhook) => {
      queryClient.setQueryData<IntegrationsSettings>(
        integrationsSettingsQueryKey,
        (current) => {
          if (!current) {
            return current;
          }

          return {
            ...current,
            outboundWebhook,
          };
        }
      );
    },
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    updateIntegration: integrationMutation.mutate,
    updateIntegrationAsync: integrationMutation.mutateAsync,
    savingIntegrationId: integrationMutation.isPending
      ? integrationMutation.variables?.id ?? null
      : null,
    isIntegrationSuccess: integrationMutation.isSuccess,
    integrationSaveError: integrationMutation.error,
    resetIntegrationSaveState: integrationMutation.reset,
    testMikrotikConnectionAsync: testConnectionMutation.mutateAsync,
    isTestingConnection: testConnectionMutation.isPending,
    testConnectionResult: testConnectionMutation.data,
    testConnectionError: testConnectionMutation.error,
    resetTestConnectionState: testConnectionMutation.reset,
    updateWebhook: webhookMutation.mutate,
    updateWebhookAsync: webhookMutation.mutateAsync,
    isSavingWebhook: webhookMutation.isPending,
    isWebhookSuccess: webhookMutation.isSuccess,
    webhookSaveError: webhookMutation.error,
    resetWebhookSaveState: webhookMutation.reset,
  };
}
