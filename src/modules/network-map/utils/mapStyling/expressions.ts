import type { ExpressionSpecification } from "mapbox-gl";
import { ConnectionType, NetworkNodeType } from "../../types";
import { MAP_COLORS } from "./constants";

const HOVER: ExpressionSpecification = ["boolean", ["feature-state", "hover"], false];
const STATUS = (value: string): ExpressionSpecification => ["==", ["get", "status"], value];
const TYPE = (value: string): ExpressionSpecification => ["==", ["get", "type"], value];

/** Build a Mapbox `match` on node `type` from enum-keyed values. */
export function matchNodeType(
  values: Record<NetworkNodeType, string | number>,
  fallback: string | number
): ExpressionSpecification {
  const pairs = Object.values(NetworkNodeType).flatMap((nodeType) => [
    nodeType,
    values[nodeType],
  ]);
  return ["match", ["get", "type"], ...pairs, fallback];
}

export function hoverCase<T extends string | number>(
  hovered: T,
  otherwise: ExpressionSpecification
): ExpressionSpecification {
  return ["case", HOVER, hovered, otherwise];
}

const NODE_FILL_BY_TYPE = matchNodeType(MAP_COLORS.node, "#94a3b8");

export const NODE_FILL: ExpressionSpecification = [
  "case",
  STATUS("inactive"),
  MAP_COLORS.status.inactive,
  STATUS("error"),
  [
    "match",
    ["get", "type"],
    NetworkNodeType.CUSTOMER,
    MAP_COLORS.status.customerError,
    MAP_COLORS.status.error,
  ],
  STATUS("warning"),
  [
    "match",
    ["get", "type"],
    NetworkNodeType.CORE_NODE,
    MAP_COLORS.status.warning,
    NetworkNodeType.POP,
    MAP_COLORS.status.warning,
    MAP_COLORS.status.distributionWarning,
  ],
  STATUS("degraded"),
  MAP_COLORS.status.degraded,
  NODE_FILL_BY_TYPE,
];

export const LINE_COLOR: ExpressionSpecification = [
  "case",
  STATUS("inactive"),
  MAP_COLORS.status.inactive,
  STATUS("error"),
  MAP_COLORS.status.error,
  STATUS("warning"),
  MAP_COLORS.status.warning,
  STATUS("degraded"),
  MAP_COLORS.status.degraded,
  [
    "match",
    ["get", "type"],
    ConnectionType.FIBER_ROUTE,
    MAP_COLORS.connection.fiber_route,
    ConnectionType.CUSTOMER_CONNECTION,
    MAP_COLORS.connection.customer_connection,
    "#94a3b8",
  ],
];

/** Zoom-interpolated circle radius with tiered core/pop sizing. */
export function nodeCircleRadius(
  core: [number, number, number],
  pop: [number, number, number],
  defaultRadius: [number, number, number]
): ExpressionSpecification {
  return [
    "interpolate",
    ["linear"],
    ["zoom"],
    5,
    ["case", TYPE(NetworkNodeType.CORE_NODE), core[0], defaultRadius[0]],
    12,
    [
      "case",
      TYPE(NetworkNodeType.CORE_NODE),
      core[1],
      TYPE(NetworkNodeType.POP),
      pop[1],
      defaultRadius[1],
    ],
    18,
    [
      "case",
      TYPE(NetworkNodeType.CORE_NODE),
      core[2],
      TYPE(NetworkNodeType.POP),
      pop[2],
      defaultRadius[2],
    ],
  ];
}

/** Zoom-interpolated line width with hover boost. */
export function lineWidthStops(
  stops: [zoom: number, base: number, hover: number][]
): ExpressionSpecification {
  const expr: ExpressionSpecification = ["interpolate", ["linear"], ["zoom"]];
  for (const [zoom, base, hover] of stops) {
    expr.push(zoom, ["case", HOVER, hover, base]);
  }
  return expr;
}

/**
 * Top-level zoom interpolate (required by Mapbox — `zoom` cannot sit inside `case`).
 * Each stop: [zoom, valueWhenNotHovered, valueWhenHovered?]
 */
export function zoomInterpolate(
  ...stops: [zoom: number, value: number, hoverValue?: number][]
): ExpressionSpecification {
  return [
    "interpolate",
    ["linear"],
    ["zoom"],
    ...stops.flatMap(([zoom, value, hoverValue]) => [
      zoom,
      hoverValue !== undefined
        ? (["case", HOVER, hoverValue, value] as ExpressionSpecification)
        : value,
    ]),
  ];
}

const lineOpacityAtZoom = (
  customerOpacity: number,
  fiberOpacity: number,
  hoverOpacity = 0.95
): ExpressionSpecification => [
  "case",
  HOVER,
  hoverOpacity,
  ["==", ["get", "type"], ConnectionType.CUSTOMER_CONNECTION],
  customerOpacity,
  fiberOpacity,
];

/** Line opacity: dim trunk at overview; customer drops fade in from z11. */
export const CONNECTION_LINE_OPACITY: ExpressionSpecification = [
  "interpolate",
  ["linear"],
  ["zoom"],
  5,
  lineOpacityAtZoom(0, 0.3),
  9,
  lineOpacityAtZoom(0, 0.42),
  11,
  lineOpacityAtZoom(0.42, 0.5),
  12,
  lineOpacityAtZoom(0.55, 0.65),
  13,
  lineOpacityAtZoom(0.68, 0.75),
  14,
  lineOpacityAtZoom(0.68, 0.85),
];

export const CONNECTION_GLOW_OPACITY: ExpressionSpecification = zoomInterpolate(
  [5, 0.04],
  [9, 0.08],
  [12, 0.18],
  [14, 0.28]
);

export const CONNECTION_CASING_OPACITY: ExpressionSpecification = zoomInterpolate(
  [5, 0.35, 0.7],
  [10, 0.45, 0.7],
  [13, 0.6, 0.7]
);

/** Readable on dark basemaps when the map is pitched (no terrain / sea elevation). */
export const CONNECTION_LINE_EMISSIVE: ExpressionSpecification = zoomInterpolate(
  [12, 0.15],
  [14, 0.28],
  [16, 0.42]
);

export const NODE_LAYER_OPACITY: ExpressionSpecification = zoomInterpolate(
  [5, 0.72, 1],
  [10, 0.88, 1],
  [13, 1, 1]
);

/** Node status glow — zoom at top level, status/hover in each stop. */
export const NODE_STATUS_GLOW_OPACITY: ExpressionSpecification = [
  "interpolate",
  ["linear"],
  ["zoom"],
  5,
  [
    "case",
    HOVER,
    0.65,
    STATUS("error"),
    0.35,
    STATUS("warning"),
    0.25,
    STATUS("degraded"),
    0.2,
    0,
  ],
  10,
  [
    "case",
    HOVER,
    0.65,
    STATUS("error"),
    0.45,
    STATUS("warning"),
    0.35,
    STATUS("degraded"),
    0.28,
    0,
  ],
  13,
  [
    "case",
    HOVER,
    0.65,
    STATUS("error"),
    0.55,
    STATUS("warning"),
    0.45,
    STATUS("degraded"),
    0.38,
    0,
  ],
];

export { HOVER as HOVER_EXPRESSION };
