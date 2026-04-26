"use client";

import {
  Card,
  Container,
  Grid,
  GridCol,
  Badge,
  Button,
  Icon,
  DataTable,
  DataTableColumn
} from "@shohojdhara/atomix";

const recentWorkOrders = [
  { id: "WO-991", title: "Splice Repair", status: "In Progress", technician: "John Doe" },
  { id: "WO-992", title: "New ONT Install", status: "Pending", technician: "Jane Smith" },
  { id: "WO-993", title: "Drop Cable Replacement", status: "Completed", technician: "Bob Lee" },
  { id: "WO-994", title: "Signal Auditing", status: "Pending", technician: "Unassigned" },
];

export default function DashboardPage() {
  const workOrderColumns: DataTableColumn[] = [
    { key: "id", title: "ID", render: (val) => <span className="u-font-bold">{val}</span> },
    { key: "title", title: "Task" },
    { 
      key: "status", 
      title: "Status",
      render: (val) => {
        let variant: "success"|"warning"|"danger"|"primary" = "warning";
        if (val === "Completed") variant = "success";
        if (val === "In Progress") variant = "primary";
        return <Badge variant={variant}>{val}</Badge>;
      }
    },
    { key: "technician", title: "Tech" },
  ];

  return (
    <Container className="u-py-6 u-w-100">
      <div className="u-flex u-justify-between u-items-center u-mb-6">
        <div>
          <h1 className="u-fs-2xl u-font-bold u-mb-2">Network Dashboard</h1>
          <p className="u-text-secondary-subtle u-fs-sm">
            Overview of network health, active incidents, and operational metrics.
          </p>
        </div>
        <Button variant="primary" iconName="arrows-clockwise">Refresh Data</Button>
      </div>

      <Grid className="u-mb-6" gap={4}>
        <GridCol xs={12} sm={6} lg={3}>
          <Card appearance="elevated" glass={true} className="u-h-100">
            <div className="u-flex u-justify-between u-items-center u-mb-4">
              <span className="u-text-secondary-subtle u-fs-sm u-font-bold">Total Customers</span>
              <Icon name="users" className="u-text-primary" />
            </div>
            <div className="u-fs-2xl u-font-bold">12,492</div>
            <div className="u-fs-xs u-text-success u-mt-2">+124 this month</div>
          </Card>
        </GridCol>
        
        <GridCol xs={12} sm={6} lg={3}>
          <Card appearance="elevated" glass={true} className="u-h-100">
            <div className="u-flex u-justify-between u-items-center u-mb-4">
              <span className="u-text-secondary-subtle u-fs-sm u-font-bold">Active Incidents</span>
              <Icon name="warning" className="u-text-danger" />
            </div>
            <div className="u-fs-2xl u-font-bold">3</div>
            <div className="u-fs-xs u-text-danger u-mt-2">-1 since yesterday</div>
          </Card>
        </GridCol>

        <GridCol xs={12} sm={6} lg={3}>
          <Card appearance="elevated" glass={true} className="u-h-100">
            <div className="u-flex u-justify-between u-items-center u-mb-4">
              <span className="u-text-secondary-subtle u-fs-sm u-font-bold">Avg. Signal Health</span>
              <Icon name="activity" className="u-text-success" />
            </div>
            <div className="u-fs-2xl u-font-bold">94%</div>
            <div className="u-fs-xs u-text-secondary-subtle u-mt-2">Stable across all nodes</div>
          </Card>
        </GridCol>

        <GridCol xs={12} sm={6} lg={3}>
          <Card appearance="elevated" glass={true} className="u-h-100">
            <div className="u-flex u-justify-between u-items-center u-mb-4">
              <span className="u-text-secondary-subtle u-fs-sm u-font-bold">Open Work Orders</span>
              <Icon name="clipboard" className="u-text-primary" />
            </div>
            <div className="u-fs-2xl u-font-bold">28</div>
            <div className="u-fs-xs u-text-warning u-mt-2">5 high priority</div>
          </Card>
        </GridCol>
      </Grid>

      <Grid className="u-mb-6" gap={4}>
        <GridCol xs={12} lg={8}>
          <Card appearance="elevated" glass={true} className="u-h-100" title="Network Usage Trends">
             <div className="u-flex u-items-center u-justify-center u-bg-dark u-rounded u-h-100 u-min-h-50 u-border u-border-secondary-subtle" style={{ minHeight: '300px' }}>
                <span className="u-text-secondary-subtle u-fs-sm u-font-mono">[ Chart Rendering Placeholder - Use AreaChart ]</span>
             </div>
          </Card>
        </GridCol>
        <GridCol xs={12} lg={4}>
          <Card appearance="elevated" glass={true} className="u-h-100" title="Active Outages">
            <div className="u-flex u-flex-column u-gap-4">
              <div className="u-p-4 u-bg-danger-subtle u-rounded u-border u-border-danger">
                <div className="u-flex u-justify-between u-mb-2">
                  <span className="u-font-bold u-text-danger">Node Delta Failure</span>
                  <span className="u-fs-xs">10m ago</span>
                </div>
                <p className="u-fs-sm u-mb-0">Loss of signal reported on splitters 01-08 affecting 64 customers.</p>
              </div>
              <div className="u-p-4 u-bg-warning-subtle u-rounded u-border u-border-warning">
                <div className="u-flex u-justify-between u-mb-2">
                  <span className="u-font-bold u-text-warning">High Attenuation</span>
                  <span className="u-fs-xs">2h ago</span>
                </div>
                <p className="u-fs-sm u-mb-0">Node Gamma showing abnormal signal drop on downstream.</p>
              </div>
            </div>
          </Card>
        </GridCol>
      </Grid>

      <Grid className="u-mb-6" gap={4}>
        <GridCol xs={12}>
          <Card appearance="elevated" glass={true} title="Recent Work Orders" className="u-overflow-x-auto">
             <DataTable
                columns={workOrderColumns}
                data={recentWorkOrders}
                rowKey="id"
              />
          </Card>
        </GridCol>
      </Grid>
    </Container>
  );
}
