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
];

