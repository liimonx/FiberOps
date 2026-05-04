// Map styling utilities for Mapbox GL JS

import type { ExpressionSpecification, LayerSpecification } from "mapbox-gl";
import type { NetworkNode, NetworkConnection } from "../types";

/* ─────────────────────────────────────────────────────────────────────────────
 * DESIGN TOKENS
 * ───────────────────────────────────────────────────────────────────────────── */

/**
 * Curated color palette for network infrastructure.
 * These follow a logical hierarchy: Core (Dark Blue), Distribution (Teal),
 * Plant (Amber/Stone), and Edge (Sky/Violet).
 */
export const MAP_COLORS = {
  // Nodes
  core: "#1e3a8a", // Deep Indigo
  pop: "#3730a3", // Violet 800
  distribution: "#0f766e", // Teal 700
  access: "#047857", // Emerald 700
  splitter: "#b45309", // Amber 700
  junction: "#57534e", // Stone 600
  pole: "#92400e", // Brown 800
  onu: "#0369a1", // Sky 700
  customer: "#6d28d9", // Violet 700

  // Connections
  fiber_route: "#ee8952", // Orange 600
  customer_connection: "#38bdf8", // Sky 400

  // Status
  inactive: "#64748b", // Slate 500
  error: "#b91c1c", // Red 700
  warning: "#d97706", // Amber 600
  selected: "#fefce8", // Warm White
  hovered: "#fde68a", // Soft Gold

  // Backgrounds
  casing: "#0f172a", // Slate 900
  coverage: "#14b8a6", // Teal 500
} as const;

/** Sizing hierarchy for different zoom levels */
const NODE_SIZES = {
  min: {
    core: 6,
    pop: 6,
    distribution: 4,
    access: 3,
    onu: 3,
    splitter: 2.5,
    junction: 2.5,
    customer: 2,
    pole: 2,
  },
  mid: {
    core: 14,
    pop: 14,
    distribution: 10,
    access: 8,
    onu: 8,
    splitter: 6,
    junction: 6,
    customer: 5,
    pole: 5,
  },
  max: {
    core: 24,
    pop: 24,
    distribution: 18,
    access: 14,
    onu: 14,
    splitter: 10,
    junction: 10,
    customer: 8,
    pole: 8,
  },
} as const;

/* ─────────────────────────────────────────────────────────────────────────────
 * EXPRESSION BUILDERS
 * ───────────────────────────────────────────────────────────────────────────── */

/** Helper to build a node type-based match expression */
const matchNodeType = (
  values: Record<string, any>,
  defaultValue: any
): ExpressionSpecification => [
  "match",
  ["get", "type"],
  "core_node",
  values.core,
  "pop",
  values.pop,
  "distribution_node",
  values.distribution,
  "access_node",
  values.access,
  "splitter",
  values.splitter,
  "junction_box",
  values.junction,
  "pole",
  values.pole,
  "onu",
  values.onu,
  "customer",
  values.customer,
  defaultValue,
];

/** Node fill expression accounting for status */
const NODE_FILL: ExpressionSpecification = [
  "case",
  ["==", ["get", "status"], "inactive"],
  MAP_COLORS.inactive,
  ["==", ["get", "status"], "error"],
  ["match", ["get", "type"], "customer", "#991b1b", MAP_COLORS.error],
  ["==", ["get", "status"], "warning"],
  [
    "match",
    ["get", "type"],
    "core_node",
    MAP_COLORS.warning,
    "pop",
    MAP_COLORS.warning,
    "#fbbf24", // distribution/pole warning color
  ],
  matchNodeType(MAP_COLORS, "#94a3b8"),
];

/** Connection stroke expression */
const LINE_COLOR: ExpressionSpecification = [
  "case",
  ["==", ["get", "status"], "inactive"],
  MAP_COLORS.inactive,
  ["==", ["get", "status"], "error"],
  MAP_COLORS.error,
  ["==", ["get", "status"], "warning"],
  MAP_COLORS.warning,
  [
    "match",
    ["get", "type"],
    "fiber_route",
    MAP_COLORS.fiber_route,
    "customer_connection",
    MAP_COLORS.customer_connection,
    "#94a3b8",
  ],
];

/* ─────────────────────────────────────────────────────────────────────────────
 * LAYER SPECIFICATIONS
 * ───────────────────────────────────────────────────────────────────────────── */

export const AVAILABLE_STYLES = [
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
];

