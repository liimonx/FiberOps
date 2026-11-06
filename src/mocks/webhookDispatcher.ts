import type { WebhookEvent } from "@/types/domain";
import type { WebhookDelivery } from "@/types/webhooks";
import {
  getIntegrationsSettings,
  getIntegrationCredential,
} from "@/mocks/integrationsData";
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

/** Record mock deliveries locally without contacting configured integrations. */
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
  const preview = JSON.stringify(envelope).slice(0, 180);

  const webhook = settings.outboundWebhook;
  if (webhook.enabled && webhook.url && webhook.events.includes(event)) {
    results.push(
      pushDelivery({
        event,
        channel: "outbound",
        target: webhook.url,
        ok: true,
        message: "Simulated locally; no request was sent.",
        payloadPreview: preview,
      })
    );
  }

  const slack = settings.integrations.find((item) => item.id === "slack");
  if (slack?.enabled && (event === "incident.created" || event === "incident.resolved" || event === "outage.detected")) {
    const slackUrl = getIntegrationCredential("slack", "webhookUrl");
    if (slackUrl) {
      results.push(
        pushDelivery({
          event,
          channel: "slack",
          target: "Slack (offline mock)",
          ok: true,
          message: "Simulated locally; no request was sent.",
          payloadPreview: `[FiberOps] ${event}: ${String(payload.title ?? payload.id ?? "update")}`,
        })
      );
    }
  }

  const pagerduty = settings.integrations.find((item) => item.id === "pagerduty");
  if (
    pagerduty?.enabled &&
    (event === "incident.created" || event === "outage.detected")
  ) {
    const routingKey = getIntegrationCredential("pagerduty", "routingKey");
    if (routingKey) {
      results.push(
        pushDelivery({
          event,
          channel: "pagerduty",
          target: "PagerDuty (offline mock)",
          ok: true,
          message: "Simulated locally; no request was sent.",
          payloadPreview: JSON.stringify({
            event_action: "trigger",
            payload: {
              summary: String(payload.title ?? `FiberOps ${event}`),
              severity: String(payload.severity ?? "error"),
              source: "fiberops",
            },
          }).slice(0, 180),
        })
      );
    }
  }

  if (results.length > 0) {
    log.info(`Dispatched ${event}`, { count: results.length });
  }

  return results;
}
