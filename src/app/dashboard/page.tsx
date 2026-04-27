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
  DataTableColumn,
  AreaChart,
  Callout,
  DonutChart,
} from "@shohojdhara/atomix";

const recentWorkOrders = [
  { id: "WO-991", title: "Splice Repair", status: "In Progress", technician: "John Doe" },
  { id: "WO-992", title: "New ONT Install", status: "Pending", technician: "Jane Smith" },
  {
    id: "WO-993",
    title: "Drop Cable Replacement",
    status: "Completed",
    technician: "Bob Lee",
  },
  { id: "WO-994", title: "Signal Auditing", status: "Pending", technician: "Unassigned" },
];

const networkTrends = [
  { label: "00:00", value: 450 },
  { label: "02:00", value: 380 },
  { label: "04:00", value: 320 },
  { label: "06:00", value: 550 },
  { label: "08:00", value: 890 },
  { label: "10:00", value: 1050 },
  { label: "12:00", value: 1200 },
  { label: "14:00", value: 1150 },
  { label: "16:00", value: 1100 },
  { label: "18:00", value: 1350 },
  { label: "20:00", value: 1450 },
  { label: "22:00", value: 950 },
  { label: "23:59", value: 600 },
];

const customerSegments = [
  { label: "Residential", value: 8400, color: "var(--atomix-primary)" },
  { label: "Business", value: 3200, color: "var(--atomix-success)" },
  { label: "Enterprise", value: 892, color: "var(--atomix-warning)" },
];

export default function DashboardPage() {
  const workOrderColumns: DataTableColumn[] = [
    {
      key: "id",
      title: "ID",
      render: (val) => <span className="u-font-bold">{val}</span>,
    },
    { key: "title", title: "Task" },
    {
      key: "status",
      title: "Status",
      render: (val) => {
        let variant: "success" | "warning" | "error" | "primary" = "warning";
        if (val === "Completed") variant = "success";
        if (val === "In Progress") variant = "primary";
        return <Badge variant={variant} label={val} />;
      },
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
        <Button variant="primary" iconName="ArrowsClockwise">
          Refresh Data
        </Button>
      </div>

      <Grid className="u-mb-6">
        <GridCol xs={12} sm={6} lg={3}>
          <Card className="u-h-100" variant="primary">
            <div className="u-flex u-justify-between u-items-center u-mb-4">
              <span className="u-text-secondary-subtle u-fs-sm u-font-bold">
                Total Customers
              </span>
              <Icon name="Users" className="u-text-primary-emphasis" />
            </div>
            <div className="u-fs-2xl u-font-bold">12,492</div>
            <div className="u-fs-xs u-text-success u-mt-2">+124 this month</div>
          </Card>
        </GridCol>

        <GridCol xs={12} sm={6} lg={3}>
          <Card className="u-h-100" variant="error">
            <div className="u-flex u-justify-between u-items-center u-mb-4">
              <span className="u-text-secondary-subtle u-fs-sm u-font-bold">
                Active Incidents
              </span>
              <Icon name="Warning" className="u-text-error" />
            </div>
            <div className="u-fs-2xl u-font-bold">3</div>
            <div className="u-fs-xs u-text-danger u-mt-2">-1 since yesterday</div>
          </Card>
        </GridCol>

        <GridCol xs={12} sm={6} lg={3}>
          <Card className="u-h-100" variant="success">
            <div className="u-flex u-justify-between u-items-center u-mb-4">
              <span className="u-text-secondary-subtle u-fs-sm u-font-bold">
                Avg. Signal Health
              </span>
              <Icon name="Pulse" className="u-text-success" />
            </div>
            <div className="u-fs-2xl u-font-bold">94%</div>
            <div className="u-fs-xs u-text-secondary-subtle u-mt-2">
              Stable across all nodes
            </div>
          </Card>
        </GridCol>

        <GridCol xs={12} sm={6} lg={3}>
          <Card className="u-h-100" variant="warning">
            <div className="u-flex u-justify-between u-items-center u-mb-4">
              <span className="u-text-secondary-subtle u-fs-sm u-font-bold">
                Open Work Orders
              </span>
              <Icon name="Clipboard" className="u-text-warning-emphasis" />
            </div>
            <div className="u-fs-2xl u-font-bold">28</div>
            <div className="u-fs-xs u-text-warning u-mt-2">5 high priority</div>
          </Card>
        </GridCol>
      </Grid>

      <Grid className="u-mb-6">
        <GridCol xs={12} lg={8}>
          <Card className="u-h-100" title="Network Usage Trends">
            <div className="u-w-100" style={{ height: "300px" }}>
              <AreaChart
                data={networkTrends}
                variant="primary"
                interactive={true}
                showLegend={false}
                areaOptions={{
                  smooth: true,
                  useGradient: true,
                  showDataPoints: true,
                }}
                config={{
                  xAxis: {
                    showGrid: false,
                    label: "Time (24h)",
                  },
                  yAxis: {
                    showGrid: true,
                    label: "Usage (Mbps)",
                    formatter: (val) => `${val}M`,
                  },
                }}
              />
            </div>
          </Card>
        </GridCol>
        <GridCol xs={12} lg={4}>
          <Card className="u-h-100" title="Active Outages">
            <div className="u-flex u-flex-column u-gap-4">
              <Callout
                variant="error"
                title="Node Delta Failure"
                icon={<Icon name="Warning" />}
              >
                <div className="u-flex u-justify-between u-items-center u-mb-1">
                  <span className="u-fs-xs u-text-secondary-subtle">10m ago</span>
                </div>
                <p className="u-fs-sm u-mb-0">
                  Loss of signal reported on splitters 01-08 affecting 64 customers.
                </p>
              </Callout>

              <Callout
                variant="warning"
                title="High Attenuation"
                icon={<Icon name="CellSignalHigh" />}
              >
                <div className="u-flex u-justify-between u-items-center u-mb-1">
                  <span className="u-fs-xs u-text-secondary-subtle">2h ago</span>
                </div>
                <p className="u-fs-sm u-mb-0">
                  Node Gamma showing abnormal signal drop on downstream.
                </p>
              </Callout>
            </div>
          </Card>
        </GridCol>
      </Grid>

      <Grid className="u-mb-6">
        <GridCol xs={12} lg={4}>
          <Card title="Customer Segments" className="u-h-100">
            <div style={{ height: "250px" }} className="u-w-100">
              <DonutChart data={customerSegments} interactive={true} showLegend={true} />
            </div>
          </Card>
        </GridCol>
        <GridCol xs={12} lg={8}>
          <Card title="Recent Work Orders" className="u-overflow-x-auto">
            <DataTable columns={workOrderColumns} data={recentWorkOrders} rowKey="id" />
          </Card>
        </GridCol>
      </Grid>
    </Container>
  );
}
