"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@shohojdhara/atomix";
import { useEffect, useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [isMswReady, setIsMswReady] = useState(false);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 10_000, retry: 1, refetchOnWindowFocus: false },
        },
      })
  );

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      setTimeout(() => setIsMswReady(true), 0);
      return;
    }

    let cancelled = false;
    (async () => {
      const { startMockServiceWorker } = await import("@/mocks/browser");
      await startMockServiceWorker();
      if (!cancelled) {
        setIsMswReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Prevent app from mounting until MSW is ready in development.
  // This avoids race conditions where components attempt WebSocket connections
  // before MSW has intercepted the global WebSocket object.
  if (!isMswReady && process.env.NODE_ENV === "development") {
    return null; // Or a loading spinner if preferred
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">{children}</ThemeProvider>
    </QueryClientProvider>
  );
}
