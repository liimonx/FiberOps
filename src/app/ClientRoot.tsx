"use client";

import { usePathname } from "next/navigation";
import { Providers } from "./providers";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthBootstrap } from "@/components/AuthBootstrap";
import { Shell } from "@/patterns/Shell";

const authRoutes = ["/login", "/register"];

export function ClientRoot({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  return (
    <Providers>
      <ErrorBoundary>
        <AuthBootstrap>
          {isAuthRoute ? children : <Shell>{children}</Shell>}
        </AuthBootstrap>
      </ErrorBoundary>
    </Providers>
  );
}
