import type { Asset, ChartDataPoint, Customer, Incident, WorkOrder } from "@/types/domain";
import { mapCustomerToTableRow } from "@/lib/operationsViewMappers";
import { statusLabels as workOrderStatusLabels } from "@/modules/work-orders/schemas/workOrder.schema";

export type DashboardHeatmapPoint = {
  x: string;
  y: string;
  value: number;
  label?: string;
};

export type DashboardBubblePoint = {
  label: string;
  x: number;
  y: number;
  size: number;
  value: number;
  color?: string;
};

export type DashboardScatterPoint = ChartDataPoint & {
  x: number;
  y: number;
  size?: number;
};

const TIME_BLOCKS = ["00-06", "06-12", "12-18", "18-24"] as const;

const WEEKDAY_ROWS = [
  "01 Mon",
  "02 Tue",
  "03 Wed",
  "04 Thu",
  "05 Fri",
  "06 Sat",
  "07 Sun",
] as const;

const JS_DAY_TO_ROW: Record<number, (typeof WEEKDAY_ROWS)[number]> = {
  0: "07 Sun",
  1: "01 Mon",
  2: "02 Tue",
  3: "03 Wed",
  4: "04 Thu",
  5: "05 Fri",
  6: "06 Sat",
};

const SEGMENT_COLORS: Record<string, string> = {
  Residential: "var(--atomix-primary)",
  Business: "var(--atomix-secondary)",
  Enterprise: "var(--atomix-accent)",
  Government: "var(--atomix-warning)",
};

const WORK_ORDER_STATUS_COLORS: Record<string, string> = {
  New: "var(--atomix-warning)",
  Assigned: "var(--atomix-primary)",
  "In Progress": "var(--atomix-accent)",
  Review: "var(--atomix-secondary)",
  Done: "var(--atomix-success)",
};

const SEVERITY_RANK: Record<Incident["severity"], number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

function assetMap(assets: Asset[]): Map<string, Asset> {
  return new Map(assets.map((asset) => [asset.id, asset]));
}

