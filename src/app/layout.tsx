import type { Metadata } from "next";
import "./globals.scss";
import { Shell } from "@/patterns/Shell";
import { Providers } from "./providers";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  title: "BCN FiberOps",
  description:
    "Telecom network operations dashboard (frontend-first, mock-driven).",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <a href="#main-content" className="skip-to-main">
          Skip to main content
        </a>
        <Providers>
          <ErrorBoundary>
            <Shell>{children}</Shell>
          </ErrorBoundary>
        </Providers>
      </body>
    </html>
  );
}
