"use client";

import { Card, Container } from "@shohojdhara/atomix";
import { SettingsNav } from "@/modules/settings/components/SettingsNav";
import { SettingsAdminGuard } from "@/modules/settings/components/SettingsAdminGuard";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Container className="u-page">
      <div className="u-page-header">
        <div>
          <h1 className="u-page-title">System Settings</h1>
          <p className="u-page-subtitle">
            Configure system parameters, integrations, and user access.
          </p>
        </div>
      </div>

      <Card className="u-w-100">
        <SettingsAdminGuard>
          <SettingsNav />
          {children}
        </SettingsAdminGuard>
      </Card>
    </Container>
  );
}
