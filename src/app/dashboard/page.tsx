"use client";

import { useQuery } from "@tanstack/react-query";
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
import { ClientOnly } from "@/components/ClientOnly";

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

const customerSegments = [
  { label: "Residential", value: 8400, color: "var(--atomix-primary)" },
  { label: "Business", value: 3200, color: "var(--atomix-secondary)" },
  { label: "Enterprise", value: 1200, color: "var(--atomix-accent)" },
  { label: "Government", value: 600, color: "var(--atomix-warning)" },
];

export default function DashboardPage() {
  const { data: usageData, isLoading: isUsageLoading } = useQuery({
    queryKey: ["network-trends"],
    queryFn: async () => {
      const res = await fetch("/api/stats/usage");
      if (!res.ok) throw new Error("Failed to fetch usage stats");
      return res.json();
    },
    refetchInterval: 30000,
  });

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
          <h1 className="u-text-xxl u-font-bold u-mb-2">Network Dashboard</h1>
          <p className="u-text-secondary-emphasis u-text-sm">
            Overview of network health, active incidents, and operational metrics.
          </p>
        </div>
        <Button variant="primary" iconName="ArrowsClockwise">
          Refresh Data
        </Button>
      </div>

      <Grid className="u-mb-6">
        <GridCol xs={12} sm={6} lg={3}>
          <Card className="u-h-100">
            <div className="u-flex u-justify-between u-items-center u-mb-4">
              <span className="u-text-secondary-emphasis u-text-sm u-font-bold">
                Total Customers
              </span>
              <Icon name="Users" className="-emphasis" />
            </div>
            <div className="u-text-xxl u-font-bold">12,492</div>
            <div className="u-text-xs u-text-success u-mt-2">+124 this month</div>
          </Card>
        </GridCol>

        <GridCol xs={12} sm={6} lg={3}>
          <Card className="u-h-100">
            <div className="u-flex u-justify-between u-items-center u-mb-4">
              <span className="u-text-secondary-emphasis u-text-sm u-font-bold">
                Active Incidents
              </span>
              <Icon name="Warning" className="u-text-error" />
            </div>
            <div className="u-text-xxl u-font-bold">3</div>
            <div className="u-text-xs u-text-danger u-mt-2">-1 since yesterday</div>
          </Card>
        </GridCol>

        <GridCol xs={12} sm={6} lg={3}>
          <Card className="u-h-100">
            <div className="u-flex u-justify-between u-items-center u-mb-4">
              <span className="u-text-secondary-emphasis u-text-sm u-font-bold">
                Avg. Signal Health
              </span>
              <Icon name="Pulse" className="u-text-success" />
            </div>
            <div className="u-text-xxl u-font-bold">94%</div>
            <div className="u-text-xs u-text-secondary-emphasis u-mt-2">
              Stable across all nodes
            </div>
          </Card>
        </GridCol>

        <GridCol xs={12} sm={6} lg={3}>
          <Card className="u-h-100">
            <div className="u-flex u-justify-between u-items-center u-mb-4">
              <span className="u-text-secondary-emphasis u-text-sm u-font-bold">
                Open Work Orders
              </span>
              <Icon name="Clipboard" className="u-text-warning-emphasis" />
            </div>
            <div className="u-text-xxl u-font-bold">28</div>
            <div className="u-text-xs u-text-warning u-mt-2">5 high priority</div>
          </Card>
        </GridCol>
      </Grid>

      <Grid className="u-mb-6">
        <GridCol xs={12} lg={8}>
          <Card className="u-h-100" title="Network Usage Trends">
            <div className="u-h-100 u-min-h-300 u-flex u-items-center u-justify-center">
              {isUsageLoading ? (
                <div className="u-text-secondary-emphasis">Loading Trends...</div>
              ) : (
                <ClientOnly>
                  <AreaChart
                    datasets={[
                      {
                        label: "Network Usage",
                        data: usageData || [],
                        color: "var(--atomix-primary)",
                      },
                    ]}
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
                        formatter: (val: unknown) => `${val}M`,
                      },
                    }}
                  />
                </ClientOnly>
              )}
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
                  <span className="u-text-xs u-text-secondary-emphasis">10m ago</span>
                </div>
                <p className="u-text-sm u-mb-0">
                  Loss of signal reported on splitters 01-08 affecting 64 customers.
                </p>
              </Callout>

              <Callout
                variant="warning"
                title="High Attenuation"
                icon={<Icon name="CellSignalHigh" />}
              >
                <div className="u-flex u-justify-between u-items-center u-mb-1">
                  <span className="u-text-xs u-text-secondary-emphasis">2h ago</span>
                </div>
                <p className="u-text-sm u-mb-0">
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
            <div
              style={{ height: "250px" }}
              className="u-w-100 u-flex u-items-center u-justify-center"
            >
              <ClientOnly>
                <DonutChart
                  datasets={[
                    {
                      label: "Segments",
                      data: customerSegments,
                    },
                  ]}
                  interactive={true}
                  showLegend={true}
                />
              </ClientOnly>
            </div>
          </Card>
        </GridCol>
        <GridCol xs={12} lg={8}>
          <Card title="Recent Work Orders" className="u-overflow-x-auto u-h-100">
            <DataTable columns={workOrderColumns} data={recentWorkOrders} rowKey="id" />
          </Card>
        </GridCol>
      </Grid>
    </Container>
  );
}
