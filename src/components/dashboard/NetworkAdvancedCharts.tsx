"use client";

import {
  BubbleChart,
  HeatmapChart,
  ScatterChart,
} from "@shohojdhara/atomix";
import { ClientOnly } from "@/components/ClientOnly";
import { DashboardChartFrame } from "@/components/dashboard/DashboardChartFrame";
import type {
  DashboardBubblePoint,
  DashboardHeatmapPoint,
  DashboardScatterPoint,
} from "@/lib/dashboardMetrics";

type ChartPanelProps = {
  isLoading?: boolean;
};

type IncidentHeatmapChartProps = ChartPanelProps & {
  data: DashboardHeatmapPoint[];
};

export function IncidentHeatmapChart({
  data,
  isLoading = false,
}: IncidentHeatmapChartProps) {
  return (
    <DashboardChartFrame isLoading={isLoading} label="Loading incident heatmap">
      <ClientOnly>
        <HeatmapChart
          data={data}
          interactive
          showColorLegend
          showGrid={false}
          colorScale={{
            scheme: "custom",
            colors: [
              "var(--atomix-secondary-bg-subtle)",
              "var(--atomix-primary-bg-subtle)",
              "var(--atomix-primary)",
              "var(--atomix-warning)",
              "var(--atomix-error)",
            ],
            min: 0,
          }}
          cellConfig={{
            spacing: 3,
            borderRadius: 4,
            showLabels: false,
          }}
          config={{
            xAxis: { label: "Time of day", showGrid: false },
            yAxis: { label: "Day", showGrid: false },
          }}
        />
      </ClientOnly>
    </DashboardChartFrame>
  );
}

type PopZoneBubbleChartProps = ChartPanelProps & {
  data: DashboardBubblePoint[];
};

export function PopZoneBubbleChart({
  data,
  isLoading = false,
}: PopZoneBubbleChartProps) {
  return (
    <DashboardChartFrame isLoading={isLoading} label="Loading POP zone chart">
      <ClientOnly>
        <BubbleChart
          bubbleData={data}
          interactive
          bubbleOptions={{
            minBubbleSize: 12,
            maxBubbleSize: 48,
            showLabels: true,
            labelPosition: "top",
            showSizeLegend: true,
            sizeLegendTitle: "Subscribers",
            bubbleOpacity: 0.75,
          }}
          config={{
            xAxis: {
              label: "Avg. signal health (%)",
              showGrid: true,
              min: 0,
              max: 100,
            },
            yAxis: {
              label: "Relative load (%)",
              showGrid: true,
              min: 0,
              max: 100,
            },
          }}
        />
      </ClientOnly>
    </DashboardChartFrame>
  );
}

type SignalHealthScatterChartProps = ChartPanelProps & {
  data: DashboardScatterPoint[];
};

export function SignalHealthScatterChart({
  data,
  isLoading = false,
}: SignalHealthScatterChartProps) {
  return (
    <DashboardChartFrame isLoading={isLoading} label="Loading signal scatter chart">
      <ClientOnly>
        <ScatterChart
          datasets={[
            {
              label: "Subscribers",
              data,
              color: "var(--atomix-primary)",
            },
          ]}
          interactive
          showLegend={false}
          scatterOptions={{
            pointRadius: 6,
            showLabels: false,
            enableHoverEffects: true,
          }}
          config={{
            xAxis: {
              label: "Signal health (%)",
              showGrid: true,
              min: 0,
              max: 100,
            },
            yAxis: {
              label: "Recency (30d scale)",
              showGrid: true,
              min: 0,
              max: 100,
              formatter: (val: unknown) => `${Math.round(Number(val) * 0.3)}d`,
            },
          }}
        />
      </ClientOnly>
    </DashboardChartFrame>
  );
}
