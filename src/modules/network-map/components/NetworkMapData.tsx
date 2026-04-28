"use client";

import { useEffect, useMemo } from 'react';
import { 
  useNetworkData, 
  useRealTimeUpdates,
  useActiveIncidents,
  useNodesByStatus
} from '../hooks';
import { useNetworkMapStore } from '../stores/useNetworkMapStore';
import { ErrorBoundary } from './ErrorBoundary';
import { LoadingState } from './LoadingState';
import { AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import { NetworkNodeType, NetworkStatus } from '../types';

interface NetworkMapDataProps {
  children: React.ReactNode;
}

// Component that fetches and syncs network data with the store
function NetworkMapDataSync({ children }: NetworkMapDataProps) {
  // Fetch all network data using TanStack Query
  const {
    assets,
    customers,
    incidents,
    nodes,
    connections,
    isLoading,
    error,
    isSuccess,
  } = useNetworkData();

  // Real-time updates via WebSocket
  const { isConnected, connectionQuality } = useRealTimeUpdates({
    enabled: false, // Disabled until WebSocket server is configured
    onConnectionChange: (connected) => {
      console.log('[NetworkMap] WebSocket connection:', connected ? 'connected' : 'disconnected');
    },
  });

  // Get active incidents for alerts
  const { data: activeIncidents } = useActiveIncidents();

  // Get nodes by status for monitoring
  const { data: degradedNodes } = useNodesByStatus('degraded');
  const { data: downNodes } = useNodesByStatus('down');

  // Store actions
  const setNodes = useNetworkMapStore((state) => state.setNodes);
  const setConnections = useNetworkMapStore((state) => state.setConnections);
  const setLoading = useNetworkMapStore((state) => state.setLoading);
  const setError = useNetworkMapStore((state) => state.setError);
  const setWebSocketConnected = useNetworkMapStore((state) => state.setWebSocketConnected);
  const setConnectionQuality = useNetworkMapStore((state) => state.setConnectionQuality);

  // Sync fetched data with Zustand store
  useEffect(() => {
    console.log('[NetworkMapDataSync] Nodes query state:', { 
      hasData: !!nodes.data, 
      dataLength: nodes.data?.length || 0,
      isLoading: nodes.isLoading,
      error: nodes.error 
    });
    
    if (nodes.data && nodes.data.length > 0) {
      console.log('[NetworkMapDataSync] Setting nodes to store:', nodes.data.length, 'nodes');
      setNodes(nodes.data);
    }
  }, [nodes.data, setNodes]);

  // Sync customers as nodes
  useEffect(() => {
    console.log('[NetworkMapDataSync] Customers query state:', { 
      hasData: !!customers.data, 
      dataLength: customers.data?.length || 0,
      isLoading: customers.isLoading,
      error: customers.error 
    });
    
    if (customers.data && customers.data.length > 0) {
      // Transform customers to network nodes and merge with existing nodes
      const customerNodes = customers.data.map((customer: any) => ({
        id: customer.id,
        name: customer.name,
        type: NetworkNodeType.CUSTOMER,
        position: customer.location || { lat: 23.8103, lng: 90.4125 },
        status: customer.status === 'online' ? NetworkStatus.ACTIVE : customer.status === 'offline' ? NetworkStatus.ERROR : NetworkStatus.WARNING,
        metadata: {
          kind: 'customer',
          plan: customer.plan,
          originalStatus: customer.status
        }
      }));
      
      console.log('[NetworkMapDataSync] Transforming', customerNodes.length, 'customers to nodes');
      
      // Merge asset nodes with customer nodes
      const allNodes = [...(nodes.data || []), ...customerNodes];
      console.log('[NetworkMapDataSync] Total nodes after merge:', allNodes.length);
      setNodes(allNodes);
    }
  }, [customers.data, nodes.data, setNodes]);

  useEffect(() => {
    console.log('[NetworkMapDataSync] Connections query state:', { 
      hasData: !!connections.data, 
      dataLength: connections.data?.length || 0,
      isLoading: connections.isLoading,
      error: connections.error 
    });
    
    if (connections.data && connections.data.length > 0) {
      console.log('[NetworkMapDataSync] Setting connections to store:', connections.data.length, 'connections');
      setConnections(connections.data);
    }
  }, [connections.data, setConnections]);

  // Update loading state
  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);

  // Update error state
  useEffect(() => {
    if (error) {
      setError(error instanceof Error ? error.message : 'Failed to load network data');
    } else {
      setError(null);
    }
  }, [error, setError]);

  // Update WebSocket state
  useEffect(() => {
    setWebSocketConnected(isConnected);
    setConnectionQuality(connectionQuality);
  }, [isConnected, connectionQuality, setWebSocketConnected, setConnectionQuality]);

  // Show loading state
  if (isLoading && !nodes.data) {
    return (
      <div className="u-w-100 u-h-100 u-flex u-items-center u-justify-center">
        <LoadingState 
          message="Loading network map..."
          showSpinner={true}
        />
      </div>
    );
  }

  // Show error state
  if (error && !nodes.data) {
    return (
      <div className="u-w-100 u-h-100 u-flex u-items-center u-justify-center u-p-8">
        <div className="u-text-center u-max-w-md">
          <AlertTriangle className="u-w-16 u-h-16 u-text-warning u-mb-4 u-mx-auto" />
          <h2 className="u-fs-xl u-font-bold u-mb-2">Failed to Load Network Data</h2>
          <p className="u-text-secondary-subtle u-mb-4">{error instanceof Error ? error.message : 'An unknown error occurred'}</p>
          <button 
            onClick={() => window.location.reload()}
            className="u-px-4 u-py-2 u-bg-primary u-text-white u-rounded u-cursor-pointer"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Render children (the actual map components)
  return (
    <>
      {/* Network Status Indicators */}
      <NetworkStatusIndicators 
        isConnected={isConnected}
        connectionQuality={connectionQuality}
        activeIncidents={activeIncidents?.length || 0}
        degradedNodes={degradedNodes?.length || 0}
        downNodes={downNodes?.length || 0}
      />
      
      {children}
    </>
  );
}

// Component showing network status indicators
function NetworkStatusIndicators({
  isConnected,
  connectionQuality,
  activeIncidents,
  degradedNodes,
  downNodes,
}: {
  isConnected: boolean;
  connectionQuality: string;
  activeIncidents: number;
  degradedNodes: number;
  downNodes: number;
}) {
  const qualityColor = {
    good: 'success',
    fair: 'warning',
    poor: 'danger',
    disconnected: 'danger',
  }[connectionQuality] || 'secondary';

  return (
    <div className="u-absolute u-top-4 u-start-1/2 u-transform--translate-x-1/2 u-flex u-gap-2 u-z-1">
      {/* WebSocket Connection Status */}
      <div className="u-bg-dark u-p-2 u-rounded u-shadow-lg u-flex u-items-center u-gap-2">
        {isConnected ? (
          <Wifi className={`u-w-4 u-h-4 u-text-${qualityColor}`} />
        ) : (
          <WifiOff className="u-w-4 u-h-4 u-text-danger" />
        )}
        <span className="u-fs-xs u-font-medium">
          {isConnected ? 'Live' : 'Offline'}
        </span>
      </div>

      {/* Active Incidents Badge */}
      {activeIncidents > 0 && (
        <div className="u-bg-danger u-p-2 u-rounded u-shadow-lg u-flex u-items-center u-gap-2 u-z-">
          <AlertTriangle className="u-w-4 u-h-4 u-text-white" />
          <span className="u-fs-xs u-font-bold u-text-white">
            {activeIncidents} Active Incident{activeIncidents !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Node Status Summary */}
      {(degradedNodes > 0 || downNodes > 0) && (
        <div className="u-bg-dark u-p-2 u-rounded u-shadow-lg u-flex u-items-center u-gap-3 u-z-1">
          {degradedNodes > 0 && (
            <div className="u-flex u-items-center u-gap-1">
              <div className="u-w-2 u-h-2 u-rounded-full u-bg-warning" />
              <span className="u-fs-xs">{degradedNodes} Degraded</span>
            </div>
          )}
          {downNodes > 0 && (
            <div className="u-flex u-items-center u-gap-1">
              <div className="u-w-2 u-h-2 u-rounded-full u-bg-danger" />
              <span className="u-fs-xs">{downNodes} Down</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Main wrapper component with error boundary
export function NetworkMapDataProvider({ children }: NetworkMapDataProps) {
  return (
    <ErrorBoundary
      fallback={
        <div className="u-w-100 u-h-100 u-flex u-items-center u-justify-center u-p-8">
          <div className="u-text-center">
            <AlertTriangle className="u-w-16 u-h-16 u-text-danger u-mb-4 u-mx-auto" />
            <h2 className="u-fs-xl u-font-bold u-mb-2">Map Component Error</h2>
            <p className="u-text-secondary-subtle u-mb-4">
              The network map encountered an error. Please try refreshing.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="u-px-4 u-py-2 u-bg-primary u-text-white u-rounded u-cursor-pointer"
            >
              Refresh Page
            </button>
          </div>
        </div>
      }
    >
      <NetworkMapDataSync>{children}</NetworkMapDataSync>
    </ErrorBoundary>
  );
}

// Hook to access loaded network data
export function useLoadedNetworkData() {
  const nodes = useNetworkMapStore((state) => state.nodes);
  const connections = useNetworkMapStore((state) => state.connections);
  const isLoading = useNetworkMapStore((state) => state.isLoading);
  const error = useNetworkMapStore((state) => state.error);
  const lastUpdated = useNetworkMapStore((state) => state.lastUpdated);

  return useMemo(() => ({
    nodes,
    connections,
    isLoading,
    error,
    lastUpdated,
    hasData: nodes.length > 0 && connections.length > 0,
  }), [nodes, connections, isLoading, error, lastUpdated]);
}
