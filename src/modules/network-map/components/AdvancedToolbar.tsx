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
  { id: "select", icon: "CursorClick", label: "Select" },
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

  const { pointCount } = useMeasurementTool();
  const { hasTrace } = useTraceTool() as any;
  const { hasHeatmap } = useHeatmapTool() as any;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const focusedIndex = buttonRefs.current.findIndex(
      (btn) => btn === document.activeElement
    );
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault();
        buttonRefs.current[
          focusedIndex === -1 ? 0 : (focusedIndex + 1) % TOOL_CONFIG.length
        ]?.focus();
        break;
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        buttonRefs.current[
          focusedIndex === -1
            ? TOOL_CONFIG.length - 1
            : (focusedIndex - 1 + TOOL_CONFIG.length) % TOOL_CONFIG.length
        ]?.focus();
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
    <Card glass={true} className="u-p-1 u-shadow-lg u-bg-white-opacity-5">
      <div
        className="u-flex u-items-center u-gap-1"
        role="toolbar"
        aria-label="Advanced map tools"
        onKeyDown={handleKeyDown}
      >
        {TOOL_CONFIG.map(({ id, icon, label }, index) => {
          const isActive = activeToolId === id;
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
          className="u-border-start u-border-solid u-border-secondary-subtle u-opacity-20 u-mx-1 u-h-6"
          aria-hidden="true"
        />
        <Button
          variant="secondary"
          size="sm"
          iconName="Stack"
          iconOnly
          aria-label="Toggle layers panel"
        />
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

interface StatusWrapperProps {
  children: React.ReactNode;
  icon: string;
}

const StatusWrapper = ({ children, icon }: StatusWrapperProps) => (
  <Card
    glass={true}
    className="u-px-3 u-py-1.5 u-bg-white-opacity-5 u-rounded-pill u-animate-fade-in"
  >
    <div className="u-flex u-items-center u-gap-2 u-text-xs u-font-medium u-text-secondary-emphasis">
      <Icon name={icon as any} size={14} className="" />
      {children}
    </div>
  </Card>
);

export function ToolStatusBar() {
  const activeToolId = useNetworkMapStore((state) => state.interaction.activeTool);
  const { formattedDistance, pointCount } = useMeasurementTool();
  const { formattedDistance: traceDistance, nodeCount } = useTraceTool() as any;

  if (activeToolId === "select")
    return (
      <StatusWrapper icon="CursorClick">
        Select nodes or connections to inspect
      </StatusWrapper>
    );
  if (activeToolId === "trace") {
    return (
      <StatusWrapper icon="GitBranch">
        {nodeCount > 0 ? (
          <span className="u-text-success">
            Path: {nodeCount} nodes • {traceDistance}
          </span>
        ) : (
          "Select source and target nodes to trace"
        )}
      </StatusWrapper>
    );
  }
  if (activeToolId === "measure") {
    return (
      <StatusWrapper icon="Ruler">
        {pointCount > 0 ? (
          <span className="">
            {pointCount} points • Total: {formattedDistance}
          </span>
        ) : (
          "Click on map to measure distance"
        )}
      </StatusWrapper>
    );
  }
  if (activeToolId === "heatmap")
    return <StatusWrapper icon="Fire">Visualizing network traffic density</StatusWrapper>;
  return null;
}

export function KeyboardShortcutsHelp() {
  const shortcuts = [
    { key: "Esc", action: "Cancel" },
    { key: "BS", action: "Undo point" },
    { key: "1-4", action: "Switch tools" },
    { key: "Arrows", action: "Pan map" },
  ];

  return (
    <Card glass={true} className="u-p-4 u-shadow-lg u-bg-white-opacity-5 u-w-48">
      <h4
        className="u-m-0 u-text-xs u-font-bold u-text-uppercase u-mb-3 u-tracking-widest"
      >
        Shortcuts
      </h4>
      <div className="u-flex u-flex-column u-gap-2">
        {shortcuts.map(({ key, action }) => (
          <div key={key} className="u-flex u-justify-between u-items-center u-text-xs">
            <kbd className="u-px-1.5 u-py-0.5 u-bg-white-opacity-10 u-rounded u-font-mono  u-border u-border-solid u-border-secondary-subtle">
              {key}
            </kbd>
            <span className="u-text-secondary-emphasis">{action}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
