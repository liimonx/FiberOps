"use client";

import { useEffect, useMemo } from "react";
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

interface NetworkMapDataProps {
  children: React.ReactNode;
}

// Component that fetches and syncs network data with the store
function NetworkMapDataSync({ children }: NetworkMapDataProps) {
  const { customers, nodes, connections, isLoading, error } = useNetworkData();

  const { isConnected, connectionQuality } = useRealTimeUpdates({
    enabled: false,
    onConnectionChange: (connected) => {
      console.log(
        "[NetworkMap] WebSocket connection:",
        connected ? "connected" : "disconnected"
      );
    },
  });

  const { data: activeIncidents } = useActiveIncidents();
  const { data: degradedNodes } = useNodesByStatus("degraded");
  const { data: downNodes } = useNodesByStatus("down");

  const setNodes = useNetworkMapStore((state) => state.setNodes);
  const setConnections = useNetworkMapStore((state) => state.setConnections);
  const setLoading = useNetworkMapStore((state) => state.setLoading);
  const setError = useNetworkMapStore((state) => state.setError);
  const setWebSocketConnected = useNetworkMapStore(
    (state) => state.setWebSocketConnected
  );
  const setConnectionQuality = useNetworkMapStore((state) => state.setConnectionQuality);

  // Single merge: avoids asset-only effect overwriting customer nodes when queries resolve out of order.
  useEffect(() => {
    const assetNodes = nodes.data ?? [];
    const customerNodes =
      customers.data?.map((customer: Customer) => ({
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
      })) ?? [];

    if (assetNodes.length === 0 && customerNodes.length === 0) return;

    setNodes([...assetNodes, ...customerNodes]);
  }, [nodes.data, customers.data, setNodes]);

  useEffect(() => {
    if (connections.data !== undefined) {
      setConnections(connections.data);
    }
  }, [connections.data, setConnections]);

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);

  useEffect(() => {
    setError(
      error instanceof Error
        ? error.message
        : error
          ? "Failed to load network data"
          : null
    );
  }, [error, setError]);

  useEffect(() => {
    setWebSocketConnected(isConnected);
    setConnectionQuality(connectionQuality);
  }, [isConnected, connectionQuality, setWebSocketConnected, setConnectionQuality]);

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
          className="u-p-8 u-text-center u-max-w-md u-bg-white-opacity-5"
        >
          <Icon name="Warning" size={48} className="u-text-warning u-mb-4" />
          <h2 className="u-m-0 u-text-xl u-font-bold  u-text-uppercase u-mb-2">
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
    <div className="u-absolute u-mt-4 u-start-50 u-flex u-items-center  u-gap-2">
      {/* WebSocket Connection Status */}
      <Badge
        glass={{
          blurAmount: 10,
        }}
        variant={
          isConnected ? (connectionQuality === "good" ? "success" : "warning") : "error"
        }
        icon={<Icon name={isConnected ? "WifiHigh" : "WifiSlash"} size={"sm"} />}
        label={isConnected ? "Live Feed" : "Static Map"}
        size="sm"
      />

      {/* Active Incidents Badge */}
      {activeIncidents > 0 && (
        <Badge
          glass={{
            blurAmount: 10,
          }}
          variant="error"
          icon={<Icon name="Warning" size={"sm"} />}
          label={`${activeIncidents} Active Incidents`}
          size="sm"
        />
      )}

      {/* Node Status Summary - Degraded */}
      {degradedNodes > 0 && (
        <Badge
          glass={{
            blurAmount: 10,
          }}
          variant="warning"
          icon={<Icon name="Warning" size={"sm"} />}
          label={`${degradedNodes} Degraded`}
          size="sm"
        />
      )}

      {/* Node Status Summary - Down */}
      {downNodes > 0 && (
        <Badge
          glass={{
            blurAmount: 10,
          }}
          variant="error"
          icon={<Icon name="Warning" size={"sm"} />}
          label={`${downNodes} Down`}
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
