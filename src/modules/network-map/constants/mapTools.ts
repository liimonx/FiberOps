import { ToolType } from "../types";

export interface MapToolConfig {
  id: ToolType;
  icon: string;
  label: string;
  description: string;
  shortcut?: string;
}

export const MAP_TOOLS: MapToolConfig[] = [
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
  {
    id: "impairment",
    icon: "Warning",
    label: "Impairment Area",
    description:
      "Define a blast radius to simulate outages and perform impact analysis.",
    shortcut: "I",
  },
];

export const MAP_TOOL_SHORTCUTS: Record<string, ToolType> = Object.fromEntries(
  MAP_TOOLS.filter((t) => t.shortcut).map((t) => [t.shortcut!, t.id])
) as Record<string, ToolType>;
