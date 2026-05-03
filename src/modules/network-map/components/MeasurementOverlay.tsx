"use client";

import React from "react";
import { useMeasurementTool, useTraceTool, useHeatmapTool } from "../hooks/useMapTools";
import { Button, Card, Icon } from "@shohojdhara/atomix";

interface MeasurementOverlayProps {
  onClose?: () => void;
}

export function MeasurementOverlay({ onClose }: MeasurementOverlayProps) {
  const { measurements, formattedDistance, clearMeasurements } = useMeasurementTool();

  if (measurements.length === 0) {
    return null;
  }

  return (
    <Card
        glass={true}
        className="u-shadow-lg u-p-4 u-bg-white-opacity-5"
      >
        <div className="u-flex u-justify-between u-items-center u-mb-4">
          <div className="u-flex u-items-center u-gap-3">
            <div className="u-w-8 u-h-8 u-rounded u-bg-primary-subtle u-flex u-items-center u-justify-center">
              <Icon name="Ruler" size={18} className="" />
            </div>
            <h3 className="u-font-bold u-text-sm ">Measurement Tool</h3>
          </div>
          <div className="u-flex u-gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={clearMeasurements}
              iconName="Trash"
              iconOnly
              aria-label="Clear all measurements"
            />
            {onClose && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onClose}
                iconName="X"
                iconOnly
              />
            )}
          </div>
        </div>

        <div className="u-bg-primary-subtle u-rounded u-p-3 u-mb-4 u-border u-border-solid u-border-primary-subtle">
          <div className="u-flex u-justify-between u-items-center">
            <span className="u-text-secondary-emphasis u-text-xs u-font-bold u-text-uppercase">
              Total Distance
            </span>
            <span className="u-font-bold u-text-lg ">{formattedDistance}</span>
          </div>
        </div>

        <div className="u-overflow-y-auto u-mb-4">
          <table className="u-w-100 u-text-xs">
            <thead className="u-border-bottom u-border-secondary-subtle">
              <tr>
                <th className="u-text-start u-py-2 u-text-secondary-emphasis u-font-bold">
                  #
                </th>
                <th className="u-text-start u-py-2 u-text-secondary-emphasis u-font-bold">
                  Coordinates
                </th>
                <th className="u-text-end u-py-2 u-text-secondary-emphasis u-font-bold">
                  Segment
                </th>
              </tr>
            </thead>
            <tbody>
              {measurements.map((point, index) => (
                <tr
                  key={point.id}
                  className="u-border-bottom u-border-secondary-subtle u-opacity-80"
                >
                  <td className="u-py-2 u-font-bold ">{index + 1}</td>
                  <td className="u-py-2 u-font-mono u-opacity-70">
                    {point.position.lat.toFixed(5)}, {point.position.lng.toFixed(5)}
                  </td>
                  <td className="u-py-2 u-text-end u-font-medium">
                    {point.distance ? `${Math.round(point.distance)}m` : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="u-p-3 u-rounded u-bg-white-opacity-5 u-border u-border-solid u-border-secondary-subtle">
          <p className="u-m-0 u-text-xs u-text-secondary-emphasis u-leading-normal">
            Click on map to add points. Press{" "}
            <kbd className="u-bg-white-opacity-10 u-px-1 u-rounded-sm">Esc</kbd> to remove
            last point.
          </p>
        </div>
      </Card>
  );
}

// Trace path overlay component
export function TracePathOverlay({ onClose }: { onClose?: () => void }) {
  const traceData = useTraceTool();
  const {
    tracePath,
    hasTrace,
    formattedDistance,
    nodeCount,
    connectionCount,
    clearTrace,
  } = traceData;

  if (!hasTrace || !tracePath) {
    return null;
  }

  return (
    <Card
      glass={true}
      className="u-shadow-lg u-p-4 u-bg-white-opacity-5"
    >
        <div className="u-flex u-justify-between u-items-center u-mb-4">
          <div className="u-flex u-items-center u-gap-3">
            <div className="u-w-8 u-h-8 u-rounded u-bg-success-subtle u-flex u-items-center u-justify-center">
              <Icon name="GitBranch" size={18} className="u-text-success" />
            </div>
            <h3 className="u-font-bold u-text-sm u-text-success">Connection Trace</h3>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={clearTrace}
            iconName="X"
            iconOnly
          />
        </div>

        <div className="u-flex u-gap-2 u-mb-4">
          {[
            { label: "Distance", value: formattedDistance, color: "success" },
            { label: "Nodes", value: nodeCount, color: "primary" },
            { label: "Links", value: connectionCount, color: "warning" },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`u-flex-1 u-p-2 u-rounded u-bg-${stat.color}-subtle u-text-center u-border u-border-solid u-border-${stat.color}-subtle`}
            >
              <div
                className="u-text-xs u-text-secondary-emphasis u-font-bold u-text-uppercase u-mb-1"
              >
                {stat.label}
              </div>
              <div className={`u-font-bold u-text-base u-text-${stat.color}`}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        <div className="u-overflow-y-auto">
          <div className="u-text-xs u-font-bold u-text-secondary-emphasis u-text-uppercase u-mb-2 u-ms-1">
            Route Path
          </div>
          <div className="u-flex u-flex-column u-gap-2">
            {tracePath.path.map((node: any, index: number) => (
              <div
                key={node.id}
                className="u-flex u-items-center u-gap-3 u-p-2 u-rounded u-bg-white-opacity-5"
              >
                <div
                  className={`u-w-2 u-h-2 u-rounded-circle u-flex-shrink-0 ${
                    index === 0
                      ? "u-bg-success"
                      : index === tracePath.path.length - 1
                        ? "u-bg-error"
                        : "u-bg-primary"
                  }`}
                />
                <span className="u-text-xs u-font-medium  u-text-truncate">
                  {node.name}
                </span>
                <span className="u-text-xs u-text-secondary-emphasis u-opacity-60">
                  ({node.type})
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>
  );
}

// Heatmap legend component
export function HeatmapLegend({ onClose }: { onClose?: () => void }) {
  const { heatmapData, hasHeatmap, setHeatmapType, clearHeatmap } =
    useHeatmapTool();
  const [activeHeatmapType, setActiveHeatmapType] = React.useState<'density' | 'utilization' | 'incidents'>('density');

  if (!hasHeatmap || !heatmapData) {
    return null;
  }

  const gradientStops = Object.entries(heatmapData.gradient || {});

  return (
    <Card
        glass={true}
        className="u-shadow-lg u-p-4 u-bg-white-opacity-5"
      >
        <div className="u-flex u-justify-between u-items-center u-mb-4">
          <div className="u-flex u-items-center u-gap-2">
            <Icon name="Fire" size={18} className="u-text-error" />
            <h4 className="u-font-bold u-text-sm ">Heatmap Analysis</h4>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={clearHeatmap}
            iconName="X"
            iconOnly
          />
        </div>

        <div className="u-flex u-flex-column u-gap-3">
          <div className="u-flex u-flex-column u-gap-1">
            <div
              className="u-h-3 u-rounded-sm u-w-100 u-border u-border-solid u-border-secondary-subtle"
              style={{
                background: `linear-gradient(to right, ${gradientStops
                  .map(([stop, color]) => `${color} ${parseFloat(stop) * 100}%`)
                  .join(", ")})`,
              }}
            />
            <div className="u-flex u-justify-between u-text-xs u-text-secondary-emphasis u-font-medium">
              <span>Low Density</span>
              <span>High</span>
            </div>
          </div>

          <div className="u-flex u-flex-column u-gap-1 u-mt-2">
            <span className="u-text-xs u-font-bold u-text-secondary-emphasis u-text-uppercase u-mb-1">
              Analyze By
            </span>
            <div className="u-flex u-gap-1">
              {[
                { id: "density", label: "Density" },
                { id: "utilization", label: "Load" },
                { id: "incidents", label: "Alerts" },
              ].map((type) => (
                <Button
                  key={type.id}
                  size="sm"
                  variant={activeHeatmapType === type.id ? "primary" : "secondary"}
                  onClick={() => {
                    const t = type.id as 'density' | 'utilization' | 'incidents';
                    setHeatmapType(t);
                    setActiveHeatmapType(t);
                  }}
                  fullWidth
                  className="u-p-1 u-text-xs"
                >
                  {type.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </Card>
  );
}
