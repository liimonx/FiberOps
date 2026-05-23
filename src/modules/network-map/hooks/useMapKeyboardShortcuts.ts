"use client";

import { useEffect } from "react";
import { MAP_TOOL_SHORTCUTS } from "../constants/mapTools";
import { ToolType } from "../types";

export function isTypingInField(): boolean {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    (el as HTMLElement).isContentEditable
  );
}

/**
 * Global map tool shortcuts (V/T/M/H/I). Pan/zoom shortcuts stay on the map container.
 */
export function useMapKeyboardShortcuts(
  onActivateTool: (toolId: ToolType) => void,
  enabled = true
) {
  useEffect(() => {
    if (!enabled) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (isTypingInField() || e.ctrlKey || e.metaKey) return;

      const toolId = MAP_TOOL_SHORTCUTS[e.key.toUpperCase()];
      if (!toolId) return;

      e.preventDefault();
      onActivateTool(toolId);
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [enabled, onActivateTool]);
}
