import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { updateOutboundWebhook } from "@/mocks/integrationsData";
import { dispatchIntegrationEvent } from "./webhookDispatcher";

describe("dispatchIntegrationEvent", () => {
  beforeEach(() => {
    updateOutboundWebhook({
      enabled: true,
      url: "https://example.com/hooks/fiberops",
      secret: "offline-test-secret",
      events: ["incident.created"],
    });
  });

  afterEach(() => {
    updateOutboundWebhook({
      enabled: false,
      url: "",
      secret: "",
      events: [],
    });
    vi.restoreAllMocks();
  });

  it("records configured webhook events without making network requests", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const deliveries = await dispatchIntegrationEvent("incident.created", {
      id: "INC-1",
      title: "Fiber cut",
    });

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(deliveries).toHaveLength(1);
    expect(deliveries[0]).toMatchObject({
      channel: "outbound",
      ok: true,
      message: "Simulated locally; no request was sent.",
    });
  });
});