export const CUSTOM_LAYERS: Record<string, LayerSpecification> = {
  /** Soft halo behind every node for better visibility and status feedback */
  nodeGlow: {
    id: "network-nodes-glow",
    type: "circle",
    source: "network-nodes",
    paint: {
      "circle-radius": [
        "interpolate",
        ["exponential", 1.5],
        ["zoom"],
        5,
        matchNodeType(
          {
            core: 12,
            pop: 12,
            distribution: 8,
            access: 6,
            onu: 5,
            splitter: 5,
            junction: 4,
            customer: 4,
            pole: 4,
          },
          5
        ),
        12,
        matchNodeType(
          {
            core: 24,
            pop: 24,
            distribution: 16,
            access: 14,
            onu: 12,
            splitter: 10,
            junction: 9,
            customer: 8,
            pole: 8,
          },
          12
        ),
        18,
        matchNodeType(
          {
            core: 40,
            pop: 40,
            distribution: 30,
            access: 24,
            onu: 20,
            splitter: 16,
            junction: 14,
            customer: 12,
            pole: 12,
          },
          20
        ),
      ],
      "circle-color": NODE_FILL,
      "circle-opacity": [
        "case",
        ["==", ["get", "status"], "error"],
        0.35,
        ["==", ["get", "status"], "warning"],
        0.25,
        ["==", ["get", "status"], "inactive"],
        0.05,
        0.15,
      ],
      "circle-blur": 1,
    },
  },

  /** Primary node visualization */
  nodes: {
    id: "network-nodes-layer",
    type: "circle",
    source: "network-nodes",
    paint: {
      "circle-radius": [
        "interpolate",
        ["exponential", 1.5],
        ["zoom"],
        5,
        matchNodeType(NODE_SIZES.min, 3),
        12,
        matchNodeType(NODE_SIZES.mid, 8),
        18,
        matchNodeType(NODE_SIZES.max, 14),
      ],
      "circle-color": NODE_FILL,
      "circle-stroke-width": [
        "case",
        ["boolean", ["feature-state", "selected"], false],
        3,
        ["boolean", ["feature-state", "hovered"], false],
        2.5,
        ["match", ["get", "type"], "core_node", 2, "pop", 2, "customer", 1, 1.5],
      ],
      "circle-stroke-color": [
        "case",
        ["boolean", ["feature-state", "selected"], false],
        MAP_COLORS.selected,
        ["boolean", ["feature-state", "hovered"], false],
        MAP_COLORS.hovered,
        "rgba(255, 255, 255, 0.8)",
      ],
      "circle-opacity": 0.98,
      "circle-stroke-opacity": 0.9,
    },
  },

  /** Dark casing under connections for visual depth */
  connectionCasing: {
    id: "network-connections-casing",
    type: "line",
    source: "network-connections",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-width": [
        "interpolate",
        ["linear"],
        ["zoom"],
        5,
        [
          "+",
          ["match", ["get", "type"], "fiber_route", 2, "customer_connection", 1, 1.5],
          1.5,
        ],
        10,
        [
          "+",
          ["match", ["get", "type"], "fiber_route", 4, "customer_connection", 2, 3],
          2.5,
        ],
        15,
        [
          "+",
          ["match", ["get", "type"], "fiber_route", 7, "customer_connection", 3.5, 5],
          3,
        ],
      ],
      "line-color": MAP_COLORS.casing,
      "line-opacity": 0.4,
    },
  },

  /** Primary connection lines */
  connections: {
    id: "network-connections-layer",
    type: "line",
    source: "network-connections",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-width": [
        "interpolate",
        ["exponential", 1.5],
        ["zoom"],
        5,
        ["match", ["get", "type"], "fiber_route", 1.25, "customer_connection", 0.65, 0.9],
        12,
        ["match", ["get", "type"], "fiber_route", 3, "customer_connection", 1.5, 2.2],
        18,
        ["match", ["get", "type"], "fiber_route", 5, "customer_connection", 2.2, 3.5],
      ],
      "line-color": LINE_COLOR,
      "line-opacity": 0.9,
      "line-dasharray": [
        "case",
        ["==", ["get", "status"], "inactive"],
        [2, 2],
        ["==", ["get", "type"], "customer_connection"],
        [4, 3],
        ["==", ["get", "status"], "warning"],
        [6, 2.5],
        [1, 0],
      ],
    },
  },

  /** Glowing corridor for outage identification */
  outagesGlow: {
    id: "network-outages-glow",
    type: "line",
    source: "network-outages",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-width": ["interpolate", ["linear"], ["zoom"], 5, 8, 10, 14, 15, 22],
      "line-color": MAP_COLORS.error,
      "line-opacity": 0.3,
      "line-blur": 3,
    },
  },

  /** Distinctive dashed lines for outages */
  outages: {
    id: "network-outages-layer",
    type: "line",
    source: "network-outages",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-width": ["interpolate", ["linear"], ["zoom"], 5, 2, 10, 3.5, 15, 5],
      "line-color": "#fca5a5",
      "line-opacity": 0.95,
      "line-dasharray": [3, 2],
    },
  },

  /** Coverage/Regional availability areas */
  coverage: {
    id: "network-coverage-layer",
    type: "fill",
    source: "network-coverage",
    paint: {
      "fill-color": MAP_COLORS.coverage,
      "fill-opacity": ["interpolate", ["linear"], ["zoom"], 5, 0.06, 12, 0.1, 16, 0.14],
      "fill-outline-color": "rgba(94, 234, 212, 0.35)",
    },
  },
};

