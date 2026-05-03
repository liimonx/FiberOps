"use client";

import { Card, Container, Button } from "@shohojdhara/atomix";

export default function PlanningPage() {
  return (
    <Container className="u-py-6 u-w-100">
      <div className="u-flex u-justify-between u-items-center u-mb-6">
        <div>
          <h1 className="u-text-xxl u-font-bold u-mb-2">Network Planning</h1>
          <p className="u-text-secondary-emphasis u-text-sm">
            Future network expansion, capacity forecasting, and budget modeling.
          </p>
        </div>
        <Button variant="primary" iconName="plus">
          Create Proposal
        </Button>
      </div>

      <Card glass={true} className="u-w-100 u-text-center u-py-8">
        <h2 className="u-text-xl u-font-bold u-mb-2">Module Coming Soon</h2>
        <p className="u-text-secondary-emphasis">
          The planning module is currently under active development.
        </p>
      </Card>
    </Container>
  );
}
