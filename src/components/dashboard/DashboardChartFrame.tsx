"use client";

type DashboardChartFrameProps = {
  isLoading?: boolean;
  children: React.ReactNode;
  label?: string;
  compact?: boolean;
};

export function DashboardChartFrame({
  isLoading = false,
  children,
  label = "Loading chart",
  compact = false,
}: DashboardChartFrameProps) {
  if (isLoading) {
    return (
      <div
        className={`u-dashboard-chart${compact ? " u-dashboard-chart--compact" : ""}`}
        aria-busy="true"
        aria-label={label}
      >
        <div className="u-skeleton u-h-100 u-w-100" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div
      className={`u-dashboard-chart${compact ? " u-dashboard-chart--compact" : ""}`}
    >
      {children}
    </div>
  );
}
