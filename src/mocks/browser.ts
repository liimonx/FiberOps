let started = false;

export async function startMockServiceWorker() {
  if (started) return;
  started = true;

  const { setupWorker } = await import("msw/browser");
  const { handlers } = await import("./handlers");

  const worker = setupWorker(...handlers);

  await worker.start({
    onUnhandledRequest(request, print) {
      const url = new URL(request.url);

      // Next.js internals and static assets load via passthrough.
      // Mapbox requests are handled explicitly in handlers.ts via bypass().
      if (
        url.pathname.startsWith("/_next") ||
        url.pathname.startsWith("/mockServiceWorker")
      ) {
        return;
      }

      if (
        url.hostname.endsWith(".mapbox.com") ||
        url.hostname === "mapbox.com"
      ) {
        return;
      }

      if (url.pathname.startsWith("/api/")) {
        print.warning();
      }
    },
  });
}

