"use client";

import React, { useRef, useCallback, useEffect } from "react";
import { Button, Card, Tooltip } from "@shohojdhara/atomix";
import { useNetworkMapStore } from "../stores/useNetworkMapStore";
import { useAccessibilityAnnounce } from "./AccessibilityAnnouncer";
import { ToolType } from "../types";

interface ToolbarProps {
  className?: string;
  position?: "top-right" | "bottom-right" | "top-left" | "bottom-left";
}

interface ToolConfig {
  id: ToolType;
  icon: string;
  label: string;
  description: string;
  shortcut?: string;
}

const TOOLS: ToolConfig[] = [
  {
    id: "select",
    icon: "CursorClick",
    label: "Select",
    description: "Select and inspect network elements",
    shortcut: "V",
  },
  {
    id: "trace",
    icon: "GitCommit",
    label: "Trace Path",
    description: "Trace connection paths between nodes",
    shortcut: "T",
  },
  {
    id: "measure",
    icon: "Ruler",
    label: "Measure",
    description: "Measure distances on the map",
    shortcut: "M",
  },
  {
    id: "heatmap",
    icon: "Fire",
    label: "Heatmap",
    description: "Show network density heatmap",
    shortcut: "H",
  },
];

export const Toolbar: React.FC<ToolbarProps> = ({
  className = "",
  position = "top-right",
}) => {
  const activeTool = useNetworkMapStore((state) => state.interaction.activeTool);
  const setActiveTool = useNetworkMapStore((state) => state.setActiveTool);
  const { announce } = useAccessibilityAnnounce();
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleToolClick = useCallback(
    (toolId: ToolType, index: number) => {
      setActiveTool(toolId);
      announce(`${TOOLS[index].label} tool activated`, "polite");
    },
    [setActiveTool, announce]
  );

  const handleToolbarKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = buttonRefs.current.findIndex(
      (ref) => ref === document.activeElement
    );
    if (currentIndex === -1) return;

    let nextIndex = currentIndex;

    switch (e.key) {
      case "ArrowDown":
      case "ArrowRight":
        e.preventDefault();
        nextIndex = (currentIndex + 1) % TOOLS.length;
        buttonRefs.current[nextIndex]?.focus();
        break;
      case "ArrowUp":
      case "ArrowLeft":
        e.preventDefault();
        nextIndex = currentIndex === 0 ? TOOLS.length - 1 : currentIndex - 1;
        buttonRefs.current[nextIndex]?.focus();
        break;
      case "Home":
        e.preventDefault();
        buttonRefs.current[0]?.focus();
        break;
      case "End":
        e.preventDefault();
        buttonRefs.current[TOOLS.length - 1]?.focus();
        break;
    }
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        (document.activeElement as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      const key = e.key.toUpperCase();
      const tool = TOOLS.find(t => t.shortcut === key);
      
      if (tool) {
        e.preventDefault();
        setActiveTool(tool.id);
        announce(`${tool.label} tool activated`, "polite");
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [setActiveTool, announce]);

  const positionClasses = {
    "top-right": "u-absolute u-top-0 u-end-0 u-mt-2 u-me-2",
    "bottom-right": "u-absolute u-bottom-0 u-end-0 u-mb-2 u-me-2",
    "top-left": "u-absolute u-top-0 u-start-0 u-mt-2 u-ms-2",
    "bottom-left": "u-absolute u-bottom-0 u-start-0 u-mb-2 u-ms-2",
  };

  const tooltipPosition = position.includes('left') ? 'right' : 'left';

  return (
    <div
      className={`u-flex u-flex-column u-gap-2 ${positionClasses[position]} ${className}`}
      role="toolbar"
      aria-label="Map tools"
    >
      <Card glass={true}>
        <div
          className="u-flex u-flex-column u-gap-1"
          role="group"
          aria-label="Tool selection"
          onKeyDown={handleToolbarKeyDown}
        >
          {TOOLS.map((tool, index) => (
            <Tooltip
              key={tool.id}
              content={
                <div className="u-flex u-flex-column u-gap-1 u-p-1">
                  <strong className="u-text-sm">{tool.label}</strong>
                  <span className="u-text-xs u-text-secondary-emphasis">
                    {tool.description}
                  </span>
                  {tool.shortcut && (
                    <kbd className="u-mt-1 u-self-start u-px-2 u-py-0 u-bg-secondary-subtle u-rounded-sm u-text-xs u-font-mono">
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
