"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { services } from '@/services/serviceLocator';
import { Asset, Customer, Incident } from '@/types/domain';
import { NetworkNode, NetworkConnection, NetworkStatus, NetworkNodeType } from '../types';

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
  const nodeTypeMap: Record<string, any> = {
    pop: 'CORE_NODE',
    junction_box: 'DISTRIBUTION_NODE',
    splitter: 'SPLITTER',
    onu: 'CUSTOMER',
    pole: 'ACCESS_NODE',
    fiber_route: 'ACCESS_NODE'
  };

  const statusMap: Record<string, any> = {
    active: 'ACTIVE',
    degraded: 'WARNING',
    down: 'ERROR',
    maintenance: 'INACTIVE'
  };

  return {
    id: asset.id,
    name: asset.name,
    type: nodeTypeMap[asset.kind] || 'ACCESS_NODE',
    position: asset.location,
    status: statusMap[asset.status] || 'ACTIVE',
    metadata: {
      kind: asset.kind,
      originalStatus: asset.status
    }
  };
};

// Transform domain customers to network nodes
const transformCustomerToNode = (customer: Customer): NetworkNode => {
  const statusMap: Record<string, any> = {
    online: 'ACTIVE',
    offline: 'ERROR',
    unstable: 'WARNING'
  };

  return {
    id: customer.id,
    name: customer.name,
    type: NetworkNodeType.CUSTOMER,
    position: customer.location || { lat: 23.8103, lng: 90.4125 }, // Default to Dhaka center if no location
    status: statusMap[customer.status] || 'ACTIVE',
    metadata: {
      kind: 'customer',
      plan: customer.plan,
      originalStatus: customer.status
    }
  };
};

// Hook: Fetch all assets
export function useAssets() {
  return useQuery({
    queryKey: networkQueryKeys.assets.list(),
    queryFn: async () => {
      const result = await services.assets.list();
      return result.items;
    },
    staleTime: 30_000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60_000, // Keep in cache for 5 minutes
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
    staleTime: 60_000, // Customers change less frequently
    gcTime: 10 * 60_000,
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
    staleTime: 15_000, // Incidents can change quickly
    gcTime: 5 * 60_000,
    refetchInterval: 30_000, // Auto-refetch every 30 seconds
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
    gcTime: 2 * 60_000,
    refetchInterval: 15_000, // More frequent updates for active incidents
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
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}

// Hook: Fetch nodes by type
export function useNodesByType(type: string) {
  return useQuery({
    queryKey: networkQueryKeys.nodes.byType(type),
    queryFn: async () => {
      const result = await services.assets.list();
      const filtered = result.items.filter(asset => asset.kind === type);
      return filtered.map(transformAssetToNode);
    },
    enabled: !!type,
    staleTime: 30_000,
  });
}

// Hook: Fetch nodes by status
export function useNodesByStatus(status: string) {
  return useQuery({
    queryKey: networkQueryKeys.nodes.byStatus(status),
    queryFn: async () => {
      const result = await services.assets.list();
      const filtered = result.items.filter(asset => asset.status === status);
      return filtered.map(transformAssetToNode);
    },
    enabled: !!status,
    staleTime: 15_000,
    refetchInterval: 20_000,
  });
}

// Hook: Fetch network connections (mock implementation - would be real API in production)
export function useNetworkConnections() {
  return useQuery({
    queryKey: networkQueryKeys.connections.list(),
    queryFn: async () => {
      // In production, this would fetch from a real endpoint
      // For now, we'll generate mock connections based on assets
      const result = await services.assets.list();
      const assets = result.items;
      
      // Create simple chain connections for demo purposes
      const connections: NetworkConnection[] = [];
      for (let i = 0; i < assets.length - 1; i++) {
        connections.push({
          id: `conn_${assets[i].id}_${assets[i + 1].id}`,
          sourceNodeId: assets[i].id,
          targetNodeId: assets[i + 1].id,
          status: assets[i].status === 'active' && assets[i + 1].status === 'active' 
            ? NetworkStatus.ACTIVE 
            : NetworkStatus.WARNING,
          bandwidth: 1000, // 1 Gbps
          utilization: Math.random() * 80 // Random utilization 0-80%
        });
      }
      
      return connections;
    },
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}

// Hook: Fetch connections for a specific node
export function useConnectionsByNode(nodeId: string) {
  return useQuery({
    queryKey: networkQueryKeys.connections.byNodeId(nodeId),
    queryFn: async () => {
      const result = await services.assets.list();
      const connections: NetworkConnection[] = [];
      
      // Find connections where this node is either source or target
      result.items.forEach((asset, index) => {
        if (asset.id === nodeId && index > 0) {
          // Connection from previous asset
          connections.push({
            id: `conn_${result.items[index - 1].id}_${asset.id}`,
            sourceNodeId: result.items[index - 1].id,
            targetNodeId: asset.id,
            status: NetworkStatus.ACTIVE,
            bandwidth: 1000
          });
        }
        if (asset.id === nodeId && index < result.items.length - 1) {
          // Connection to next asset
          connections.push({
            id: `conn_${asset.id}_${result.items[index + 1].id}`,
            sourceNodeId: asset.id,
            targetNodeId: result.items[index + 1].id,
            status: NetworkStatus.ACTIVE,
            bandwidth: 1000
          });
        }
      });
      
      return connections;
    },
    enabled: !!nodeId,
    staleTime: 30_000,
  });
}

// Mutation: Update asset status
export function useUpdateAssetStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ assetId, status }: { assetId: string; status: string }) => {
      // In production, this would call an API endpoint
      // For now, simulate with a delay
      await new Promise(resolve => setTimeout(resolve, 500));
      return { assetId, status };
    },
    onSuccess: (_, variables) => {
      // Invalidate relevant queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: networkQueryKeys.assets.list() });
      queryClient.invalidateQueries({ queryKey: networkQueryKeys.nodes.list() });
      queryClient.invalidateQueries({ queryKey: networkQueryKeys.nodes.byStatus(variables.status) });
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
      queryClient.invalidateQueries({ queryKey: networkQueryKeys.incidents.list() });
      queryClient.invalidateQueries({ queryKey: networkQueryKeys.incidents.active() });
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
  };
}

// Utility hook: Get node details with related data
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
    staleTime: 30_000,
  });

  const connectionsQuery = useConnectionsByNode(nodeId || '');

  return {
    node: nodeQuery,
    connections: connectionsQuery,
    isLoading: nodeQuery.isLoading || connectionsQuery.isLoading,
  };
}
