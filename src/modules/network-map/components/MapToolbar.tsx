"use client";

import React, { useRef, useCallback, useEffect } from "react";
import { Button, Card, Tooltip } from "@shohojdhara/atomix";
import { useNetworkMapStore } from "../stores/useNetworkMapStore";
import { useMapTools } from "../hooks/useMapTools";
import { useMapInstance } from "../hooks/useMapInstance";
import { useMapKeyboardShortcuts } from "../hooks/useMapKeyboardShortcuts";
import { useAccessibilityAnnounce } from "./AccessibilityAnnouncer";
import { getToolManager } from "../tools/toolManager";
import { MAP_TOOLS } from "../constants/mapTools";
import { ToolType } from "../types";

export interface MapToolbarProps {
  className?: string;
  /** When false, parent overlay handles layout (default for network-map page). */
  floating?: boolean;
}

export const MapToolbar: React.FC<MapToolbarProps> = ({
  className = "",
  floating = false,
}) => {
  const mapInstance = useMapInstance();
  const activeTool = useNetworkMapStore((state) => state.interaction.activeTool);
  const { switchTool } = useMapTools({ mapInstance: mapInstance ?? undefined });
  const { announce } = useAccessibilityAnnounce();
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const activateTool = useCallback(
    (toolId: ToolType) => {
      const tool = MAP_TOOLS.find((t) => t.id === toolId);
      switchTool(toolId);
      announce(`${tool?.label ?? toolId} tool activated`, "polite");
    },
    [switchTool, announce]
  );

  useMapKeyboardShortcuts(activateTool);

  const handleToolClick = useCallback(
    (toolId: ToolType, index: number) => {
      activateTool(toolId);
      buttonRefs.current[index]?.focus();
    },
    [activateTool]
  );

  const handleToolbarKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const currentIndex = buttonRefs.current.findIndex(
        (ref) => ref === document.activeElement
      );
      if (currentIndex === -1) return;

      let nextIndex = currentIndex;

      switch (e.key) {
        case "ArrowDown":
        case "ArrowRight":
          e.preventDefault();
          nextIndex = (currentIndex + 1) % MAP_TOOLS.length;
          buttonRefs.current[nextIndex]?.focus();
          break;
        case "ArrowUp":
        case "ArrowLeft":
          e.preventDefault();
          nextIndex = currentIndex === 0 ? MAP_TOOLS.length - 1 : currentIndex - 1;
          buttonRefs.current[nextIndex]?.focus();
          break;
        case "Home":
          e.preventDefault();
          buttonRefs.current[0]?.focus();
          break;
        case "End":
          e.preventDefault();
          buttonRefs.current[MAP_TOOLS.length - 1]?.focus();
          break;
      }
    },
    []
  );

  useEffect(() => {
    if (!mapInstance) return;
    const tool = getToolManager().getActiveTool();
    mapInstance.getCanvas().style.cursor = tool?.cursor ?? "";
  }, [mapInstance, activeTool]);

  const tooltipPosition = "left";

  return (
    <div
      className={`u-flex u-flex-column u-gap-2 ${
        floating ? "u-absolute u-top-0 u-end-0 u-mt-2 u-me-2" : ""
      } ${className}`}
      role="toolbar"
      aria-label="Map tools"
    >
      <Card glass>
        <div
          className="u-flex u-flex-column u-gap-1"
          role="group"
          aria-label="Tool selection"
          onKeyDown={handleToolbarKeyDown}
        >
          {MAP_TOOLS.map((tool, index) => (
            <Tooltip
              key={tool.id}
              content={
                <div className="u-flex u-flex-column u-gap-1 u-p-1">
                  <strong className="u-text-sm">{tool.label}</strong>
                  <span className="u-text-xs u-text-secondary-emphasis">
                    {tool.description}
                  </span>
                  {tool.shortcut && (
                    <kbd className="u-kbd u-mt-1 u-self-start">
                      {tool.shortcut}
                    </kbd>
                  )}
                </div>
              }
              position={tooltipPosition}
            >
              <Button
                ref={(el: HTMLButtonElement | null) => {
                  buttonRefs.current[index] = el;
                }}
                variant={activeTool === tool.id ? "primary" : "secondary"}
                size="sm"
                iconName={tool.icon}
                iconOnly
                onClick={() => handleToolClick(tool.id, index)}
                aria-label={`${tool.label}${tool.shortcut ? `, shortcut ${tool.shortcut}` : ""}`}
                aria-pressed={activeTool === tool.id}
                aria-keyshortcuts={tool.shortcut}
              />
            </Tooltip>
          ))}
        </div>
      </Card>
    </div>
  );
};

/** @deprecated Use MapToolbar */
export const Toolbar = MapToolbar;
