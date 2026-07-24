"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { clearAuthToken } from "@/lib/apiClient";
import { useAuthStore } from "@/stores/useAuthStore";

const authRoutes = ["/login", "/register"];

/**
 * Validates persisted sessions after Zustand rehydration and keeps
 * auth routes / app routes in sync with the mock auth store.
 */
export function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const fetchMe = useAuthStore((state) => state.fetchMe);

  useEffect(() => {
    if (!isHydrated || !token) return;

    let cancelled = false;
    (async () => {
      try {
        await fetchMe();
      } catch {
        if (!cancelled) {
          clearAuthToken();
          useAuthStore.setState({ user: null, token: null });
          router.replace("/login");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isHydrated, token, fetchMe, router]);

  useEffect(() => {
    if (!isHydrated) return;

    const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

    if (isAuthRoute && (user || token)) {
      router.replace("/dashboard");
      return;
    }

    if (!isAuthRoute && !user && !token) {
      const from = pathname || "/dashboard";
      router.replace(`/login?from=${encodeURIComponent(from)}`);
    }
  }, [isHydrated, pathname, user, token, router]);

  if (!isHydrated) {
    return null;
  }

  return <>{children}</>;
}
