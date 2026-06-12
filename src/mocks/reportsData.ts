import { getAssets } from "@/mocks/assetsData";
import { getIncidents } from "@/mocks/incidentsData";
import { computeIncidentAnalytics } from "@/modules/reports/lib/computeIncidentAnalytics";
import {
  computeNetworkUptimePercent,
  computeUptimeSummary,
} from "@/modules/reports/lib/computeUptimeSummary";
import { buildReportDownload } from "@/modules/reports/lib/buildReportExports";
import {
  reportPeriodLabels,
  type GenerateReportFormValues,
} from "@/modules/reports/schemas/report.schema";
import type {
  GeneratedReport,
  IncidentAnalytics,
  ReportDownloadPayload,
  ReportsSummary,
  UptimeSummary,
} from "@/types/domain";

const SLA_TARGET = 99.5;

let reportHistory: GeneratedReport[] = [
  {
    id: "rpt-001",
    type: "uptime_summary",
    format: "pdf",
    title: "Uptime Summary — March 2026",
    status: "ready",
    period: "30d",
    generatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    generatedBy: "Jordan Lee",
    fileSizeBytes: 48_200,
  },
  {
    id: "rpt-002",
    type: "asset_inventory",
    format: "csv",
    title: "Asset Inventory Export",
    status: "ready",
    period: "30d",
    generatedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    generatedBy: "Sam Rivera",
    fileSizeBytes: 12_400,
  },
];

function nextReportId(): string {
  const max = reportHistory.reduce((acc, report) => {
    const num = Number.parseInt(report.id.replace("rpt-", ""), 10);
    return Number.isNaN(num) ? acc : Math.max(acc, num);
  }, 0);
  return `rpt-${String(max + 1).padStart(3, "0")}`;
}

function reportsThisMonth(): number {
  const now = new Date();
  return reportHistory.filter((report) => {
    const generated = new Date(report.generatedAt);
    return (
      generated.getMonth() === now.getMonth() &&
      generated.getFullYear() === now.getFullYear()
    );
  }).length;
}

export function getReportsSummary(): ReportsSummary {
  const assets = getAssets();
  const incidents = getIncidents();
  const analytics = computeIncidentAnalytics(incidents, "30d");
  const uptimePercent = computeNetworkUptimePercent(assets);

  return {
    networkUptimePercent: uptimePercent,
    slaTargetPercent: SLA_TARGET,
    slaCompliant: uptimePercent >= SLA_TARGET,
    totalAssets: assets.length,
    degradedAssets: assets.filter(
      (asset) => asset.status === "degraded" || asset.status === "down"
    ).length,
    openIncidents: incidents.filter((incident) => incident.status !== "resolved")
      .length,
    avgResolutionHours: analytics.mttrHours,
    reportsGeneratedThisMonth: reportsThisMonth(),
  };
}

export function getIncidentAnalytics(period: string): IncidentAnalytics {
  return computeIncidentAnalytics(getIncidents(), period);
}

export function getUptimeSummary(period: string): UptimeSummary {
  return computeUptimeSummary(getAssets(), period);
}

export function getReportHistory(): GeneratedReport[] {
  return [...reportHistory].sort(
    (a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
  );
}

export function generateReport(
  input: GenerateReportFormValues,
  generatedBy = "Jordan Lee"
): { report: GeneratedReport; download: ReportDownloadPayload } {
  const assets = getAssets();
  const incidents = getIncidents();
  const uptime = getUptimeSummary(input.period);
  const analytics = getIncidentAnalytics(input.period);
  const periodLabel = reportPeriodLabels[input.period];

  const download = buildReportDownload(input.type, input.format, {
    assets,
    incidents,
    uptime,
    analytics,
    periodLabel,
  });

  const report: GeneratedReport = {
    id: nextReportId(),
    type: input.type,
    format: input.format,
    title: `${download.filename.replace(/\.[^.]+$/, "")}`,
    status: "ready",
    period: input.period,
    generatedAt: new Date().toISOString(),
    generatedBy,
    fileSizeBytes: new TextEncoder().encode(download.content).length,
  };

  reportHistory = [report, ...reportHistory];
  return { report, download };
}

export function getReportDownloadById(id: string): ReportDownloadPayload | null {
  const report = reportHistory.find((item) => item.id === id);
  if (!report) return null;

  const assets = getAssets();
  const incidents = getIncidents();
  const uptime = getUptimeSummary(report.period);
  const analytics = getIncidentAnalytics(report.period);
  const periodLabel = reportPeriodLabels[report.period];

  return buildReportDownload(report.type, report.format, {
    assets,
    incidents,
    uptime,
    analytics,
    periodLabel,
  });
}
