"use client";

import React from 'react';
import { Button, Card, Badge } from '@shohojdhara/atomix';
import { 
  MousePointer, 
  GitCommit, 
  Ruler, 
  Flame,
  Layers,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { useMapTools, useMeasurementTool, useTraceTool, useHeatmapTool } from '../hooks';
import { ToolType } from '../types';
import { useNetworkMapStore } from '../stores/useNetworkMapStore';

interface AdvancedToolbarProps {
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
}

export function AdvancedToolbar({ onToggleFullscreen, isFullscreen }: AdvancedToolbarProps) {
  const { switchTool, activeTool } = useMapTools();
  const activeToolId = useNetworkMapStore((state) => state.interaction.activeTool);
  
  // Get tool-specific data for badges
  const { pointCount } = useMeasurementTool();
  const { hasTrace } = useTraceTool() as any;
  const { hasHeatmap } = useHeatmapTool() as any;

  const tools: Array<{ id: ToolType; icon: any; label: string }> = [
    { id: 'select', icon: MousePointer, label: 'Select' },
    { id: 'trace', icon: GitCommit, label: 'Trace' },
    { id: 'measure', icon: Ruler, label: 'Measure' },
    { id: 'heatmap', icon: Flame, label: 'Heatmap' },
  ];

  return (
    <Card appearance="elevated" glass={true} className="u-p-2 u-shadow-lg">
      <div className="u-flex u-gap-2">
        {/* Tool buttons */}
        {tools.map(({ id, icon: Icon, label }) => {
          const isActive = activeToolId === id;
          const hasActiveState = 
            (id === 'measure' && pointCount > 0) ||
            (id === 'trace' && hasTrace) ||
            (id === 'heatmap' && hasHeatmap);

          return (
            <Button
              key={id}
              variant={isActive ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => switchTool(id)}
              title={`${label} tool`}
              className="u-relative"
            >
              <Icon className="u-w-4 u-h-4" />
              
              {/* Active state indicator */}
              {hasActiveState && (
                <div className="u-absolute -u-top-1 -u-right-1 u-w-2 u-h-2 u-rounded-full u-bg-success" />
              )}
            </Button>
          );
        })}

        <div className="u-border-start u-border-secondary-subtle u-mx-1" />

        {/* Layer controls button */}
        <Button
          variant="secondary"
          size="sm"
          iconName="Layers"
          title="Toggle layers"
        />

        {/* Fullscreen toggle */}
        {onToggleFullscreen && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onToggleFullscreen}
            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="u-w-4 u-h-4" />
            ) : (
              <Maximize2 className="u-w-4 u-h-4" />
            )}
          </Button>
        )}
      </div>
    </Card>
  );
}

// Tool status bar showing current tool information
export function ToolStatusBar() {
  const activeToolId = useNetworkMapStore((state) => state.interaction.activeTool);
  const { formattedDistance, pointCount } = useMeasurementTool();
  const traceData = require('../hooks/useMapTools').useTraceTool();
  const { formattedDistance: traceDistance, nodeCount } = traceData;

  if (activeToolId === 'select') {
    return (
      <div className="u-fs-xs u-text-secondary-subtle">
        Click on nodes or connections to view details
      </div>
    );
  }

  if (activeToolId === 'trace') {
    return (
      <div className="u-flex u-items-center u-gap-3 u-fs-xs">
        <span className="u-text-secondary-subtle">Trace Mode:</span>
        {nodeCount > 0 ? (
          <span className="u-text-success">
            Path found: {nodeCount} nodes, {traceDistance}
          </span>
        ) : (
          <span>Click source node, then target node</span>
        )}
      </div>
    );
  }

  if (activeToolId === 'measure') {
    return (
      <div className="u-flex u-items-center u-gap-3 u-fs-xs">
        <span className="u-text-secondary-subtle">Measure Mode:</span>
        {pointCount > 0 ? (
          <span className="u-text-primary">
            {pointCount} points, Total: {formattedDistance}
          </span>
        ) : (
          <span>Click to add measurement points</span>
        )}
      </div>
    );
  }

  if (activeToolId === 'heatmap') {
    return (
      <div className="u-flex u-items-center u-gap-3 u-fs-xs">
        <span className="u-text-secondary-subtle">Heatmap Mode:</span>
        <span>Visualizing network density</span>
      </div>
    );
  }

  return null;
}

// Keyboard shortcuts help component
export function KeyboardShortcutsHelp() {
  const shortcuts = [
    { key: 'Esc', action: 'Cancel current operation' },
    { key: 'Backspace', action: 'Remove last measurement point' },
    { key: '1', action: 'Select tool' },
    { key: '2', action: 'Trace tool' },
    { key: '3', action: 'Measure tool' },
    { key: '4', action: 'Heatmap tool' },
  ];

  return (
    <Card appearance="elevated" glass={true} className="u-p-3 u-shadow-lg">
      <h4 className="u-font-bold u-fs-sm u-mb-2">Keyboard Shortcuts</h4>
      <div className="u-flex u-flex-column u-gap-1">
        {shortcuts.map(({ key, action }) => (
          <div key={key} className="u-flex u-justify-between u-items-center u-fs-2xs">
            <kbd className="u-px-2 u-py-1 u-bg-secondary-subtle u-rounded u-font-mono">
              {key}
            </kbd>
            <span className="u-text-secondary-subtle">{action}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
