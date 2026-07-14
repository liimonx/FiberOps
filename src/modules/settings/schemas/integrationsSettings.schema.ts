import { z } from "zod";
import type { IntegrationProviderId, WebhookEvent } from "@/types/domain";
import { assertSafeInternalHost, assertSafeOutboundUrl } from "@/lib/ssrf";

export const webhookEvents = [
  "incident.created",
  "incident.resolved",
  "outage.detected",
  "work_order.updated",
] as const satisfies readonly WebhookEvent[];

export const integrationUpdateSchema = z.object({
  enabled: z.boolean(),
  apiKey: z.string().optional(),
  webhookUrl: z.string().optional(),
  routingKey: z.string().optional(),
  host: z.string().optional(),
  port: z.number().int().min(1).max(65535).optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  useSsl: z.boolean().optional(),
  verifySsl: z.boolean().optional(),
  apiMode: z.enum(["rest", "classic"]).optional(),
  monitoredInterface: z.string().optional(),
});

export type IntegrationUpdateFormValues = z.infer<
  typeof integrationUpdateSchema
>;

export const mikrotikTestSchema = z.object({
  host: z.string().optional(),
  port: z.number().int().min(1).max(65535).optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  useSsl: z.boolean().optional(),
  verifySsl: z.boolean().optional(),
  apiMode: z.enum(["rest", "classic"]).optional(),
});

export type MikrotikTestFormValues = z.infer<typeof mikrotikTestSchema>;

export const outboundWebhookSchema = z
  .object({
    enabled: z.boolean(),
    url: z.string().trim(),
    secret: z.string().optional(),
    events: z.array(z.enum(webhookEvents)),
  })
  .superRefine((data, ctx) => {
    if (!data.enabled) {
      return;
    }

    if (!data.url) {
      ctx.addIssue({
        code: "custom",
        message: "Webhook URL is required when enabled",
        path: ["url"],
      });
      return;
    }

    const safety = assertSafeOutboundUrl(data.url);
    if (!safety.ok) {
      ctx.addIssue({
        code: "custom",
        message: safety.message,
        path: ["url"],
      });
    }

    if (data.events.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "Select at least one event",
        path: ["events"],
      });
    }
  });

export type OutboundWebhookFormValues = z.infer<typeof outboundWebhookSchema>;

type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: z.ZodError };

function normalizeOptionalSecret(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed === "" ? undefined : trimmed;
}

export function validateOutboundWebhook(
  values: OutboundWebhookFormValues,
  hasExistingSecret: boolean
): ValidationResult<OutboundWebhookFormValues> {
  const parsed = outboundWebhookSchema.safeParse(values);
  if (!parsed.success) {
    return parsed;
  }

  const data = {
    ...parsed.data,
    secret: normalizeOptionalSecret(parsed.data.secret),
  };

  if (data.enabled && !hasExistingSecret && !data.secret) {
    return {
      success: false,
      error: new z.ZodError([
        {
          code: "custom",
          message: "Signing secret is required when enabling webhooks",
          path: ["secret"],
        },
      ]),
    };
  }

  if (data.secret && data.secret.length < 8) {
    return {
      success: false,
      error: new z.ZodError([
        {
          code: "custom",
          message: "Signing secret must be at least 8 characters",
          path: ["secret"],
        },
      ]),
    };
  }

  return {
    success: true,
    data,
  };
}

type IntegrationValidationResult = ValidationResult<IntegrationUpdateFormValues>;

function normalizeIntegrationValues(
  values: IntegrationUpdateFormValues
): IntegrationUpdateFormValues {
  const trim = (value?: string) => {
    const trimmed = value?.trim();
    return trimmed === "" ? undefined : trimmed;
  };

  return {
    enabled: values.enabled,
    apiKey: trim(values.apiKey),
    webhookUrl: trim(values.webhookUrl),
    routingKey: trim(values.routingKey),
    host: trim(values.host),
    username: trim(values.username),
    password: trim(values.password),
    monitoredInterface: trim(values.monitoredInterface),
    port: values.port,
    useSsl: values.useSsl,
    verifySsl: values.verifySsl,
    apiMode: values.apiMode,
  };
}

function looksLikeMapboxToken(value: string): boolean {
  return /^(pk|sk)\.[A-Za-z0-9_-]{8,}$/.test(value);
}

function looksLikeStripeSecret(value: string): boolean {
  return /^sk_(test|live)_[A-Za-z0-9]{8,}$/.test(value);
}

function looksLikeSlackWebhook(value: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      (url.hostname === "hooks.slack.com" ||
        url.hostname.endsWith(".slack.com"))
    );
  } catch {
    return false;
  }
}

