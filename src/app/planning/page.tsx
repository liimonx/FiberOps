"use client";

import { Card, Container, Button } from "@shohojdhara/atomix";

export default function PlanningPage() {
  return (
    <Container className="u-page">
      <div className="u-page-header">
        <div>
          <h1 className="u-page-title">Network Planning</h1>
          <p className="u-page-subtitle">
            Future network expansion, capacity forecasting, and budget modeling.
          </p>
        </div>
        <Button variant="primary" iconName="Plus">
          Create Proposal
        </Button>
      </div>

      <Card className="u-w-100 u-text-center u-py-8">
        <h2 className="u-text-xl u-font-bold u-mb-2">Module Coming Soon</h2>
        <p className="u-text-secondary-emphasis">
          The planning module is currently under active development.
        </p>
      </Card>
    </Container>
  );
}
