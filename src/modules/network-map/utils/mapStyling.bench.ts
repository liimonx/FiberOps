import { bench, describe } from 'vitest';
import { createConnectionFeature } from './mapStyling';
import { NetworkConnection, NetworkNode, NetworkNodeType, NetworkStatus, ConnectionType } from '../types';

const generateData = (nodeCount: number, connectionCount: number) => {
  const nodes: NetworkNode[] = Array.from({ length: nodeCount }, (_, i) => ({
    id: `node-${i}`,
    name: `Node ${i}`,
    type: NetworkNodeType.CORE_NODE,
    position: { lat: 0, lng: 0 },
    status: NetworkStatus.ACTIVE,
  }));

  const connections: NetworkConnection[] = Array.from({ length: connectionCount }, (_, i) => ({
    id: `conn-${i}`,
    sourceNodeId: `node-${i % nodeCount}`,
    targetNodeId: `node-${(i + 1) % nodeCount}`,
    type: ConnectionType.FIBER_ROUTE,
    status: NetworkStatus.ACTIVE,
    capacity: 100,
    utilizedCapacity: 50,
  }));

  return { nodes, connections };
};

const { nodes, connections } = generateData(10000, 5000);

describe('mapStyling performance', () => {
  bench('createConnectionFeature - array lookup', () => {
    connections.forEach(conn => {
      createConnectionFeature(conn, nodes);
    });
  });

  bench('createConnectionFeature - map lookup', () => {
    const nodesMap = new Map(nodes.map(n => [n.id, n]));
    connections.forEach(conn => {
      createConnectionFeature(conn, nodesMap);
    });
  });
});
