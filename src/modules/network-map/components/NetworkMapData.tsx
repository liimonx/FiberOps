"use client";

import { useEffect, useMemo } from "react";
import { Icon, Button } from "@shohojdhara/atomix";
import {
  useNetworkData,
  useRealTimeUpdates,
  useActiveIncidents,
  useNodesByStatus,
} from "../hooks";
import { useNetworkMapStore } from "../stores/useNetworkMapStore";
import { ErrorBoundary } from "./ErrorBoundary";
import { LoadingState } from "./LoadingState";
import { NetworkNodeType, NetworkStatus } from "../types";

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
      console.log(
        "[NetworkMap] WebSocket connection:",
        connected ? "connected" : "disconnected"
      );
    },
  });

  // Get active incidents for alerts
  const { data: activeIncidents } = useActiveIncidents();

  // Get nodes by status for monitoring
  const { data: degradedNodes } = useNodesByStatus("degraded");
  const { data: downNodes } = useNodesByStatus("down");

  // Store actions
  const setNodes = useNetworkMapStore((state) => state.setNodes);
  const setConnections = useNetworkMapStore((state) => state.setConnections);
  const setLoading = useNetworkMapStore((state) => state.setLoading);
  const setError = useNetworkMapStore((state) => state.setError);
  const setWebSocketConnected = useNetworkMapStore(
    (state) => state.setWebSocketConnected
  );
  const setConnectionQuality = useNetworkMapStore((state) => state.setConnectionQuality);

  // Sync fetched data with Zustand store
  useEffect(() => {
    console.log("[NetworkMapDataSync] Nodes query state:", {
      hasData: !!nodes.data,
      dataLength: nodes.data?.length || 0,
      isLoading: nodes.isLoading,
      error: nodes.error,
    });

    if (nodes.data && nodes.data.length > 0) {
      console.log(
        "[NetworkMapDataSync] Setting nodes to store:",
        nodes.data.length,
        "nodes"
      );
      setNodes(nodes.data);
    }
  }, [nodes.data, setNodes]);

  // Sync customers as nodes
  useEffect(() => {
    console.log("[NetworkMapDataSync] Customers query state:", {
      hasData: !!customers.data,
      dataLength: customers.data?.length || 0,
      isLoading: customers.isLoading,
      error: customers.error,
    });

    if (customers.data && customers.data.length > 0) {
      // Transform customers to network nodes and merge with existing nodes
      const customerNodes = customers.data.map((customer: any) => ({
        id: customer.id,
        name: customer.name,
        type: NetworkNodeType.CUSTOMER,
        position: customer.location || { lat: 23.8103, lng: 90.4125 },
        status:
          customer.status === "online"
            ? NetworkStatus.ACTIVE
            : customer.status === "offline"
              ? NetworkStatus.ERROR
              : NetworkStatus.WARNING,
        metadata: {
          kind: "customer",
          plan: customer.plan,
          originalStatus: customer.status,
        },
      }));

      console.log(
        "[NetworkMapDataSync] Transforming",
        customerNodes.length,
        "customers to nodes"
      );

      // Merge asset nodes with customer nodes
      const allNodes = [...(nodes.data || []), ...customerNodes];
      console.log("[NetworkMapDataSync] Total nodes after merge:", allNodes.length);
      setNodes(allNodes);
    }
  }, [customers.data, nodes.data, setNodes]);

  useEffect(() => {
    console.log("[NetworkMapDataSync] Connections query state:", {
      hasData: !!connections.data,
      dataLength: connections.data?.length || 0,
      isLoading: connections.isLoading,
      error: connections.error,
    });

    if (connections.data && connections.data.length > 0) {
      console.log(
        "[NetworkMapDataSync] Setting connections to store:",
        connections.data.length,
        "connections"
      );
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
      setError(error instanceof Error ? error.message : "Failed to load network data");
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
        <LoadingState message="Loading network map..." showSpinner={true} />
      </div>
    );
  }

  // Show error state
  if (error && !nodes.data) {
    return (
      <div className="u-w-100 u-h-100 u-flex u-items-center u-justify-center u-p-8">
        <div className="u-text-center">
          <Icon name="Warning" size={48} className="u-text-warning u-mb-4" />
          <h2 className="u-text-xl u-font-bold u-mb-2">Failed to Load Network Data</h2>
          <p className="u-text-secondary u-mb-4">
            {error instanceof Error ? error.message : "An unknown error occurred"}
          </p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Retry
          </Button>
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
  return (
    <div className="network-status-bar">
      {/* WebSocket Connection Status */}
      <div className="status-badge">
        <Icon
          name={isConnected ? "WifiHigh" : "WifiSlash"}
          size={14}
          className={`status-icon status-icon--${isConnected ? connectionQuality : "disconnected"}`}
        />
        <span className="status-label">{isConnected ? "Live" : "Offline"}</span>
      </div>

      {/* Active Incidents Badge */}
      {activeIncidents > 0 && (
        <div className="status-badge status-badge--danger">
          <Icon name="Warning" size={14} />
          <span className="status-label">
            {activeIncidents} Incident{activeIncidents !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* Node Status Summary */}
      {(degradedNodes > 0 || downNodes > 0) && (
        <div className="status-badge">
          {degradedNodes > 0 && (
            <span className="status-count status-count--warning">
              <span className="status-dot status-dot--warning" />
              {degradedNodes} Degraded
            </span>
          )}
          {downNodes > 0 && (
            <span className="status-count status-count--error">
              <span className="status-dot status-dot--error" />
              {downNodes} Down
            </span>
          )}
        </div>
      )}

      <style jsx>{`
        .network-status-bar {
          position: absolute;
          top: 12px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 8px;
          pointer-events: auto;
          z-index: 10;
        }

        .status-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: rgba(17, 24, 39, 0.85);
          backdrop-filter: blur(8px);
          border-radius: 20px;
          border: 1px solid var(--color-gray-700);
          font-size: 12px;
          color: var(--color-gray-200);
        }

        .status-badge--danger {
          background: rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.5);
          color: #fca5a5;
        }

        .status-icon--good {
          color: #10b981;
        }
        .status-icon--fair {
          color: #f59e0b;
        }
        .status-icon--poor {
          color: #ef4444;
        }
        .status-icon--disconnected {
          color: #ef4444;
        }

        .status-label {
          font-weight: 500;
          white-space: nowrap;
        }

        .status-count {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
        }

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .status-dot--warning {
          background: #f59e0b;
        }
        .status-dot--error {
          background: #ef4444;
        }

        @media (max-width: 768px) {
          .network-status-bar {
            top: 8px;
            gap: 4px;
          }

          .status-badge {
            padding: 4px 8px;
            font-size: 11px;
          }
        }
      `}</style>
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
            <Icon name="Warning" size={48} className="u-text-danger u-mb-4" />
            <h2 className="u-text-xl u-font-bold u-mb-2">Map Component Error</h2>
            <p className="u-text-secondary u-mb-4">
              The network map encountered an error. Please try refreshing.
            </p>
            <Button variant="primary" onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
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

  return useMemo(
    () => ({
      nodes,
      connections,
      isLoading,
      error,
      lastUpdated,
      hasData: nodes.length > 0 && connections.length > 0,
    }),
    [nodes, connections, isLoading, error, lastUpdated]
  );
}
