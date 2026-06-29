"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge, Button, Callout, Grid, GridCol } from "@shohojdhara/atomix";
import type { IntegrationProviderId } from "@/types/domain";
import type { IntegrationUpdateFormValues } from "@/modules/settings/schemas/integrationsSettings.schema";
import { useIntegrationsSettings } from "@/modules/settings/hooks/useIntegrationsSettings";
import { IntegrationCard } from "@/modules/settings/components/IntegrationCard";
import { MikrotikIntegrationCard } from "@/modules/settings/components/MikrotikIntegrationCard";
import { OutboundWebhookForm } from "@/modules/settings/components/OutboundWebhookForm";

const SUCCESS_DISMISS_MS = 4000;

export function IntegrationsSettingsPanel() {
  const {
    data,
    isLoading,
    isError,
    refetch,
    updateIntegrationAsync,
    savingIntegrationId,
    isIntegrationSuccess,
    integrationSaveError,
    resetIntegrationSaveState,
    updateWebhookAsync,
    isSavingWebhook,
    isWebhookSuccess,
    webhookSaveError,
    resetWebhookSaveState,
  } = useIntegrationsSettings();

  const [feedbackIntegrationId, setFeedbackIntegrationId] =
    useState<IntegrationProviderId | null>(null);

  const connectedCount = useMemo(
    () => data?.integrations.filter((integration) => integration.status === "connected").length ?? 0,
    [data]
  );

  useEffect(() => {
    if (!isIntegrationSuccess) {
      return;
    }

    const timeout = window.setTimeout(() => {
      resetIntegrationSaveState();
      setFeedbackIntegrationId(null);
    }, SUCCESS_DISMISS_MS);

    return () => window.clearTimeout(timeout);
  }, [isIntegrationSuccess, resetIntegrationSaveState]);

  useEffect(() => {
    if (!isWebhookSuccess) {
      return;
    }

    const timeout = window.setTimeout(resetWebhookSaveState, SUCCESS_DISMISS_MS);
    return () => window.clearTimeout(timeout);
  }, [isWebhookSuccess, resetWebhookSaveState]);

  const handleIntegrationSave = useCallback(
    async (id: IntegrationProviderId, values: IntegrationUpdateFormValues) => {
      setFeedbackIntegrationId(id);
      resetIntegrationSaveState();
      await updateIntegrationAsync({ id, values });
    },
    [resetIntegrationSaveState, updateIntegrationAsync]
  );

  const handleWebhookSave = useCallback(
    async (values: Parameters<typeof updateWebhookAsync>[0]) => {
      resetWebhookSaveState();
      await updateWebhookAsync(values);
    },
    [resetWebhookSaveState, updateWebhookAsync]
  );

  if (isLoading) {
    return (
      <div aria-busy="true" className="u-flex u-flex-column u-gap-6">
        <div>
          <div className="u-skeleton u-h-8 u-mb-2" style={{ width: "12rem" }} />
          <div className="u-skeleton u-h-4" style={{ width: "20rem" }} />
        </div>
        <Grid>
          {Array.from({ length: 4 }).map((_, index) => (
            <GridCol key={index} xs={12} lg={6} className="u-mb-4">
              <div className="u-skeleton u-h-52" />
            </GridCol>
          ))}
        </Grid>
        <div className="u-divider-subtle" role="separator" />
        <div>
          <div className="u-skeleton u-h-8 u-mb-4" style={{ width: "10rem" }} />
          <div className="u-skeleton u-h-40" style={{ maxWidth: "50%" }} />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Callout variant="error" title="Failed to load integrations">
        <p className="u-text-sm u-mb-3">
          Integration settings could not be loaded. Please try again.
        </p>
        <Button variant="outline-secondary" size="sm" onClick={() => refetch()}>
          Retry
        </Button>
      </Callout>
    );
  }

  return (
    <div className="u-flex u-flex-column u-gap-6">
      <section aria-labelledby="external-services-heading">
        <div className="u-settings-section-header">
          <div>
            <h2 id="external-services-heading" className="u-text-sm u-font-bold u-mb-1">
              External Services
            </h2>
            <p className="u-text-xs u-text-secondary-emphasis u-mb-0">
              Connect third-party APIs used by maps, alerts, on-call, and billing.
            </p>
          </div>
          <Badge
            variant={connectedCount > 0 ? "success" : "info"}
            label={`${connectedCount} of ${data.integrations.length} connected`}
          />
        </div>

        <Grid>
          {data.integrations.map((integration) => (
            <GridCol key={integration.id} xs={12} lg={6} className="u-mb-4">
              {integration.id === "mikrotik" ? (
                <MikrotikIntegrationCard
                  integration={integration}
                  isSaving={savingIntegrationId === integration.id}
                  isSuccess={
                    isIntegrationSuccess &&
                    feedbackIntegrationId === integration.id
                  }
                  saveError={
                    integrationSaveError &&
                    feedbackIntegrationId === integration.id
                      ? integrationSaveError
                      : null
                  }
                  onSave={(values) => handleIntegrationSave(integration.id, values)}
                  onResetSaveState={resetIntegrationSaveState}
                />
              ) : (
                <IntegrationCard
                  integration={integration}
                  isSaving={savingIntegrationId === integration.id}
                  isSuccess={
                    isIntegrationSuccess &&
                    feedbackIntegrationId === integration.id
                  }
                  saveError={
                    integrationSaveError &&
                    feedbackIntegrationId === integration.id
                      ? integrationSaveError
                      : null
                  }
                  onSave={handleIntegrationSave}
                  onResetSaveState={resetIntegrationSaveState}
                />
              )}
            </GridCol>
          ))}
        </Grid>
      </section>

      <div className="u-divider-subtle" role="separator" />

      <section aria-labelledby="outbound-webhooks-heading">
        <div className="u-settings-section-header">
          <div>
            <h2 id="outbound-webhooks-heading" className="u-text-sm u-font-bold u-mb-1">
              Outbound Webhooks
            </h2>
            <p className="u-text-xs u-text-secondary-emphasis u-mb-0">
              Push incident and operations events to your own systems.
            </p>
          </div>
          {data.outboundWebhook.enabled && (
            <Badge variant="success" label="Active" />
          )}
        </div>

        <OutboundWebhookForm
          webhook={data.outboundWebhook}
          isSaving={isSavingWebhook}
          isSuccess={isWebhookSuccess}
          saveError={webhookSaveError}
          onSave={handleWebhookSave}
          onResetSaveState={resetWebhookSaveState}
        />
      </section>
    </div>
  );
}
