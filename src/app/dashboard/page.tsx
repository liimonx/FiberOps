"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
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
import {
  useActiveIncidents,
  useWorkOrders,
} from "@/modules/network-map/hooks/useNetworkData";
import { useTeamSettings } from "@/modules/settings/hooks/useTeamSettings";
import {
  getHighPriorityOpenWorkOrderCount,
  getOpenWorkOrderCount,
  mapWorkOrderToTableRow,
} from "@/lib/operationsViewMappers";

const customerSegments = [
  { label: "Residential", value: 8400, color: "var(--atomix-primary)" },
  { label: "Business", value: 3200, color: "var(--atomix-secondary)" },
  { label: "Enterprise", value: 1200, color: "var(--atomix-accent)" },
  { label: "Government", value: 600, color: "var(--atomix-warning)" },
];

export default function DashboardPage() {
  const router = useRouter();
  const { data: activeIncidents } = useActiveIncidents();
  const { data: workOrders } = useWorkOrders();
  const { data: teamSettings } = useTeamSettings();
  const activeIncidentCount = activeIncidents?.length ?? 0;

  const orderList = workOrders ?? [];
  const memberNameById = useMemo(() => {
    const map = new Map<string, string>();
    (teamSettings?.members ?? []).forEach((member) => map.set(member.id, member.name));
    return map;
  }, [teamSettings?.members]);

  const openWorkOrderCount = getOpenWorkOrderCount(orderList);
  const highPriorityCount = getHighPriorityOpenWorkOrderCount(orderList);

  const recentWorkOrders = useMemo(() => {
    return [...orderList]
      .filter((order) => order.status !== "done")
      .sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
      .slice(0, 4)
      .map((order) => {
        const row = mapWorkOrderToTableRow(
          order,
          order.assigneeId ? memberNameById.get(order.assigneeId) : undefined
        );
        return {
          id: row.id,
          title: row.title,
          status: row.status,
          technician: row.assignee,
        };
      });
  }, [orderList, memberNameById]);

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
    <Container className="u-page">
      <div className="u-page-header">
        <div>
          <h1 className="u-page-title">Network Dashboard</h1>
          <p className="u-page-subtitle">
            Overview of network health, active incidents, and operational metrics.
          </p>
        </div>
        <Button variant="primary" iconName="ArrowsClockwise">
          Refresh Data
        </Button>
      </div>

      <Grid className="u-mb-6">
        <GridCol xs={12} sm={6} lg={3}>
          <Card>
            <div className="u-stat-header">
              <span className="u-text-secondary-emphasis u-text-sm u-font-bold">
                Total Customers
              </span>
              <Icon name="Users" className="u-text-secondary-emphasis" />
            </div>
            <div className="u-text-xxl u-font-bold">12,492</div>
            <div className="u-text-xs u-text-success u-mt-2">+124 this month</div>
          </Card>
        </GridCol>

        <GridCol xs={12} sm={6} lg={3}>
          <Card>
            <div className="u-stat-header">
              <span className="u-text-secondary-emphasis u-text-sm u-font-bold">
                Active Incidents
              </span>
              <Icon name="Warning" className="u-text-error" />
            </div>
            <div className="u-text-xxl u-font-bold">{activeIncidentCount}</div>
            <div className="u-text-xs u-text-error u-mt-2">Live from incident log</div>
          </Card>
        </GridCol>

        <GridCol xs={12} sm={6} lg={3}>
          <Card>
            <div className="u-stat-header">
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
          <Card>
            <div className="u-stat-header">
              <span className="u-text-secondary-emphasis u-text-sm u-font-bold">
                Open Work Orders
              </span>
              <Icon name="Clipboard" className="u-text-warning-emphasis" />
            </div>
            <div className="u-text-xxl u-font-bold">{openWorkOrderCount}</div>
            <div className="u-text-xs u-text-warning u-mt-2">
              {highPriorityCount} high priority
            </div>
          </Card>
        </GridCol>
      </Grid>

      <Grid className="u-mb-6">
        <GridCol xs={12} lg={8}>
          <Card className="u-h-100" title="Network Usage Trends">
            <div className="u-h-100 u-min-h-75 u-flex u-items-center u-justify-center">
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
                  <span className="u-meta">10m ago</span>
                </div>
                <p className="u-body-sm">
                  Loss of signal reported on splitters 01-08 affecting 64 customers.
                </p>
              </Callout>

              <Callout
                variant="warning"
                title="High Attenuation"
                icon={<Icon name="CellSignalHigh" />}
              >
                <div className="u-flex u-justify-between u-items-center u-mb-1">
                  <span className="u-meta">2h ago</span>
                </div>
                <p className="u-body-sm">
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
            <div className="u-h-62 u-w-100 u-flex u-items-center u-justify-center">
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
            <DataTable
              columns={workOrderColumns}
              data={recentWorkOrders}
              rowKey="id"
              onRowClick={(row) =>
                router.push(`/work-orders?selected=${row.id}`)
              }
            />
          </Card>
        </GridCol>
      </Grid>
    </Container>
  );
}
