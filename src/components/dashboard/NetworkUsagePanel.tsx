"use client";

import { AreaChart, BarChart } from "@shohojdhara/atomix";
import { ClientOnly } from "@/components/ClientOnly";
import { buildUsageUtilizationChart } from "@/lib/dashboardMetrics";
import type { ChartDataPoint } from "@/types/domain";

type NetworkUsagePanelProps = {
  usageData: ChartDataPoint[] | undefined;
  isLoading?: boolean;
};

function ChartSkeleton({ label }: { label: string }) {
  return (
    <div className="u-dashboard-usage-panel__chart" aria-busy="true" aria-label={label}>
      <div className="u-skeleton u-h-100 u-w-100" aria-hidden="true" />
    </div>
  );
}

export function NetworkUsagePanel({ usageData, isLoading = false }: NetworkUsagePanelProps) {
  const utilizationData = buildUsageUtilizationChart(usageData ?? []);

  if (isLoading) {
    return (
      <div className="u-dashboard-usage-panel">
        <ChartSkeleton label="Loading bandwidth chart" />
        <ChartSkeleton label="Loading utilization chart" />
      </div>
    );
  }

  return (
    <div className="u-dashboard-usage-panel">
      <div className="u-dashboard-usage-panel__chart">
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
            interactive
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
      </div>

      <div className="u-dashboard-usage-panel__divider" aria-hidden="true" />

      <div className="u-dashboard-usage-panel__section">
        <div className="u-dashboard-usage-panel__label">Peak Utilization (24h)</div>
        <div className="u-dashboard-usage-panel__chart">
          <ClientOnly>
            <BarChart
              datasets={[
                {
                  label: "Utilization",
                  data: utilizationData,
                  color: "var(--atomix-accent)",
                },
              ]}
              variant="primary"
              interactive
              showLegend={false}
              barOptions={{
                borderRadius: 3,
              }}
              config={{
                xAxis: {
                  showGrid: false,
                  label: "Time",
                },
                yAxis: {
                  showGrid: true,
                  label: "Utilization (%)",
                  formatter: (val: unknown) => `${val}%`,
                },
              }}
            />
          </ClientOnly>
        </div>
      </div>
    </div>
  );
}
