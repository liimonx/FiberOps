"use client";

import React from 'react';
import { Ruler, X, Trash2 } from 'lucide-react';
import { useMeasurementTool } from '../hooks/useMapTools';
import { Button, Card } from '@shohojdhara/atomix';

interface MeasurementOverlayProps {
  onClose?: () => void;
}

export function MeasurementOverlay({ onClose }: MeasurementOverlayProps) {
  const {
    measurements,
    totalDistance,
    formattedDistance,
    clearMeasurements,
    pointCount,
  } = useMeasurementTool();

  if (measurements.length === 0) {
    return null;
  }

  return (
    <div className="measurement-overlay u-absolute u-bottom-4 u-left-1/2 u-transform--translate-x-1/2 u-z-10">
      <Card appearance="elevated" glass={true} className="u-shadow-xl u-p-4 u-min-w-[300px]">
        <div className="u-flex u-justify-between u-items-center u-mb-3">
          <div className="u-flex u-items-center u-gap-2">
            <Ruler className="u-w-5 u-h-5 u-text-primary" />
            <h3 className="u-font-bold u-fs-base">Measurement Tool</h3>
          </div>
          <div className="u-flex u-gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={clearMeasurements}
              iconName="Trash"
              title="Clear all measurements"
            >
              Clear
            </Button>
            {onClose && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onClose}
                iconName="X"
              />
            )}
          </div>
        </div>

        <div className="u-bg-primary-subtle u-rounded u-p-3 u-mb-3">
          <div className="u-flex u-justify-between u-items-center">
            <span className="u-text-secondary-subtle u-fs-sm">Total Distance</span>
            <span className="u-font-bold u-fs-lg u-text-primary">{formattedDistance}</span>
          </div>
        </div>

        <div className="u-max-h-[200px] u-overflow-y-auto">
          <table className="u-w-100 u-fs-xs">
            <thead className="u-border-bottom u-border-secondary-subtle">
              <tr>
                <th className="u-text-left u-py-2 u-text-secondary-subtle">#</th>
                <th className="u-text-left u-py-2 u-text-secondary-subtle">Coordinates</th>
                <th className="u-text-right u-py-2 u-text-secondary-subtle">Segment</th>
              </tr>
            </thead>
            <tbody>
              {measurements.map((point, index) => (
                <tr key={point.id} className="u-border-bottom u-border-secondary-subtle/30">
                  <td className="u-py-2 u-font-medium">{index + 1}</td>
                  <td className="u-py-2 u-font-mono u-fs-2xs">
                    {point.position.lat.toFixed(6)}, {point.position.lng.toFixed(6)}
                  </td>
                  <td className="u-py-2 u-text-right">
                    {point.distance ? `${Math.round(point.distance)} m` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="u-mt-3 u-pt-3 u-border-top u-border-secondary-subtle u-fs-xs u-text-secondary-subtle">
          <p>Click on the map to add measurement points. Press Escape to remove last point.</p>
        </div>
      </Card>
    </div>
  );
}

// Trace path overlay component
export function TracePathOverlay({ onClose }: { onClose?: () => void }) {
  const {
    tracePath,
    hasTrace,
    formattedDistance,
    nodeCount,
    connectionCount,
    clearTrace,
  } = useMeasurementTool() as any; // Using wrong hook, need to use useTraceTool

  // Import the correct hook
  const traceData = require('../hooks/useMapTools').useTraceTool();
  const {
    tracePath: actualTracePath,
    hasTrace: actualHasTrace,
    formattedDistance: traceFormattedDistance,
    nodeCount: actualNodeCount,
    connectionCount: actualConnectionCount,
    clearTrace: actualClearTrace,
  } = traceData;

  if (!actualHasTrace || !actualTracePath) {
    return null;
  }

  return (
    <div className="trace-overlay u-absolute u-bottom-4 u-left-1/2 u-transform--translate-x-1/2 u-z-10">
      <Card appearance="elevated" glass={true} className="u-shadow-xl u-p-4 u-min-w-[350px]">
        <div className="u-flex u-justify-between u-items-center u-mb-3">
          <div className="u-flex u-items-center u-gap-2">
            <Ruler className="u-w-5 u-h-5 u-text-success" />
            <h3 className="u-font-bold u-fs-base">Connection Trace</h3>
          </div>
          <div className="u-flex u-gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={actualClearTrace}
              iconName="X"
            />
          </div>
        </div>

        <div className="u-grid u-grid-cols-3 u-gap-3 u-mb-3">
          <div className="u-bg-success-subtle u-rounded u-p-2 u-text-center">
            <div className="u-fs-2xs u-text-secondary-subtle">Distance</div>
            <div className="u-font-bold u-fs-base u-text-success">{traceFormattedDistance}</div>
          </div>
          <div className="u-bg-primary-subtle u-rounded u-p-2 u-text-center">
            <div className="u-fs-2xs u-text-secondary-subtle">Nodes</div>
            <div className="u-font-bold u-fs-base u-text-primary">{actualNodeCount}</div>
          </div>
          <div className="u-bg-warning-subtle u-rounded u-p-2 u-text-center">
            <div className="u-fs-2xs u-text-secondary-subtle">Connections</div>
            <div className="u-font-bold u-fs-base u-text-warning">{actualConnectionCount}</div>
          </div>
        </div>

        <div className="u-max-h-[150px] u-overflow-y-auto">
          <div className="u-fs-xs u-text-secondary-subtle u-mb-2">Path:</div>
          <div className="u-flex u-flex-column u-gap-1">
            {actualTracePath.path.map((node: any, index: number) => (
              <div key={node.id} className="u-flex u-items-center u-gap-2 u-fs-xs">
                <div className={`u-w-2 u-h-2 u-rounded-full ${
                  index === 0 ? 'u-bg-success' : 
                  index === actualTracePath.path.length - 1 ? 'u-bg-danger' : 
                  'u-bg-primary'
                }`} />
                <span className="u-font-medium">{node.name}</span>
                <span className="u-text-secondary-subtle u-fs-2xs">({node.type})</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

// Heatmap legend component
export function HeatmapLegend({ onClose }: { onClose?: () => void }) {
  const { heatmapData, hasHeatmap, setHeatmapType, clearHeatmap } = 
    require('../hooks/useMapTools').useHeatmapTool();

  if (!hasHeatmap || !heatmapData) {
    return null;
  }

  const gradientStops = Object.entries(heatmapData.gradient || {});

  return (
    <div className="heatmap-legend u-absolute u-bottom-4 u-right-4 u-z-10">
      <Card appearance="elevated" glass={true} className="u-shadow-xl u-p-3">
        <div className="u-flex u-justify-between u-items-center u-mb-2">
          <h4 className="u-font-bold u-fs-sm">Heatmap Legend</h4>
          <Button
            variant="secondary"
            size="sm"
            onClick={clearHeatmap}
            iconName="X"
          />
        </div>

        <div className="u-flex u-flex-column u-gap-2">
          {/* Gradient bar */}
          <div 
            className="u-h-4 u-rounded u-mb-2"
            style={{
              background: `linear-gradient(to right, ${
                gradientStops.map(([stop, color]) => `${color} ${parseFloat(stop) * 100}%`).join(', ')
              })`
            }}
          />

          <div className="u-flex u-justify-between u-fs-2xs u-text-secondary-subtle">
            <span>Low</span>
            <span>High</span>
          </div>

          {/* Heatmap type selector */}
          <div className="u-flex u-gap-1 u-mt-2">
            <button
              onClick={() => setHeatmapType('density')}
              className="u-px-2 u-py-1 u-fs-2xs u-rounded u-bg-primary u-text-white"
            >
              Density
            </button>
            <button
              onClick={() => setHeatmapType('utilization')}
              className="u-px-2 u-py-1 u-fs-2xs u-rounded u-bg-secondary-subtle"
            >
              Utilization
            </button>
            <button
              onClick={() => setHeatmapType('incidents')}
              className="u-px-2 u-py-1 u-fs-2xs u-rounded u-bg-secondary-subtle"
            >
              Incidents
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
