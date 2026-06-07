"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Callout, Checkbox, Icon, Input, Toggle } from "@shohojdhara/atomix";
import type { OutboundWebhook, WebhookEvent } from "@/types/domain";
import {
  outboundWebhookSchema,
  validateOutboundWebhook,
  webhookEvents,
  type OutboundWebhookFormValues,
} from "@/modules/settings/schemas/integrationsSettings.schema";

const eventLabels: Record<WebhookEvent, string> = {
  "incident.created": "Incident created",
  "incident.resolved": "Incident resolved",
  "outage.detected": "Outage detected",
  "work_order.updated": "Work order updated",
};

type OutboundWebhookFormProps = {
  webhook: OutboundWebhook;
  isSaving: boolean;
  isSuccess: boolean;
  saveError: Error | null;
  onSave: (values: OutboundWebhookFormValues) => Promise<void>;
  onResetSaveState: () => void;
};

export function OutboundWebhookForm({
  webhook,
  isSaving,
  isSuccess,
  saveError,
  onSave,
  onResetSaveState,
}: OutboundWebhookFormProps) {
  const hasExistingSecret = Boolean(webhook.secretMasked);

  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    setError,
    formState: { errors, isDirty },
  } = useForm<OutboundWebhookFormValues>({
    resolver: zodResolver(outboundWebhookSchema),
    mode: "onChange",
    defaultValues: {
      enabled: webhook.enabled,
      url: webhook.url,
      secret: "",
      events: webhook.events,
    },
  });

  const enabled = useWatch({ control, name: "enabled" });
  const selectedEvents = useWatch({ control, name: "events" }) ?? [];
  const formValues = useWatch({ control });

  useEffect(() => {
    reset({
      enabled: webhook.enabled,
      url: webhook.url,
      secret: "",
      events: webhook.events,
    });
  }, [
    webhook.enabled,
    webhook.url,
    webhook.events,
    webhook.secretMasked,
    reset,
  ]);

  const validation = validateOutboundWebhook(
    {
      enabled: formValues?.enabled ?? webhook.enabled,
      url: formValues?.url ?? webhook.url,
      secret: formValues?.secret,
      events: formValues?.events ?? webhook.events,
    },
    hasExistingSecret
  );

  const canSave = isDirty && validation.success && !isSaving;

  const toggleEvent = (event: WebhookEvent, checked: boolean) => {
    const nextEvents = checked
      ? [...selectedEvents, event]
      : selectedEvents.filter((value) => value !== event);

    setValue("events", nextEvents, { shouldDirty: true, shouldValidate: true });
  };

  const onSubmit = async (values: OutboundWebhookFormValues) => {
    const parsed = validateOutboundWebhook(values, hasExistingSecret);

    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const field = issue.path[0];
        if (typeof field === "string") {
          setError(field as keyof OutboundWebhookFormValues, {
            message: issue.message,
          });
        }
      });
      return;
    }

    onResetSaveState();
    await onSave(parsed.data);
    reset({
      enabled: parsed.data.enabled,
      url: parsed.data.url,
      secret: "",
      events: parsed.data.events,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="u-form-column" noValidate>
      <div className="u-flex u-items-center u-justify-between u-gap-3">
        <div>
          <p className="u-text-sm u-font-bold u-mb-1">Enable outbound webhooks</p>
          <p className="u-text-xs u-text-secondary-emphasis u-mb-0">
            POST FiberOps events to your own endpoint with a signed payload.
          </p>
        </div>
        <Toggle
          checked={enabled ?? webhook.enabled}
          disabled={isSaving}
          onChange={(checked) =>
            setValue("enabled", checked, { shouldDirty: true, shouldValidate: true })
          }
          aria-label="Enable outbound webhooks"
        />
      </div>

      {enabled && (
        <>
          <div>
            <label htmlFor="webhook-url" className="u-form-label">
              Endpoint URL
            </label>
            <Input
              id="webhook-url"
              type="url"
              fullWidth
              placeholder="https://api.example.com/webhooks/fiberops"
              {...register("url")}
            />
            {errors.url && (
              <p className="u-form-error">{errors.url.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="webhook-secret" className="u-form-label">
              Signing Secret
            </label>
            <Input
              id="webhook-secret"
              type="password"
              fullWidth
              placeholder="Enter signing secret"
              autoComplete="off"
              {...register("secret")}
            />
            {hasExistingSecret && (
              <p className="u-form-help u-mt-1">
                Current: {webhook.secretMasked} — leave blank to keep
              </p>
            )}
            {errors.secret && (
              <p className="u-form-error">{errors.secret.message}</p>
            )}
          </div>

          <fieldset className="u-border-0 u-p-0 u-m-0">
            <legend className="u-form-label">Notify on</legend>
            <div className="u-flex u-flex-column u-gap-2 u-mt-2">
              {webhookEvents.map((event) => (
                <Checkbox
                  key={event}
                  id={`webhook-event-${event}`}
                  label={eventLabels[event]}
                  checked={selectedEvents.includes(event)}
                  onChange={(changeEvent) =>
                    toggleEvent(event, changeEvent.target.checked)
                  }
                />
              ))}
            </div>
            {errors.events && (
              <p className="u-form-error">{errors.events.message}</p>
            )}
          </fieldset>
        </>
      )}

      {isSuccess && (
        <Callout
          variant="success"
          title="Webhook saved"
          icon={<Icon name="CheckCircle" />}
        >
          <p className="u-form-help">Outbound webhook settings were updated.</p>
        </Callout>
      )}

      {saveError && (
        <Callout variant="error" title="Save failed">
          <p className="u-form-help">
            {saveError.message || "Unable to save outbound webhook settings."}
          </p>
        </Callout>
      )}

      <div className="u-mt-2">
        <Button
          type="submit"
          variant="primary"
          disabled={!canSave}
          loading={isSaving}
        >
          Save Webhook
        </Button>
      </div>
    </form>
  );
}
