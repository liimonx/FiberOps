"use client";

import { usePathname } from "next/navigation";
import { Providers } from "./providers";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Shell } from "@/patterns/Shell";

const authRoutes = ["/login", "/register"];

export function ClientRoot({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));
  const useMsw = process.env.NEXT_PUBLIC_USE_MSW !== "false";

  return (
    <Providers>
      <ErrorBoundary>
        {isAuthRoute ? (
          children
        ) : (
          <Shell useMsw={useMsw}>{children}</Shell>
        )}
      </ErrorBoundary>
    </Providers>
  );
}
