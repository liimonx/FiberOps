import { NetworkNodeType } from "../../types";
import type { NetworkConnection, NetworkNode } from "../../types";
import {
  CONNECTION_ANCHORS,
  DEFAULT_FOOTPRINT_RADIUS,
  NODE_FOOTPRINT_RADIUS,
  NODE_HEIGHTS,
  POLE_CROSSARM_ELEVATION,
} from "./constants";
import { extrusionPart, rectRing, resolveNodes } from "./geometryHelpers";

const node3DCache = new Map<string, GeoJSON.Feature[]>();

export const clearGeometryCaches = () => {
  node3DCache.clear();
};

function at(node: NetworkNode) {
  return { lng: node.position.lng, lat: node.position.lat };
}

function capPart(
  node: NetworkNode,
  suffix: string,
  halfW: number,
  halfL: number,
  top: number,
  bottom: number,
  scale = 1.1
) {
  return extrusionPart(
    node,
    `${node.id}-${suffix}`,
    rectRing(node.position.lng, node.position.lat, halfW * scale, halfL * scale),
    top,
    bottom
  );
}

function buildPop(node: NetworkNode): GeoJSON.Feature[] {
  const { lng, lat } = at(node);
  const w = 0.00028;
  const l = 0.00022;
  const h = NODE_HEIGHTS[NetworkNodeType.POP];

  const building = extrusionPart(
    node,
    node.id,
    rectRing(lng, lat, w, l),
    h
  );

  const unitSize = 0.00005;
  const unitH = h + 3;
  const units = [
    { dlng: -w * 0.5, dlat: -l * 0.4 },
    { dlng: w * 0.5, dlat: -l * 0.4 },
    { dlng: -w * 0.5, dlat: l * 0.4 },
    { dlng: w * 0.5, dlat: l * 0.4 },
  ].map((pos, i) =>
    extrusionPart(
      node,
      `${node.id}-hvac-${i}`,
      rectRing(lng, lat, unitSize, unitSize, pos),
      unitH,
      h
    )
  );

  const dockW = w * 0.38;
  const dockL = 0.00004;
  const entrance = extrusionPart(
    node,
    `${node.id}-entrance`,
    rectRing(lng, lat - l - dockL * 0.5, dockW, dockL * 0.5),
    5
  );

  return [building, ...units, entrance];
}

function buildAccessCabinet(node: NetworkNode): GeoJSON.Feature[] {
  const { lng, lat } = at(node);
  const w = 0.00007;
  const l = 0.000045;
  const h = NODE_HEIGHTS[NetworkNodeType.ACCESS_NODE];

  const cabinet = extrusionPart(node, node.id, rectRing(lng, lat, w, l), h);
  const cap = capPart(node, "cap", w, l, h + 0.35, h - 0.15);
  const plinth = extrusionPart(
    node,
    `${node.id}-plinth`,
    rectRing(lng, lat, w * 1.15, l * 1.15),
    0.5
  );

  return [cabinet, cap, plinth];
}

function buildSplitter(node: NetworkNode): GeoJSON.Feature[] {
  const { lng, lat } = at(node);
  const w = 0.00004;
  const l = 0.000035;
  const h = NODE_HEIGHTS[NetworkNodeType.SPLITTER];

  const body = extrusionPart(node, node.id, rectRing(lng, lat, w, l), h);
  const cap = capPart(node, "cap", w, l, h + 0.2, h - 0.1, 1.08);
  const port = extrusionPart(
    node,
    `${node.id}-ports`,
    rectRing(lng + w, lat, 0.000008, l * 0.45),
    h * 0.65,
    h * 0.25
  );

  return [body, cap, port];
}

function buildJunction(node: NetworkNode): GeoJSON.Feature[] {
  const { lng, lat } = at(node);
  const w = 0.000035;
  const l = 0.000018;
  const h = NODE_HEIGHTS[NetworkNodeType.JUNCTION_BOX];

  const pedestal = extrusionPart(node, node.id, rectRing(lng, lat, w, l), h);
  const cap = capPart(node, "cap", w, l, h + 0.12, h - 0.08, 1.12);

  return [pedestal, cap];
}

function buildOnu(node: NetworkNode): GeoJSON.Feature[] {
  const { lng, lat } = at(node);
  const w = 0.000025;
  const l = 0.000018;
  const h = NODE_HEIGHTS[NetworkNodeType.ONU];
  const mount = CONNECTION_ANCHORS[NetworkNodeType.ONU];

  const box = extrusionPart(node, node.id, rectRing(lng, lat, w, l), h + mount, mount);
  const conduit = extrusionPart(
    node,
    `${node.id}-conduit`,
    rectRing(lng, lat, 0.0000025, 0.0000025),
    mount,
    0
  );

  return [box, conduit];
}

