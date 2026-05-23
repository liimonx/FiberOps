import type { LayerSpecification } from "mapbox-gl";
import {
  MAP_COLORS,
  MAP_TRANSITION_MS,
  MAP_TRANSITION_SLOW_MS,
  ZOOM_CONNECTION_GLOW_MIN,
  ZOOM_NODE_GLOW_MIN,
  ZOOM_NODES_3D_MIN,
} from "./constants";
import {
  CONNECTION_CASING_OPACITY,
  CONNECTION_GLOW_OPACITY,
  CONNECTION_LINE_EMISSIVE,
  CONNECTION_LINE_OPACITY,
  HOVER_EXPRESSION,
  LINE_COLOR,
  NODE_FILL,
  NODE_LAYER_OPACITY,
  NODE_STATUS_GLOW_OPACITY,
  hoverCase,
  lineWidthStops,
  nodeCircleRadius,
  zoomInterpolate,
} from "./expressions";

const LINE_LAYOUT = { "line-cap": "round" as const, "line-join": "round" as const };
const transition = (duration = MAP_TRANSITION_MS) => ({ duration });

/** Overview: small markers; mid zoom: readable; pre-3D handoff: full size. */
const NODE_RADIUS_MAIN = nodeCircleRadius([1.5, 4, 7], [1.2, 3.5, 6], [0.8, 1.8, 2.8]);
const NODE_RADIUS_GLOW = nodeCircleRadius([2.5, 6, 10], [2, 5, 8], [1.2, 2.5, 4]);

/** Thinner at city scale; slightly heavier at street/3D zoom for pitched views. */
const LINE_WIDTH_MAIN = lineWidthStops([
  [5, 0.5, 1],
  [9, 0.9, 1.6],
  [12, 1.6, 2.8],
  [14, 2.2, 3.8],
  [16, 2.8, 4.5],
]);

const LINE_WIDTH_GLOW = lineWidthStops([
  [5, 1, 1.6],
  [9, 1.6, 2.4],
  [12, 2.4, 3.6],
  [14, 3.2, 4.8],
  [16, 4, 6],
]);

const LINE_WIDTH_CASING = lineWidthStops([
  [5, 1.2, 1.8],
  [9, 2, 3],
  [12, 3, 4.5],
  [14, 4, 6],
]);

