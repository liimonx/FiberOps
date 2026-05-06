"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { services } from '@/services/serviceLocator';
import { Asset, Customer, Incident } from '@/types/domain';
import { NetworkNode, NetworkConnection, NetworkStatus, NetworkNodeType, ConnectionType } from '../types';
import { validateData } from '../utils/validation';
import { networkNodeSchema } from '../schemas/networkNode.schema';
import { networkConnectionSchema } from '../schemas/networkConnection.schema';
import { z } from 'zod';

// Query keys for better organization and cache management
export const networkQueryKeys = {
  all: ['network'] as const,
  assets: {
    all: ['network', 'assets'] as const,
    list: () => [...networkQueryKeys.assets.all, 'list'] as const,
    detail: (id: string) => [...networkQueryKeys.assets.all, 'detail', id] as const,
  },
  customers: {
    all: ['network', 'customers'] as const,
    list: () => [...networkQueryKeys.customers.all, 'list'] as const,
    detail: (id: string) => [...networkQueryKeys.customers.all, 'detail', id] as const,
  },
  incidents: {
    all: ['network', 'incidents'] as const,
    list: () => [...networkQueryKeys.incidents.all, 'list'] as const,
    detail: (id: string) => [...networkQueryKeys.incidents.all, 'detail', id] as const,
    active: () => [...networkQueryKeys.incidents.all, 'active'] as const,
  },
  nodes: {
    all: ['network', 'nodes'] as const,
    list: () => [...networkQueryKeys.nodes.all, 'list'] as const,
    detail: (id: string) => [...networkQueryKeys.nodes.all, 'detail', id] as const,
    byType: (type: string) => [...networkQueryKeys.nodes.all, 'byType', type] as const,
    byStatus: (status: string) => [...networkQueryKeys.nodes.all, 'byStatus', status] as const,
  },
  connections: {
    all: ['network', 'connections'] as const,
    list: () => [...networkQueryKeys.connections.all, 'list'] as const,
    byNodeId: (nodeId: string) => [...networkQueryKeys.connections.all, 'byNode', nodeId] as const,
  },
};

