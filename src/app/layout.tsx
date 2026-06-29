import type { Metadata } from "next";
import "./globals.scss";
import { ClientRoot } from "./ClientRoot";

export const metadata: Metadata = {
  title: "BCN FiberOps",
  description: "Telecom network operations dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning data-atomix-color-mode="dark">
        <a href="#main-content" className="skip-to-main">
          Skip to main content
        </a>
        <ClientRoot>{children}</ClientRoot>
      </body>
    </html>
  );
}
