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
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  useSsl?: boolean;
  verifySsl?: boolean;
  apiMode?: "rest" | "classic";
  monitoredInterface?: string;
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
    case "mikrotik":
      return Boolean(credentials.host && credentials.username && credentials.password);
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
    integration.id === "mikrotik"
      ? credentials.password != null
        ? maskSecret(credentials.password)
        : undefined
      : credentials.apiKey != null
      ? maskSecret(credentials.apiKey, integration.id === "stripe" ? "sk-" : "")
      : credentials.webhookUrl != null
        ? maskWebhookUrl(credentials.webhookUrl)
        : credentials.routingKey != null
          ? maskSecret(credentials.routingKey)
          : undefined;

  if (integration.id === "mikrotik") {
    return {
      ...integration,
      status,
      host: credentials.host,
      port: credentials.port,
      username: credentials.username,
      passwordMasked: apiKeyMasked,
      useSsl: credentials.useSsl,
      verifySsl: credentials.verifySsl,
      apiMode: credentials.apiMode,
      monitoredInterface: credentials.monitoredInterface,
    };
  }

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
    {
      id: "mikrotik",
      name: "Mikrotik",
      description: "RouterOS PPPoE, interface, and netwatch monitoring.",
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
    mikrotik: {},
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
  if (patch.host) {
    credentials.host = patch.host;
  }
  if (patch.port) {
    credentials.port = patch.port;
  }
  if (patch.username) {
    credentials.username = patch.username;
  }
  if (patch.password) {
    credentials.password = patch.password;
  }
  if (patch.useSsl !== undefined) {
    credentials.useSsl = patch.useSsl;
  }
  if (patch.verifySsl !== undefined) {
    credentials.verifySsl = patch.verifySsl;
  }
  if (patch.apiMode) {
    credentials.apiMode = patch.apiMode;
  }
  if (patch.monitoredInterface !== undefined) {
    credentials.monitoredInterface = patch.monitoredInterface;
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

export function testMikrotikConnection(): {
  ok: boolean;
  message: string;
  identity?: string;
} {
  const credentials = state.credentials.mikrotik;

  if (!credentials.host || !credentials.username || !credentials.password) {
    return { ok: false, message: "Mikrotik credentials are incomplete." };
  }

  return {
    ok: true,
    message: "Connected successfully",
    identity: credentials.host,
  };
}
