"use client";

import { useQuery } from "@tanstack/react-query";
import { Badge, Button, Callout, Card } from "@shohojdhara/atomix";
import { apiClient } from "@/lib/apiClient";
import type { WebhookDelivery } from "@/types/webhooks";

export const webhookDeliveriesQueryKey = ["settings", "integrations", "deliveries"] as const;

export function WebhookDeliveryLog() {
  const query = useQuery({
    queryKey: webhookDeliveriesQueryKey,
    queryFn: () =>
      apiClient<{ items: WebhookDelivery[] }>(
        "/api/settings/integrations/deliveries"
      ),
    refetchInterval: 15_000,
  });

  const items = query.data?.items ?? [];

  return (
    <section aria-labelledby="delivery-log-heading" className="u-mt-6">
      <div className="u-settings-section-header">
        <div>
          <h2 id="delivery-log-heading" className="u-text-sm u-font-bold u-mb-1">
            Recent deliveries
          </h2>
          <p className="u-text-xs u-text-secondary-emphasis u-mb-0">
            Outbound webhook, Slack, and PagerDuty attempts from recent events.
          </p>
        </div>
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={() => query.refetch()}
          loading={query.isFetching}
        >
          Refresh
        </Button>
      </div>

      {query.isError ? (
        <Callout variant="error" title="Could not load deliveries">
          <p className="u-form-help">
            {query.error instanceof Error
              ? query.error.message
              : "Delivery history is unavailable."}
          </p>
        </Callout>
      ) : items.length === 0 ? (
        <p className="u-text-sm u-text-secondary-emphasis u-mb-0">
          No deliveries yet. Create or resolve an incident to trigger configured
          channels.
        </p>
      ) : (
        <Card>
          <ul className="u-stack u-gap-3 u-m-0 u-p-0" style={{ listStyle: "none" }}>
            {items.slice(0, 12).map((item) => (
              <li key={item.id} className="u-flex u-flex-column u-gap-1">
                <div className="u-flex u-items-center u-gap-2 u-flex-wrap">
                  <Badge
                    variant={item.ok ? "success" : "error"}
                    label={item.ok ? "ok" : "failed"}
                  />
                  <span className="u-text-sm u-font-bold">{item.event}</span>
                  <span className="u-text-xs u-text-secondary-emphasis">
                    {item.channel}
                  </span>
                  <span className="u-text-xs u-text-secondary-emphasis">
                    {new Date(item.at).toLocaleString()}
                  </span>
                </div>
                <p className="u-text-xs u-text-secondary-emphasis u-mb-0">
                  {item.target} — {item.message}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </section>
  );
}
