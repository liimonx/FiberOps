import type {
  Integration,
  IntegrationProviderId,
  IntegrationsSettings,
  IntegrationStatus,
  OutboundWebhook,
  WebhookEvent,
} from "@/types/domain";
import type { IntegrationUpdateFormValues } from "@/modules/settings/schemas/integrationsSettings.schema";
import type { OutboundWebhookFormValues } from "@/modules/settings/schemas/integrationsSettings.schema";

type ProviderCredentials = {
  apiKey?: string;
  webhookUrl?: string;
  routingKey?: string;
};

type InternalIntegrationsState = {
  integrations: Integration[];
  credentials: Record<IntegrationProviderId, ProviderCredentials>;
  outboundWebhook: OutboundWebhook & { secret?: string };
};

function maskSecret(value: string, prefix = ""): string {
  const suffix = value.slice(-4);
  return `${prefix}${"•".repeat(8)}${suffix}`;
}

function maskWebhookUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}/••••••••${url.slice(-4)}`;
  } catch {
    return maskSecret(url);
  }
}

function hasCredentials(
  providerId: IntegrationProviderId,
  credentials: ProviderCredentials
): boolean {
  switch (providerId) {
    case "mapbox":
    case "stripe":
      return Boolean(credentials.apiKey);
    case "slack":
      return Boolean(credentials.webhookUrl);
    case "pagerduty":
      return Boolean(credentials.routingKey);
  }
}

function deriveStatus(
  providerId: IntegrationProviderId,
  enabled: boolean,
  credentials: ProviderCredentials
): IntegrationStatus {
  if (!enabled) {
    return "disconnected";
  }

  return hasCredentials(providerId, credentials) ? "connected" : "error";
}

function toPublicIntegration(
  integration: Integration,
  credentials: ProviderCredentials
): Integration {
  const status = deriveStatus(integration.id, integration.enabled, credentials);
  const apiKeyMasked =
    credentials.apiKey != null
      ? maskSecret(credentials.apiKey, integration.id === "stripe" ? "sk-" : "")
      : credentials.webhookUrl != null
        ? maskWebhookUrl(credentials.webhookUrl)
        : credentials.routingKey != null
          ? maskSecret(credentials.routingKey)
          : undefined;

  return {
    ...integration,
    status,
    apiKeyMasked,
  };
}

function toPublicWebhook(
  webhook: InternalIntegrationsState["outboundWebhook"]
): OutboundWebhook {
  const { secret, ...rest } = webhook;
  return {
    ...rest,
    secretMasked: secret ? maskSecret(secret) : undefined,
  };
}

export const defaultIntegrationsSettings: IntegrationsSettings = {
  integrations: [
    {
      id: "mapbox",
      name: "Mapbox",
      description: "GIS basemap and geocoding for the network map.",
      status: "connected",
      enabled: true,
      apiKeyMasked: "pk.••••••••cdef",
    },
    {
      id: "slack",
      name: "Slack",
      description: "Post incident and outage alerts to a Slack channel.",
      status: "disconnected",
      enabled: false,
    },
    {
      id: "pagerduty",
      name: "PagerDuty",
      description: "Escalate critical incidents to on-call engineers.",
      status: "disconnected",
      enabled: false,
    },
    {
      id: "stripe",
      name: "Stripe",
      description: "Sync billing and subscription data with FiberOps.",
      status: "disconnected",
      enabled: false,
    },
  ],
  outboundWebhook: {
    enabled: false,
    url: "",
    events: [],
  },
};

const state: InternalIntegrationsState = {
  integrations: defaultIntegrationsSettings.integrations.map((integration) => ({
    id: integration.id,
    name: integration.name,
    description: integration.description,
    status: integration.status,
    enabled: integration.enabled,
  })),
  credentials: {
    mapbox: { apiKey: "pk.test_mapbox_token_abcdef" },
    slack: {},
    pagerduty: {},
    stripe: {},
  },
  outboundWebhook: {
    enabled: false,
    url: "",
    events: [] as WebhookEvent[],
  },
};

export function getIntegrationsSettings(): IntegrationsSettings {
  return {
    integrations: state.integrations.map((integration) =>
      toPublicIntegration(integration, state.credentials[integration.id])
    ),
    outboundWebhook: toPublicWebhook(state.outboundWebhook),
  };
}

export function updateIntegration(
  id: IntegrationProviderId,
  patch: IntegrationUpdateFormValues
): Integration {
  const index = state.integrations.findIndex((integration) => integration.id === id);
  if (index === -1) {
    throw new Error(`Unknown integration: ${id}`);
  }

  const credentials = { ...state.credentials[id] };

  if (patch.apiKey) {
    credentials.apiKey = patch.apiKey;
  }
  if (patch.webhookUrl) {
    credentials.webhookUrl = patch.webhookUrl;
  }
  if (patch.routingKey) {
    credentials.routingKey = patch.routingKey;
  }

  const updatedIntegration: Integration = {
    ...state.integrations[index],
    enabled: patch.enabled,
  };

  state.credentials[id] = credentials;
  state.integrations[index] = updatedIntegration;

  return toPublicIntegration(updatedIntegration, credentials);
}

export function updateOutboundWebhook(
  patch: OutboundWebhookFormValues
): OutboundWebhook {
  const nextSecret =
    patch.secret !== undefined
      ? patch.secret
      : state.outboundWebhook.secret;

  state.outboundWebhook = {
    enabled: patch.enabled,
    url: patch.url,
    secret: nextSecret,
    events: patch.events,
  };

  return toPublicWebhook(state.outboundWebhook);
}

export function integrationHasExistingCredentials(
  id: IntegrationProviderId
): boolean {
  return hasCredentials(id, state.credentials[id]);
}

export function webhookHasExistingSecret(): boolean {
  return Boolean(state.outboundWebhook.secret);
}
