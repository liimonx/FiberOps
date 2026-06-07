import type {
  BillingSettings,
  BillingSettingsPayload,
  StripeConnectionSummary,
} from "@/types/domain";
import type { BillingSettingsFormValues } from "@/modules/settings/schemas/billingSettings.schema";
import { getIntegrationsSettings } from "@/mocks/integrationsData";

export const defaultBillingSettings: BillingSettings = {
  legalName: "BCN Fiber Networks Ltd.",
  billingEmail: "billing@bcn-fiberops.com",
  currency: "USD",
  taxId: "US-12-3456789",
  invoiceDelivery: "email",
  lastSyncedAt: null,
};

let billingSettings: BillingSettings = { ...defaultBillingSettings };

function getStripeSummary(): StripeConnectionSummary {
  const stripe = getIntegrationsSettings().integrations.find(
    (integration) => integration.id === "stripe"
  );

  if (!stripe) {
    return {
      status: "disconnected",
      enabled: false,
    };
  }

  return {
    status: stripe.status,
    enabled: stripe.enabled,
    apiKeyMasked: stripe.apiKeyMasked,
  };
}

export function getBillingSettingsPayload(): BillingSettingsPayload {
  return {
    settings: { ...billingSettings },
    stripe: getStripeSummary(),
  };
}

export function setBillingSettings(
  data: BillingSettingsFormValues
): BillingSettingsPayload {
  billingSettings = {
    ...data,
    lastSyncedAt: billingSettings.lastSyncedAt,
  };

  return getBillingSettingsPayload();
}

export function syncBillingWithStripe(): BillingSettingsPayload {
  const stripe = getStripeSummary();

  if (stripe.status !== "connected") {
    throw new Error("Connect Stripe under Integrations before syncing billing data.");
  }

  billingSettings = {
    ...billingSettings,
    lastSyncedAt: new Date().toISOString(),
  };

  return getBillingSettingsPayload();
}
