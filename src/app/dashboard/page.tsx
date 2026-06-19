"use client";

import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  BarChart,
  Callout,
  DonutChart,
  GaugeChart,
  LineChart,
} from "@shohojdhara/atomix";
import { ClientOnly } from "@/components/ClientOnly";
import {
  ActiveOutagesPanel,
  DashboardChartFrame,
  IncidentHeatmapChart,
  NetworkUsagePanel,
  PopZoneBubbleChart,
  SignalHealthScatterChart,
} from "@/components/dashboard";
import { MetricCard } from "@/components/home/MetricCard";
import {
  buildCustomerSegmentChart,
  buildIncidentActivityHeatmap,
  buildPopZoneBubbleChart,
  buildSignalHealthScatter,
  buildWorkOrderPipelineChart,
  computeAverageSignalHealth,
} from "@/lib/dashboardMetrics";
import { countCustomersAddedThisMonth } from "@/lib/homeActivity";
import {
  getHighPriorityOpenWorkOrderCount,
  getOpenWorkOrderCount,
  mapWorkOrderToTableRow,
} from "@/lib/operationsViewMappers";
import {
  useActiveIncidents,
  useAssets,
  useCustomers,
  useIncidents,
  useWorkOrders,
} from "@/modules/network-map/hooks/useNetworkData";
import {
  useIncidentAnalytics,
  useReportsSummary,
  useUptimeSummary,
} from "@/modules/reports/hooks/useReportsData";
import { useTeamSettings } from "@/modules/settings/hooks/useTeamSettings";

const ANALYTICS_PERIOD = "30d";
const UPTIME_PERIOD = "6m";

function formatCount(value: number): string {
  return value.toLocaleString("en-US");
}

