"use client";

import { useEffect, useMemo, useCallback } from "react";
import { Icon, Button, Card, Badge } from "@shohojdhara/atomix";
import {
  useNetworkData,
  useRealTimeUpdates,
  useActiveIncidents,
} from "../hooks";
import { useNetworkMapStore } from "../stores/useNetworkMapStore";
import { ErrorBoundary } from "./ErrorBoundary";
import { AccessibilityProvider } from "./AccessibilityAnnouncer";
import { LoadingIndicator } from "./loading";
import { NetworkStatus } from "../types";
import { createLogger } from "@/lib/logger";

const log = createLogger("NetworkMap");

interface NetworkMapDataProps {
  children: React.ReactNode;
}

// Component that fetches and syncs network data with the store
function NetworkMapDataSync({ children }: NetworkMapDataProps) {
  const { nodes, connections, isLoading, error, isFetching } = useNetworkData();

  const handleConnectionChange = useCallback((connected: boolean) => {
    log.info("WebSocket connection:", connected ? "connected" : "disconnected");
  }, []);

  const { isConnected, connectionQuality } = useRealTimeUpdates({
    enabled: true,
    onConnectionChange: handleConnectionChange,
  });

  const { data: activeIncidents } = useActiveIncidents();
  
  // Memoize counts to avoid re-renders of status indicators
  const stats = useMemo(() => {
    return {
      degraded: nodes.filter(n => n.status === NetworkStatus.WARNING).length,
      down: nodes.filter(n => n.status === NetworkStatus.ERROR).length,
      incidents: activeIncidents?.length || 0
    };
  }, [nodes, activeIncidents]);

  const setNodes = useNetworkMapStore((state) => state.setNodes);
  const setConnections = useNetworkMapStore((state) => state.setConnections);
  const setLoading = useNetworkMapStore((state) => state.setLoading);
  const setError = useNetworkMapStore((state) => state.setError);
  const setWebSocketConnected = useNetworkMapStore((state) => state.setWebSocketConnected);
  const setConnectionQuality = useNetworkMapStore((state) => state.setConnectionQuality);
  const simulatedOutageActive = useNetworkMapStore(
    (state) => state.simulatedOutageActive
  );

  // Consolidated sync effect
  useEffect(() => {
    setLoading(isLoading);
    setWebSocketConnected(isConnected);
    setConnectionQuality(connectionQuality);
    
    if (error) {
      setError(error instanceof Error ? error.message : "Failed to load network data");
    } else {
      setError(null);
    }

    // Do not overwrite in-memory outage simulation when the user is previewing impact
    if (simulatedOutageActive) return;

    // Keep store topology in sync with the latest successful payload, including
    // valid empty responses so stale entities are not left on the map.
    if (!error) {
      setNodes(nodes);
      setConnections(connections);
    }
  }, [
    nodes, 
    connections, 
    isLoading, 
    error, 
    isConnected, 
    connectionQuality,
    simulatedOutageActive,
    setNodes, 
    setConnections, 
    setLoading, 
    setError, 
    setWebSocketConnected, 
    setConnectionQuality
  ]);

  if (isLoading && nodes.length === 0) {
    return (
      <div className="u-w-100 u-h-100 u-flex u-items-center u-justify-center u-bg-dark">
        <LoadingIndicator message="Connecting to Fiber Mesh..." />
      </div>
    );
  }

  if (error && nodes.length === 0) {
    return (
      <div className="u-w-100 u-h-100 u-flex u-items-center u-justify-center u-p-8 u-bg-dark">
        <Card
          className="u-p-8 u-text-center u-max-w-md u-border-solid u-border-secondary-subtle"
        >
          <Icon name="Warning" size={48} className="u-text-warning u-mb-4" />
          <h2 className="u-m-0 u-text-xl u-font-bold u-text-uppercase u-mb-2">
            Data Synchronization Error
          </h2>
          <p className="u-text-sm u-text-secondary-emphasis u-mb-8">
            {error instanceof Error
              ? error.message
              : "An unknown error occurred while fetching network topology."}
          </p>
          <Button
            variant="primary"
            onClick={() => window.location.reload()}
            iconName="ArrowsCounterClockwise"
            fullWidth
          >
            Retry Sync
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <>
      <NetworkStatusIndicators
        isConnected={isConnected}
        connectionQuality={connectionQuality}
        activeIncidents={stats.incidents}
        degradedNodes={stats.degraded}
        downNodes={stats.down}
        isFetching={isFetching}
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
  isFetching,
}: {
  isConnected: boolean;
  connectionQuality: string;
  activeIncidents: number;
  degradedNodes: number;
  downNodes: number;
  isFetching: boolean;
}) {
  return (
    <div 
      className="u-absolute u-mt-4 u-start-50 u-flex u-items-center u-gap-2"
      role="status"
      aria-live="polite"
    >
      <Badge
        variant={
          isConnected ? (connectionQuality === "good" ? "success" : "warning") : "error"
        }
        icon={<Icon name={isConnected ? "WifiHigh" : "WifiSlash"} size={"sm"} />}
        label={isConnected ? "Live Feed" : "Static Map"}
        size="sm"
        aria-label={isConnected ? `Live connection active, quality: ${connectionQuality}` : "Connection lost, showing cached data"}
      />

      {isFetching && (
        <Badge
          variant="primary"
          icon={<Icon name="ArrowsCounterClockwise" size={"sm"} className="u-animate-spin" />}
          label="Syncing..."
          size="sm"
        />
      )}

      {activeIncidents > 0 && (
        <Badge
          variant="error"
          icon={<Icon name="Warning" size={"sm"} />}
          label={`${activeIncidents} Active Incidents`}
          size="sm"
          aria-label={`${activeIncidents} critical incidents reported`}
        />
      )}

      {degradedNodes > 0 && (
        <Badge
          variant="warning"
          icon={<Icon name="Warning" size={"sm"} />}
          label={`${degradedNodes} Degraded`}
          size="sm"
          aria-label={`${degradedNodes} nodes experiencing performance issues`}
        />
      )}

      {downNodes > 0 && (
        <Badge
          variant="error"
          icon={<Icon name="Warning" size={"sm"} />}
          label={`${downNodes} Down`}
          size="sm"
          aria-label={`${downNodes} nodes currently offline`}
        />
      )}
    </div>
  );
}

// Main wrapper component with error boundary
export function NetworkMapDataProvider({ children }: NetworkMapDataProps) {
  return (
    <ErrorBoundary>
      <AccessibilityProvider>
        <NetworkMapDataSync>{children}</NetworkMapDataSync>
      </AccessibilityProvider>
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
