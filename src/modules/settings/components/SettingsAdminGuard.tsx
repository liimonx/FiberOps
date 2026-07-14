"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button, Callout } from "@shohojdhara/atomix";
import { canAccessSettings } from "@/lib/auth/rbac";
import { useAuthStore } from "@/stores/useAuthStore";

export function SettingsAdminGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const isSessionReady = useAuthStore((state) => state.isSessionReady);
  const useMsw = process.env.NEXT_PUBLIC_USE_MSW !== "false";

  useEffect(() => {
    if (!isHydrated || !isSessionReady) return;
    if (!user && !useMsw) {
      router.replace(`/login?from=${encodeURIComponent(pathname)}`);
    }
  }, [isHydrated, isSessionReady, user, useMsw, pathname, router]);

  if (!isHydrated || !isSessionReady) {
    return (
      <div className="u-flex u-flex-column u-gap-4" aria-busy="true">
        <div className="u-skeleton u-h-24" />
        <div className="u-skeleton u-h-48" />
      </div>
    );
  }

  if (!canAccessSettings(user)) {
    return (
      <Callout variant="warning" title="Admin access required">
        <p className="u-text-sm u-mb-3">
          System settings are limited to administrators. Ask an admin if you need
          access to organization, integrations, billing, or team settings.
        </p>
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={() => router.push("/dashboard")}
        >
          Back to dashboard
        </Button>
      </Callout>
    );
  }

  return <>{children}</>;
}
