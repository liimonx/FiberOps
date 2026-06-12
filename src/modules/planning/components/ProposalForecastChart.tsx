import type { CapacityContext } from "@/modules/planning/lib/computeCapacityContext";

type ProposalForecastChartProps = {
  capacity: CapacityContext;
};

function UtilizationBar({
  label,
  value,
  variant,
}: {
  label: string;
  value: number;
  variant: "current" | "projected";
}) {
  const color =
    variant === "current"
      ? value >= 90
        ? "var(--atomix-danger)"
        : value >= 75
          ? "var(--atomix-warning)"
          : "var(--atomix-primary)"
      : value >= 75
        ? "var(--atomix-warning)"
        : "var(--atomix-success)";

  return (
    <div className="u-mb-4">
      <div className="u-flex u-justify-between u-mb-1">
        <span className="u-text-sm u-font-bold">{label}</span>
        <span className="u-text-sm u-font-mono">{value}%</span>
      </div>
      <div
        className="u-w-100 u-rounded"
        style={{
          height: "8px",
          background: "var(--color-gray-800)",
        }}
      >
        <div
          className="u-rounded"
          style={{
            width: `${Math.min(100, value)}%`,
            height: "100%",
            background: color,
            transition: "width 0.3s ease",
          }}
        />
      </div>
    </div>
  );
}

export function ProposalForecastChart({ capacity }: ProposalForecastChartProps) {
  return (
    <div>
      {capacity.assetName && (
        <p className="u-text-sm u-text-secondary-emphasis u-mb-4">
          Linked asset: <span className="u-font-bold">{capacity.assetName}</span>
        </p>
      )}

      {capacity.currentUtilization !== null ? (
        <UtilizationBar
          label="Current utilization"
          value={capacity.currentUtilization}
          variant="current"
        />
      ) : (
        <p className="u-text-sm u-text-secondary-emphasis u-mb-4">
          No baseline utilization data. Link a related asset for live context.
        </p>
      )}

      <UtilizationBar
        label="Projected utilization after build"
        value={capacity.projectedUtilization}
        variant="projected"
      />

      <div className="u-flex u-gap-4 u-flex-wrap u-mt-4">
        <div className="u-p-3 u-bg-dark u-rounded u-border u-border-secondary-subtle u-flex-1">
          <div className="u-text-xs u-text-secondary-emphasis u-mb-1">
            New customers
          </div>
          <div className="u-text-lg u-font-bold">
            {capacity.estimatedNewCustomers.toLocaleString()}
          </div>
        </div>
        {capacity.headroomAfterBuild !== null && (
          <div className="u-p-3 u-bg-dark u-rounded u-border u-border-secondary-subtle u-flex-1">
            <div className="u-text-xs u-text-secondary-emphasis u-mb-1">
              Headroom after build
            </div>
            <div className="u-text-lg u-font-bold">
              {capacity.headroomAfterBuild}%
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
