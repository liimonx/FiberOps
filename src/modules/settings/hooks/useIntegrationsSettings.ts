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
import { parseSettingsError } from "@/modules/settings/lib/parseSettingsError";
import { billingSettingsQueryKey } from "@/modules/settings/hooks/useBillingSettings";

export const integrationsSettingsQueryKey = ["settings", "integrations"] as const;

async function fetchIntegrationsSettings(): Promise<IntegrationsSettings> {
  const res = await fetch("/api/settings/integrations");
  if (!res.ok) {
    throw new Error("Failed to fetch integrations settings");
  }
  return res.json();
}

async function patchIntegration(
  id: IntegrationProviderId,
  data: IntegrationUpdateFormValues
): Promise<Integration> {
  const res = await fetch(`/api/settings/integrations/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    await parseSettingsError(res, "Failed to update integration");
  }

  return res.json();
}

async function patchOutboundWebhook(
  data: OutboundWebhookFormValues
): Promise<OutboundWebhook> {
  const res = await fetch("/api/settings/integrations/webhook", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    await parseSettingsError(res, "Failed to update outbound webhook");
  }

  return res.json();
}

export function useIntegrationsSettings() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: integrationsSettingsQueryKey,
    queryFn: fetchIntegrationsSettings,
  });

  const integrationMutation = useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: IntegrationProviderId;
      values: IntegrationUpdateFormValues;
    }) => patchIntegration(id, values),
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
    },
  });

  const webhookMutation = useMutation({
    mutationFn: patchOutboundWebhook,
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
    updateWebhook: webhookMutation.mutate,
    updateWebhookAsync: webhookMutation.mutateAsync,
    isSavingWebhook: webhookMutation.isPending,
    isWebhookSuccess: webhookMutation.isSuccess,
    webhookSaveError: webhookMutation.error,
    resetWebhookSaveState: webhookMutation.reset,
  };
}
