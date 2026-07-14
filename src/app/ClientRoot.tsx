"use client";

import { usePathname } from "next/navigation";
import { Providers } from "./providers";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthSessionBootstrap } from "@/components/AuthSessionBootstrap";
import { IncidentAlertToaster } from "@/components/IncidentAlertToaster";
import { Shell } from "@/patterns/Shell";

const authRoutes = ["/login", "/register", "/invite"];

export function ClientRoot({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  return (
    <Providers>
      <ErrorBoundary>
        <AuthSessionBootstrap />
        {isAuthRoute ? (
          children
        ) : (
          <Shell>
            {children}
            <IncidentAlertToaster />
          </Shell>
        )}
      </ErrorBoundary>
    </Providers>
  );
}
