import { delay, http, HttpResponse } from "msw";
import { assets, customers, incidents } from "@/mocks/data";

export const handlers = [
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

