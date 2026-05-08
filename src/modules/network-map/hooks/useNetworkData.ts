"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { services } from '@/services/serviceLocator';
import { 
  transformAssetToNode, 
  transformCustomerToNode, 
  generateTopology 
} from '../utils/dataTransformation';

// Query keys for better organization and cache management
export const networkQueryKeys = {
  all: ['network'] as const,
  assets: {
    all: ['network', 'assets'] as const,
    list: () => [...networkQueryKeys.assets.all, 'list'] as const,
  },
  customers: {
    all: ['network', 'customers'] as const,
    list: () => [...networkQueryKeys.customers.all, 'list'] as const,
  },
  incidents: {
    all: ['network', 'incidents'] as const,
    list: () => [...networkQueryKeys.incidents.all, 'list'] as const,
    active: () => [...networkQueryKeys.incidents.all, 'active'] as const,
  },
  nodes: {
    all: ['network', 'nodes'] as const,
    list: () => [...networkQueryKeys.nodes.all, 'list'] as const,
    detail: (id: string) => [...networkQueryKeys.nodes.all, 'detail', id] as const,
  },
  connections: {
    all: ['network', 'connections'] as const,
    list: () => [...networkQueryKeys.connections.all, 'list'] as const,
    byNodeId: (nodeId: string) => [...networkQueryKeys.connections.all, 'byNode', nodeId] as const,
  },
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

/**
 * Combined hook: Fetch all network data at once.
 * Centralizes the fetching and transformation of nodes and connections.
 */
export function useNetworkData() {
  const assetsQuery = useAssets();
  const customersQuery = useCustomers();
  const incidentsQuery = useIncidents();

  // Optimized data derivation
  const nodes = (assetsQuery.data?.map(transformAssetToNode) ?? [])
    .concat(customersQuery.data?.map(transformCustomerToNode) ?? []);

  const connections = (assetsQuery.data && customersQuery.data)
    ? generateTopology(assetsQuery.data, customersQuery.data)
    : [];

  return {
    nodes,
    connections,
    isLoading: assetsQuery.isLoading || customersQuery.isLoading || incidentsQuery.isLoading,
    error: assetsQuery.error || customersQuery.error || incidentsQuery.error,
    isSuccess: assetsQuery.isSuccess && customersQuery.isSuccess && incidentsQuery.isSuccess,
    isFetching: assetsQuery.isFetching || customersQuery.isFetching || incidentsQuery.isFetching
  };
}

// Mutation: Update asset status
export function useUpdateAssetStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ assetId, status }: { assetId: string; status: string }) => {
      // In a real app, this would be a service call
      await new Promise(resolve => setTimeout(resolve, 500));
      return { assetId, status };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: networkQueryKeys.assets.all });
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

// Hook: Specific node details (uses cached data where possible)
export function useNodeDetails(nodeId: string | null) {
  const { nodes, connections, isLoading } = useNetworkData();
  
  const node = nodes.find(n => n.id === nodeId) || null;
  const nodeConnections = connections.filter(
    c => c.sourceNodeId === nodeId || c.targetNodeId === nodeId
  );

  return {
    node,
    connections: nodeConnections,
    isLoading,
  };
}
