"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Badge, Button, Callout, Card, Icon, Input, Toggle } from "@shohojdhara/atomix";
import type { Integration, IntegrationProviderId } from "@/types/domain";
import {
  integrationUpdateSchema,
  validateIntegrationUpdate,
  type IntegrationUpdateFormValues,
} from "@/modules/settings/schemas/integrationsSettings.schema";

const providerIcons: Record<
  IntegrationProviderId,
  "MapTrifold" | "SlackLogo" | "BellRinging" | "CreditCard" | "WifiHigh"
> = {
  mapbox: "MapTrifold",
  slack: "SlackLogo",
  pagerduty: "BellRinging",
  stripe: "CreditCard",
  mikrotik: "WifiHigh",
};

const statusVariants: Record<
  Integration["status"],
  "success" | "info" | "error"
> = {
  connected: "success",
  disconnected: "info",
  error: "error",
};

const statusLabels: Record<Integration["status"], string> = {
  connected: "Connected",
  disconnected: "Disconnected",
  error: "Needs setup",
};

type IntegrationCardProps = {
  integration: Integration;
  isSaving: boolean;
  isSuccess: boolean;
  saveError: Error | null;
  onSave: (
    id: IntegrationProviderId,
    values: IntegrationUpdateFormValues
  ) => Promise<void>;
  onResetSaveState: () => void;
};

function getCredentialField(id: IntegrationProviderId): {
  key: "apiKey" | "webhookUrl" | "routingKey";
  label: string;
  inputType: "password" | "url" | "text";
  placeholder: string;
} {
  switch (id) {
    case "mapbox":
      return {
        key: "apiKey",
        label: "Access Token",
        inputType: "password",
        placeholder: "pk.…",
      };
    case "slack":
      return {
        key: "webhookUrl",
        label: "Incoming Webhook URL",
        inputType: "url",
        placeholder: "https://hooks.slack.com/services/…",
      };
    case "pagerduty":
      return {
        key: "routingKey",
        label: "Routing Key",
        inputType: "password",
        placeholder: "Enter routing key",
      };
    case "stripe":
      return {
        key: "apiKey",
        label: "Secret Key",
        inputType: "password",
        placeholder: "sk_…",
      };
    case "mikrotik":
      return {
        key: "apiKey",
        label: "Not used",
        inputType: "password",
        placeholder: "",
      };
  }
}

export function IntegrationCard({
  integration,
  isSaving,
  isSuccess,
  saveError,
  onSave,
  onResetSaveState,
}: IntegrationCardProps) {
  const credentialField = getCredentialField(integration.id);
  const hasExistingCredentials = Boolean(integration.apiKeyMasked);

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    setError,
    formState: { errors, isDirty },
  } = useForm<IntegrationUpdateFormValues>({
    resolver: zodResolver(integrationUpdateSchema),
    mode: "onChange",
    defaultValues: {
      enabled: integration.enabled,
      apiKey: "",
      webhookUrl: "",
      routingKey: "",
    },
  });

  const enabled = useWatch({ control, name: "enabled" });
  const formValues = useWatch({ control });

  useEffect(() => {
    reset({
      enabled: integration.enabled,
      apiKey: "",
      webhookUrl: "",
      routingKey: "",
    });
  }, [
    integration.id,
    integration.enabled,
    integration.apiKeyMasked,
    integration.status,
    reset,
  ]);

  const validation = validateIntegrationUpdate(
    integration.id,
    {
      enabled: formValues?.enabled ?? integration.enabled,
      apiKey: formValues?.apiKey,
      webhookUrl: formValues?.webhookUrl,
      routingKey: formValues?.routingKey,
    },
    hasExistingCredentials
  );

  const canSave = isDirty && validation.success && !isSaving;

  const onSubmit = async (values: IntegrationUpdateFormValues) => {
    const parsed = validateIntegrationUpdate(
      integration.id,
      values,
      hasExistingCredentials
    );

    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0];
        if (typeof field === "string") {
          setError(field as keyof IntegrationUpdateFormValues, {
            message: issue.message,
          });
        }
      });
      return;
    }

    onResetSaveState();
    await onSave(integration.id, parsed.data);
    reset({
      enabled: parsed.data.enabled,
      apiKey: "",
      webhookUrl: "",
      routingKey: "",
    });
  };

  return (
    <Card className="u-h-100">
      <div className="u-flex u-flex-column u-gap-4">
        <div className="u-flex u-items-start u-justify-between u-gap-3">
          <div className="u-flex u-items-center u-gap-3">
            <div className="u-integration-icon">
              <Icon name={providerIcons[integration.id]} size="md" />
            </div>
            <div>
              <h3 className="u-text-sm u-font-bold u-mb-1">{integration.name}</h3>
              <Badge
                variant={statusVariants[integration.status]}
                label={statusLabels[integration.status]}
              />
            </div>
          </div>

          <Toggle
            checked={enabled ?? integration.enabled}
            disabled={isSaving}
            onChange={(checked) =>
              setValue("enabled", checked, { shouldDirty: true, shouldValidate: true })
            }
            aria-label={`Enable ${integration.name}`}
          />
        </div>

        <p className="u-text-xs u-text-secondary-emphasis u-mb-0">
          {integration.description}
        </p>

        {integration.id === "stripe" && (
          <p className="u-text-xs u-text-secondary-emphasis u-mb-0">
            Invoice and tax settings live under Billing Settings once Stripe is
            connected.
          </p>
        )}

        {integration.status === "error" && enabled && (
          <Callout variant="warning" title="Setup incomplete">
            <p className="u-form-help">
              Add credentials below to finish connecting {integration.name}.
            </p>
          </Callout>
        )}

        {enabled && (
          <div>
            <label
              htmlFor={`${integration.id}-${credentialField.key}`}
              className="u-form-label"
            >
              {credentialField.label}
            </label>
            <Input
              id={`${integration.id}-${credentialField.key}`}
              type={credentialField.inputType}
              fullWidth
              placeholder={credentialField.placeholder}
              autoComplete="off"
              {...register(credentialField.key)}
            />
            {hasExistingCredentials && (
              <p className="u-form-help u-mt-1">
                Current: {integration.apiKeyMasked} — leave blank to keep
              </p>
            )}
            {errors[credentialField.key] && (
              <p className="u-form-error">
                {errors[credentialField.key]?.message}
              </p>
            )}
          </div>
        )}

        {isSuccess && (
          <Callout variant="success" title="Saved" icon={<Icon name="CheckCircle" />}>
            <p className="u-form-help">{integration.name} settings were updated.</p>
          </Callout>
        )}

        {saveError && (
          <Callout variant="error" title="Save failed">
            <p className="u-form-help">
              {saveError.message || `Unable to save ${integration.name} settings.`}
            </p>
          </Callout>
        )}

        <div className="u-mt-auto">
          <Button
            type="button"
            variant="outline-primary"
            size="sm"
            disabled={!canSave}
            loading={isSaving}
            onClick={handleSubmit(onSubmit)}
          >
            Save
          </Button>
        </div>
      </div>
    </Card>
  );
}
