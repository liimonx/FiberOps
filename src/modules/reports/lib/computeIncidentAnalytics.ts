import type { ChartDataPoint, Incident, IncidentAnalytics } from "@/types/domain";

const severityLabels: Record<Incident["severity"], string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

const severityColors: Record<Incident["severity"], string> = {
  critical: "var(--atomix-danger)",
  high: "var(--atomix-warning)",
  medium: "var(--atomix-primary)",
  low: "var(--atomix-secondary)",
};

const statusLabels: Record<Incident["status"], string> = {
  new: "New",
  investigating: "Investigating",
  assigned: "Assigned",
  resolved: "Resolved",
};

function hoursBetween(start: string, end: string): number {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(0, ms / (1000 * 60 * 60));
}

function filterByPeriod(incidents: Incident[], periodDays: number): Incident[] {
  const cutoff = Date.now() - periodDays * 24 * 60 * 60 * 1000;
  return incidents.filter(
    (incident) => new Date(incident.createdAt).getTime() >= cutoff
  );
}

function periodToDays(period: string): number {
  switch (period) {
    case "7d":
      return 7;
    case "30d":
      return 30;
    case "90d":
      return 90;
    case "6m":
      return 180;
    case "12m":
      return 365;
    default:
      return 30;
  }
}

function buildResolutionTrend(incidents: Incident[]): ChartDataPoint[] {
  const resolved = incidents.filter(
    (incident) => incident.status === "resolved" && incident.resolvedAt
  );

  const buckets = new Map<string, number>();
  for (const incident of resolved) {
    const weekStart = new Date(incident.resolvedAt as string);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const label = weekStart.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    buckets.set(label, (buckets.get(label) ?? 0) + 1);
  }

  return [...buckets.entries()]
    .slice(-8)
    .map(([label, value]) => ({ label, value }));
}

export function computeIncidentAnalytics(
  incidents: Incident[],
  period: string = "30d"
): IncidentAnalytics {
  const scoped = filterByPeriod(incidents, periodToDays(period));
  const resolved = scoped.filter((incident) => incident.status === "resolved");

  const severityCounts = new Map<string, ChartDataPoint>();
  for (const severity of ["critical", "high", "medium", "low"] as const) {
    severityCounts.set(severity, {
      label: severityLabels[severity],
      value: scoped.filter((incident) => incident.severity === severity).length,
      color: severityColors[severity],
    });
  }

  const statusCounts = new Map<string, ChartDataPoint>();
  for (const status of ["new", "investigating", "assigned", "resolved"] as const) {
    statusCounts.set(status, {
      label: statusLabels[status],
      value: scoped.filter((incident) => incident.status === status).length,
    });
  }

  const avgResolutionBySeverity: ChartDataPoint[] = (
    ["critical", "high", "medium", "low"] as const
  ).map((severity) => {
    const resolvedForSeverity = resolved.filter(
      (incident) =>
        incident.severity === severity && incident.resolvedAt
    );
    const avg =
      resolvedForSeverity.length === 0
        ? 0
        : resolvedForSeverity.reduce(
            (sum, incident) =>
              sum +
              hoursBetween(incident.createdAt, incident.resolvedAt as string),
            0
          ) / resolvedForSeverity.length;

    return {
      label: severityLabels[severity],
      value: Math.round(avg * 10) / 10,
      color: severityColors[severity],
    };
  });

  const mttrValues = resolved
    .filter((incident) => incident.resolvedAt)
    .map((incident) =>
      hoursBetween(incident.createdAt, incident.resolvedAt as string)
    );

  const mttrHours =
    mttrValues.length === 0
      ? 0
      : Math.round(
          (mttrValues.reduce((sum, hours) => sum + hours, 0) / mttrValues.length) *
            10
        ) / 10;

  return {
    bySeverity: [...severityCounts.values()],
    byStatus: [...statusCounts.values()],
    resolutionTrend: buildResolutionTrend(scoped),
    avgResolutionBySeverity,
    mttrHours,
    totalIncidents: scoped.length,
    resolvedIncidents: resolved.length,
  };
}
