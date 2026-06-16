// Network map constants and configuration

import { NetworkStatus, NetworkNodeType, NetworkMapLayer } from "./types";

export const MAPBOX_CONFIG = {
  ACCESS_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "",
  STYLE: "mapbox://styles/mapbox/dark-v11",
  DEFAULT_CENTER: [89.6174234, 24.5339807] as [number, number], // Brothers Communication Network area [lng, lat]
  DEFAULT_ZOOM: 15,
  DEFAULT_PITCH: 60,
  DEFAULT_BEARING: -20,
  MIN_ZOOM: 2,
  MAX_ZOOM: 18,
} as const;

export const RESPONSIVE_BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1280,
} as const;

export const NETWORK_STATUS_COLORS = {
  [NetworkStatus.ACTIVE]: "#10b981", // Green
  [NetworkStatus.INACTIVE]: "#6b7280", // Gray
  [NetworkStatus.WARNING]: "#f59e0b", // Orange
  [NetworkStatus.DEGRADED]: "#fb923c", // Light Orange/Amber
  [NetworkStatus.ERROR]: "#ef4444", // Red
} as const;

export const NETWORK_STATUS_LABELS = {
  [NetworkStatus.ACTIVE]: "Active",
  [NetworkStatus.INACTIVE]: "Inactive",
  [NetworkStatus.WARNING]: "Warning",
  [NetworkStatus.DEGRADED]: "Degraded",
  [NetworkStatus.ERROR]: "Error",
} as const;

export const NODE_TYPE_ICONS = {
  [NetworkNodeType.CORE_NODE]: "HardDrive",
  [NetworkNodeType.DISTRIBUTION_NODE]: "Cpu",
  [NetworkNodeType.ACCESS_NODE]: "Desktop",
  [NetworkNodeType.SPLITTER]: "GitFork",
  [NetworkNodeType.CUSTOMER]: "User",
  [NetworkNodeType.POLE]: "MapPin",
  [NetworkNodeType.JUNCTION_BOX]: "Package",
  [NetworkNodeType.ONU]: "HardDrive",
  [NetworkNodeType.POP]: "Pulse",
} as const;

export const DEFAULT_LAYERS: NetworkMapLayer[] = [
  { id: "fiber-routes", name: "Fiber Routes", visible: true, type: "connections" },
  { id: "infrastructure", name: "Core Nodes", visible: true, type: "nodes" },
  { id: "pops", name: "Points of Presence", visible: true, type: "nodes" },
  { id: "splitters", name: "Splitters", visible: true, type: "nodes" },
  { id: "junction-boxes", name: "Junction Boxes", visible: true, type: "nodes" },
  { id: "poles", name: "Utility Poles", visible: true, type: "nodes" },
  { id: "onus", name: "ONU Units", visible: true, type: "nodes" },
  { id: "customers", name: "Client Endpoints", visible: true, type: "nodes" },
  { id: "customer-connections", name: "Drop Cables", visible: true, type: "connections" },
  { id: "outages", name: "Active Outages", visible: true, type: "outages" },
  { id: "coverage", name: "Service Coverage", visible: true, type: "coverage" },
  {
    id: "planning-proposals",
    name: "Proposed Expansion",
    visible: true,
    type: "planning",
  },
];

// Animation constants
export const ANIMATION_DURATIONS = {
  SHORT: 150,
  MEDIUM: 300,
  LONG: 500,
} as const;
