// Map styling utilities for Mapbox GL JS

import type { ExpressionSpecification, LayerSpecification } from "mapbox-gl";
import { NetworkNodeType } from "../types";
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
  core: "#00ffcc", // Emerald
  pop: "#00e5ff", // Sky Blue
  distribution: "#7e22ce", // Soft Emerald
  access: "#a855f7", // Mint
  splitter: "#f472b6", // Purple
  junction: "#fb7185", // Slate
  pole: "#475569", // Dark Slate
  onu: "#38bdf8", // Blue
  customer: "#6ee7b7", // Rose

  // Connections
  fiber_route: "#00ffcc", // Cyan
  customer_connection: "#c084fc", // Sky

  // Status
  inactive: "#334155", // Gray
  error: "#ff0055", // Red
  warning: "#ffaa00", // Amber
  selected: "#ffffff", // White
  hovered: "#00ffcc", // Amber/Yellow for high-contrast feedback

  // Backgrounds
  casing: "#020617", // Deep Navy
  coverage: "#064e3b", // Deep Emerald
} as const;

/**
 * Standard heights for 3D infrastructure (meters)
 */
export const NODE_HEIGHTS = {
  [NetworkNodeType.CORE_NODE]: 50,
  [NetworkNodeType.POP]: 40,
  [NetworkNodeType.DISTRIBUTION_NODE]: 30,
  [NetworkNodeType.ACCESS_NODE]: 4,
  [NetworkNodeType.POLE]: 20,
  [NetworkNodeType.SPLITTER]: 2,
  [NetworkNodeType.JUNCTION_BOX]: 1.5,
  [NetworkNodeType.ONU]: 3,
  [NetworkNodeType.CUSTOMER]: 0.8,
} as const;

/**
 * Vertical anchor points for cable connections (meters)
 * This ensures cables attach correctly to poles or ground boxes.
 */
export const CONNECTION_ANCHORS = {
  [NetworkNodeType.CORE_NODE]: 20,
  [NetworkNodeType.POP]: 20,
  [NetworkNodeType.DISTRIBUTION_NODE]: 15,
  [NetworkNodeType.ACCESS_NODE]: 3.5,
  [NetworkNodeType.POLE]: 19.5,
  [NetworkNodeType.SPLITTER]: 1.8,
  [NetworkNodeType.JUNCTION_BOX]: 1.2,
  [NetworkNodeType.ONU]: 2.5,
  [NetworkNodeType.CUSTOMER]: 4.0, // Reduced from 6m to look better on houses
} as const;

/* ─────────────────────────────────────────────────────────────────────────────
 * EXPRESSION BUILDERS
 * ───────────────────────────────────────────────────────────────────────────── */

/** Helper to build a node type-based match expression */
const matchNodeType = (
  values: Record<string, string | number>,
  defaultValue: string | number
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
];

