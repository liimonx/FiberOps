import type { WebhookEvent } from "@/types/domain";
import type { WebhookDelivery } from "@/types/webhooks";
import {
  getIntegrationsSettings,
  getIntegrationCredential,
  getOutboundWebhookSecret,
} from "@/mocks/integrationsData";
import { assertSafeOutboundUrl } from "@/lib/ssrf";
import { createLogger } from "@/lib/logger";

export type { WebhookDelivery };

const log = createLogger("WebhookDispatch");

export type DeliveryChannel = WebhookDelivery["channel"];

const deliveries: WebhookDelivery[] = [];
const MAX_DELIVERIES = 50;

function pushDelivery(entry: Omit<WebhookDelivery, "id" | "at">): WebhookDelivery {
  const record: WebhookDelivery = {
    ...entry,
    id: `del-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    at: new Date().toISOString(),
  };
  deliveries.unshift(record);
  if (deliveries.length > MAX_DELIVERIES) {
    deliveries.length = MAX_DELIVERIES;
  }
  return record;
}

export function getWebhookDeliveries(): WebhookDelivery[] {
  return deliveries.map((item) => ({ ...item }));
}

function hmacSha256Hex(secret: string, body: string): string {
  // Lightweight deterministic mock signature (not crypto.subtle — sync for MSW).
  let hash = 0;
  const input = `${secret}:${body}`;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return `mock${Math.abs(hash).toString(16).padStart(8, "0")}`;
}

async function postJson(
  url: string,
  body: unknown,
  headers: Record<string, string> = {}
): Promise<{ ok: boolean; status: number; message: string }> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(body),
    });
    return {
      ok: response.ok,
      status: response.status,
      message: response.ok ? "Delivered" : `HTTP ${response.status}`,
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      message: error instanceof Error ? error.message : "Delivery failed",
    };
  }
}

/**
 * MSW/in-process dispatcher. In browser/MSW, external posts may fail (CORS);
 * we still record the attempt so Integrations UI can show delivery history.
 * When running via Next.js route handler (Node), real HTTP posts succeed.
 */
export async function dispatchIntegrationEvent(
  event: WebhookEvent,
  payload: Record<string, unknown>
): Promise<WebhookDelivery[]> {
  const settings = getIntegrationsSettings();
  const results: WebhookDelivery[] = [];
  const envelope = {
    event,
    occurredAt: new Date().toISOString(),
    data: payload,
  };
  const body = JSON.stringify(envelope);
  const preview = body.slice(0, 180);

  const webhook = settings.outboundWebhook;
  if (webhook.enabled && webhook.url && webhook.events.includes(event)) {
    const safety = assertSafeOutboundUrl(webhook.url);
    if (!safety.ok) {
      results.push(
        pushDelivery({
          event,
          channel: "outbound",
          target: webhook.url,
          ok: false,
          message: safety.message,
          payloadPreview: preview,
        })
      );
    } else {
      const secret = getOutboundWebhookSecret() ?? "";
      const signature = hmacSha256Hex(secret, body);
      const result = await postJson(webhook.url, envelope, {
        "X-FiberOps-Event": event,
        "X-FiberOps-Signature": `sha256=${signature}`,
      });
      results.push(
        pushDelivery({
          event,
          channel: "outbound",
          target: webhook.url,
          ok: result.ok,
          statusCode: result.status || undefined,
          message: result.message,
          payloadPreview: preview,
        })
      );
    }
  }

  const slack = settings.integrations.find((item) => item.id === "slack");
  if (slack?.enabled && (event === "incident.created" || event === "incident.resolved" || event === "outage.detected")) {
    const slackUrl = getIntegrationCredential("slack", "webhookUrl");
    if (slackUrl) {
      const safety = assertSafeOutboundUrl(slackUrl);
      if (!safety.ok) {
        results.push(
          pushDelivery({
            event,
            channel: "slack",
            target: slackUrl,
            ok: false,
            message: safety.message,
            payloadPreview: preview,
          })
        );
      } else {
        const text = `[FiberOps] ${event}: ${String(payload.title ?? payload.id ?? "update")}`;
        const result = await postJson(slackUrl, { text });
        results.push(
          pushDelivery({
            event,
            channel: "slack",
            target: slackUrl,
            ok: result.ok,
            statusCode: result.status || undefined,
            message: result.message,
            payloadPreview: text,
          })
        );
      }
    }
  }

  const pagerduty = settings.integrations.find((item) => item.id === "pagerduty");
  if (
    pagerduty?.enabled &&
    (event === "incident.created" || event === "outage.detected")
  ) {
    const routingKey = getIntegrationCredential("pagerduty", "routingKey");
    if (routingKey) {
      const pdBody = {
        routing_key: routingKey,
        event_action: "trigger",
        payload: {
          summary: String(payload.title ?? `FiberOps ${event}`),
          severity: String(payload.severity ?? "error"),
          source: "fiberops",
        },
      };
      const result = await postJson(
        "https://events.pagerduty.com/v2/enqueue",
        pdBody
      );
      results.push(
        pushDelivery({
          event,
          channel: "pagerduty",
          target: "events.pagerduty.com",
          ok: result.ok,
          statusCode: result.status || undefined,
          message: result.message,
          payloadPreview: JSON.stringify(pdBody).slice(0, 180),
        })
      );
    }
  }

  if (results.length > 0) {
    log.info(`Dispatched ${event}`, { count: results.length });
  }

  return results;
}