// Transform domain assets to network nodes
const transformAssetToNode = (asset: Asset): NetworkNode => {
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

// Transform domain customers to network nodes
const transformCustomerToNode = (customer: Customer): NetworkNode => {
  const statusMap: Record<string, NetworkStatus> = {
    online: NetworkStatus.ACTIVE,
    offline: NetworkStatus.ERROR,
    unstable: NetworkStatus.WARNING
  };

  const node: NetworkNode = {
    id: customer.id,
    name: customer.name,
    type: NetworkNodeType.CUSTOMER,
    position: customer.location || { lat: 23.8103, lng: 90.4125 },
    status: statusMap[customer.status] || NetworkStatus.ACTIVE,
    metadata: {
      kind: 'customer',
      plan: customer.plan,
      originalStatus: customer.status
    }
  };

  return validateData(networkNodeSchema, node);
};

// Hook: Fetch all assets
export function useAssets() {
  return useQuery({
    queryKey: networkQueryKeys.assets.list(),
    queryFn: async () => {
      const result = await services.assets.list();
      return result.items;
    },
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
  });
}

// Hook: Fetch all customers
export function useCustomers() {
  return useQuery({
    queryKey: networkQueryKeys.customers.list(),
    queryFn: async () => {
      const result = await services.customers.list();
      return result.items;
    },
    staleTime: 5 * 60_000,
    gcTime: 20 * 60_000,
  });
}

// Hook: Fetch all incidents
export function useIncidents() {
  return useQuery({
    queryKey: networkQueryKeys.incidents.list(),
    queryFn: async () => {
      const result = await services.incidents.list();
      return result.items;
    },
    staleTime: 15_000,
    gcTime: 5 * 60_000,
    refetchInterval: 30_000,
  });
}

// Hook: Fetch active incidents only
export function useActiveIncidents() {
  return useQuery({
    queryKey: networkQueryKeys.incidents.active(),
    queryFn: async () => {
      const result = await services.incidents.list();
      return result.items.filter(inc => inc.status !== 'resolved');
    },
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}

// Hook: Fetch network nodes (transformed from assets)
export function useNetworkNodes() {
  return useQuery({
    queryKey: networkQueryKeys.nodes.list(),
    queryFn: async () => {
      const result = await services.assets.list();
      return result.items.map(transformAssetToNode);
    },
    staleTime: 60_000,
    gcTime: 15 * 60_000,
  });
}

// Hook: Fetch nodes by type
export function useNodesByType(type: string) {
  return useQuery({
    queryKey: networkQueryKeys.nodes.byType(type),
    queryFn: async () => {
      const result = await services.assets.list();
      return result.items
        .filter(asset => asset.kind === type)
        .map(transformAssetToNode);
    },
    enabled: !!type,
    staleTime: 60_000,
  });
}

// Hook: Fetch nodes by status
export function useNodesByStatus(status: string) {
  return useQuery({
    queryKey: networkQueryKeys.nodes.byStatus(status),
    queryFn: async () => {
      const result = await services.assets.list();
      return result.items
        .filter(asset => asset.status === status)
        .map(transformAssetToNode);
    },
    enabled: !!status,
    staleTime: 20_000,
    refetchInterval: 30_000,
  });
}

// Hook: Fetch network connections
export function useNetworkConnections() {
  return useQuery({
    queryKey: networkQueryKeys.connections.list(),
    queryFn: async () => {
      const [assetsResult, customersResult] = await Promise.all([
        services.assets.list(),
        services.customers.list()
      ]);
      
      const assets = assetsResult.items;
      const customers = customersResult.items;
      const connections: NetworkConnection[] = [];
      
      // Categorize assets
      const pops = assets.filter(a => a.kind === 'pop');
      const junctionBoxes = assets.filter(a => a.kind === 'junction_box');
      const splitters = assets.filter(a => a.kind === 'splitter');
      const poles = assets.filter(a => a.kind === 'pole');
      const onus = assets.filter(a => a.kind === 'onu');
      
      // Connection logic remains similar but with validation
      // 1. Core Ring
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
      
      // 2. Junction Boxes
      junctionBoxes.forEach(jb => {
        const nearestPop = pops.reduce((prev, curr) => {
          const distPrev = Math.hypot(jb.location.lat - prev.location.lat, jb.location.lng - prev.location.lng);
          const distCurr = Math.hypot(jb.location.lat - curr.location.lat, jb.location.lng - curr.location.lng);
          return distCurr < distPrev ? curr : prev;
        }, pops[0]);
        
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
      
      // 3. Splitters to Junction Boxes
      splitters.forEach(splitter => {
        const nearestJB = junctionBoxes.length > 0 
          ? junctionBoxes.reduce((prev, curr) => {
              const distPrev = Math.hypot(splitter.location.lat - prev.location.lat, splitter.location.lng - prev.location.lng);
              const distCurr = Math.hypot(splitter.location.lat - curr.location.lat, splitter.location.lng - curr.location.lng);
              return distCurr < distPrev ? curr : prev;
            }, junctionBoxes[0])
          : pops[0];

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

      // 4. Poles to Splitters
      poles.forEach(pole => {
        const nearestSplitter = splitters.length > 0
          ? splitters.reduce((prev, curr) => {
              const distPrev = Math.hypot(pole.location.lat - prev.location.lat, pole.location.lng - prev.location.lng);
              const distCurr = Math.hypot(pole.location.lat - curr.location.lat, pole.location.lng - curr.location.lng);
              return distCurr < distPrev ? curr : prev;
            }, splitters[0])
          : null;

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

      // 5. ONUs to Poles
      onus.forEach(onu => {
        const nearestPole = poles.length > 0
          ? poles.reduce((prev, curr) => {
              const distPrev = Math.hypot(onu.location.lat - prev.location.lat, onu.location.lng - prev.location.lng);
              const distCurr = Math.hypot(onu.location.lat - curr.location.lat, onu.location.lng - curr.location.lng);
              return distCurr < distPrev ? curr : prev;
            }, poles[0])
          : null;

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

      // 6. Customers to ONUs (Drop Cables)
      customers.forEach(customer => {
        if (!customer.location) return;
        
        const nearestOnu = onus.length > 0
          ? onus.reduce((prev, curr) => {
              const distPrev = Math.hypot(customer.location!.lat - prev.location.lat, customer.location!.lng - prev.location.lng);
              const distCurr = Math.hypot(customer.location!.lat - curr.location.lat, customer.location!.lng - curr.location.lng);
              return distCurr < distPrev ? curr : prev;
            }, onus[0])
          : null;

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
    },
    staleTime: 60_000,
    gcTime: 15 * 60_000,
  });
}

// Hook: Fetch connections for a specific node
export function useConnectionsByNode(nodeId: string) {
  return useQuery({
    queryKey: networkQueryKeys.connections.byNodeId(nodeId),
    queryFn: async () => {
      const result = await services.assets.list();
      const connections: NetworkConnection[] = [];
      
      result.items.forEach((asset, index) => {
        if (asset.id === nodeId && index > 0) {
          connections.push(validateData(networkConnectionSchema, {
            id: `conn_${result.items[index - 1].id}_${asset.id}`,
            sourceNodeId: result.items[index - 1].id,
            targetNodeId: asset.id,
            type: ConnectionType.FIBER_ROUTE,
            status: NetworkStatus.ACTIVE,
            bandwidth: 1000
          }));
        }
        if (asset.id === nodeId && index < result.items.length - 1) {
          connections.push(validateData(networkConnectionSchema, {
            id: `conn_${asset.id}_${result.items[index + 1].id}`,
            sourceNodeId: asset.id,
            targetNodeId: result.items[index + 1].id,
            type: ConnectionType.FIBER_ROUTE,
            status: NetworkStatus.ACTIVE,
            bandwidth: 1000
          }));
        }
      });
      
      return connections;
    },
    enabled: !!nodeId,
    staleTime: 60_000,
  });
}

// Mutation: Update asset status
export function useUpdateAssetStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ assetId, status }: { assetId: string; status: string }) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { assetId, status };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: networkQueryKeys.assets.all });
      queryClient.invalidateQueries({ queryKey: networkQueryKeys.nodes.all });
    },
  });
}

// Mutation: Resolve incident
export function useResolveIncident() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (incidentId: string) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return incidentId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: networkQueryKeys.incidents.all });
    },
  });
}

