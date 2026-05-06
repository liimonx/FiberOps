"use client";

import { useEffect, useMemo, useCallback } from "react";
import { Icon, Button, Card, Badge } from "@shohojdhara/atomix";
import { Customer } from "@/types/domain";
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
import { sanitizeSearchQuery, sanitizeMetadata } from "../utils/sanitization";

interface NetworkMapDataProps {
  children: React.ReactNode;
}

// Component that fetches and syncs network data with the store
function NetworkMapDataSync({ children }: NetworkMapDataProps) {
  const { customers, nodes, connections, isLoading, error } = useNetworkData();

  const handleConnectionChange = useCallback((connected: boolean) => {
    console.log(
      "[NetworkMap] WebSocket connection:",
      connected ? "connected" : "disconnected"
    );
  }, []);

  const { isConnected, connectionQuality } = useRealTimeUpdates({
    enabled: true,
    onConnectionChange: handleConnectionChange,
  });

  const { data: activeIncidents } = useActiveIncidents();
  const { data: degradedNodes } = useNodesByStatus("degraded");
  const { data: downNodes } = useNodesByStatus("down");

  const setNodes = useNetworkMapStore((state) => state.setNodes);
  const setConnections = useNetworkMapStore((state) => state.setConnections);
  const setLoading = useNetworkMapStore((state) => state.setLoading);
  const setError = useNetworkMapStore((state) => state.setError);
  const setWebSocketConnected = useNetworkMapStore((state) => state.setWebSocketConnected);
  const setConnectionQuality = useNetworkMapStore((state) => state.setConnectionQuality);

  // Sync basic states
  useEffect(() => {
    setLoading(isLoading);
    setError(
      error instanceof Error
        ? error.message
        : error
          ? "Failed to load network data"
          : null
    );
    setWebSocketConnected(isConnected);
    setConnectionQuality(connectionQuality);
  }, [isLoading, error, isConnected, connectionQuality, setLoading, setError, setWebSocketConnected, setConnectionQuality]);

  // Sync data with sanitization and optimization
  useEffect(() => {
    const assetNodes = nodes.data ?? [];
    const customerNodes = customers.data?.map((customer: Customer) => ({
      id: customer.id,
      name: sanitizeSearchQuery(customer.name),
      type: NetworkNodeType.CUSTOMER,
      position: customer.location || { lat: 23.8103, lng: 90.4125 },
      status:
        customer.status === "online"
          ? NetworkStatus.ACTIVE
          : customer.status === "offline"
            ? NetworkStatus.ERROR
            : NetworkStatus.WARNING,
      metadata: sanitizeMetadata({
        kind: "customer",
        plan: customer.plan,
        originalStatus: customer.status,
      }),
    })) ?? [];

    if (assetNodes.length > 0 || customerNodes.length > 0) {
      setNodes([...assetNodes, ...customerNodes]);
    }

    if (connections.data) {
      setConnections(connections.data);
    }
  }, [nodes.data, customers.data, connections.data, setNodes, setConnections]);

  if (isLoading && !nodes.data) {
    return (
      <div className="u-w-100 u-h-100 u-flex u-items-center u-justify-center u-bg-dark">
        <LoadingState message="Connecting to Fiber Mesh..." />
      </div>
    );
  }

  if (error && !nodes.data) {
    return (
      <div className="u-w-100 u-h-100 u-flex u-items-center u-justify-center u-p-8 u-bg-dark">
        <Card
          glass={true}
          appearance="ghost"
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
    <div 
      className="u-absolute u-mt-4 u-start-50 u-flex u-items-center u-gap-2"
      role="status"
      aria-live="polite"
    >
      <Badge
        glass={{ blurAmount: 10 }}
        variant={
          isConnected ? (connectionQuality === "good" ? "success" : "warning") : "error"
        }
        icon={<Icon name={isConnected ? "WifiHigh" : "WifiSlash"} size={"sm"} />}
        label={isConnected ? "Live Feed" : "Static Map"}
        size="sm"
        aria-label={isConnected ? `Live connection active, quality: ${connectionQuality}` : "Connection lost, showing cached data"}
      />

      {activeIncidents > 0 && (
        <Badge
          glass={{ blurAmount: 10 }}
          variant="error"
          icon={<Icon name="Warning" size={"sm"} />}
          label={`${activeIncidents} Active Incidents`}
          size="sm"
          aria-label={`${activeIncidents} critical incidents reported`}
        />
      )}

      {degradedNodes > 0 && (
        <Badge
          glass={{ blurAmount: 10 }}
          variant="warning"
          icon={<Icon name="Warning" size={"sm"} />}
          label={`${degradedNodes} Degraded`}
          size="sm"
          aria-label={`${degradedNodes} nodes experiencing performance issues`}
        />
      )}

      {downNodes > 0 && (
        <Badge
          glass={{ blurAmount: 10 }}
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
