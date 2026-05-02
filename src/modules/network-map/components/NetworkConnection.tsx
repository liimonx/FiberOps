"use client";

import React, { useMemo } from "react";
import { Icon, Card } from "@shohojdhara/atomix";
import {
  NetworkConnection as NetworkConnectionType,
  NetworkStatus,
  LatLng,
} from "../types";
import { NETWORK_STATUS_COLORS } from "../constants";

interface NetworkConnectionProps {
  connection: NetworkConnectionType;
  sourcePosition: LatLng;
  targetPosition: LatLng;
  selected?: boolean;
  hovered?: boolean;
  animated?: boolean;
  showMetrics?: boolean;
  onClick?: (connection: NetworkConnectionType) => void;
  onMouseEnter?: (connection: NetworkConnectionType) => void;
  onMouseLeave?: () => void;
  className?: string;
}

export const NetworkConnection: React.FC<NetworkConnectionProps> = ({
  connection,
  sourcePosition,
  targetPosition,
  selected = false,
  hovered = false,
  animated = true,
  showMetrics = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
  className = "",
}) => {
  const statusColor = NETWORK_STATUS_COLORS[connection.status];

  const pathData = useMemo(() => {
    if (connection.route && connection.route.length > 0) {
      return connection.route
        .map((point, index) => `${index === 0 ? "M" : "L"} ${point.lng} ${point.lat}`)
        .join(" ");
    }
    return `M ${sourcePosition.lng} ${sourcePosition.lat} L ${targetPosition.lng} ${targetPosition.lat}`;
  }, [connection.route, sourcePosition, targetPosition]);

  const getStatusIcon = () => {
    switch (connection.status) {
      case NetworkStatus.ACTIVE:
        return "Activity";
      case NetworkStatus.WARNING:
        return "Warning";
      case NetworkStatus.ERROR:
        return "WarningCircle";
      case NetworkStatus.INACTIVE:
        return "Power";
      default:
        return "Activity";
    }
  };

  return (
    <div
      className={`u-absolute u-cursor-pointer u-transition-all u-z-5 ${className}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(connection);
      }}
      onMouseEnter={() => onMouseEnter?.(connection)}
      onMouseLeave={onMouseLeave}
      role="button"
      aria-label={`Connection ${connection.id} - ${connection.status}`}
      tabIndex={0}
    >
      <svg
        className="u-absolute u-inset-0 u-w-100 u-h-100 u-overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <marker
            id={`arrowhead-${connection.id}`}
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3, 0 6"
              fill={statusColor}
              opacity={connection.status === NetworkStatus.ACTIVE ? 1 : 0.5}
            />
          </marker>
        </defs>

        <path
          d={pathData}
          className="u-transition-all"
          style={{
            stroke: statusColor,
            strokeWidth: selected ? 4 : hovered ? 3 : 2,
            strokeDasharray:
              connection.status === NetworkStatus.INACTIVE ? "5,5" : "none",
            fill: "none",
            filter: selected || hovered ? `drop-shadow(0 0 4px ${statusColor})` : "none",
          }}
          markerEnd={
            connection.status === NetworkStatus.ACTIVE
              ? `url(#arrowhead-${connection.id})`
              : undefined
          }
        />

        {animated && connection.status === NetworkStatus.ACTIVE && (
          <path
            d={pathData}
            className="u-animate-pulse"
            style={{
              stroke: statusColor,
              strokeWidth: 2,
              fill: "none",
              strokeDasharray: "10, 20",
              opacity: 0.6,
            }}
          />
        )}
      </svg>

      {/* Metrics overlay */}
      {showMetrics && (
        <div className="u-absolute u-top-50 u-start-50 u-transform-center u-pointer-events-none u-z-10">
          <Card glass={true} className="u-px-3 u-py-2 u-shadow-lg">
            <div className="u-flex u-items-center u-gap-2">
              <Icon
                name={getStatusIcon() as any}
                size={14}
                style={{ color: statusColor }}
              />
              {connection.bandwidth && (
                <span className="u-text-xs u-font-bold ">
                  {connection.bandwidth} Mbps
                </span>
              )}
              {connection.utilization !== undefined && (
                <span className="u-text-xs u-text-secondary-emphasis u-opacity-70">
                  {connection.utilization}%
                </span>
              )}
            </div>
          </Card>
        </div>
      )}

      <style jsx>{`
        div:focus {
          outline: 2px solid var(--color-primary);
          outline-offset: 4px;
        }
      `}</style>
    </div>
  );
};

export const NetworkConnections: React.FC<{
  connections: NetworkConnectionType[];
  nodePositions: Map<string, LatLng>;
  selectedConnectionId?: string;
  hoveredConnectionId?: string;
  onConnectionClick?: (connection: NetworkConnectionType) => void;
  onConnectionHover?: (connection: NetworkConnectionType | null) => void;
}> = ({
  connections,
  nodePositions,
  selectedConnectionId,
  hoveredConnectionId,
  onConnectionClick,
  onConnectionHover,
}) => {
  return (
    <>
      {connections.map((connection) => {
        const sourcePosition = nodePositions.get(connection.sourceNodeId);
        const targetPosition = nodePositions.get(connection.targetNodeId);
        if (!sourcePosition || !targetPosition) return null;

        return (
          <NetworkConnection
            key={connection.id}
            connection={connection}
            sourcePosition={sourcePosition}
            targetPosition={targetPosition}
            selected={connection.id === selectedConnectionId}
            hovered={connection.id === hoveredConnectionId}
            onClick={onConnectionClick}
            onMouseEnter={onConnectionHover}
            onMouseLeave={() => onConnectionHover?.(null)}
          />
        );
      })}
    </>
  );
};
