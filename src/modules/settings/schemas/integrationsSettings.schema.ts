import { z } from "zod";
import type { IntegrationProviderId, WebhookEvent } from "@/types/domain";

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
});

export type IntegrationUpdateFormValues = z.infer<
  typeof integrationUpdateSchema
>;

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

    try {
      new URL(data.url);
    } catch {
      ctx.addIssue({
        code: "custom",
        message: "Enter a valid webhook URL",
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
  };
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
        try {
          new URL(data.webhookUrl);
        } catch {
          issues.push({
            code: "custom",
            message: "Enter a valid webhook URL",
            path: ["webhookUrl"],
          });
        }
      }
    }

    if (
      (providerId === "mapbox" || providerId === "stripe") &&
      needsCredential &&
      !data.apiKey
    ) {
      issues.push({
        code: "custom",
        message:
          providerId === "mapbox"
            ? "Access token is required"
            : "Secret key is required",
        path: ["apiKey"],
      });
    } else if (data.apiKey && data.apiKey.length < 8) {
      issues.push({
        code: "custom",
        message: "Credential must be at least 8 characters",
        path: ["apiKey"],
      });
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
