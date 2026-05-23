import { PhosphorIconsType } from "@shohojdhara/atomix";
import { NetworkMapLayer } from "../types";

export interface LayerConfigMeta extends NetworkMapLayer {
  icon: PhosphorIconsType;
  description: string;
  color: string;
}

export const LAYER_CONFIGS: LayerConfigMeta[] = [
  {
    id: "fiber-routes",
    name: "Fiber Routes",
    visible: true,
    type: "connections",
    icon: "GitBranch",
    description: "Fiber optic backbone & distribution",
    color: "#06b6d4",
  },
  {
    id: "infrastructure",
    name: "Core Nodes",
    visible: true,
    type: "nodes",
    icon: "HardDrive",
    description: "Core and Distribution infrastructure",
    color: "#8b5cf6",
  },
  {
    id: "pops",
    name: "Points of Presence",
    visible: true,
    type: "nodes",
    icon: "Pulse",
    description: "Network service hubs",
    color: "#ec4899",
  },
  {
    id: "splitters",
    name: "Splitters",
    visible: true,
    type: "nodes",
    icon: "GitFork",
    description: "Passive optical splitters",
    color: "#8b5cf6",
  },
  {
    id: "junction-boxes",
    name: "Junction Boxes",
    visible: true,
    type: "nodes",
    icon: "Package",
    description: "Fiber termination points",
    color: "#94a3b8",
  },
  {
    id: "poles",
    name: "Utility Poles",
    visible: true,
    type: "nodes",
    icon: "MapPin",
    description: "Aerial distribution points",
    color: "#64748b",
  },
  {
    id: "onus",
    name: "ONU Units",
    visible: true,
    type: "nodes",
    icon: "HardDrive",
    description: "Optical Network Units",
    color: "#f59e0b",
  },
  {
    id: "customers",
    name: "Client Endpoints",
    visible: true,
    type: "nodes",
    icon: "Users",
    description: "Customer connection points",
    color: "#f59e0b",
  },
  {
    id: "customer-connections",
    name: "Drop Cables",
    visible: true,
    type: "connections",
    icon: "Link",
    description: "Last-mile customer connections",
    color: "#38bdf8",
  },
  {
    id: "outages",
    name: "Active Outages",
    visible: true,
    type: "outages",
    icon: "WarningCircle",
    description: "Current service interruptions",
    color: "#ef4444",
  },
  {
    id: "coverage",
    name: "Service Coverage",
    visible: true,
    type: "coverage",
    icon: "MapTrifold",
    description: "Regional network availability",
    color: "#10b981",
  },
];
