"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { getAuthToken } from "@/lib/apiClient";
import { useAuthStore } from "@/stores/useAuthStore";

const authRoutes = ["/login", "/register", "/invite"];

/**
 * Restores an in-memory bearer after reload (token is not persisted) and
 * bootstraps a demo admin session when MSW mode has no active login.
 */
export function AuthSessionBootstrap() {
  const pathname = usePathname();
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const fetchMe = useAuthStore((state) => state.fetchMe);
  const bootstrapDemoSession = useAuthStore((state) => state.bootstrapDemoSession);
  const setSessionReady = useAuthStore((state) => state.setSessionReady);
  const started = useRef(false);
  const useMsw = process.env.NEXT_PUBLIC_USE_MSW !== "false";

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
            if (useMsw) {
              await bootstrapDemoSession();
            }
          }
          return;
        }

        if (useMsw) {
          await bootstrapDemoSession();
        }
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
    useMsw,
  ]);

  return null;
}