export const CUSTOM_LAYERS: Record<string, LayerSpecification> = {
  /** Neon Halo for active/hovered nodes */
  nodesGlow: {
    id: "network-nodes-glow",
    type: "circle",
    source: "network-nodes",
    paint: {
      "circle-radius": [
        "interpolate",
        ["linear"],
        ["zoom"],
        5,
        ["case", ["==", ["get", "type"], "core_node"], 6, 2],
        12,
        ["case", ["==", ["get", "type"], "core_node"], 16, ["==", ["get", "type"], "pop"], 12, 4],
        18,
        ["case", ["==", ["get", "type"], "core_node"], 32, ["==", ["get", "type"], "pop"], 24, 6],
      ],
      "circle-color": [
        "case",
        ["boolean", ["feature-state", "hover"], false],
        MAP_COLORS.hovered,
        ["==", ["get", "status"], "error"],
        MAP_COLORS.error,
        ["==", ["get", "status"], "warning"],
        MAP_COLORS.warning,
        "transparent",
      ],
      "circle-opacity": [
        "case",
        ["boolean", ["feature-state", "hover"], false],
        0.8,
        ["==", ["get", "status"], "error"],
        0.6,
        ["==", ["get", "status"], "warning"],
        0.4,
        0.4,
      ],
      "circle-blur": 1.5,
      "circle-opacity-transition": { duration: 300 },
      "circle-color-transition": { duration: 300 },
    },
  },

  /** 2D Node Circles */
  nodes: {
    id: "network-nodes-layer",
    type: "circle",
    source: "network-nodes",
    paint: {
      "circle-radius": [
        "interpolate",
        ["linear"],
        ["zoom"],
        5,
        ["case", ["==", ["get", "type"], "core_node"], 3, 1],
        12,
        ["case", ["==", ["get", "type"], "core_node"], 8, ["==", ["get", "type"], "pop"], 6, 2],
        18,
        ["case", ["==", ["get", "type"], "core_node"], 16, ["==", ["get", "type"], "pop"], 12, 3],
      ],
      "circle-color": [
        "case",
        ["boolean", ["feature-state", "hover"], false],
        MAP_COLORS.hovered,
        NODE_FILL,
      ],
      "circle-stroke-width": ["interpolate", ["linear"], ["zoom"], 5, 0.5, 12, 1.5, 18, 2.5],
      "circle-stroke-color": MAP_COLORS.casing,
      "circle-color-transition": { duration: 300 },
      "circle-stroke-color-transition": { duration: 300 },
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
        ["case", ["boolean", ["feature-state", "hover"], false], 5.0, 3.5],
        10,
        ["case", ["boolean", ["feature-state", "hover"], false], 8.0, 5.0],
        15,
        ["case", ["boolean", ["feature-state", "hover"], false], 12.0, 7.5],
      ],
      "line-color": MAP_COLORS.casing,
      "line-opacity": ["case", ["boolean", ["feature-state", "hover"], false], 0.9, 0.7],
      "line-blur": ["case", ["boolean", ["feature-state", "hover"], false], 2.0, 1.0],
      "line-opacity-transition": { duration: 300 },
      "line-width-transition": { duration: 300 },
    },
  },

  /** Neon glow for connections */
  connectionsGlow: {
    id: "network-connections-glow",
    type: "line",
    source: "network-connections",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-width": [
        "interpolate",
        ["linear"],
        ["zoom"],
        5,
        ["case", ["boolean", ["feature-state", "hover"], false], 4.5, 2.5],
        10,
        ["case", ["boolean", ["feature-state", "hover"], false], 6.5, 4.0],
        15,
        ["case", ["boolean", ["feature-state", "hover"], false], 8.5, 5.5],
      ],
      "line-color": MAP_COLORS.fiber_route,
      "line-opacity": 0.6,
      "line-blur": 4,
      "line-width-transition": { duration: 300 },
      "line-opacity-transition": { duration: 300 },
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
        ["linear"],
        ["zoom"],
        5,
        ["case", ["boolean", ["feature-state", "hover"], false], 3.0, 1.5],
        10,
        ["case", ["boolean", ["feature-state", "hover"], false], 4.5, 2.5],
        15,
        ["case", ["boolean", ["feature-state", "hover"], false], 6.0, 3.5],
      ],
      "line-color": [
        "case",
        ["boolean", ["feature-state", "hover"], false],
        MAP_COLORS.hovered,
        LINE_COLOR,
      ],
      "line-opacity": ["case", ["boolean", ["feature-state", "hover"], false], 1, 0.8],
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
      "line-color-transition": { duration: 300 },
      "line-width-transition": { duration: 300 },
      "line-opacity-transition": { duration: 300 },
    },
  },

  /** Neon Node Halo Layer */
  nodesGlow: {
    id: "network-nodes-glow",
    type: "circle",
    source: "network-nodes",
    paint: {
      "circle-radius": [
        "interpolate",
        ["linear"],
        ["zoom"],
        5,
        2,
        12,
        8,
        18,
        32,
      ],
      "circle-blur": 0.8,
      "circle-color": [
        "case",
        ["boolean", ["feature-state", "hover"], false],
        MAP_COLORS.hovered,
        ["==", ["get", "status"], "error"],
        MAP_COLORS.error,
        ["==", ["get", "status"], "warning"],
        MAP_COLORS.warning,
        "transparent"
      ],
      "circle-opacity": [
        "case",
        ["boolean", ["feature-state", "hover"], false],
        0.8,
        ["==", ["get", "status"], "error"],
        0.6,
        ["==", ["get", "status"], "warning"],
        0.6,
        0
      ],
      "circle-opacity-transition": { duration: 300 },
      "circle-color-transition": { duration: 300 },
      "circle-radius-transition": { duration: 300 },
    },
  },

  /** 2D Circle Nodes Layer */
  nodes: {
    id: "network-nodes-layer",
    type: "circle",
    source: "network-nodes",
    paint: {
      "circle-radius": [
        "interpolate",
        ["linear"],
        ["zoom"],
        5,
        1,
        12,
        4,
        18,
        16,
      ],
      "circle-color": [
        "case",
        ["boolean", ["feature-state", "hover"], false],
        MAP_COLORS.hovered,
        NODE_FILL
      ],
      "circle-stroke-width": 1.5,
      "circle-stroke-color": MAP_COLORS.casing,
      "circle-color-transition": { duration: 300 },
      "circle-radius-transition": { duration: 300 },
    },
  },

  /** Glowing corridor for outage identification */
  outagesGlow: {
    id: "network-outages-glow",
    type: "line",
    source: "network-outages",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-width": ["interpolate", ["linear"], ["zoom"], 5, 4, 10, 6, 15, 10],
      "line-color": MAP_COLORS.error,
      "line-opacity": 0.35,
      "line-blur": 5,
      "line-opacity-transition": { duration: 500 },
    },
  },

  /** Distinctive dashed lines for outages */
  outages: {
    id: "network-outages-layer",
    type: "line",
    source: "network-outages",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-width": ["interpolate", ["linear"], ["zoom"], 10, 0.8, 15, 1.0, 18, 1.5],
      "line-color": "#f87171",
      "line-opacity": 1,
      "line-dasharray": [3, 2],
      "line-width-transition": { duration: 300 },
    },
  },

  /** Coverage/Regional availability areas */
  coverage: {
    id: "network-coverage-layer",
    type: "fill",
    source: "network-coverage",
    paint: {
      "fill-color": MAP_COLORS.coverage,
      "fill-opacity": ["interpolate", ["linear"], ["zoom"], 5, 0.08, 12, 0.12, 16, 0.18],
      "fill-outline-color": "rgba(110, 231, 183, 0.4)",
      "fill-opacity-transition": { duration: 500 },
    },
  },

  /** 3D Extruded Blocks for Nodes */
  nodes3D: {
    id: "network-nodes-3d-layer",
    type: "fill-extrusion",
    source: "network-nodes-3d",
    paint: {
      "fill-extrusion-color": [
        "case",
        ["boolean", ["feature-state", "hover"], false],
        MAP_COLORS.hovered,
        NODE_FILL,
      ],
      "fill-extrusion-height": ["get", "height"],
      "fill-extrusion-base": ["get", "min_height"],
      "fill-extrusion-opacity": 0.95,
      "fill-extrusion-color-transition": { duration: 300 },
      "fill-extrusion-height-transition": { duration: 300 },
      "fill-extrusion-base-transition": { duration: 300 },
    },
  },

  /** 3D Extruded Fiber Lines (Ribbons) */
  connections3D: {
    id: "network-connections-3d-layer",
    type: "fill-extrusion",
    source: "network-connections-3d",
    minzoom: 15,
    paint: {
      "fill-extrusion-color": MAP_COLORS.fiber_route,
      "fill-extrusion-height": ["get", "height"],
      "fill-extrusion-base": ["get", "min_height"],
      "fill-extrusion-opacity": 0.9,
      "fill-extrusion-opacity-transition": { duration: 500 },
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
    { id: "network-connections-3d", type: "geojson" },
    { id: "network-outages", type: "geojson" },
    { id: "network-coverage", type: "geojson" },
    { id: "network-nodes-3d", type: "geojson" },
  ];

  // Set the map background to a deep premium navy to enhance the "wow" factor
  if (map.getLayer("background")) {
    map.setPaintProperty("background", "background-color", "#020617");
  }

  // Find a label layer to insert the 3D buildings beneath it
  if (!map.isStyleLoaded()) return;
  const styleLayers = map.getStyle()?.layers || [];
  let labelLayerId: string | undefined;
  for (let i = 0; i < styleLayers.length; i++) {
    if (styleLayers[i].type === "symbol" && styleLayers[i].layout) {
      labelLayerId = styleLayers[i].id;
      break;
    }
  }

  if (!map.getLayer("3d-buildings")) {
    map.addLayer(
      {
        id: "3d-buildings",
        source: "composite",
        "source-layer": "building",
        filter: ["==", "extrude", "true"],
        type: "fill-extrusion",
        minzoom: 14,
        paint: {
          "fill-extrusion-color": "#0f172a", // Deep slate 3D buildings
          "fill-extrusion-height": [
            "interpolate",
            ["linear"],
            ["zoom"],
            14,
            0,
            14.05,
            ["get", "height"],
          ],
          "fill-extrusion-base": [
            "interpolate",
            ["linear"],
            ["zoom"],
            14,
            0,
            14.05,
            ["get", "min_height"],
          ],
          "fill-extrusion-opacity": 0.6,
          "fill-extrusion-color-transition": { duration: 500 },
        },
      },
      labelLayerId
    );
  }

  // Add sources
  sources.forEach((src) => {
    if (!map.getSource(src.id)) {
      map.addSource(src.id, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
    }
  });

  const layers = [
    CUSTOM_LAYERS.coverage,
    CUSTOM_LAYERS.connectionCasing,
    CUSTOM_LAYERS.connectionsGlow,
    CUSTOM_LAYERS.connections,
    CUSTOM_LAYERS.nodesGlow,
    CUSTOM_LAYERS.nodes,
    CUSTOM_LAYERS.outagesGlow,
    CUSTOM_LAYERS.nodesGlow,
    CUSTOM_LAYERS.nodes,
    CUSTOM_LAYERS.nodes3D,
    CUSTOM_LAYERS.connections3D,
    CUSTOM_LAYERS.outages,
  ];

  layers.forEach((layer) => {
    if (!map.getLayer(layer.id)) {
      // Insert all network layers beneath labels for better legibility
      map.addLayer(layer, labelLayerId);
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
    "network-nodes-3d-layer": [],
    "network-connections-layer": ["network-connections-casing", "network-connections-glow"],
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
  state: Record<string, unknown>
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

export const create3DNodeFeatures = (node: NetworkNode): GeoJSON.Feature[] => {
  let radius = 0.0001; // ~10m
  const height = NODE_HEIGHTS[node.type] || 15;

  if (node.type === NetworkNodeType.CORE_NODE) {
    radius = 0.0004;
  } else if (node.type === NetworkNodeType.POP) {
    radius = 0.0003;
  } else if (node.type === NetworkNodeType.DISTRIBUTION_NODE) {
    radius = 0.0002;
  } else if (node.type === NetworkNodeType.ACCESS_NODE) {
    radius = 0.00015;
  }

  const baseFeature: GeoJSON.Feature = {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [node.position.lng - radius, node.position.lat - radius],
          [node.position.lng + radius, node.position.lat - radius],
          [node.position.lng + radius, node.position.lat + radius],
          [node.position.lng - radius, node.position.lat + radius],
          [node.position.lng - radius, node.position.lat - radius],
        ],
      ],
    },
    properties: {
      ...node,
      type: String(node.type),
      status: String(node.status),
      height,
      min_height: 0,
    },
  };

  if (node.type === NetworkNodeType.POP) {
    // Large Data Center / POP building
    const w = 0.0003; // width
    const l = 0.00025; // length
    const h = 40;

    baseFeature.geometry = {
      type: "Polygon",
      coordinates: [
        [
          [node.position.lng - w, node.position.lat - l],
          [node.position.lng + w, node.position.lat - l],
          [node.position.lng + w, node.position.lat + l],
          [node.position.lng - w, node.position.lat + l],
          [node.position.lng - w, node.position.lat - l],
        ],
      ],
    };
    if (baseFeature.properties) {
      baseFeature.properties.height = h;
    }

    // Cooling units on roof
    const unitSize = 0.00006;
    const unitH = h + 4;
    const units: GeoJSON.Feature[] = [];

    const unitPositions = [
      { dlng: -w * 0.5, dlat: -l * 0.4 },
      { dlng: w * 0.5, dlat: -l * 0.4 },
      { dlng: -w * 0.5, dlat: l * 0.4 },
      { dlng: w * 0.5, dlat: l * 0.4 },
    ];

    unitPositions.forEach((pos, i) => {
      units.push({
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [
                node.position.lng + pos.dlng - unitSize,
                node.position.lat + pos.dlat - unitSize,
              ],
              [
                node.position.lng + pos.dlng + unitSize,
                node.position.lat + pos.dlat - unitSize,
              ],
              [
                node.position.lng + pos.dlng + unitSize,
                node.position.lat + pos.dlat + unitSize,
              ],
              [
                node.position.lng + pos.dlng - unitSize,
                node.position.lat + pos.dlat + unitSize,
              ],
              [
                node.position.lng + pos.dlng - unitSize,
                node.position.lat + pos.dlat - unitSize,
              ],
            ],
          ],
        },
        properties: {
          ...node,
          id: `${node.id}-hvac-${i}`,
          type: String(node.type),
          status: String(node.status),
          height: unitH,
          min_height: h,
        },
      });
    });

    // Front entrance / loading dock area
    const dockW = w * 0.4;
    const dockL = 0.00005;
    const dockH = 6;
    const entrance: GeoJSON.Feature = {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [node.position.lng - dockW, node.position.lat - l - dockL],
            [node.position.lng + dockW, node.position.lat - l - dockL],
            [node.position.lng + dockW, node.position.lat - l],
            [node.position.lng - dockW, node.position.lat - l],
            [node.position.lng - dockW, node.position.lat - l - dockL],
          ],
        ],
      },
      properties: {
        ...node,
        id: `${node.id}-entrance`,
        type: String(node.type),
        status: String(node.status),
        height: dockH,
        min_height: 0,
      },
    };

    return [baseFeature, ...units, entrance];
  }

  if (node.type === NetworkNodeType.ACCESS_NODE) {
    // Street Cabinet (DSLAM / ODF)
    const w = 0.00008; // width
    const l = 0.00005; // depth
    const h = 4; // height (scaled for visibility)

    // Main Cabinet
    baseFeature.geometry = {
      type: "Polygon",
      coordinates: [
        [
          [node.position.lng - w, node.position.lat - l],
          [node.position.lng + w, node.position.lat - l],
          [node.position.lng + w, node.position.lat + l],
          [node.position.lng - w, node.position.lat + l],
          [node.position.lng - w, node.position.lat - l],
        ],
      ],
    };
    if (baseFeature.properties) {
      baseFeature.properties.height = h;
    }

    // Top Cap (slightly wider and slanted-look)
    const capW = w * 1.1;
    const capL = l * 1.1;
    const capH = h + 0.4;
    const capMin = h - 0.2;

    const cap: GeoJSON.Feature = {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [node.position.lng - capW, node.position.lat - capL],
            [node.position.lng + capW, node.position.lat - capL],
            [node.position.lng + capW, node.position.lat + capL],
            [node.position.lng - capW, node.position.lat + capL],
            [node.position.lng - capW, node.position.lat - capL],
          ],
        ],
      },
      properties: {
        ...node,
        id: `${node.id}-cap`,
        type: String(node.type),
        status: String(node.status),
        height: capH,
        min_height: capMin,
      },
    };

    // Base Plinth
    const plinthW = w * 1.2;
    const plinthL = l * 1.2;
    const plinthH = 0.6;

    const plinth: GeoJSON.Feature = {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [node.position.lng - plinthW, node.position.lat - plinthL],
            [node.position.lng + plinthW, node.position.lat - plinthL],
            [node.position.lng + plinthW, node.position.lat + plinthL],
            [node.position.lng - plinthW, node.position.lat + plinthL],
            [node.position.lng - plinthW, node.position.lat - plinthL],
          ],
        ],
      },
      properties: {
        ...node,
        id: `${node.id}-plinth`,
        type: String(node.type),
        status: String(node.status),
        height: plinthH,
        min_height: 0,
      },
    };

    return [baseFeature, cap, plinth];
  }

  if (node.type === NetworkNodeType.SPLITTER) {
    // Splitter: Compact rugged box
    const w = 0.00005;
    const l = 0.00005;
    const h = 2;

    baseFeature.geometry = {
      type: "Polygon",
      coordinates: [
        [
          [node.position.lng - w, node.position.lat - l],
          [node.position.lng + w, node.position.lat - l],
          [node.position.lng + w, node.position.lat + l],
          [node.position.lng - w, node.position.lat + l],
          [node.position.lng - w, node.position.lat - l],
        ],
      ],
    };
    if (baseFeature.properties) {
      baseFeature.properties.height = h;
    }

    // Splitter Cap
    const capH = h + 0.3;
    const capMin = h - 0.2;
    const capFeature: GeoJSON.Feature = {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [node.position.lng - w * 1.1, node.position.lat - l * 1.1],
            [node.position.lng + w * 1.1, node.position.lat - l * 1.1],
            [node.position.lng + w * 1.1, node.position.lat + l * 1.1],
            [node.position.lng - w * 1.1, node.position.lat + l * 1.1],
            [node.position.lng - w * 1.1, node.position.lat - l * 1.1],
          ],
        ],
      },
      properties: {
        ...node,
        id: `${node.id}-cap`,
        type: String(node.type),
        status: String(node.status),
        height: capH,
        min_height: capMin,
      },
    };

    // Ports / Connections side detail
    const portW = 0.00001;
    const portL = 0.00002;
    const portH = h * 0.6;
    const portMin = h * 0.2;

    const port: GeoJSON.Feature = {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [node.position.lng + w, node.position.lat - l * 0.5],
            [node.position.lng + w + portL, node.position.lat - l * 0.5],
            [node.position.lng + w + portL, node.position.lat + l * 0.5],
            [node.position.lng + w, node.position.lat + l * 0.5],
            [node.position.lng + w, node.position.lat - l * 0.5],
          ],
        ],
      },
      properties: {
        ...node,
        id: `${node.id}-ports`,
        type: String(node.type),
        status: String(node.status),
        height: portH,
        min_height: portMin,
      },
    };

    return [baseFeature, capFeature, port];
  }

  if (node.type === NetworkNodeType.JUNCTION_BOX) {
    // Ground-mounted telecom pedestal / junction box
    const w = 0.00004; // width
    const l = 0.00002; // length (depth)
    const h = 1.5; // 1.5 meters tall

    baseFeature.geometry = {
      type: "Polygon",
      coordinates: [
        [
          [node.position.lng - w, node.position.lat - l],
          [node.position.lng + w, node.position.lat - l],
          [node.position.lng + w, node.position.lat + l],
          [node.position.lng - w, node.position.lat + l],
          [node.position.lng - w, node.position.lat - l],
        ],
      ],
    };
    if (baseFeature.properties) {
      baseFeature.properties.height = h;
    }

    // Small raised "lid" or cap on top
    const capW = 0.000045; // slightly wider cap
    const capL = 0.000025;
    const capH = 1.6;
    const capMin = 1.4;

    const capFeature: GeoJSON.Feature = {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [node.position.lng - capW, node.position.lat - capL],
            [node.position.lng + capW, node.position.lat - capL],
            [node.position.lng + capW, node.position.lat + capL],
            [node.position.lng - capW, node.position.lat + capL],
            [node.position.lng - capW, node.position.lat - capL],
          ],
        ],
      },
      properties: {
        ...node,
        id: `${node.id}-cap`,
        type: String(node.type),
        status: String(node.status),
        height: capH,
        min_height: capMin,
      },
    };

    return [baseFeature, capFeature];
  }

  if (node.type === NetworkNodeType.ONU) {
    // ONU: Small wall-mounted or side-mounted box, floating slightly off the ground
    const w = 0.00003; // increased width
    const l = 0.00002; // increased depth
    const h = 3.0; // taller
    const minH = 1.8; // higher base

    baseFeature.geometry = {
      type: "Polygon",
      coordinates: [
        [
          [node.position.lng - w, node.position.lat - l],
          [node.position.lng + w, node.position.lat - l],
          [node.position.lng + w, node.position.lat + l],
          [node.position.lng - w, node.position.lat + l],
          [node.position.lng - w, node.position.lat - l],
        ],
      ],
    };
    if (baseFeature.properties) {
      baseFeature.properties.height = h;
      baseFeature.properties.min_height = minH;
    }

    // Conduit / wire going from the ONU down to the ground
    const wireRadius = 0.000003;
    const wireFeature: GeoJSON.Feature = {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [node.position.lng - wireRadius, node.position.lat - wireRadius],
            [node.position.lng + wireRadius, node.position.lat - wireRadius],
            [node.position.lng + wireRadius, node.position.lat + wireRadius],
            [node.position.lng - wireRadius, node.position.lat + wireRadius],
            [node.position.lng - wireRadius, node.position.lat - wireRadius],
          ],
        ],
      },
      properties: {
        ...node,
        id: `${node.id}-wire`,
        type: String(node.type),
        status: String(node.status),
        height: minH,
        min_height: 0,
      },
    };

    return [baseFeature, wireFeature];
  }

  if (node.type === NetworkNodeType.POLE) {
    // Utility pole: realistic proportions
    const poleRadius = 0.00001; // Thinner pole, still visible
    const poleHeight = 20; // 20m tall

    // Main Pole Body
    baseFeature.geometry = {
      type: "Polygon",
      coordinates: [
        [
          [node.position.lng - poleRadius, node.position.lat - poleRadius],
          [node.position.lng + poleRadius, node.position.lat - poleRadius],
          [node.position.lng + poleRadius, node.position.lat + poleRadius],
          [node.position.lng - poleRadius, node.position.lat + poleRadius],
          [node.position.lng - poleRadius, node.position.lat - poleRadius],
        ],
      ],
    };
    if (baseFeature.properties) {
      baseFeature.properties.height = poleHeight;
      baseFeature.properties.min_height = 0;
    }

    // Top Crossarm (larger, primary wires)
    const ca1W = 0.00006; // Length
    const ca1L = 0.000008; // Width
    const ca1H = poleHeight - 0.5;
    const ca1Min = ca1H - 0.3;

    const crossarm1: GeoJSON.Feature = {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [node.position.lng - ca1W, node.position.lat - ca1L],
            [node.position.lng + ca1W, node.position.lat - ca1L],
            [node.position.lng + ca1W, node.position.lat + ca1L],
            [node.position.lng - ca1W, node.position.lat + ca1L],
            [node.position.lng - ca1W, node.position.lat - ca1L],
          ],
        ],
      },
      properties: {
        ...node,
        id: `${node.id}-ca1`,
        type: String(node.type),
        status: String(node.status),
        height: ca1H,
        min_height: ca1Min,
      },
    };

    // Secondary Crossarm (lower, secondary/fiber)
    const ca2W = 0.000045;
    const ca2L = ca1L;
    const ca2H = poleHeight - 2.5;
    const ca2Min = ca2H - 0.3;

    const crossarm2: GeoJSON.Feature = {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [node.position.lng - ca2W, node.position.lat - ca2L],
            [node.position.lng + ca2W, node.position.lat - ca2L],
            [node.position.lng + ca2W, node.position.lat + ca2L],
            [node.position.lng - ca2W, node.position.lat + ca2L],
            [node.position.lng - ca2W, node.position.lat - ca2L],
          ],
        ],
      },
      properties: {
        ...node,
        id: `${node.id}-ca2`,
        type: String(node.type),
        status: String(node.status),
        height: ca2H,
        min_height: ca2Min,
      },
    };

    // Insulators on crossarms
    const insulators: GeoJSON.Feature[] = [];
    const insRadius = 0.000003;

    // Insulators on Top Crossarm
    [-0.8, -0.3, 0.3, 0.8].forEach((offset, i) => {
      insulators.push({
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [
                node.position.lng + ca1W * offset - insRadius,
                node.position.lat - insRadius,
              ],
              [
                node.position.lng + ca1W * offset + insRadius,
                node.position.lat - insRadius,
              ],
              [
                node.position.lng + ca1W * offset + insRadius,
                node.position.lat + insRadius,
              ],
              [
                node.position.lng + ca1W * offset - insRadius,
                node.position.lat + insRadius,
              ],
              [
                node.position.lng + ca1W * offset - insRadius,
                node.position.lat - insRadius,
              ],
            ],
          ],
        },
        properties: {
          ...node,
          id: `${node.id}-ins1-${i}`,
          type: String(node.type),
          status: String(node.status),
          height: ca1H + 0.4,
          min_height: ca1H,
        },
      });
    });

    // Insulators on Second Crossarm
    [-0.7, 0.7].forEach((offset, i) => {
      insulators.push({
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [
                node.position.lng + ca2W * offset - insRadius,
                node.position.lat - insRadius,
              ],
              [
                node.position.lng + ca2W * offset + insRadius,
                node.position.lat - insRadius,
              ],
              [
                node.position.lng + ca2W * offset + insRadius,
                node.position.lat + insRadius,
              ],
              [
                node.position.lng + ca2W * offset - insRadius,
                node.position.lat + insRadius,
              ],
              [
                node.position.lng + ca2W * offset - insRadius,
                node.position.lat - insRadius,
              ],
            ],
          ],
        },
        properties: {
          ...node,
          id: `${node.id}-ins2-${i}`,
          type: String(node.type),
          status: String(node.status),
          height: ca2H + 0.3,
          min_height: ca2H,
        },
      });
    });

    // Transformer (Side-mounted cylinder/box)
    const transW = 0.000015;
    const transL = 0.000015;
    const transH = 15.5;
    const transMin = 13.5;

    const transformer: GeoJSON.Feature = {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [node.position.lng + poleRadius, node.position.lat - transL],
            [node.position.lng + poleRadius + transW, node.position.lat - transL],
            [node.position.lng + poleRadius + transW, node.position.lat + transL],
            [node.position.lng + poleRadius, node.position.lat + transL],
            [node.position.lng + poleRadius, node.position.lat - transL],
          ],
        ],
      },
      properties: {
        ...node,
        id: `${node.id}-trans`,
        type: String(node.type),
        status: String(node.status),
        height: transH,
        min_height: transMin,
      },
    };

    return [baseFeature, crossarm1, crossarm2, ...insulators, transformer];
  }

  if (node.type === NetworkNodeType.CUSTOMER) {
    // WiFi Router: flat box base with two small antennas
    const w = 0.00006; // increased width
    const l = 0.00004; // increased length
    const h = 0.8; // increased height
    const minH = 0; // on ground

    baseFeature.geometry = {
      type: "Polygon",
      coordinates: [
        [
          [node.position.lng - w, node.position.lat - l],
          [node.position.lng + w, node.position.lat - l],
          [node.position.lng + w, node.position.lat + l],
          [node.position.lng - w, node.position.lat + l],
          [node.position.lng - w, node.position.lat - l],
        ],
      ],
    };
    if (baseFeature.properties) {
      baseFeature.properties.height = h;
      baseFeature.properties.min_height = minH;
    }

    // Antennas
    const antRadius = 0.000002;
    const antH = 6.0; // taller antennas for better visibility
    const antLeftOffset = w * 0.7; // near the left edge
    const antDepthOffset = l * 0.7; // near the back edge

    const antenna1: GeoJSON.Feature = {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [
              node.position.lng - antLeftOffset - antRadius,
              node.position.lat - antDepthOffset - antRadius,
            ],
            [
              node.position.lng - antLeftOffset + antRadius,
              node.position.lat - antDepthOffset - antRadius,
            ],
            [
              node.position.lng - antLeftOffset + antRadius,
              node.position.lat - antDepthOffset + antRadius,
            ],
            [
              node.position.lng - antLeftOffset - antRadius,
              node.position.lat - antDepthOffset + antRadius,
            ],
            [
              node.position.lng - antLeftOffset - antRadius,
              node.position.lat - antDepthOffset - antRadius,
            ],
          ],
        ],
      },
      properties: {
        ...node,
        id: `${node.id}-ant1`,
        type: String(node.type),
        status: String(node.status),
        height: antH,
        min_height: h,
      },
    };

    const antenna2: GeoJSON.Feature = {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [
              node.position.lng + antLeftOffset - antRadius,
              node.position.lat - antDepthOffset - antRadius,
            ],
            [
              node.position.lng + antLeftOffset + antRadius,
              node.position.lat - antDepthOffset - antRadius,
            ],
            [
              node.position.lng + antLeftOffset + antRadius,
              node.position.lat - antDepthOffset + antRadius,
            ],
            [
              node.position.lng + antLeftOffset - antRadius,
              node.position.lat - antDepthOffset + antRadius,
            ],
            [
              node.position.lng + antLeftOffset - antRadius,
              node.position.lat - antDepthOffset - antRadius,
            ],
          ],
        ],
      },
      properties: {
        ...node,
        id: `${node.id}-ant2`,
        type: String(node.type),
        status: String(node.status),
        height: antH,
        min_height: h,
      },
    };

    return [baseFeature, antenna1, antenna2];
  }

  return [baseFeature];
};