export const CUSTOM_LAYERS: Record<string, LayerSpecification> = {
  nodesGlow: {
    id: "network-nodes-glow",
    type: "circle",
    source: "network-nodes",
    minzoom: ZOOM_NODE_GLOW_MIN,
    maxzoom: ZOOM_NODES_3D_MIN,
    paint: {
      "circle-radius": NODE_RADIUS_GLOW,
      "circle-color": [
        "case",
        HOVER_EXPRESSION,
        MAP_COLORS.interaction.hover,
        ["==", ["get", "status"], "error"],
        MAP_COLORS.status.error,
        ["==", ["get", "status"], "warning"],
        MAP_COLORS.status.warning,
        ["==", ["get", "status"], "degraded"],
        MAP_COLORS.status.degraded,
        "transparent",
      ],
      "circle-opacity": NODE_STATUS_GLOW_OPACITY,
      "circle-blur": zoomInterpolate([9, 0.4], [12, 0.8], [14, 1]),
      "circle-opacity-transition": transition(),
      "circle-color-transition": transition(),
      "circle-radius-transition": transition(),
    },
  },

  nodes: {
    id: "network-nodes-layer",
    type: "circle",
    source: "network-nodes",
    maxzoom: ZOOM_NODES_3D_MIN,
    paint: {
      "circle-radius": NODE_RADIUS_MAIN,
      "circle-color": hoverCase(MAP_COLORS.interaction.hover, NODE_FILL),
      "circle-opacity": NODE_LAYER_OPACITY,
      "circle-stroke-width": zoomInterpolate([5, 0.25], [10, 0.6], [13, 1.2]),
      "circle-stroke-color": MAP_COLORS.surface.casing,
      "circle-stroke-opacity": zoomInterpolate([5, 0.5], [10, 0.75], [13, 1]),
      "circle-color-transition": transition(),
      "circle-stroke-color-transition": transition(),
      "circle-radius-transition": transition(),
    },
  },

  connectionCasing: {
    id: "network-connections-casing",
    type: "line",
    source: "network-connections",
    layout: LINE_LAYOUT,
    paint: {
      "line-width": LINE_WIDTH_CASING,
      "line-color": MAP_COLORS.surface.casing,
      "line-opacity": CONNECTION_CASING_OPACITY,
      "line-blur": zoomInterpolate([5, 0.2], [10, 0.5], [13, 0.8]),
      "line-opacity-transition": transition(),
      "line-width-transition": transition(),
    },
  },

  connectionsGlow: {
    id: "network-connections-glow",
    type: "line",
    source: "network-connections",
    minzoom: ZOOM_CONNECTION_GLOW_MIN,
    layout: LINE_LAYOUT,
    paint: {
      "line-width": LINE_WIDTH_GLOW,
      "line-color": hoverCase(MAP_COLORS.interaction.hover, LINE_COLOR),
      "line-opacity": CONNECTION_GLOW_OPACITY,
      "line-emissive-strength": CONNECTION_LINE_EMISSIVE,
      "line-blur": zoomInterpolate([10, 0.5], [12, 1.5], [14, 2], [16, 1.2]),
      "line-width-transition": transition(),
      "line-opacity-transition": transition(),
    },
  },

  connections: {
    id: "network-connections-layer",
    type: "line",
    source: "network-connections",
    layout: LINE_LAYOUT,
    paint: {
      "line-width": LINE_WIDTH_MAIN,
      "line-color": hoverCase(MAP_COLORS.interaction.hover, LINE_COLOR),
      "line-opacity": CONNECTION_LINE_OPACITY,
      "line-emissive-strength": CONNECTION_LINE_EMISSIVE,
      "line-dasharray": [
        "case",
        ["==", ["get", "status"], "inactive"],
        ["literal", [2, 2]],
        ["==", ["get", "type"], "customer_connection"],
        ["literal", [3, 2]],
        ["==", ["get", "status"], "warning"],
        ["literal", [5, 2]],
        ["==", ["get", "status"], "degraded"],
        ["literal", [4, 2]],
        ["literal", [1, 0]],
      ],
      "line-color-transition": transition(),
      "line-width-transition": transition(),
      "line-opacity-transition": transition(),
    },
  },

  outagesGlow: {
    id: "network-outages-glow",
    type: "line",
    source: "network-outages",
    layout: LINE_LAYOUT,
    paint: {
      "line-width": lineWidthStops([
        [5, 2.5, 2.5],
        [10, 4, 4],
        [15, 6, 6],
      ]),
      "line-color": MAP_COLORS.status.error,
      "line-opacity": zoomInterpolate([5, 0.12], [10, 0.2], [14, 0.3]),
      "line-blur": zoomInterpolate([5, 1], [10, 2], [14, 3]),
      "line-opacity-transition": transition(MAP_TRANSITION_SLOW_MS),
    },
  },

  outages: {
    id: "network-outages-layer",
    type: "line",
    source: "network-outages",
    layout: LINE_LAYOUT,
    paint: {
      "line-width": ["interpolate", ["linear"], ["zoom"], 10, 0.6, 15, 0.9, 18, 1.2],
      "line-color": MAP_COLORS.surface.outage,
      "line-opacity": zoomInterpolate([10, 0.7], [14, 0.9]),
      "line-dasharray": [3, 2],
      "line-width-transition": transition(),
    },
  },

  coverage: {
    id: "network-coverage-layer",
    type: "fill",
    source: "network-coverage",
    paint: {
      "fill-color": MAP_COLORS.surface.coverage,
      "fill-opacity": ["interpolate", ["linear"], ["zoom"], 5, 0.03, 12, 0.07, 16, 0.12],
      "fill-outline-color": MAP_COLORS.surface.coverageOutline,
      "fill-opacity-transition": transition(MAP_TRANSITION_SLOW_MS),
    },
  },

  nodes3D: {
    id: "network-nodes-3d-layer",
    type: "fill-extrusion",
    source: "network-nodes-3d",
    minzoom: ZOOM_NODES_3D_MIN,
    paint: {
      "fill-extrusion-color": hoverCase(MAP_COLORS.interaction.hover, NODE_FILL),
      "fill-extrusion-height": ["get", "height"],
      "fill-extrusion-base": ["get", "min_height"],
      "fill-extrusion-opacity": 0.92,
      "fill-extrusion-color-transition": transition(),
      "fill-extrusion-height-transition": transition(),
      "fill-extrusion-base-transition": transition(),
    },
  },

};

export const LAYER_STACK: LayerSpecification[] = [
  CUSTOM_LAYERS.coverage,
  CUSTOM_LAYERS.connectionCasing,
  CUSTOM_LAYERS.connectionsGlow,
  CUSTOM_LAYERS.connections,
  CUSTOM_LAYERS.outagesGlow,
  CUSTOM_LAYERS.outages,
  CUSTOM_LAYERS.nodesGlow,
  CUSTOM_LAYERS.nodes,
  CUSTOM_LAYERS.nodes3D,
];
