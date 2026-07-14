import type {
  Integration,
  IntegrationProviderId,
  IntegrationsSettings,
  IntegrationStatus,
  OutboundWebhook,
  WebhookEvent,
} from "@/types/domain";
import type {
  IntegrationUpdateFormValues,
  MikrotikTestFormValues,
  OutboundWebhookFormValues,
} from "@/modules/settings/schemas/integrationsSettings.schema";
import { sealSecret, unsealSecret } from "@/lib/secretVault";

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

function credentialPlaintext(
  credentials: ProviderCredentials
): ProviderCredentials {
  return {
    ...credentials,
    apiKey: unsealSecret(credentials.apiKey),
    webhookUrl: unsealSecret(credentials.webhookUrl),
    routingKey: unsealSecret(credentials.routingKey),
    password: unsealSecret(credentials.password),
    // host/username are not secrets; secret field sealed separately
  };
}

function hasCredentials(
  providerId: IntegrationProviderId,
  credentials: ProviderCredentials
): boolean {
  const plain = credentialPlaintext(credentials);
  switch (providerId) {
    case "mapbox":
    case "stripe":
      return Boolean(plain.apiKey);
    case "slack":
      return Boolean(plain.webhookUrl);
    case "pagerduty":
      return Boolean(plain.routingKey);
    case "mikrotik":
      return Boolean(plain.host && plain.username && plain.password);
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
  const plain = credentialPlaintext(credentials);
  const status = deriveStatus(integration.id, integration.enabled, credentials);
  const apiKeyMasked =
    integration.id === "mikrotik"
      ? plain.password != null
        ? maskSecret(plain.password)
        : undefined
      : plain.apiKey != null
        ? maskSecret(plain.apiKey, integration.id === "stripe" ? "sk-" : "")
        : plain.webhookUrl != null
          ? maskWebhookUrl(plain.webhookUrl)
          : plain.routingKey != null
            ? maskSecret(plain.routingKey)
            : undefined;

  if (integration.id === "mikrotik") {
    return {
      ...integration,
      status,
      host: plain.host,
      port: plain.port,
      username: plain.username,
      passwordMasked: apiKeyMasked,
      useSsl: plain.useSsl,
      verifySsl: plain.verifySsl,
      apiMode: plain.apiMode,
      monitoredInterface: plain.monitoredInterface,
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
  const secret = unsealSecret(webhook.secret);
  const { secret: _sealed, ...rest } = webhook;
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
    mapbox: { apiKey: sealSecret("pk.test_mapbox_token_abcdef") },
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

export function getMapboxAccessToken(): string | null {
  const integration = state.integrations.find((item) => item.id === "mapbox");
  if (!integration?.enabled) {
    return null;
  }
  const token = unsealSecret(state.credentials.mapbox.apiKey);
  return token || null;
}

export function getMikrotikSavedCredentials(): {
  host?: string;
  username?: string;
  password?: string;
} {
  const plain = credentialPlaintext(state.credentials.mikrotik);
  return {
    host: plain.host,
    username: plain.username,
    password: plain.password,
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
    credentials.apiKey = sealSecret(patch.apiKey);
  }
  if (patch.webhookUrl) {
    credentials.webhookUrl = sealSecret(patch.webhookUrl);
  }
  if (patch.routingKey) {
    credentials.routingKey = sealSecret(patch.routingKey);
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
    credentials.password = sealSecret(patch.password);
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
      ? sealSecret(patch.secret)
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
  return Boolean(unsealSecret(state.outboundWebhook.secret));
}

export function getOutboundWebhookSecret(): string | undefined {
  return unsealSecret(state.outboundWebhook.secret);
}

export function getIntegrationCredential(
  providerId: IntegrationProviderId,
  field: keyof ProviderCredentials
): string | undefined {
  const plain = credentialPlaintext(state.credentials[providerId]);
  const value = plain[field];
  return typeof value === "string" ? value : undefined;
}

export function testMikrotikConnection(payload?: MikrotikTestFormValues): {
  ok: boolean;
  message: string;
  identity?: string;
} {
  const saved = getMikrotikSavedCredentials();
  const host = payload?.host?.trim() || saved.host;
  const username = payload?.username?.trim() || saved.username;
  const password = payload?.password?.trim() || saved.password;

  if (!host || !username || !password) {
    return { ok: false, message: "Mikrotik credentials are incomplete." };
  }

  return {
    ok: true,
    message: "Connected successfully",
    identity: host,
  };
}
