import type {
  Asset,
  Incident,
  IncidentAnalytics,
  ReportDownloadPayload,
  UptimeSummary,
} from "@/types/domain";
import type { GenerateReportFormValues } from "@/modules/reports/schemas/report.schema";
import { reportTypeLabels } from "@/modules/reports/schemas/report.schema";

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildAssetInventoryCsv(assets: Asset[]): string {
  const header = "id,kind,name,status,latitude,longitude";
  const rows = assets.map((asset) =>
    [
      escapeCsv(asset.id),
      escapeCsv(asset.kind),
      escapeCsv(asset.name),
      escapeCsv(asset.status),
      asset.location.lat,
      asset.location.lng,
    ].join(",")
  );
  return [header, ...rows].join("\n");
}

export function buildIncidentAnalyticsCsv(analytics: IncidentAnalytics): string {
  const sections = [
    "section,label,value",
    ...analytics.bySeverity.map(
      (point) => `severity,${escapeCsv(point.label)},${point.value}`
    ),
    ...analytics.byStatus.map(
      (point) => `status,${escapeCsv(point.label)},${point.value}`
    ),
    ...analytics.avgResolutionBySeverity.map(
      (point) => `avg_resolution_hours,${escapeCsv(point.label)},${point.value}`
    ),
    `summary,mttr_hours,${analytics.mttrHours}`,
    `summary,total_incidents,${analytics.totalIncidents}`,
    `summary,resolved_incidents,${analytics.resolvedIncidents}`,
  ];
  return sections.join("\n");
}

export function buildUptimeReportHtml(
  summary: UptimeSummary,
  periodLabel: string
): string {
  const rows = summary.monthlyUptime
    .map(
      (point) =>
        `<tr><td>${point.label}</td><td>${point.value}%</td><td>${point.value >= summary.slaTarget ? "Pass" : "Fail"}</td></tr>`
    )
    .join("");

  const outages = summary.outageEvents
    .map(
      (event) =>
        `<tr><td>${new Date(event.date).toLocaleString()}</td><td>${event.durationMinutes} min</td><td>${event.affectedCustomers}</td><td>${event.cause}</td></tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Uptime Summary Report</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 2rem; color: #111; }
    h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
    .meta { color: #555; margin-bottom: 1.5rem; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; }
    th, td { border: 1px solid #ddd; padding: 0.5rem 0.75rem; text-align: left; }
    th { background: #f5f5f5; }
    .kpi { display: flex; gap: 1rem; margin-bottom: 1.5rem; }
    .kpi div { padding: 1rem; border: 1px solid #ddd; border-radius: 8px; flex: 1; }
    .kpi strong { display: block; font-size: 1.25rem; }
  </style>
</head>
<body>
  <h1>Network Uptime Summary</h1>
  <p class="meta">Period: ${periodLabel} · Generated ${new Date().toLocaleString()}</p>
  <div class="kpi">
    <div>Current month uptime<strong>${summary.currentMonthUptime}%</strong></div>
    <div>SLA target<strong>${summary.slaTarget}%</strong></div>
    <div>Compliance<strong>${summary.currentMonthUptime >= summary.slaTarget ? "Met" : "At risk"}</strong></div>
  </div>
  <h2>Monthly availability</h2>
  <table>
    <thead><tr><th>Month</th><th>Uptime</th><th>SLA</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <h2>Recent outage events</h2>
  <table>
    <thead><tr><th>Date</th><th>Duration</th><th>Customers</th><th>Cause</th></tr></thead>
    <tbody>${outages || "<tr><td colspan='4'>No outages recorded</td></tr>"}</tbody>
  </table>
</body>
</html>`;
}

export function buildReportDownload(
  type: GenerateReportFormValues["type"],
  format: GenerateReportFormValues["format"],
  data: {
    assets: Asset[];
    incidents: Incident[];
    uptime: UptimeSummary;
    analytics: IncidentAnalytics;
    periodLabel: string;
  }
): ReportDownloadPayload {
  const timestamp = new Date().toISOString().slice(0, 10);
  const baseName = reportTypeLabels[type].toLowerCase().replace(/\s+/g, "-");

  if (type === "asset_inventory") {
    return {
      filename: `${baseName}-${timestamp}.csv`,
      mimeType: "text/csv;charset=utf-8",
      content: buildAssetInventoryCsv(data.assets),
    };
  }

  if (type === "incident_analytics") {
    const content =
      format === "csv"
        ? buildIncidentAnalyticsCsv(data.analytics)
        : buildIncidentAnalyticsCsv(data.analytics);
    return {
      filename: `${baseName}-${timestamp}.${format === "pdf" ? "csv" : "csv"}`,
      mimeType: "text/csv;charset=utf-8",
      content,
    };
  }

  if (format === "csv") {
    const rows = data.uptime.monthlyUptime
      .map((point) => `${point.label},${point.value}`)
      .join("\n");
    return {
      filename: `${baseName}-${timestamp}.csv`,
      mimeType: "text/csv;charset=utf-8",
      content: `month,uptime_percent\n${rows}`,
    };
  }

  return {
    filename: `${baseName}-${timestamp}.html`,
    mimeType: "text/html;charset=utf-8",
    content: buildUptimeReportHtml(data.uptime, data.periodLabel),
  };
}

export function triggerReportDownload(payload: ReportDownloadPayload): void {
  const blob = new Blob([payload.content], { type: payload.mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = payload.filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
