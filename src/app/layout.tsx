import type { Metadata } from "next";
import "@shohojdhara/atomix/css";
import "./globals.css";
import { Shell } from "@/patterns/Shell";
import { Providers } from "./providers";

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
      <body>
        <Providers>
          <Shell>{children}</Shell>
        </Providers>
      </body>
    </html>
  );
}
