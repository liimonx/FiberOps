"use client";

import { useState } from "react";
import {
  Card,
  Container,
  Button,
  Tabs,
  Input
} from "@shohojdhara/atomix";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState(0);
  return (
    <Container className="u-py-6 u-w-100">
      <div className="u-flex u-justify-between u-items-center u-mb-6">
        <div>
          <h1 className="u-fs-2xl u-font-bold u-mb-2">System Settings</h1>
          <p className="u-text-secondary-subtle u-fs-sm">
            Configure system parameters, integrations, and user access.
          </p>
        </div>
      </div>

      <Card appearance="elevated" glass={true} className="u-w-100">
         <Tabs activeIndex={activeTab} onTabChange={setActiveTab}>
            <Tabs.List className="u-mb-6">
               <Tabs.Trigger index={0}>General</Tabs.Trigger>
               <Tabs.Trigger index={1}>Integrations</Tabs.Trigger>
               <Tabs.Trigger index={2}>Billing Settings</Tabs.Trigger>
               <Tabs.Trigger index={3}>Team & Access</Tabs.Trigger>
            </Tabs.List>
            <Tabs.Panels>
               <Tabs.Panel index={0}>
                  <div className="u-w-lg-50 u-flex u-flex-column u-gap-4">
                     <div>
                        <label className="u-font-bold u-fs-sm u-mb-2 u-block">Organization Name</label>
                        <Input defaultValue="BCN FiberOps" fullWidth />
                     </div>
                     <div>
                        <label className="u-font-bold u-fs-sm u-mb-2 u-block">Support Email</label>
                        <Input defaultValue="support@bcn-fiberops.com" type="email" fullWidth />
                     </div>
                     <div className="u-mt-4">
                        <Button variant="primary">Save Changes</Button>
                     </div>
                  </div>
               </Tabs.Panel>
               <Tabs.Panel index={1}>
                  <p className="u-text-secondary-subtle">Configure external APIs and webhooks here.</p>
               </Tabs.Panel>
               <Tabs.Panel index={2}>
                  <p className="u-text-secondary-subtle">Stripe and invoicing configurations.</p>
               </Tabs.Panel>
               <Tabs.Panel index={3}>
                  <p className="u-text-secondary-subtle">Manage users, roles, and permissions.</p>
               </Tabs.Panel>
            </Tabs.Panels>
         </Tabs>
      </Card>
    </Container>
  );
}
