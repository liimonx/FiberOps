"use client";

import {
  Card,
  Container,
  Button,
  Tabs,
  Input
} from "@shohojdhara/atomix";

export default function SettingsPage() {
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
         <Tabs defaultValue="general">
            <Tabs.List className="u-mb-6">
               <Tabs.Trigger value="general">General</Tabs.Trigger>
               <Tabs.Trigger value="integrations">Integrations</Tabs.Trigger>
               <Tabs.Trigger value="billing">Billing Settings</Tabs.Trigger>
               <Tabs.Trigger value="team">Team & Access</Tabs.Trigger>
            </Tabs.List>
            <Tabs.Panels>
               <Tabs.Panel value="general">
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
               <Tabs.Panel value="integrations">
                  <p className="u-text-secondary-subtle">Configure external APIs and webhooks here.</p>
               </Tabs.Panel>
               <Tabs.Panel value="billing">
                  <p className="u-text-secondary-subtle">Stripe and invoicing configurations.</p>
               </Tabs.Panel>
               <Tabs.Panel value="team">
                  <p className="u-text-secondary-subtle">Manage users, roles, and permissions.</p>
               </Tabs.Panel>
            </Tabs.Panels>
         </Tabs>
      </Card>
    </Container>
  );
}
