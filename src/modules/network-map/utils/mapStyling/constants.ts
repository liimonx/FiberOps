import { NetworkNodeType } from "../../types";

/** Meters — extrusion height per node type (field-scale, not exaggerated). */
export const NODE_HEIGHTS: Record<NetworkNodeType, number> = {
  [NetworkNodeType.CORE_NODE]: 42,
  [NetworkNodeType.POP]: 36,
  [NetworkNodeType.DISTRIBUTION_NODE]: 28,
  [NetworkNodeType.ACCESS_NODE]: 2.2,
  [NetworkNodeType.POLE]: 11,
  [NetworkNodeType.SPLITTER]: 0.45,
  [NetworkNodeType.JUNCTION_BOX]: 0.9,
  [NetworkNodeType.ONU]: 0.35,
  [NetworkNodeType.CUSTOMER]: 0.25,
};

/** Meters — upper crossarm on utility poles (matches buildPole). */
export const POLE_CROSSARM_ELEVATION =
  NODE_HEIGHTS[NetworkNodeType.POLE] - 0.4;

/** Meters — cable attachment height at each node type. */
export const CONNECTION_ANCHORS: Record<NetworkNodeType, number> = {
  [NetworkNodeType.CORE_NODE]: 18,
  [NetworkNodeType.POP]: 16,
  [NetworkNodeType.DISTRIBUTION_NODE]: 12,
  [NetworkNodeType.ACCESS_NODE]: 1.8,
  [NetworkNodeType.POLE]: POLE_CROSSARM_ELEVATION,
  [NetworkNodeType.SPLITTER]: 0.5,
  [NetworkNodeType.JUNCTION_BOX]: 0.45,
  [NetworkNodeType.ONU]: 1.2,
  [NetworkNodeType.CUSTOMER]: 1.0,
};

/**
 * Professional dark-map palette: hierarchy by role, restrained glows.
 * Aligned with statusColors.ts semantics where possible.
 */
export const MAP_COLORS = {
  node: {
    [NetworkNodeType.CORE_NODE]: "#0ea5e9",
    [NetworkNodeType.POP]: "#06b6d4",
    [NetworkNodeType.DISTRIBUTION_NODE]: "#7c3aed",
    [NetworkNodeType.ACCESS_NODE]: "#64748b",
    [NetworkNodeType.SPLITTER]: "#a78bfa",
    [NetworkNodeType.JUNCTION_BOX]: "#78716c",
    [NetworkNodeType.POLE]: "#57534e",
    [NetworkNodeType.ONU]: "#38bdf8",
    [NetworkNodeType.CUSTOMER]: "#34d399",
  },
  connection: {
    /** Trunk / backhaul — readable on dark basemaps without blowing out */
    fiber_route: "#0e7490",
    /** Last-mile drops — deeper tone; kept subtle until mid zoom */
    customer_connection: "#5b21b6",
  },
  status: {
    inactive: "#475569",
    error: "#f43f5e",
    warning: "#fbbf24",
    degraded: "#fb923c",
    customerError: "#b91c1c",
    distributionWarning: "#d97706",
  },
  interaction: {
    hover: "#fbbf24",
    selected: "#e2e8f0",
  },
  surface: {
    casing: "#0f172a",
    background: "#020617",
    coverage: "#064e3b",
    coverageOutline: "rgba(52, 211, 153, 0.35)",
    building: "#1e293b",
    outage: "#fca5a5",
  },
} as const;

/** Default footprint radius in degrees (~meters at mid-latitudes). */
export const NODE_FOOTPRINT_RADIUS: Partial<Record<NetworkNodeType, number>> = {
  [NetworkNodeType.CORE_NODE]: 0.00035,
  [NetworkNodeType.POP]: 0.00028,
  [NetworkNodeType.DISTRIBUTION_NODE]: 0.0002,
  [NetworkNodeType.ACCESS_NODE]: 0.00012,
};

export const DEFAULT_FOOTPRINT_RADIUS = 0.00008;

export const MAP_TRANSITION_MS = 300;
export const MAP_TRANSITION_SLOW_MS = 500;

export const AVAILABLE_STYLES = [
  {
    id: "cyber",
    name: "Cyber Security",
    url: "mapbox://styles/mapbox/cj3kbeqzo00022smj7akz3o1e",
    isDark: true,
  },
  { id: "dark", name: "Dark", url: "mapbox://styles/mapbox/dark-v11", isDark: true },
  { id: "light", name: "Light", url: "mapbox://styles/mapbox/light-v11", isDark: false },
  {
    id: "satellite",
    name: "Satellite",
    url: "mapbox://styles/mapbox/satellite-v9",
    isDark: false,
  },
  {
    id: "streets",
    name: "Streets",
    url: "mapbox://styles/mapbox/streets-v12",
    isDark: false,
  },
] as const;

/** Node circles use `maxzoom`; node extrusions use `minzoom`. */
export const ZOOM_NODES_3D_MIN = 14;
/** Street-level zoom where 3D node extrusions and heavier line weights apply. */
export const ZOOM_CONNECTIONS_3D_MIN = 15;

/** City-wide overview: hide noisy last-mile geometry & glows below this zoom. */
export const ZOOM_SHOW_CUSTOMER_CONNECTIONS = 11;
export const ZOOM_CONNECTION_GLOW_MIN = 10;
export const ZOOM_NODE_GLOW_MIN = 9;

/** Mapbox fill-extrusion layer for composite building footprints. */
export const BUILDINGS_LAYER_ID = "3d-buildings";

export const NETWORK_SOURCE_IDS = [
  "network-nodes",
  "network-connections",
  "network-outages",
  "network-coverage",
  "network-nodes-3d",
] as const;

export const LAYER_AUXILIARY: Record<string, string[]> = {
  "network-nodes-layer": ["network-nodes-glow"],
  "network-nodes-3d-layer": [],
  "network-connections-layer": ["network-connections-casing", "network-connections-glow"],
  "network-outages-layer": ["network-outages-glow"],
};
