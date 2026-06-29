import { delay, http, ws } from "msw";
import { getAssets } from "@/mocks/assetsData";
import { handleApiRequest } from "@/mocks/apiRouter";
import { createLogger } from "@/lib/logger";

const log = createLogger("MSW");

const chat = ws.link("ws://localhost:8080/ws");

async function toHttpResponse(request: Request, delayMs = 0) {
  if (delayMs > 0) {
    await delay(delayMs);
  }

  const response = await handleApiRequest(request);
  const body = await response.text();

  return new Response(body, {
    status: response.status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

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
      const assetList = getAssets();
      const randomNode = assetList[Math.floor(Math.random() * assetList.length)];
      if (!randomNode) return;

      const statuses = ["active", "warning", "error", "inactive"];
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

  http.all("/api/*", ({ request }) => toHttpResponse(request, 300)),
];