function buildPole(node: NetworkNode): GeoJSON.Feature[] {
  const { lng, lat } = at(node);
  const r = 0.000008;
  const h = NODE_HEIGHTS[NetworkNodeType.POLE];

  const pole = extrusionPart(node, node.id, rectRing(lng, lat, r, r), h);

  const crossarm = (suffix: string, armW: number, armL: number, elevation: number) =>
    extrusionPart(
      node,
      `${node.id}-${suffix}`,
      rectRing(lng, lat, armW, armL),
      elevation,
      elevation - 0.25
    );

  const ca1H = POLE_CROSSARM_ELEVATION;
  const ca2H = h - 2.2;
  const crossarm1 = crossarm("ca1", 0.000055, 0.000007, ca1H);
  const crossarm2 = crossarm("ca2", 0.00004, 0.000007, ca2H);

  const insulator = (suffix: string, armW: number, armH: number, offset: number) =>
    extrusionPart(
      node,
      suffix,
      rectRing(lng + armW * offset, lat, 0.0000025, 0.0000025),
      armH + 0.25,
      armH
    );

  const insulators = [
    ...[-0.8, -0.3, 0.3, 0.8].map((o, i) =>
      insulator(`${node.id}-ins1-${i}`, 0.000055, ca1H, o)
    ),
    ...[-0.7, 0.7].map((o, i) => insulator(`${node.id}-ins2-${i}`, 0.00004, ca2H, o)),
  ];

  const transformer = extrusionPart(
    node,
    `${node.id}-trans`,
    rectRing(lng + r, lat, 0.000012, 0.000012),
    8.5,
    7.2
  );

  return [pole, crossarm1, crossarm2, ...insulators, transformer];
}

function buildCustomer(node: NetworkNode): GeoJSON.Feature[] {
  const { lng, lat } = at(node);
  const w = 0.00004;
  const l = 0.000028;
  const h = NODE_HEIGHTS[NetworkNodeType.CUSTOMER];

  const router = extrusionPart(node, node.id, rectRing(lng, lat, w, l), h);
  const antH = h + 0.18;
  const antOffset = w * 0.65;
  const antR = 0.0000018;

  const antenna = (suffix: string, sign: number) =>
    extrusionPart(
      node,
      `${node.id}-${suffix}`,
      rectRing(lng + sign * antOffset, lat - l * 0.55, antR, antR),
      antH,
      h
    );

  return [router, antenna("ant1", -1), antenna("ant2", 1)];
}

const NODE_3D_BUILDERS: Partial<
  Record<NetworkNodeType, (node: NetworkNode) => GeoJSON.Feature[]>
> = {
  [NetworkNodeType.POP]: buildPop,
  [NetworkNodeType.ACCESS_NODE]: buildAccessCabinet,
  [NetworkNodeType.SPLITTER]: buildSplitter,
  [NetworkNodeType.JUNCTION_BOX]: buildJunction,
  [NetworkNodeType.ONU]: buildOnu,
  [NetworkNodeType.POLE]: buildPole,
  [NetworkNodeType.CUSTOMER]: buildCustomer,
};

function buildDefaultFootprint(node: NetworkNode): GeoJSON.Feature[] {
  const radius = NODE_FOOTPRINT_RADIUS[node.type] ?? DEFAULT_FOOTPRINT_RADIUS;
  const height = NODE_HEIGHTS[node.type] ?? 12;
  const { lng, lat } = at(node);

  return [
    extrusionPart(node, node.id, rectRing(lng, lat, radius, radius), height),
  ];
}

function build3DNodeFeatures(node: NetworkNode): GeoJSON.Feature[] {
  const builder = NODE_3D_BUILDERS[node.type];
  return builder ? builder(node) : buildDefaultFootprint(node);
}

export const createNodeFeature = (node: NetworkNode): GeoJSON.Feature => ({
  type: "Feature",
  geometry: {
    type: "Point",
    coordinates: [node.position.lng, node.position.lat],
  },
  properties: {
    ...node,
    type: String(node.type),
    status: String(node.status),
  },
});

export const create3DNodeFeatures = (node: NetworkNode): GeoJSON.Feature[] => {
  const cacheKey = `${node.id}-${node.position.lng}-${node.position.lat}-${node.type}-${node.status}`;
  const cached = node3DCache.get(cacheKey);
  if (cached) return cached;

  const result = build3DNodeFeatures(node);
  node3DCache.set(cacheKey, result);
  return result;
};

export const createConnectionFeature = (
  connection: NetworkConnection,
  nodes?: NetworkNode[] | Map<string, NetworkNode>
): GeoJSON.Feature | null => {
  const coords = resolveConnectionCoords(connection, nodes);
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

function resolveConnectionCoords(
  connection: NetworkConnection,
  nodes?: NetworkNode[] | Map<string, NetworkNode>
): [number, number][] {
  if (connection.route?.length) {
    return connection.route.map((p) => [p.lng, p.lat]);
  }
  if (!nodes) return [];

  const lookup = resolveNodes(nodes);
  const source = lookup.get(connection.sourceNodeId);
  const target = lookup.get(connection.targetNodeId);
  if (!source || !target) return [];

  return [
    [source.position.lng, source.position.lat],
    [target.position.lng, target.position.lat],
  ];
}

