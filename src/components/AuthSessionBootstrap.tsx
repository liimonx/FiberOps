"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { getAuthToken } from "@/lib/apiClient";
import { useAuthStore } from "@/stores/useAuthStore";

const authRoutes = ["/login", "/register", "/invite"];

/**
 * Restores an in-memory bearer after reload (token is not persisted) and
 * bootstraps a demo admin session through the local mock API when needed.
 */
export function AuthSessionBootstrap() {
  const pathname = usePathname();
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const fetchMe = useAuthStore((state) => state.fetchMe);
  const bootstrapDemoSession = useAuthStore((state) => state.bootstrapDemoSession);
  const setSessionReady = useAuthStore((state) => state.setSessionReady);
  const started = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("fiberops:auth-token");
    }
  }, []);

  useEffect(() => {
    if (!isHydrated || started.current) return;
    const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
    if (isAuthRoute) {
      setSessionReady(true);
      return;
    }

    started.current = true;

    void (async () => {
      try {
        if (getAuthToken()) {
          try {
            await fetchMe();
          } catch {
            await bootstrapDemoSession();
          }
          return;
        }

        await bootstrapDemoSession();
      } finally {
        setSessionReady(true);
      }
    })();
  }, [
    isHydrated,
    pathname,
    fetchMe,
    bootstrapDemoSession,
    setSessionReady,
  ]);

  return null;
}
