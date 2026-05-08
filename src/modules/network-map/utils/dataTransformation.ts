import { Asset, Customer } from "@/types/domain";
import { NetworkNode, NetworkConnection, NetworkStatus, NetworkNodeType, ConnectionType } from "../types";
import { validateData } from "./validation";
import { networkNodeSchema } from "../schemas/networkNode.schema";
import { networkConnectionSchema } from "../schemas/networkConnection.schema";
import { sanitizeSearchQuery, sanitizeMetadata } from "./sanitization";

/**
 * Transforms a domain Asset into a NetworkNode
 */
export const transformAssetToNode = (asset: Asset): NetworkNode => {
  const nodeTypeMap: Record<string, NetworkNodeType> = {
    pop: NetworkNodeType.POP,
    junction_box: NetworkNodeType.JUNCTION_BOX,
    splitter: NetworkNodeType.SPLITTER,
    onu: NetworkNodeType.ONU,
    pole: NetworkNodeType.POLE,
    fiber_route: NetworkNodeType.ACCESS_NODE
  };

  const statusMap: Record<string, NetworkStatus> = {
    active: NetworkStatus.ACTIVE,
    degraded: NetworkStatus.WARNING,
    down: NetworkStatus.ERROR,
    maintenance: NetworkStatus.INACTIVE
  };

  const node: NetworkNode = {
    id: asset.id,
    name: asset.name,
    type: nodeTypeMap[asset.kind] || NetworkNodeType.ACCESS_NODE,
    position: asset.location,
    status: statusMap[asset.status] || NetworkStatus.ACTIVE,
    metadata: {
      kind: asset.kind,
      originalStatus: asset.status
    }
  };

  return validateData(networkNodeSchema, node);
};

/**
 * Transforms a domain Customer into a NetworkNode
 */
export const transformCustomerToNode = (customer: Customer): NetworkNode => {
  const statusMap: Record<string, NetworkStatus> = {
    online: NetworkStatus.ACTIVE,
    offline: NetworkStatus.ERROR,
    unstable: NetworkStatus.WARNING
  };

  const node: NetworkNode = {
    id: customer.id,
    name: sanitizeSearchQuery(customer.name),
    type: NetworkNodeType.CUSTOMER,
    position: customer.location || { lat: 23.8103, lng: 90.4125 },
    status: statusMap[customer.status] || NetworkStatus.ACTIVE,
    metadata: sanitizeMetadata({
      kind: 'customer',
      plan: customer.plan,
      originalStatus: customer.status
    })
  };

  return validateData(networkNodeSchema, node);
};

/**
 * Generates network topology (connections) from assets and customers.
 * Uses optimized spatial proximity checks.
 */
export const generateTopology = (assets: Asset[], customers: Customer[]): NetworkConnection[] => {
  const connections: NetworkConnection[] = [];
  
  // Categorize assets for faster access
  const assetMap = new Map<string, Asset[]>();
  assets.forEach(asset => {
    const list = assetMap.get(asset.kind) || [];
    list.push(asset);
    assetMap.set(asset.kind, list);
  });

  const pops = assetMap.get('pop') || [];
  const junctionBoxes = assetMap.get('junction_box') || [];
  const splitters = assetMap.get('splitter') || [];
  const poles = assetMap.get('pole') || [];
  const onus = assetMap.get('onu') || [];

  // Helper for finding nearest node
  const findNearest = <T extends { location: { lat: number, lng: number } }>(
    target: { lat: number, lng: number },
    options: T[]
  ): T | null => {
    if (options.length === 0) return null;
    let nearest = options[0];
    let minDist = Infinity;

    for (const option of options) {
      const dist = Math.hypot(target.lat - option.location.lat, target.lng - option.location.lng);
      if (dist < minDist) {
        minDist = dist;
        nearest = option;
      }
    }
    return nearest;
  };

  // 1. Core Ring (POPs)
  for (let i = 0; i < pops.length; i++) {
    const source = pops[i];
    const target = pops[(i + 1) % pops.length];
    if (source.id !== target.id) {
      connections.push(validateData(networkConnectionSchema, {
        id: `conn_${source.id}_${target.id}`,
        sourceNodeId: source.id,
        targetNodeId: target.id,
        type: ConnectionType.FIBER_ROUTE,
        status: NetworkStatus.ACTIVE,
        bandwidth: 10000,
        utilization: 20 + Math.random() * 30
      }));
    }
  }

  // 2. Junction Boxes to Nearest POP
  junctionBoxes.forEach(jb => {
    const nearestPop = findNearest(jb.location, pops);
    if (nearestPop) {
      connections.push(validateData(networkConnectionSchema, {
        id: `conn_${nearestPop.id}_${jb.id}`,
        sourceNodeId: nearestPop.id,
        targetNodeId: jb.id,
        type: ConnectionType.FIBER_ROUTE,
        status: jb.status === 'degraded' ? NetworkStatus.WARNING : NetworkStatus.ACTIVE,
        bandwidth: 2000,
        utilization: 30 + Math.random() * 40
      }));
    }
  });

  // 3. Splitters to Nearest Junction Box (or POP)
  splitters.forEach(splitter => {
    const nearestJB = findNearest(splitter.location, junctionBoxes) || findNearest(splitter.location, pops);
    if (nearestJB) {
      connections.push(validateData(networkConnectionSchema, {
        id: `conn_${nearestJB.id}_${splitter.id}`,
        sourceNodeId: nearestJB.id,
        targetNodeId: splitter.id,
        type: ConnectionType.FIBER_ROUTE,
        status: splitter.status === 'down' ? NetworkStatus.ERROR : NetworkStatus.ACTIVE,
        bandwidth: 1000,
        utilization: 15 + Math.random() * 25
      }));
    }
  });

  // 4. Poles to Nearest Splitter
  poles.forEach(pole => {
    const nearestSplitter = findNearest(pole.location, splitters);
    if (nearestSplitter) {
      connections.push(validateData(networkConnectionSchema, {
        id: `conn_${nearestSplitter.id}_${pole.id}`,
        sourceNodeId: nearestSplitter.id,
        targetNodeId: pole.id,
        type: ConnectionType.FIBER_ROUTE,
        status: NetworkStatus.ACTIVE,
        bandwidth: 100,
        utilization: 10 + Math.random() * 20
      }));
    }
  });

  // 5. ONUs to Nearest Pole
  onus.forEach(onu => {
    const nearestPole = findNearest(onu.location, poles);
    if (nearestPole) {
      connections.push(validateData(networkConnectionSchema, {
        id: `conn_${nearestPole.id}_${onu.id}`,
        sourceNodeId: nearestPole.id,
        targetNodeId: onu.id,
        type: ConnectionType.FIBER_ROUTE,
        status: NetworkStatus.ACTIVE,
        bandwidth: 100,
        utilization: 5 + Math.random() * 15
      }));
    }
  });

  // 6. Customers to Nearest ONU
  customers.forEach(customer => {
    if (!customer.location) return;
    const nearestOnu = findNearest(customer.location, onus);
    if (nearestOnu) {
      connections.push(validateData(networkConnectionSchema, {
        id: `conn_${nearestOnu.id}_${customer.id}`,
        sourceNodeId: nearestOnu.id,
        targetNodeId: customer.id,
        type: ConnectionType.CUSTOMER_CONNECTION,
        status: customer.status === 'offline' ? NetworkStatus.ERROR : NetworkStatus.ACTIVE,
        bandwidth: 50,
        utilization: Math.random() * 80
      }));
    }
  });

  return connections;
};