// Combined hook: Fetch all network data at once
export function useNetworkData() {
  const assetsQuery = useAssets();
  const customersQuery = useCustomers();
  const incidentsQuery = useIncidents();
  const nodesQuery = useNetworkNodes();
  const connectionsQuery = useNetworkConnections();

  return {
    assets: assetsQuery,
    customers: customersQuery,
    incidents: incidentsQuery,
    nodes: nodesQuery,
    connections: connectionsQuery,
    isLoading: assetsQuery.isLoading || customersQuery.isLoading || 
                incidentsQuery.isLoading || nodesQuery.isLoading || 
                connectionsQuery.isLoading,
    error: assetsQuery.error || customersQuery.error || 
           incidentsQuery.error || nodesQuery.error || 
           connectionsQuery.error,
    isSuccess: assetsQuery.isSuccess && customersQuery.isSuccess && 
               incidentsQuery.isSuccess && nodesQuery.isSuccess && 
               connectionsQuery.isSuccess,
    isFetching: assetsQuery.isFetching || customersQuery.isFetching ||
                incidentsQuery.isFetching || nodesQuery.isFetching ||
                connectionsQuery.isFetching
  };
}

// Hook: Node details
export function useNodeDetails(nodeId: string | null) {
  const nodeQuery = useQuery({
    queryKey: networkQueryKeys.nodes.detail(nodeId || ''),
    queryFn: async () => {
      if (!nodeId) return null;
      const result = await services.assets.list();
      const asset = result.items.find(a => a.id === nodeId);
      return asset ? transformAssetToNode(asset) : null;
    },
    enabled: !!nodeId,
    staleTime: 60_000,
  });

  const connectionsQuery = useConnectionsByNode(nodeId || '');

  return {
    node: nodeQuery,
    connections: connectionsQuery,
    isLoading: nodeQuery.isLoading || connectionsQuery.isLoading,
  };
}