export function validateIntegrationUpdate(
  providerId: IntegrationProviderId,
  values: IntegrationUpdateFormValues,
  hasExistingCredentials: boolean
): IntegrationValidationResult {
  const parsed = integrationUpdateSchema.safeParse(values);
  if (!parsed.success) {
    return parsed;
  }

  const data = normalizeIntegrationValues(parsed.data);
  const issues: z.ZodIssue[] = [];

  if (data.enabled) {
    const needsCredential = !hasExistingCredentials;

    if (providerId === "slack") {
      if (needsCredential && !data.webhookUrl) {
        issues.push({
          code: "custom",
          message: "Incoming webhook URL is required",
          path: ["webhookUrl"],
        });
      } else if (data.webhookUrl) {
        const safety = assertSafeOutboundUrl(data.webhookUrl);
        if (!safety.ok) {
          issues.push({
            code: "custom",
            message: safety.message,
            path: ["webhookUrl"],
          });
        } else if (!looksLikeSlackWebhook(data.webhookUrl)) {
          issues.push({
            code: "custom",
            message: "Enter a valid Slack incoming webhook URL",
            path: ["webhookUrl"],
          });
        }
      }
    }

    if (providerId === "mapbox") {
      if (needsCredential && !data.apiKey) {
        issues.push({
          code: "custom",
          message: "Access token is required",
          path: ["apiKey"],
        });
      } else if (data.apiKey && !looksLikeMapboxToken(data.apiKey)) {
        issues.push({
          code: "custom",
          message: "Mapbox token must start with pk. or sk.",
          path: ["apiKey"],
        });
      }
    }

    if (providerId === "stripe") {
      if (needsCredential && !data.apiKey) {
        issues.push({
          code: "custom",
          message: "Secret key is required",
          path: ["apiKey"],
        });
      } else if (data.apiKey && !looksLikeStripeSecret(data.apiKey)) {
        issues.push({
          code: "custom",
          message: "Stripe secret key must look like sk_test_… or sk_live_…",
          path: ["apiKey"],
        });
      }
    }

    if (providerId === "pagerduty") {
      if (needsCredential && !data.routingKey) {
        issues.push({
          code: "custom",
          message: "Routing key is required",
          path: ["routingKey"],
        });
      } else if (data.routingKey && data.routingKey.length < 8) {
        issues.push({
          code: "custom",
          message: "Routing key must be at least 8 characters",
          path: ["routingKey"],
        });
      }
    }

    if (providerId === "mikrotik") {
      if (needsCredential && !data.host) {
        issues.push({
          code: "custom",
          message: "Router host is required",
          path: ["host"],
        });
      } else if (data.host) {
        const safety = assertSafeInternalHost(data.host);
        if (!safety.ok) {
          issues.push({
            code: "custom",
            message: safety.message,
            path: ["host"],
          });
        }
      }
      if (needsCredential && !data.username) {
        issues.push({
          code: "custom",
          message: "API username is required",
          path: ["username"],
        });
      }
      if (needsCredential && !data.password) {
        issues.push({
          code: "custom",
          message: "API password is required",
          path: ["password"],
        });
      }
    }
  }

  if (issues.length > 0) {
    return {
      success: false,
      error: new z.ZodError(issues),
    };
  }

  return {
    success: true,
    data,
  };
}

export function validateMikrotikTest(
  values: MikrotikTestFormValues,
  saved: {
    host?: string;
    username?: string;
    password?: string;
  }
): ValidationResult<{
  host: string;
  username: string;
  password: string;
  port?: number;
  useSsl?: boolean;
  verifySsl?: boolean;
  apiMode?: "rest" | "classic";
}> {
  const parsed = mikrotikTestSchema.safeParse(values);
  if (!parsed.success) {
    return parsed;
  }

  const host = parsed.data.host?.trim() || saved.host;
  const username = parsed.data.username?.trim() || saved.username;
  const password = parsed.data.password?.trim() || saved.password;
  const issues: z.ZodIssue[] = [];

  if (!host) {
    issues.push({
      code: "custom",
      message: "Router host is required",
      path: ["host"],
    });
  } else {
    const safety = assertSafeInternalHost(host);
    if (!safety.ok) {
      issues.push({
        code: "custom",
        message: safety.message,
        path: ["host"],
      });
    }
  }

  if (!username) {
    issues.push({
      code: "custom",
      message: "API username is required",
      path: ["username"],
    });
  }

  if (!password) {
    issues.push({
      code: "custom",
      message: "API password is required",
      path: ["password"],
    });
  }

  if (issues.length > 0) {
    return { success: false, error: new z.ZodError(issues) };
  }

  return {
    success: true,
    data: {
      host: host!,
      username: username!,
      password: password!,
      port: parsed.data.port,
      useSsl: parsed.data.useSsl,
      verifySsl: parsed.data.verifySsl,
      apiMode: parsed.data.apiMode,
    },
  };
}
