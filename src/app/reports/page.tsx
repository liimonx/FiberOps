"use client";

import { useCallback, useState } from "react";
import {
  Badge,
  Button,
  Callout,
  Card,
  Container,
  Grid,
  GridCol,
  Icon,
  AreaChart,
  DonutChart,
} from "@shohojdhara/atomix";
import { ClientOnly } from "@/components/ClientOnly";
import { ReportCatalogCard } from "@/modules/reports/components/ReportCatalogCard";
import { GenerateReportModal } from "@/modules/reports/components/GenerateReportModal";
import { ReportHistoryTable } from "@/modules/reports/components/ReportHistoryTable";
import {
  useIncidentAnalytics,
  useReportHistory,
  useReportsSummary,
  useUptimeSummary,
} from "@/modules/reports/hooks/useReportsData";
import type { ReportType } from "@/types/domain";

const ANALYTICS_PERIOD = "30d";
const UPTIME_PERIOD = "6m";

export default function ReportsPage() {
  const {
    data: summary,
    isLoading: isSummaryLoading,
    isError: isSummaryError,
    refetch: refetchSummary,
  } = useReportsSummary();
  const {
    data: incidentAnalytics,
    isLoading: isAnalyticsLoading,
    isError: isAnalyticsError,
    refetch: refetchAnalytics,
  } = useIncidentAnalytics(ANALYTICS_PERIOD);
  const {
    data: uptimeSummary,
    isLoading: isUptimeLoading,
    isError: isUptimeError,
    refetch: refetchUptime,
  } = useUptimeSummary(UPTIME_PERIOD);
  const {
    data: reportHistory,
    isLoading: isHistoryLoading,
    isError: isHistoryError,
    refetch: refetchHistory,
  } = useReportHistory();

  const [generateType, setGenerateType] = useState<ReportType | null>(null);

  const handleRefresh = useCallback(() => {
    refetchSummary();
    refetchAnalytics();
    refetchUptime();
    refetchHistory();
  }, [refetchSummary, refetchAnalytics, refetchUptime, refetchHistory]);

  const isLoading =
    isSummaryLoading || isAnalyticsLoading || isUptimeLoading || isHistoryLoading;
  const isError =
    isSummaryError || isAnalyticsError || isUptimeError || isHistoryError;

  if (isLoading) {
    return (
      <Container className="u-page" aria-busy="true">
        <div className="u-skeleton u-h-10 u-mb-6" style={{ width: "16rem" }} />
        <div className="u-skeleton u-h-32 u-mb-6" />
        <div className="u-skeleton u-h-64" />
      </Container>
    );
  }

  if (isError || !summary || !incidentAnalytics || !uptimeSummary) {
    return (
      <Container className="u-page">
        <Callout variant="error" title="Failed to load reports">
          <p className="u-text-sm u-mb-3">
            Analytics data could not be loaded. Please try again.
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
          <h1 className="u-page-title">Reports & Analytics</h1>
          <p className="u-page-subtitle">
            Generate insights on network performance, billing, and incidents.
          </p>
        </div>
        <Button variant="primary" iconName="ArrowsClockwise" onClick={handleRefresh}>
          Refresh Data
        </Button>
      </div>

      <Grid className="u-mb-6">
        <GridCol xs={12} sm={6} lg={3}>
          <Card>
            <div className="u-stat-header">
              <span className="u-text-secondary-emphasis u-text-sm u-font-bold">
                Network Uptime
              </span>
              <Icon name="Pulse" className="u-text-success" />
            </div>
            <div className="u-text-xxl u-font-bold">{summary.networkUptimePercent}%</div>
            <div className="u-text-xs u-mt-2">
              <Badge
                variant={summary.slaCompliant ? "success" : "warning"}
                label={
                  summary.slaCompliant
                    ? `SLA met (${summary.slaTargetPercent}%)`
                    : `Below SLA (${summary.slaTargetPercent}%)`
                }
              />
            </div>
          </Card>
        </GridCol>

        <GridCol xs={12} sm={6} lg={3}>
          <Card>
            <div className="u-stat-header">
              <span className="u-text-secondary-emphasis u-text-sm u-font-bold">
                Assets Monitored
              </span>
              <Icon name="TreeStructure" className="u-text-primary" />
            </div>
            <div className="u-text-xxl u-font-bold">{summary.totalAssets}</div>
            <div className="u-text-xs u-text-warning u-mt-2">
              {summary.degradedAssets} degraded or down
            </div>
          </Card>
        </GridCol>

        <GridCol xs={12} sm={6} lg={3}>
          <Card>
            <div className="u-stat-header">
              <span className="u-text-secondary-emphasis u-text-sm u-font-bold">
                Open Incidents
              </span>
              <Icon name="Warning" className="u-text-error" />
            </div>
            <div className="u-text-xxl u-font-bold">{summary.openIncidents}</div>
            <div className="u-text-xs u-text-secondary-emphasis u-mt-2">
              MTTR {summary.avgResolutionHours}h (30d)
            </div>
          </Card>
        </GridCol>

        <GridCol xs={12} sm={6} lg={3}>
          <Card>
            <div className="u-stat-header">
              <span className="u-text-secondary-emphasis u-text-sm u-font-bold">
                Reports This Month
              </span>
              <Icon name="FileText" className="u-text-secondary-emphasis" />
            </div>
            <div className="u-text-xxl u-font-bold">
              {summary.reportsGeneratedThisMonth}
            </div>
            <div className="u-text-xs u-text-secondary-emphasis u-mt-2">
              From catalog and scheduled exports
            </div>
          </Card>
        </GridCol>
      </Grid>

      <Grid className="u-mb-6">
        <GridCol xs={12} lg={8}>
          <Card title="Monthly Uptime Trend" className="u-h-100">
            <div className="u-h-100 u-min-h-75 u-flex u-items-center u-justify-center">
              <ClientOnly>
                <AreaChart
                  datasets={[
                    {
                      label: "Uptime %",
                      data: uptimeSummary.monthlyUptime,
                      color: "var(--atomix-success)",
                    },
                  ]}
                  variant="primary"
                  interactive
                  showLegend={false}
                  areaOptions={{
                    smooth: true,
                    useGradient: true,
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
            </div>
          </Card>
        </GridCol>

        <GridCol xs={12} lg={4}>
          <Card title="Incidents by Severity" className="u-h-100">
            <div className="u-h-62 u-w-100 u-flex u-items-center u-justify-center">
              <ClientOnly>
                <DonutChart
                  datasets={[
                    {
                      label: "Severity",
                      data: incidentAnalytics.bySeverity,
                    },
                  ]}
                  interactive
                  showLegend
                />
              </ClientOnly>
            </div>
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
          </Card>
        </GridCol>
      </Grid>

      <div className="u-mb-4">
        <h2 className="u-text-lg u-font-bold u-mb-1">Report Catalog</h2>
        <p className="u-meta u-mb-0">
          Generate exports for compliance, inventory audits, and operations review.
        </p>
      </div>

      <Grid className="u-mb-6">
        <GridCol xs={12} sm={6} lg={4}>
          <ReportCatalogCard
            type="uptime_summary"
            description="Monthly network availability and SLA compliance reports."
            iconName="FilePdf"
            iconClassName="u-text-error"
            onGenerate={setGenerateType}
          />
        </GridCol>
        <GridCol xs={12} sm={6} lg={4}>
          <ReportCatalogCard
            type="asset_inventory"
            description="Exportable CSV of all network nodes, splitters, and ONTs."
            iconName="FileCsv"
            iconClassName="u-text-success"
            onGenerate={setGenerateType}
          />
        </GridCol>
        <GridCol xs={12} sm={6} lg={4}>
          <ReportCatalogCard
            type="incident_analytics"
            description="Detailed analysis of ticket resolution times and severities."
            iconName="ChartBar"
            onGenerate={setGenerateType}
          />
        </GridCol>
      </Grid>

      <Card title="Generated Reports" className="u-overflow-x-auto">
        <ReportHistoryTable reports={reportHistory ?? []} />
      </Card>

      <GenerateReportModal
        open={Boolean(generateType)}
        reportType={generateType}
        onClose={() => setGenerateType(null)}
        onGenerated={() => refetchHistory()}
      />
    </Container>
  );
}
