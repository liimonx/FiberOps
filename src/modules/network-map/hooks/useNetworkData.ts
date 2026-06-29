"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Asset, Customer, Incident } from '@/types/domain';
import { useCustomers } from "@/modules/customers/hooks/useCustomersData";
import {
  useIncidents,
} from "@/modules/incidents/hooks/useIncidentsData";
import { 
  transformAssetToNode, 
  transformCustomerToNode, 
  generateTopology 
} from '../utils/dataTransformation';

import { fetchList } from "@/lib/fetchApi";

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
    detail: (id: string) => [...networkQueryKeys.customers.all, 'detail', id] as const,
  },
  incidents: {
    all: ['network', 'incidents'] as const,
    list: () => [...networkQueryKeys.incidents.all, 'list'] as const,
    active: () => [...networkQueryKeys.incidents.all, 'active'] as const,
    detail: (id: string) => [...networkQueryKeys.incidents.all, 'detail', id] as const,
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
  proposals: {
    all: ['network', 'proposals'] as const,
    list: () => [...networkQueryKeys.proposals.all, 'list'] as const,
    detail: (id: string) => [...networkQueryKeys.proposals.all, 'detail', id] as const,
  },
  workOrders: {
    all: ['network', 'workOrders'] as const,
    list: () => [...networkQueryKeys.workOrders.all, 'list'] as const,
    detail: (id: string) => [...networkQueryKeys.workOrders.all, 'detail', id] as const,
  },
};

// Hook: Fetch all assets
export function useAssets() {
  return useQuery({
    queryKey: networkQueryKeys.assets.list(),
    queryFn: () => fetchList<Asset>('/api/assets'),
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
  });
}

export { useCustomers } from "@/modules/customers/hooks/useCustomersData";
export { useIncidents } from "@/modules/incidents/hooks/useIncidentsData";
export { useWorkOrders } from "@/modules/work-orders/hooks/useWorkOrdersData";

// Hook: Fetch active incidents only
export function useActiveIncidents() {
  return useQuery({
    queryKey: networkQueryKeys.incidents.active(),
    queryFn: async () => {
      const items = await fetchList<Incident>('/api/incidents');
      return items.filter((inc) => inc.status !== 'resolved');
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

export { useResolveIncident } from "@/modules/incidents/hooks/useIncidentsData";

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
