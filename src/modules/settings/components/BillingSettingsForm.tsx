"use client";

import Link from "next/link";
import { useEffect } from "react";
import type { ChangeEvent } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Badge, Button, Callout, Card, Icon, Input, Select } from "@shohojdhara/atomix";
import {
  billingCurrencies,
  billingSettingsSchema,
  invoiceDeliveryOptions,
  type BillingSettingsFormValues,
} from "@/modules/settings/schemas/billingSettings.schema";
import { useBillingSettings } from "@/modules/settings/hooks/useBillingSettings";
import type { IntegrationStatus } from "@/types/domain";

const SUCCESS_DISMISS_MS = 4000;

const stripeStatusVariants: Record<
  IntegrationStatus,
  "success" | "info" | "error"
> = {
  connected: "success",
  disconnected: "info",
  error: "error",
};

const stripeStatusLabels: Record<IntegrationStatus, string> = {
  connected: "Connected",
  disconnected: "Not connected",
  error: "Needs setup",
};

const currencyLabels: Record<(typeof billingCurrencies)[number], string> = {
  USD: "USD — US Dollar",
  EUR: "EUR — Euro",
  GBP: "GBP — British Pound",
  CAD: "CAD — Canadian Dollar",
};

function formatSyncedAt(value: string | null): string {
  if (!value) {
    return "Never synced";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function BillingSettingsForm() {
  const {
    data,
    isLoading,
    isError,
    refetch,
    updateSettingsAsync,
    isSaving,
    isSaveSuccess,
    saveError,
    resetSaveState,
    syncWithStripeAsync,
    isSyncing,
    isSyncSuccess,
    syncError,
    resetSyncState,
  } = useBillingSettings();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty, isValid },
  } = useForm<BillingSettingsFormValues>({
    resolver: zodResolver(billingSettingsSchema),
    mode: "onChange",
    defaultValues: {
      legalName: "",
      billingEmail: "",
      currency: "USD",
      taxId: "",
      invoiceDelivery: "email",
    },
  });

  useEffect(() => {
    if (data) {
      reset(data.settings);
      resetSaveState();
      resetSyncState();
    }
  }, [data, reset, resetSaveState, resetSyncState]);

  useEffect(() => {
    if (!isSaveSuccess && !isSyncSuccess) {
      return;
    }

    const timeout = window.setTimeout(() => {
      resetSaveState();
      resetSyncState();
    }, SUCCESS_DISMISS_MS);

    return () => window.clearTimeout(timeout);
  }, [isSaveSuccess, isSyncSuccess, resetSaveState, resetSyncState]);

  const onSubmit = async (values: BillingSettingsFormValues) => {
    resetSaveState();
    resetSyncState();
    await updateSettingsAsync(values);
    reset(values);
  };

  const handleSync = async () => {
    resetSaveState();
    resetSyncState();
    await syncWithStripeAsync();
  };

  if (isLoading) {
    return (
      <div className="u-flex u-flex-column u-gap-6" aria-busy="true">
        <div className="u-skeleton u-h-24" />
        <div className="u-form-column">
          <div className="u-skeleton u-h-14" />
          <div className="u-skeleton u-h-14" />
          <div className="u-skeleton u-h-14" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Callout variant="error" title="Failed to load billing settings">
        <p className="u-text-sm u-mb-3">
          Billing settings could not be loaded. Please try again.
        </p>
        <Button variant="outline-secondary" size="sm" onClick={() => refetch()}>
          Retry
        </Button>
      </Callout>
    );
  }

  const { stripe, settings } = data;
  const canSync = stripe.status === "connected";

  return (
    <div className="u-flex u-flex-column u-gap-6">
      <Card>
        <div className="u-flex u-flex-column u-gap-4">
          <div className="u-settings-section-header u-mb-0">
            <div className="u-flex u-items-center u-gap-3">
              <div className="u-integration-icon">
                <Icon name="CreditCard" size="md" />
              </div>
              <div>
                <h2 className="u-text-sm u-font-bold u-mb-1">Stripe connection</h2>
                <Badge
                  variant={stripeStatusVariants[stripe.status]}
                  label={stripeStatusLabels[stripe.status]}
                />
              </div>
            </div>
          </div>

          <p className="u-text-xs u-text-secondary-emphasis u-mb-0">
            Manage API credentials under{" "}
            <Link href="/settings/integrations" className="u-text-primary">
              Integrations
            </Link>
            . Billing uses that connection to sync customer subscriptions.
          </p>

          {stripe.apiKeyMasked && (
            <p className="u-form-help">
              Credential: {stripe.apiKeyMasked}
            </p>
          )}

          <div className="u-flex u-flex-wrap u-items-center u-gap-3">
            <Button
              type="button"
              variant="outline-primary"
              size="sm"
              iconName="ArrowsClockwise"
              disabled={!canSync || isSyncing}
              loading={isSyncing}
              onClick={handleSync}
            >
              Sync now
            </Button>
            <span className="u-meta">
              Last synced: {formatSyncedAt(settings.lastSyncedAt)}
            </span>
          </div>

          {!canSync && (
            <Callout variant="warning" title="Stripe not connected">
              <p className="u-form-help">
                Connect Stripe in Integrations before syncing billing data.
              </p>
            </Callout>
          )}

          {isSyncSuccess && (
            <Callout
              variant="success"
              title="Sync complete"
              icon={<Icon name="CheckCircle" />}
            >
              <p className="u-form-help">
                Billing data was synced from Stripe successfully.
              </p>
            </Callout>
          )}

          {syncError && (
            <Callout variant="error" title="Sync failed">
              <p className="u-form-help">
                {syncError.message || "Unable to sync billing data."}
              </p>
            </Callout>
          )}
        </div>
      </Card>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="u-form-column"
        noValidate
      >
        {isSaveSuccess && (
          <Callout
            variant="success"
            title="Billing settings saved"
            icon={<Icon name="CheckCircle" />}
          >
            <p className="u-form-help">
              Invoice and billing preferences were updated successfully.
            </p>
          </Callout>
        )}

        {saveError && (
          <Callout variant="error" title="Save failed">
            <p className="u-form-help">
              {saveError.message || "Unable to save billing settings."}
            </p>
          </Callout>
        )}

        <div>
          <label htmlFor="legalName" className="u-form-label">
            Legal company name
          </label>
          <Input id="legalName" fullWidth {...register("legalName")} />
          {errors.legalName && (
            <p className="u-form-error">{errors.legalName.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="billingEmail" className="u-form-label">
            Billing email
          </label>
          <Input
            id="billingEmail"
            type="email"
            fullWidth
            {...register("billingEmail")}
          />
          {errors.billingEmail && (
            <p className="u-form-error">{errors.billingEmail.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="currency" className="u-form-label">
            Default currency
          </label>
          <Controller
            name="currency"
            control={control}
            render={({ field }) => (
              <Select
                id="currency"
                value={field.value}
                onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                  field.onChange(event.target.value)
                }
                options={billingCurrencies.map((currency) => ({
                  label: currencyLabels[currency],
                  value: currency,
                }))}
              />
            )}
          />
          {errors.currency && (
            <p className="u-form-error">{errors.currency.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="taxId" className="u-form-label">
            Tax ID / VAT number
          </label>
          <Input
            id="taxId"
            fullWidth
            placeholder="Optional"
            {...register("taxId")}
          />
          {errors.taxId && (
            <p className="u-form-error">{errors.taxId.message}</p>
          )}
        </div>

        <fieldset className="u-border-0 u-p-0 u-m-0">
          <legend className="u-form-label">Invoice delivery</legend>
          <div className="u-form-radio-group u-mt-2">
            {invoiceDeliveryOptions.map((option) => (
              <label key={option} className="u-form-radio-option">
                <input
                  type="radio"
                  value={option}
                  {...register("invoiceDelivery")}
                />
                {option === "email" ? "Email PDF invoices" : "Customer billing portal"}
              </label>
            ))}
          </div>
          {errors.invoiceDelivery && (
            <p className="u-form-error">{errors.invoiceDelivery.message}</p>
          )}
        </fieldset>

        <div className="u-mt-2">
          <Button
            type="submit"
            variant="primary"
            disabled={!isDirty || !isValid || isSaving}
            loading={isSaving}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
