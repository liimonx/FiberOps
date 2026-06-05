import { delay, http, HttpResponse, ws } from "msw";
import { assets, customers, incidents } from "@/mocks/data";
import { createLogger } from "@/lib/logger";

const log = createLogger("MSW");

const chat = ws.link("ws://localhost:8080/ws");

export const handlers = [
  // WebSocket Mocking
  chat.addEventListener("connection", ({ client }) => {
    log.info("WebSocket connected:", client.id);

    // Send initial heartbeat
    client.send(
      JSON.stringify({
        type: "heartbeat",
        data: {
          serverTime: new Date().toISOString(),
          connectedClients: 1,
        },
      })
    );

    // Simulate random node updates every 10 seconds
    const interval = setInterval(() => {
      const randomNode = assets[Math.floor(Math.random() * assets.length)];
      if (!randomNode) return;

      const statuses = ["active", "degraded", "down", "maintenance"];
      const newStatus = statuses[Math.floor(Math.random() * statuses.length)];

      client.send(
        JSON.stringify({
          type: "status_broadcast",
          data: {
            nodeId: randomNode.id,
            status: newStatus,
            timestamp: new Date().toISOString(),
          },
        })
      );
    }, 10000);

    client.addEventListener("close", () => {
      clearInterval(interval);
      log.info("WebSocket disconnected:", client.id);
    });
  }),

  // Bypass Mapbox telemetry requests to avoid console errors
  http.post("https://events.mapbox.com/events/v2", () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.get("/api/assets", async () => {
    await delay(350);
    return HttpResponse.json({ items: assets });
  }),

  http.get("/api/customers", async () => {
    await delay(350);
    return HttpResponse.json({ items: customers });
  }),

  http.get("/api/incidents", async () => {
    await delay(450);
    return HttpResponse.json({ items: incidents });
  }),

  // Network usage statistics for the dashboard charts
  http.get("/api/stats/usage", async () => {
    await delay(200);
    // Generate some variability for "live" feel
    const baseTrends = [
      { label: "00:00", value: 450 + Math.random() * 50 },
      { label: "02:00", value: 380 + Math.random() * 40 },
      { label: "04:00", value: 320 + Math.random() * 30 },
      { label: "06:00", value: 410 + Math.random() * 50 },
      { label: "08:00", value: 580 + Math.random() * 80 },
      { label: "10:00", value: 720 + Math.random() * 90 },
      { label: "12:00", value: 850 + Math.random() * 100 },
      { label: "14:00", value: 790 + Math.random() * 80 },
      { label: "16:00", value: 830 + Math.random() * 90 },
      { label: "18:00", value: 920 + Math.random() * 110 },
      { label: "20:00", value: 880 + Math.random() * 100 },
      { label: "22:00", value: 740 + Math.random() * 80 },
      { label: "23:59", value: 600 + Math.random() * 60 },
    ];
    return HttpResponse.json(baseTrends);
  }),
];