export const createConnectionFeature = (
  connection: NetworkConnection,
  nodes?: NetworkNode[] | Map<string, NetworkNode>
): GeoJSON.Feature | null => {
  let coords: [number, number][] = [];

  if (connection.route?.length) {
    coords = connection.route.map((p) => [p.lng, p.lat]);
  } else if (nodes) {
    let s: NetworkNode | undefined;
    let t: NetworkNode | undefined;

    if (nodes instanceof Map) {
      s = nodes.get(connection.sourceNodeId);
      t = nodes.get(connection.targetNodeId);
    } else {
      s = nodes.find((n) => n.id === connection.sourceNodeId);
      t = nodes.find((n) => n.id === connection.targetNodeId);
    }

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

/**
 * Creates 3D "ribbon" features for connections to give them physical depth.
 * These are thin fill-extrusions that sit at the height of the poles.
 */
export const create3DConnectionFeatures = (
  connection: NetworkConnection,
  nodes: NetworkNode[] | Map<string, NetworkNode>
): GeoJSON.Feature[] => {
  let sourceNode: NetworkNode | undefined;
  let targetNode: NetworkNode | undefined;

  if (nodes instanceof Map) {
    sourceNode = nodes.get(connection.sourceNodeId);
    targetNode = nodes.get(connection.targetNodeId);
  } else {
    sourceNode = nodes.find((n) => n.id === connection.sourceNodeId);
    targetNode = nodes.find((n) => n.id === connection.targetNodeId);
  }

  if (!sourceNode || !targetNode) return [];

  // Determine height based on equipment types
  // Standard anchor is derived from both ends to handle drops
  const sourceAnchor = CONNECTION_ANCHORS[sourceNode.type] || 19.5;
  const targetAnchor = CONNECTION_ANCHORS[targetNode.type] || 19.5;
  
  // For simplicity in a flat ribbon, we use the average or the dominant anchor
  // Overhead (poles) usually stays high, but if it goes to a ground box, it should drop
  const height = Math.min(sourceAnchor, targetAnchor);

  const coords: [number, number][] = connection.route?.length
    ? connection.route.map((p) => [p.lng, p.lat])
    : [
        [sourceNode.position.lng, sourceNode.position.lat],
        [targetNode.position.lng, targetNode.position.lat],
      ];

  if (coords.length < 2) return [];

  const features: GeoJSON.Feature[] = [];
  const width = 0.000005; // ~0.5 meters wide ribbon for visibility

  for (let i = 0; i < coords.length - 1; i++) {
    const p1 = coords[i];
    const p2 = coords[i + 1];

    const dx = p2[0] - p1[0];
    const dy = p2[1] - p1[1];
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) continue;

    const nx = (-dy / len) * width;
    const ny = (dx / len) * width;

    features.push({
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [p1[0] + nx, p1[1] + ny],
            [p2[0] + nx, p2[1] + ny],
            [p2[0] - nx, p2[1] - ny],
            [p1[0] - nx, p1[1] - ny],
            [p1[0] + nx, p1[1] + ny],
          ],
        ],
      },
      properties: {
        ...connection,
        id: `${connection.id}-3d-${i}`,
        height: height,
        min_height: height - 0.1, // thin ribbon
      },
    });
  }

  return features;
};
