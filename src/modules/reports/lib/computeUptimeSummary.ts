import type { Asset, UptimeOutageEvent, UptimeSummary } from "@/types/domain";

const SLA_TARGET = 99.5;

function monthsForPeriod(period: string): number {
  switch (period) {
    case "7d":
    case "30d":
      return 3;
    case "90d":
      return 4;
    case "6m":
      return 6;
    case "12m":
      return 12;
    default:
      return 6;
  }
}

function buildMonthlyUptime(months: number, assets: Asset[]): UptimeSummary["monthlyUptime"] {
  const downCount = assets.filter(
    (asset) => asset.status === "down" || asset.status === "degraded"
  ).length;
  const penalty = Math.min(2.5, downCount * 0.35);

  const now = new Date();
  const points: UptimeSummary["monthlyUptime"] = [];

  for (let i = months - 1; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    const variance = (Math.sin(i * 1.7) + 1) * 0.15;
    const value = Math.round((99.9 - penalty - variance) * 100) / 100;
    points.push({ label, value: Math.max(97.5, value) });
  }

  return points;
}

function buildOutageEvents(assets: Asset[]): UptimeOutageEvent[] {
  const downAssets = assets.filter((asset) => asset.status === "down");

  return downAssets.map((asset, index) => ({
    date: new Date(Date.now() - (index + 1) * 36 * 60 * 60 * 1000).toISOString(),
    durationMinutes: 45 + index * 30,
    affectedCustomers: 12 + index * 18,
    cause: `${asset.name} — signal loss detected`,
  }));
}

export function computeUptimeSummary(
  assets: Asset[],
  period: string = "6m"
): UptimeSummary {
  const monthlyUptime = buildMonthlyUptime(monthsForPeriod(period), assets);
  const currentMonthUptime = monthlyUptime[monthlyUptime.length - 1]?.value ?? SLA_TARGET;

  return {
    monthlyUptime,
    slaTarget: SLA_TARGET,
    currentMonthUptime,
    outageEvents: buildOutageEvents(assets),
  };
}

export function computeNetworkUptimePercent(assets: Asset[]): number {
  if (assets.length === 0) return 100;

  const weights: Record<Asset["status"], number> = {
    active: 1,
    maintenance: 0.98,
    degraded: 0.92,
    down: 0.75,
  };

  const score =
    assets.reduce((sum, asset) => sum + weights[asset.status], 0) / assets.length;

  return Math.round(score * 10000) / 100;
}