async function fetchUsageStats() {
  const res = await fetch("/api/stats/usage");
  if (!res.ok) throw new Error("Failed to fetch usage stats");
  return res.json();
}

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: customers,
    isLoading: isCustomersLoading,
    isFetching: isCustomersFetching,
    isError: isCustomersError,
    refetch: refetchCustomers,
  } = useCustomers();
  const {
    data: activeIncidents,
    isLoading: isIncidentsLoading,
    isFetching: isIncidentsFetching,
    isError: isIncidentsError,
    refetch: refetchIncidents,
  } = useActiveIncidents();
  const {
    data: allIncidents,
    isLoading: isAllIncidentsLoading,
    isFetching: isAllIncidentsFetching,
    refetch: refetchAllIncidents,
  } = useIncidents();
  const {
    data: workOrders,
    isLoading: isWorkOrdersLoading,
    isFetching: isWorkOrdersFetching,
    isError: isWorkOrdersError,
    refetch: refetchWorkOrders,
  } = useWorkOrders();
  const {
    data: assets,
    isLoading: isAssetsLoading,
    isFetching: isAssetsFetching,
    refetch: refetchAssets,
  } = useAssets();
  const {
    data: summary,
    isLoading: isSummaryLoading,
    isFetching: isSummaryFetching,
    isError: isSummaryError,
    refetch: refetchSummary,
  } = useReportsSummary();
  const {
    data: incidentAnalytics,
    isLoading: isAnalyticsLoading,
    isFetching: isAnalyticsFetching,
    isError: isAnalyticsError,
    refetch: refetchAnalytics,
  } = useIncidentAnalytics(ANALYTICS_PERIOD);
  const {
    data: uptimeSummary,
    isLoading: isUptimeLoading,
    isFetching: isUptimeFetching,
    isError: isUptimeError,
    refetch: refetchUptime,
  } = useUptimeSummary(UPTIME_PERIOD);
  const { data: teamSettings } = useTeamSettings();

  const {
    data: usageData,
    isLoading: isUsageLoading,
    isFetching: isUsageFetching,
    refetch: refetchUsage,
  } = useQuery({
    queryKey: ["network-trends"],
    queryFn: fetchUsageStats,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const customerList = customers ?? [];
  const assetList = assets ?? [];
  const orderList = workOrders ?? [];
  const incidentList = allIncidents ?? [];
  const activeIncidentList = activeIncidents ?? [];

  const memberNameById = useMemo(() => {
    const map = new Map<string, string>();
    (teamSettings?.members ?? []).forEach((member) => map.set(member.id, member.name));
    return map;
  }, [teamSettings?.members]);

  const openWorkOrderCount = getOpenWorkOrderCount(orderList);
  const highPriorityCount = getHighPriorityOpenWorkOrderCount(orderList);
  const subscriberCount = customerList.length;
  const netAddsThisMonth = countCustomersAddedThisMonth(customerList);
  const avgSignalHealth = useMemo(
    () => computeAverageSignalHealth(customerList, assetList),
    [customerList, assetList]
  );
  const customerSegments = useMemo(
    () => buildCustomerSegmentChart(customerList, assetList),
    [customerList, assetList]
  );
  const workOrderPipeline = useMemo(
    () => buildWorkOrderPipelineChart(orderList),
    [orderList]
  );
  const incidentHeatmap = useMemo(
    () => buildIncidentActivityHeatmap(incidentList),
    [incidentList]
  );
  const popZoneBubbles = useMemo(
    () => buildPopZoneBubbleChart(customerList, assetList),
    [customerList, assetList]
  );
  const signalScatter = useMemo(
    () => buildSignalHealthScatter(customerList, assetList),
    [customerList, assetList]
  );

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

  const isLoading =
    isCustomersLoading ||
    isIncidentsLoading ||
    isAllIncidentsLoading ||
    isWorkOrdersLoading ||
    isAssetsLoading ||
    isSummaryLoading ||
    isAnalyticsLoading ||
    isUptimeLoading ||
    isUsageLoading;
  const isRefreshing =
    isCustomersFetching ||
    isIncidentsFetching ||
    isAllIncidentsFetching ||
    isWorkOrdersFetching ||
    isAssetsFetching ||
    isSummaryFetching ||
    isAnalyticsFetching ||
    isUptimeFetching ||
    isUsageFetching;
  const isError =
    isCustomersError ||
    isIncidentsError ||
    isWorkOrdersError ||
    isSummaryError ||
    isAnalyticsError ||
    isUptimeError;

  const handleRefresh = useCallback(() => {
    refetchCustomers();
    refetchIncidents();
    refetchAllIncidents();
    refetchWorkOrders();
    refetchAssets();
    refetchSummary();
    refetchAnalytics();
    refetchUptime();
    refetchUsage();
    queryClient.invalidateQueries({ queryKey: ["network-trends"] });
  }, [
    refetchCustomers,
    refetchIncidents,
    refetchAllIncidents,
    refetchWorkOrders,
    refetchAssets,
    refetchSummary,
    refetchAnalytics,
    refetchUptime,
    refetchUsage,
    queryClient,
  ]);

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

  if (isError) {
    return (
      <Container className="u-page">
        <Callout variant="error" title="Failed to load dashboard">
          <p className="u-text-sm u-mb-3">
            Network metrics could not be loaded. Please try again.
          </p>
          <Button variant="outline-secondary" size="sm" onClick={handleRefresh}>
            Retry
          </Button>
        </Callout>
      </Container>
    );
  }

  return (
    <Container className="u-page">
      <div className="u-page-header">
        <div>
          <h1 className="u-page-title">Network Dashboard</h1>
          <p className="u-page-subtitle">
            Overview of network health, active incidents, and operational metrics.
          </p>
        </div>
        <Button
          variant="primary"
          iconName="ArrowsClockwise"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          Refresh Data
        </Button>
      </div>

      <Grid className="u-mb-6">
        <GridCol xs={12} sm={6} lg={3}>
          <MetricCard
            label="Total Customers"
            value={formatCount(subscriberCount)}
            icon="Users"
            href="/customers"
            isLoading={isLoading}
            footer={
              <span className="u-flex u-items-center u-gap-1 u-text-success">
                <Icon name="TrendUp" size="sm" aria-hidden="true" />
                <span>
                  {netAddsThisMonth > 0
                    ? `+${formatCount(netAddsThisMonth)} this month`
                    : "No new subscribers this month"}
                </span>
              </span>
            }
          />
        </GridCol>

        <GridCol xs={12} sm={6} lg={3}>
          <MetricCard
            label="Active Incidents"
            value={activeIncidentList.length}
            icon="Warning"
            iconClassName="u-text-error"
            iconBgClassName="u-bg-error-subtle"
            href="/incidents"
            isLoading={isLoading}
            footer={
              <span className="u-text-error">
                Live from incident log
              </span>
            }
          />
        </GridCol>

        <GridCol xs={12} sm={6} lg={3}>
          <MetricCard
            label="Avg. Signal Health"
            value={avgSignalHealth > 0 ? `${avgSignalHealth}%` : "—"}
            icon="Pulse"
            iconClassName="u-text-success"
            iconBgClassName="u-bg-success-subtle"
            href="/customers"
            isLoading={isLoading}
            footer={
              <span className="u-text-secondary-emphasis">
                Stable across all nodes
              </span>
            }
          />
        </GridCol>

        <GridCol xs={12} sm={6} lg={3}>
          <MetricCard
            label="Open Work Orders"
            value={openWorkOrderCount}
            icon="Clipboard"
            iconClassName="u-text-warning-emphasis"
            iconBgClassName="u-bg-warning-subtle"
            href="/work-orders"
            isLoading={isLoading}
            footer={
              <span className="u-text-warning">
                {highPriorityCount} high priority
              </span>
            }
          />
        </GridCol>
      </Grid>

      <Grid className="u-mb-6">
        <GridCol xs={12} lg={8}>
          <Card className="u-h-100 u-dashboard-usage-card" title="Network Usage Trends">
            <NetworkUsagePanel usageData={usageData} isLoading={isLoading} />
          </Card>
        </GridCol>
        <GridCol xs={12} lg={4}>
          <Card className="u-h-100" title="Active Outages">
            <ActiveOutagesPanel
              incidents={activeIncidentList}
              isLoading={isLoading}
            />
          </Card>
        </GridCol>
      </Grid>

      <Grid className="u-mb-6">
        <GridCol xs={12} lg={4}>
          <Card title="Customer Segments" className="u-h-100">
            <DashboardChartFrame
              isLoading={isLoading}
              label="Loading customer segments"
              compact
            >
              <ClientOnly>
                <DonutChart
                  datasets={[
                    {
                      label: "Segments",
                      data: customerSegments,
                    },
                  ]}
                  interactive
                  showLegend
                />
              </ClientOnly>
            </DashboardChartFrame>
          </Card>
        </GridCol>

        <GridCol xs={12} lg={4}>
          <Card title="Incidents by Severity" className="u-h-100">
            <DashboardChartFrame
              isLoading={isLoading}
              label="Loading incident severity chart"
              compact
            >
              <ClientOnly>
                <DonutChart
                  datasets={[
                    {
                      label: "Severity",
                      data: incidentAnalytics?.bySeverity ?? [],
                    },
                  ]}
                  interactive
                  showLegend
                />
              </ClientOnly>
            </DashboardChartFrame>
            {!isLoading && incidentAnalytics ? (
              <div className="u-flex u-gap-4 u-flex-wrap u-mt-4 u-pt-4 u-border-top u-border-secondary-subtle">
                <div>
                  <div className="u-text-xs u-text-secondary-emphasis">Total (30d)</div>
                  <div className="u-font-bold">{incidentAnalytics.totalIncidents}</div>
                </div>
                <div>
                  <div className="u-text-xs u-text-secondary-emphasis">Resolved</div>
                  <div className="u-font-bold">{incidentAnalytics.resolvedIncidents}</div>
                </div>
                <div>
                  <div className="u-text-xs u-text-secondary-emphasis">MTTR</div>
                  <div className="u-font-bold">{incidentAnalytics.mttrHours}h</div>
                </div>
              </div>
            ) : null}
          </Card>
        </GridCol>

        <GridCol xs={12} lg={4}>
          <Card title="Signal Health Gauge" className="u-h-100">
            <DashboardChartFrame
              isLoading={isLoading}
              label="Loading signal health gauge"
              compact
            >
              <ClientOnly>
                <GaugeChart
                  value={avgSignalHealth}
                  min={0}
                  max={100}
                  variant="primary"
                  gaugeOptions={{
                    showNeedle: true,
                    showValue: true,
                    valueFormatter: (val) => `${Math.round(val)}%`,
                  }}
                />
              </ClientOnly>
            </DashboardChartFrame>
            {!isLoading && summary ? (
              <div className="u-flex u-gap-4 u-flex-wrap u-mt-4 u-pt-4 u-border-top u-border-secondary-subtle">
                <div>
                  <div className="u-text-xs u-text-secondary-emphasis">Network uptime</div>
                  <div className="u-font-bold">{summary.networkUptimePercent}%</div>
                </div>
                <div>
                  <div className="u-text-xs u-text-secondary-emphasis">Degraded assets</div>
                  <div className="u-font-bold">{summary.degradedAssets}</div>
                </div>
              </div>
            ) : null}
          </Card>
        </GridCol>
      </Grid>

      <Grid className="u-mb-6">
        <GridCol xs={12} lg={4}>
          <Card title="Monthly Uptime" className="u-h-100">
            <DashboardChartFrame isLoading={isLoading} label="Loading uptime trend">
              <ClientOnly>
                <LineChart
                  datasets={[
                    {
                      label: "Uptime %",
                      data: uptimeSummary?.monthlyUptime ?? [],
                      color: "var(--atomix-success)",
                    },
                  ]}
                  variant="primary"
                  interactive
                  showLegend={false}
                  lineOptions={{
                    smooth: true,
                    showDataPoints: true,
                  }}
                  config={{
                    xAxis: { showGrid: false, label: "Month" },
                    yAxis: {
                      showGrid: true,
                      label: "Uptime (%)",
                      formatter: (val: unknown) => `${val}%`,
                    },
                  }}
                />
              </ClientOnly>
            </DashboardChartFrame>
          </Card>
        </GridCol>

        <GridCol xs={12} lg={4}>
          <Card title="Incident Resolution Trend" className="u-h-100">
            <DashboardChartFrame
              isLoading={isLoading}
              label="Loading resolution trend"
            >
              <ClientOnly>
                <BarChart
                  datasets={[
                    {
                      label: "Resolved",
                      data: incidentAnalytics?.resolutionTrend ?? [],
                      color: "var(--atomix-primary)",
                    },
                  ]}
                  variant="primary"
                  interactive
                  showLegend={false}
                  barOptions={{
                    borderRadius: 4,
                  }}
                  config={{
                    xAxis: { showGrid: false, label: "Week" },
                    yAxis: {
                      showGrid: true,
                      label: "Incidents",
                    },
                  }}
                />
              </ClientOnly>
            </DashboardChartFrame>
          </Card>
        </GridCol>

        <GridCol xs={12} lg={4}>
          <Card title="Work Order Pipeline" className="u-h-100">
            <DashboardChartFrame
              isLoading={isLoading}
              label="Loading work order pipeline"
            >
              <ClientOnly>
                <BarChart
                  datasets={[
                    {
                      label: "Work Orders",
                      data: workOrderPipeline,
                    },
                  ]}
                  variant="primary"
                  interactive
                  showLegend={false}
                  horizontal
                  barOptions={{
                    borderRadius: 4,
                  }}
                  config={{
                    xAxis: {
                      showGrid: true,
                      label: "Count",
                    },
                    yAxis: {
                      showGrid: false,
                      label: "Status",
                    },
                  }}
                />
              </ClientOnly>
            </DashboardChartFrame>
          </Card>
        </GridCol>
      </Grid>

      <div className="u-mb-4">
        <h2 className="u-text-lg u-font-bold u-mb-1">Network analytics</h2>
        <p className="u-meta u-mb-0">
          Heatmap, bubble, and scatter views across incidents and subscriber health.
        </p>
      </div>

      <Grid className="u-mb-6">
        <GridCol xs={12} lg={4}>
          <Card title="Incident Activity Heatmap" className="u-h-100">
            <p className="u-text-xs u-text-secondary-emphasis u-mb-3">
              When incidents are logged across the week.
            </p>
            <IncidentHeatmapChart data={incidentHeatmap} isLoading={isLoading} />
          </Card>
        </GridCol>

        <GridCol xs={12} lg={4}>
          <Card title="POP Zone Load" className="u-h-100">
            <p className="u-text-xs u-text-secondary-emphasis u-mb-3">
              Subscribers vs signal health — bubble size is customer count.
            </p>
            <PopZoneBubbleChart data={popZoneBubbles} isLoading={isLoading} />
          </Card>
        </GridCol>

        <GridCol xs={12} lg={4}>
          <Card title="Subscriber Signal Scatter" className="u-h-100">
            <p className="u-text-xs u-text-secondary-emphasis u-mb-3">
              Signal health vs days since last service update.
            </p>
            <SignalHealthScatterChart data={signalScatter} isLoading={isLoading} />
          </Card>
        </GridCol>
      </Grid>

      <Grid className="u-mb-6">
        <GridCol xs={12}>
          <Card title="Recent Work Orders" className="u-overflow-x-auto">
            {isLoading ? (
              <div className="u-skeleton u-h-48 u-w-100" aria-busy="true" />
            ) : (
              <DataTable
                columns={workOrderColumns}
                data={recentWorkOrders}
                rowKey="id"
                onRowClick={(row) =>
                  router.push(`/work-orders?selected=${row.id}`)
                }
              />
            )}
          </Card>
        </GridCol>
      </Grid>
    </Container>
  );
}
