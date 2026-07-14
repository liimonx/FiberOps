export type WebhookDelivery = {
  id: string;
  at: string;
  event: string;
  channel: "outbound" | "slack" | "pagerduty";
  target: string;
  ok: boolean;
  statusCode?: number;
  message: string;
  payloadPreview: string;
};
