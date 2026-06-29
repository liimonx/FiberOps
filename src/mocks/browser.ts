let started = false;

async function unregisterMockServiceWorkers() {
  if (!("serviceWorker" in navigator)) return;

  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    registrations
      .filter((registration) =>
        registration.active?.scriptURL.includes("mockServiceWorker")
      )
      .map((registration) => registration.unregister())
  );
}

export async function startMockServiceWorker() {
  if (started) return;
  started = true;

  // MSW's service worker passthrough fails for cross-origin requests (Mapbox tiles).
  // Use fetch/XHR interceptors instead so unhandled requests reach the network.
  await unregisterMockServiceWorkers();

  const { defineNetwork, InterceptorSource, HttpNetworkFrame } = await import(
    "msw/experimental"
  );
  const { FetchInterceptor } = await import("@mswjs/interceptors/fetch");
  const { XMLHttpRequestInterceptor } = await import(
    "@mswjs/interceptors/XMLHttpRequest"
  );
  const { WebSocketInterceptor } = await import("@mswjs/interceptors/WebSocket");
  const { handlers } = await import("./handlers");

  const network = defineNetwork({
    handlers,
    sources: [
      new InterceptorSource({
        interceptors: [
          new FetchInterceptor(),
          new XMLHttpRequestInterceptor(),
          new WebSocketInterceptor(),
        ] as ConstructorParameters<typeof InterceptorSource>[0]["interceptors"],
      }),
    ],
    onUnhandledFrame: ({ frame, defaults }) => {
      if (!(frame instanceof HttpNetworkFrame)) {
        return;
      }

      const url = new URL(frame.data.request.url);

      if (
        url.pathname.startsWith("/_next") ||
        url.pathname.startsWith("/mockServiceWorker") ||
        url.hostname.endsWith(".mapbox.com") ||
        url.hostname === "mapbox.com"
      ) {
        return;
      }

      if (url.pathname.startsWith("/api/")) {
        defaults.warn();
      }
    },
  });

  await network.enable();
}
