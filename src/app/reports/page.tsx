"use client";

import { Card, Container, Button, Grid, GridCol, Icon } from "@shohojdhara/atomix";

export default function ReportsPage() {
  return (
    <Container className="u-py-6 u-w-100">
      <div className="u-flex u-justify-between u-items-center u-mb-6">
        <div>
          <h1 className="u-text-2xl u-font-bold u-mb-2">Reports & Analytics</h1>
          <p className="u-text-secondary-subtle u-text-sm">
            Generate insights on network performance, billing, and incidents.
          </p>
        </div>
      </div>

      <Grid>
        <GridCol xs={12} sm={6} lg={4}>
          <Card glass={true} className="u-cursor-pointer u-h-100">
            <Icon name="FilePdf" size="xl" className="u-text-danger u-mb-4" />
            <h3 className="u-font-bold u-text-lg u-mb-2">Uptime Summary</h3>
            <p className="u-text-secondary-subtle u-text-sm">
              Monthly network availability and SLA compliance reports.
            </p>
            <Button variant="outline-secondary" className="u-mt-4 u-w-100">
              Generate
            </Button>
          </Card>
        </GridCol>
        <GridCol xs={12} sm={6} lg={4}>
          <Card glass={true} className="u-cursor-pointer u-h-100">
            <Icon name="FileCsv" size="xl" className="u-text-success u-mb-4" />
            <h3 className="u-font-bold u-text-lg u-mb-2">Asset Inventory</h3>
            <p className="u-text-secondary-subtle u-text-sm">
              Exportable CSV of all network nodes, splitters, and ONTs.
            </p>
            <Button variant="outline-secondary" className="u-mt-4 u-w-100">
              Generate
            </Button>
          </Card>
        </GridCol>
        <GridCol xs={12} sm={6} lg={4}>
          <Card glass={true} className="u-cursor-pointer u-h-100">
            <Icon name="ChartBar" size="xl" className="u-text-primary u-mb-4" />
            <h3 className="u-font-bold u-text-lg u-mb-2">Incident Analytics</h3>
            <p className="u-text-secondary-subtle u-text-sm">
              Detailed analysis of ticket resolution times and severities.
            </p>
            <Button variant="outline-secondary" className="u-mt-4 u-w-100">
              Generate
            </Button>
          </Card>
        </GridCol>
      </Grid>
    </Container>
  );
}
