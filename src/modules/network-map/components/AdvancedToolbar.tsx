"use client";

import React from "react";
import { Button, Card, Icon } from "@shohojdhara/atomix";
import { useMapTools, useMeasurementTool, useTraceTool, useHeatmapTool } from "../hooks";
import { ToolType } from "../types";
import { useNetworkMapStore } from "../stores/useNetworkMapStore";

interface AdvancedToolbarProps {
  onToggleFullscreen?: () => void;
  isFullscreen?: boolean;
}

const TOOL_CONFIG: Array<{ id: ToolType; icon: string; label: string }> = [
  { id: "select", icon: "Cursor", label: "Select" },
  { id: "trace", icon: "GitBranch", label: "Trace" },
  { id: "measure", icon: "Ruler", label: "Measure" },
  { id: "heatmap", icon: "Fire", label: "Heatmap" },
];

export function AdvancedToolbar({
  onToggleFullscreen,
  isFullscreen,
}: AdvancedToolbarProps) {
  const { switchTool } = useMapTools();
  const activeToolId = useNetworkMapStore((state) => state.interaction.activeTool);
  const buttonRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

  // Get tool-specific data for badges
  const { pointCount } = useMeasurementTool();
  const { hasTrace } = useTraceTool() as any;
  const { hasHeatmap } = useHeatmapTool() as any;

  // Keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const focusedIndex = buttonRefs.current.findIndex(
      (btn) => btn === document.activeElement
    );

    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault();
        const nextIndex =
          focusedIndex === -1 ? 0 : (focusedIndex + 1) % TOOL_CONFIG.length;
        buttonRefs.current[nextIndex]?.focus();
        break;

      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        const prevIndex =
          focusedIndex === -1
            ? TOOL_CONFIG.length - 1
            : (focusedIndex - 1 + TOOL_CONFIG.length) % TOOL_CONFIG.length;
        buttonRefs.current[prevIndex]?.focus();
        break;

      case "Home":
        e.preventDefault();
        buttonRefs.current[0]?.focus();
        break;

      case "End":
        e.preventDefault();
        buttonRefs.current[TOOL_CONFIG.length - 1]?.focus();
        break;

      case "Escape":
        e.preventDefault();
        (e.currentTarget as HTMLElement).blur();
        break;
    }
  };

  return (
    <Card appearance="elevated" glass={true} className="u-p-2 u-shadow-lg">
      <div
        className="u-flex u-gap-2"
        role="toolbar"
        aria-label="Advanced map tools"
        onKeyDown={handleKeyDown}
      >
        {/* Tool buttons */}
        {TOOL_CONFIG.map(({ id, icon, label }, index) => {
          const isActive = activeToolId === id;
          const hasActiveState =
            (id === "measure" && pointCount > 0) ||
            (id === "trace" && hasTrace) ||
            (id === "heatmap" && hasHeatmap);

          return (
            <Button
              key={id}
              variant={isActive ? "primary" : "secondary"}
              size="sm"
              iconName={icon as any}
              iconOnly
              onClick={() => switchTool(id)}
              aria-label={`${label} tool`}
              aria-pressed={isActive}
              ref={(el) => {
                buttonRefs.current[index] = el as HTMLButtonElement | null;
              }}
              className="u-relative"
            />
          );
        })}

        <div
          className="u-border-start u-border-secondary-subtle u-mx-1"
          aria-hidden="true"
        />

        {/* Layer controls button */}
        <Button
          variant="secondary"
          size="sm"
          iconName="StackSimple"
          iconOnly
          aria-label="Toggle layers panel"
        />

        {/* Fullscreen toggle */}
        {onToggleFullscreen && (
          <Button
            variant="secondary"
            size="sm"
            iconName={isFullscreen ? "ArrowsIn" : "ArrowsOut"}
            iconOnly
            onClick={onToggleFullscreen}
            aria-label={isFullscreen ? "Exit fullscreen mode" : "Enter fullscreen mode"}
          />
        )}
      </div>
    </Card>
  );
}

// Tool status bar showing current tool information
export function ToolStatusBar() {
  const activeToolId = useNetworkMapStore((state) => state.interaction.activeTool);
  const { formattedDistance, pointCount } = useMeasurementTool();
  const traceData = require("../hooks/useMapTools").useTraceTool();
  const { formattedDistance: traceDistance, nodeCount } = traceData;

  if (activeToolId === "select") {
    return (
      <div className="u-text-xs u-text-secondary-subtle">
        Click on nodes or connections to view details
      </div>
    );
  }

  if (activeToolId === "trace") {
    return (
      <div className="u-flex u-items-center u-gap-3 u-text-xs">
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

  if (activeToolId === "measure") {
    return (
      <div className="u-flex u-items-center u-gap-3 u-text-xs">
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

  if (activeToolId === "heatmap") {
    return (
      <div className="u-flex u-items-center u-gap-3 u-text-xs">
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
    { key: "Esc", action: "Cancel current operation" },
    { key: "Backspace", action: "Remove last measurement point" },
    { key: "1", action: "Select tool" },
    { key: "2", action: "Trace tool" },
    { key: "3", action: "Measure tool" },
    { key: "4", action: "Heatmap tool" },
  ];

  return (
    <Card appearance="elevated" glass={true} className="u-p-3 u-shadow-lg">
      <h4 className="u-font-bold u-text-sm u-mb-2">Keyboard Shortcuts</h4>
      <div className="u-flex u-flex-column u-gap-1">
        {shortcuts.map(({ key, action }) => (
          <div key={key} className="u-flex u-justify-between u-items-center u-text-xs">
            <kbd className="u-px-2 u-py-1 u-bg-secondary-subtle u-rounded">{key}</kbd>
            <span className="u-text-secondary-subtle">{action}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