/* ─────────────────────────────────────────────────────────────────────────────
 * UTILITY FUNCTIONS
 * ───────────────────────────────────────────────────────────────────────────── */

/** Initialize all network sources and layers on the map */
export const addCustomLayers = (map: mapboxgl.Map) => {
  const sources = [
    { id: "network-nodes", type: "geojson" },
    { id: "network-connections", type: "geojson" },
    { id: "network-outages", type: "geojson" },
    { id: "network-coverage", type: "geojson" },
  ];

  // Add sources
  sources.forEach((src) => {
    if (!map.getSource(src.id)) {
      map.addSource(src.id, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
    }
  });

  // Add layers in specific order for correct stacking
  const layers = [
    CUSTOM_LAYERS.coverage,
    CUSTOM_LAYERS.connectionCasing,
    CUSTOM_LAYERS.connections,
    CUSTOM_LAYERS.outagesGlow,
    CUSTOM_LAYERS.outages,
    CUSTOM_LAYERS.nodeGlow,
    CUSTOM_LAYERS.nodes,
  ];

  layers.forEach((layer) => {
    if (!map.getLayer(layer.id)) {
      map.addLayer(layer);
    }
  });
};

/** Toggle visibility for a layer and its associated sub-layers (glows, casings) */
export const updateLayerVisibility = (
  map: mapboxgl.Map,
  layerId: string,
  visible: boolean
) => {
  const visibility = visible ? "visible" : "none";

  // Map primary layers to their auxiliary layers
  const auxiliaryMap: Record<string, string[]> = {
    "network-nodes-layer": ["network-nodes-glow"],
    "network-connections-layer": ["network-connections-casing"],
    "network-outages-layer": ["network-outages-glow"],
  };

  const layersToUpdate = [layerId, ...(auxiliaryMap[layerId] || [])];

  layersToUpdate.forEach((id) => {
    if (map.getLayer(id)) {
      map.setLayoutProperty(id, "visibility", visibility);
    }
  });
};

/** Set feature state for interaction (hover, selected) */
export const setFeatureState = (
  map: mapboxgl.Map,
  source: string,
  id: string | number,
  state: Record<string, any>
) => {
  map.setFeatureState({ source, id }, state);
};

/** Clear all feature states or for a specific feature */
export const clearFeatureState = (
  map: mapboxgl.Map,
  source: string,
  id?: string | number
) => {
  if (id !== undefined) {
    map.setFeatureState({ source, id }, {});
  } else {
    // Note: Mapbox doesn't have a direct 'clear all' that is reliable without specific IDs
    // unless using internal methods. We query visible features as a best-effort.
    if (!map.getSource(source)) return;
    const features = map.querySourceFeatures(source);
    features.forEach((f) => map.setFeatureState({ source, id: f.id as number }, {}));
  }
};

/** Apply a specific map style/theme */
export const applyTheme = (map: mapboxgl.Map, themeId: string) => {
  const style = AVAILABLE_STYLES.find((s) => s.id === themeId) || AVAILABLE_STYLES[0];
  map.setStyle(style.url);
  map.once("style.load", () => addCustomLayers(map));
};

/* ─────────────────────────────────────────────────────────────────────────────
 * FEATURE CREATORS
 * ───────────────────────────────────────────────────────────────────────────── */

export const createNodeFeature = (node: NetworkNode): GeoJSON.Feature => ({
  type: "Feature",
  geometry: {
    type: "Point",
    coordinates: [node.position.lng, node.position.lat],
  },
  properties: {
    ...node,
    // Ensure Mapbox expressions receive string types for match filters
    type: String(node.type),
    status: String(node.status),
  },
});

export const createConnectionFeature = (
  connection: NetworkConnection,
  nodes?: NetworkNode[]
): GeoJSON.Feature | null => {
  let coords: [number, number][] = [];

  if (connection.route?.length) {
    coords = connection.route.map((p) => [p.lng, p.lat]);
  } else if (nodes) {
    const s = nodes.find((n) => n.id === connection.sourceNodeId);
    const t = nodes.find((n) => n.id === connection.targetNodeId);
    if (s && t)
      coords = [
        [s.position.lng, s.position.lat],
        [t.position.lng, t.position.lat],
      ];
  }

  if (coords.length < 2) return null;

  return {
    type: "Feature",
    geometry: { type: "LineString", coordinates: coords },
    properties: {
      ...connection,
      type: String(connection.type),
      status: String(connection.status),
    },
  };
};