export function buildCustomerSegmentChart(
  customers: Customer[],
  assets: Asset[]
): ChartDataPoint[] {
  const byId = assetMap(assets);
  const counts = new Map<string, number>();

  for (const customer of customers) {
    const relatedOnu = customer.relatedOnuId
      ? byId.get(customer.relatedOnuId)
      : undefined;
    const { type } = mapCustomerToTableRow(customer, { relatedOnu });
    counts.set(type, (counts.get(type) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({
      label,
      value,
      color: SEGMENT_COLORS[label] ?? "var(--atomix-primary)",
    }));
}

export function computeAverageSignalHealth(
  customers: Customer[],
  assets: Asset[]
): number {
  if (customers.length === 0) return 0;

  const byId = assetMap(assets);
  const total = customers.reduce((sum, customer) => {
    const relatedOnu = customer.relatedOnuId
      ? byId.get(customer.relatedOnuId)
      : undefined;
    const { signalHealth } = mapCustomerToTableRow(customer, { relatedOnu });
    return sum + signalHealth;
  }, 0);

  return Math.round(total / customers.length);
}

export function buildWorkOrderPipelineChart(workOrders: WorkOrder[]): ChartDataPoint[] {
  const counts = new Map<string, number>();

  for (const order of workOrders) {
    const label = workOrderStatusLabels[order.status];
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return (["New", "Assigned", "In Progress", "Review", "Done"] as const)
    .map((label) => ({
      label,
      value: counts.get(label) ?? 0,
      color: WORK_ORDER_STATUS_COLORS[label],
    }))
    .filter((point) => point.value > 0);
}

export function sortActiveIncidents(incidents: Incident[]): Incident[] {
  return [...incidents].sort((a, b) => {
    const severityDiff = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
    if (severityDiff !== 0) return severityDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function incidentCalloutVariant(
  severity: Incident["severity"]
): "error" | "warning" | "primary" {
  if (severity === "critical" || severity === "high") return "error";
  if (severity === "medium") return "warning";
  return "primary";
}

export function buildUsageUtilizationChart(
  usagePoints: ChartDataPoint[]
): ChartDataPoint[] {
  if (usagePoints.length === 0) return [];

  const peak = Math.max(...usagePoints.map((point) => point.value));
  if (peak <= 0) return [];

  return usagePoints.map((point) => ({
    label: point.label,
    value: Math.round((point.value / peak) * 100),
    color:
      point.value / peak >= 0.85
        ? "var(--atomix-warning)"
        : "var(--atomix-accent)",
  }));
}

function getTimeBlock(hour: number): (typeof TIME_BLOCKS)[number] {
  if (hour < 6) return "00-06";
  if (hour < 12) return "06-12";
  if (hour < 18) return "12-18";
  return "18-24";
}

function extractPopName(notes?: string): string {
  const match = notes?.match(/POP:\s*([^|]+)/);
  return match?.[1]?.trim() ?? "Unassigned";
}

export function buildIncidentActivityHeatmap(
  incidents: Incident[]
): DashboardHeatmapPoint[] {
  const counts = new Map<string, number>();

  for (const day of WEEKDAY_ROWS) {
    for (const block of TIME_BLOCKS) {
      counts.set(`${day}|${block}`, 0);
    }
  }

  for (const incident of incidents) {
    const created = new Date(incident.createdAt);
    const day = JS_DAY_TO_ROW[created.getDay()];
    const block = getTimeBlock(created.getHours());
    const key = `${day}|${block}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const points: DashboardHeatmapPoint[] = [];
  for (const day of WEEKDAY_ROWS) {
    for (const block of TIME_BLOCKS) {
      const value = counts.get(`${day}|${block}`) ?? 0;
      points.push({
        x: block,
        y: day,
        value,
        label: `${value} incident${value === 1 ? "" : "s"}`,
      });
    }
  }

  return points;
}

export function buildPopZoneBubbleChart(
  customers: Customer[],
  assets: Asset[],
  limit = 8
): DashboardBubblePoint[] {
  const byId = assetMap(assets);
  const zones = new Map<string, { health: number[]; count: number }>();

  for (const customer of customers) {
    const pop = extractPopName(customer.notes);
    const relatedOnu = customer.relatedOnuId
      ? byId.get(customer.relatedOnuId)
      : undefined;
    const { signalHealth } = mapCustomerToTableRow(customer, { relatedOnu });
    const zone = zones.get(pop) ?? { health: [], count: 0 };
    zone.health.push(signalHealth);
    zone.count += 1;
    zones.set(pop, zone);
  }

  const maxCount = Math.max(...[...zones.values()].map((zone) => zone.count), 1);

  return [...zones.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, limit)
    .map(([pop, zone]) => {
      const avgHealth = Math.round(
        zone.health.reduce((sum, value) => sum + value, 0) / zone.health.length
      );

      return {
        label: pop,
        x: avgHealth,
        y: Math.round((zone.count / maxCount) * 100),
        size: zone.count,
        value: zone.count,
        color:
          avgHealth >= 85
            ? "var(--atomix-success)"
            : avgHealth >= 60
              ? "var(--atomix-primary)"
              : "var(--atomix-warning)",
      };
    });
}

export function buildSignalHealthScatter(
  customers: Customer[],
  assets: Asset[],
  limit = 24
): DashboardScatterPoint[] {
  const byId = assetMap(assets);

  return customers
    .map((customer) => {
      const relatedOnu = customer.relatedOnuId
        ? byId.get(customer.relatedOnuId)
        : undefined;
      const { signalHealth } = mapCustomerToTableRow(customer, { relatedOnu });
      const daysSinceUpdate =
        (Date.now() - new Date(customer.updatedAt).getTime()) / 86_400_000;

      return {
        label: customer.name.split(" ")[0] ?? customer.id,
        value: signalHealth,
        x: signalHealth,
        y: Math.min(100, Math.round((daysSinceUpdate / 30) * 100)),
        size: signalHealth < 70 ? 8 : 5,
        color:
          signalHealth >= 85
            ? "var(--atomix-success)"
            : signalHealth >= 60
              ? "var(--atomix-primary)"
              : "var(--atomix-error)",
      };
    })
    .sort((a, b) => a.x - b.x)
    .slice(0, limit);
}
