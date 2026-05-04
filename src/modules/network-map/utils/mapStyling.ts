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
  core: "#00ff00", // Neon Green
  pop: "#00ffff", // Cyan
  distribution: "#00cc00", // Darker Neon Green
  access: "#33ff33", // Light Neon Green
  splitter: "#ff00ff", // Magenta
  junction: "#a3a3a3", // Light Gray
  pole: "#525252", // Dark Gray
  onu: "#0088ff", // Bright Blue
  customer: "#ff0055", // Neon Pink

  // Connections
  fiber_route: "#14b8a6", // Muted Teal
  customer_connection: "#3b82f6", // Muted Blue

  // Status
  inactive: "#333333", // Very Dark Gray
  error: "#ff0000", // Pure Red
  warning: "#ffff00", // Pure Yellow
  selected: "#ffffff", // Pure White
  hovered: "#ccff00", // Neon Yellow-Green

  // Backgrounds
  casing: "#000000", // Pure Black
  coverage: "#002200", // Very Dark Green
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
          ["match", ["get", "type"], "fiber_route", 1.5, "customer_connection", 0.8, 1],
          1,
        ],
        10,
        [
          "+",
          ["match", ["get", "type"], "fiber_route", 2.5, "customer_connection", 1.2, 1.8],
          1.5,
        ],
        15,
        [
          "+",
          ["match", ["get", "type"], "fiber_route", 4, "customer_connection", 2, 3],
          2,
        ],
      ],
      "line-color": MAP_COLORS.casing,
      "line-opacity": 0.3,
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
        ["match", ["get", "type"], "fiber_route", 0.75, "customer_connection", 0.4, 0.5],
        12,
        ["match", ["get", "type"], "fiber_route", 1.8, "customer_connection", 0.9, 1.2],
        18,
        ["match", ["get", "type"], "fiber_route", 3, "customer_connection", 1.5, 2],
      ],
      "line-color": LINE_COLOR,
      "line-opacity": 0.75,
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

  /** 3D Extruded Blocks for Nodes */
  nodes3D: {
    id: "network-nodes-3d-layer",
    type: "fill-extrusion",
    source: "network-nodes-3d",
    paint: {
      "fill-extrusion-color": NODE_FILL,
      "fill-extrusion-height": ["get", "height"],
      "fill-extrusion-base": ["get", "min_height"],
      "fill-extrusion-opacity": 0.95,
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
    { id: "network-nodes-3d", type: "geojson" },
  ];

  // Set the map background to pure black to enhance the cyberpunk look
  if (map.getLayer("background")) {
    map.setPaintProperty("background", "background-color", "#000000");
  }

  // Find a label layer to insert the 3D buildings beneath it
  const styleLayers = map.getStyle()?.layers || [];
  let labelLayerId;
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
          "fill-extrusion-color": "#0a0a0a", // Almost pitch black 3D buildings
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
          "fill-extrusion-opacity": 0.8,
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

  // Add layers in specific order for correct stacking
  const layers = [
    CUSTOM_LAYERS.coverage,
    CUSTOM_LAYERS.connectionCasing,
    CUSTOM_LAYERS.connections,
    CUSTOM_LAYERS.outagesGlow,
    CUSTOM_LAYERS.outages,
    CUSTOM_LAYERS.nodes3D,
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
    "network-nodes-3d-layer": [],
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
  let height = 15;

  if (node.type === NetworkNodeType.CORE_NODE) {
    radius = 0.0004;
    height = 50;
  } else if (node.type === NetworkNodeType.POP) {
    radius = 0.0003;
    height = 40;
  } else if (node.type === NetworkNodeType.DISTRIBUTION_NODE) {
    radius = 0.0002;
    height = 30;
  } else if (node.type === NetworkNodeType.ACCESS_NODE) {
    radius = 0.00015;
    height = 20;
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
    const w = 0.000015; // very small width
    const l = 0.00001; // very small depth
    const h = 2.0; // top at 2 meters
    const minH = 1.2; // bottom at 1.2 meters (floating)

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
    // Utility pole: make the main pole thinner
    const poleRadius = 0.00003; // ~3m
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

    // Add a crossarm near the top
    const crossarmLength = 0.00012; // ~12m
    const crossarmWidth = 0.00002; // ~2m
    const crossarmHeight = height; // 15m
    const crossarmMinHeight = height - 0.5; // 14.5m

    const crossarmFeature: GeoJSON.Feature = {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [node.position.lng - crossarmLength, node.position.lat - crossarmWidth],
            [node.position.lng + crossarmLength, node.position.lat - crossarmWidth],
            [node.position.lng + crossarmLength, node.position.lat + crossarmWidth],
            [node.position.lng - crossarmLength, node.position.lat + crossarmWidth],
            [node.position.lng - crossarmLength, node.position.lat - crossarmWidth],
          ],
        ],
      },
      properties: {
        ...node,
        id: `${node.id}-crossarm`, // distinct ID
        type: String(node.type),
        status: String(node.status),
        height: crossarmHeight,
        min_height: crossarmMinHeight,
      },
    };

    return [baseFeature, crossarmFeature];
  }

  if (node.type === NetworkNodeType.CUSTOMER) {
    // WiFi Router: flat box base with two small antennas
    const w = 0.00003; // width
    const l = 0.00002; // length (depth)
    const h = 0.5; // height (thin box)
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
    const antH = 1.5; // stick up 1.5m
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
