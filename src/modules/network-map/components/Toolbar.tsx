"use client";

import React, { useRef, useCallback } from "react";
import { Button, Card, Tooltip, Icon } from "@shohojdhara/atomix";
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

  const positionClasses = {
    "top-right": "u-absolute u-top-0 u-end-0 u-mt-4 u-me-4",
    "bottom-right": "u-absolute u-bottom-0 u-end-0 u-mb-4 u-me-4",
    "top-left": "u-absolute u-top-0 u-start-0 u-mt-4 u-ms-4",
    "bottom-left": "u-absolute u-bottom-0 u-start-0 u-mb-4 u-ms-4",
  };

  return (
    <div
      className={`u-z-modal u-flex u-flex-column u-gap-2 ${positionClasses[position]} ${className}`}
      role="toolbar"
      aria-label="Map tools"
    >
      <Card glass={true} className="u-p-1 u-bg-white-opacity-5">
        <div
          className="u-flex u-flex-column u-flex-md-row u-gap-1"
          role="group"
          aria-label="Tool selection"
          onKeyDown={handleToolbarKeyDown}
        >
          {TOOLS.map((tool, index) => (
            <Tooltip
              key={tool.id}
              content={
                <div className="u-flex u-flex-column u-gap-1 u-p-1">
                  <strong className="u-text-sm ">{tool.label}</strong>
                  <span className="u-text-xs u-text-secondary-emphasis">
                    {tool.description}
                  </span>
                  {tool.shortcut && (
                    <kbd className="u-mt-1 u-self-start u-px-2 u-py-0 u-bg-white-opacity-10 u-rounded-sm u-text-xs u-font-mono">
                      {tool.shortcut}
                    </kbd>
                  )}
                </div>
              }
              position="left"
            >
              <Button
                ref={(el: any) => {
                  buttonRefs.current[index] = el;
                }}
                variant={activeTool === tool.id ? "primary" : "secondary"}
                size="md"
                iconName={tool.icon}
                iconOnly
                onClick={() => handleToolClick(tool.id, index)}
                aria-label={`${tool.label}${tool.shortcut ? `, shortcut ${tool.shortcut}` : ""}`}
                aria-pressed={activeTool === tool.id}
                aria-keyshortcuts={tool.shortcut}
                className={`u-transition-all ${activeTool === tool.id ? "u-shadow-lg" : ""}`}
                style={{
                  transform: activeTool === tool.id ? "scale(1.1)" : "scale(1)",
                }}
              />
            </Tooltip>
          ))}
        </div>
      </Card>
    </div>
  );
};

// Compact toolbar for mobile
export const MobileToolbar: React.FC<{
  className?: string;
}> = ({ className = "" }) => {
  const activeTool = useNetworkMapStore((state) => state.interaction.activeTool);
  const setActiveTool = useNetworkMapStore((state) => state.setActiveTool);
  const [isExpanded, setIsExpanded] = React.useState(false);

  const activeToolConfig = TOOLS.find((t) => t.id === activeTool) || TOOLS[0];

  return (
    <div className={`u-z-modal ${className}`}>
      <Card glass={true} className="u-p-2 u-bg-white-opacity-10">
        {!isExpanded ? (
          <div className="u-flex u-items-center u-gap-3">
            <Button
              variant="primary"
              size="lg"
              iconName={activeToolConfig.icon}
              iconOnly
              onClick={() => setIsExpanded(true)}
              aria-label="Open tools menu"
              className="u-shadow-lg"
            />
            <span className="u-text-sm u-font-bold ">{activeToolConfig.label}</span>
            <Icon
              name="CaretDown"
              size={12}
              className="u-text-secondary-emphasis u-opacity-50"
            />
          </div>
        ) : (
          <div className="u-flex u-flex-column u-gap-3">
            <div className="u-flex u-flex-column u-gap-1">
              {TOOLS.map((tool) => (
                <button
                  key={tool.id}
                  className={`u-flex u-items-center u-gap-3 u-p-3 u-rounded u-transition-all u-border-0 u-w-100 u-text-start ${
                    activeTool === tool.id
                      ? "u-bg-primary  u-shadow-md"
                      : "u-bg-transparent u-text-secondary-emphasis"
                  }`}
                  onClick={() => {
                    setActiveTool(tool.id);
                    setIsExpanded(false);
                  }}
                >
                  <Icon name={tool.icon} size={20} />
                  <span className="u-flex-1 u-text-sm u-font-medium">{tool.label}</span>
                  {activeTool === tool.id && (
                    <div className="u-w-2 u-h-2 u-rounded-circle u-bg-white" />
                  )}
                </button>
              ))}
            </div>
            <Button
              variant="secondary"
              size="sm"
              iconName="X"
              fullWidth
              onClick={() => setIsExpanded(false)}
            >
              Close
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};
