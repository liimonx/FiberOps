"use client";

import React, { useMemo } from 'react';
import { Icon } from "@shohojdhara/atomix";
import { NetworkConnection as NetworkConnectionType, NetworkStatus, LatLng } from '../types';
import { NETWORK_STATUS_COLORS } from '../constants';

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
  className = ''
}) => {
  const statusColor = NETWORK_STATUS_COLORS[connection.status];
  
  const pathData = useMemo(() => {
    if (connection.route && connection.route.length > 0) {
      return connection.route.map((point, index) => 
        `${index === 0 ? 'M' : 'L'} ${point.lng} ${point.lat}`
      ).join(' ');
    }
    return `M ${sourcePosition.lng} ${sourcePosition.lat} L ${targetPosition.lng} ${targetPosition.lat}`;
  }, [connection.route, sourcePosition, targetPosition]);

  const connectionClasses = [
    'network-connection',
    `network-connection--${connection.status}`,
    selected && 'network-connection--selected',
    hovered && 'network-connection--hover',
    animated && 'network-connection--animated',
    className
  ].filter(Boolean).join(' ');

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.(connection);
  };

  const handleMouseEnter = () => {
    onMouseEnter?.(connection);
  };

  const getStatusIcon = () => {
    switch (connection.status) {
      case NetworkStatus.ACTIVE:
        return 'Activity';
      case NetworkStatus.WARNING:
        return 'Warning';
      case NetworkStatus.ERROR:
        return 'WarningCircle';
      case NetworkStatus.INACTIVE:
        return 'Power';
      default:
        return 'Activity';
    }
  };

  return (
    <div
      className={connectionClasses}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onMouseLeave}
      role="button"
      aria-label={`Connection ${connection.id} - ${connection.status}`}
      tabIndex={0}
      data-connection-id={connection.id}
      data-connection-status={connection.status}
    >
      <svg className="connection-svg" preserveAspectRatio="none">
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
          
          <linearGradient id={`gradient-${connection.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={statusColor} stopOpacity={0.8} />
            <stop offset="50%" stopColor={statusColor} stopOpacity={1} />
            <stop offset="100%" stopColor={statusColor} stopOpacity={0.8} />
          </linearGradient>
        </defs>
        
        <path
          d={pathData}
          className="connection-path"
          style={{
            stroke: `url(#gradient-${connection.id})`,
            strokeWidth: selected ? 4 : hovered ? 3 : 2,
            strokeDasharray: connection.status === NetworkStatus.INACTIVE ? '5,5' : 'none',
          }}
          markerEnd={connection.status === NetworkStatus.ACTIVE ? `url(#arrowhead-${connection.id})` : undefined}
        />
        
        {animated && connection.status === NetworkStatus.ACTIVE && (
          <path
            d={pathData}
            className="connection-flow"
            style={{
              stroke: statusColor,
              strokeWidth: 2,
            }}
          />
        )}
      </svg>

      {/* Metrics overlay */}
      {showMetrics && (
        <div className="connection-metrics">
          <div className="metrics-content">
            <Icon name={getStatusIcon() as any} size={12} className="status-icon" />
            {connection.bandwidth && (
              <span className="bandwidth">{connection.bandwidth} Mbps</span>
            )}
            {connection.utilization !== undefined && (
              <span className="utilization">{connection.utilization}% used</span>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .network-connection {
          position: absolute;
          cursor: pointer;
          transition: all var(--duration-normal) ease;
          z-index: 5;
        }

        .connection-svg {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: visible;
        }

        .connection-path {
          fill: none;
          transition: all var(--duration-normal) ease;
        }

        .connection-flow {
          fill: none;
          stroke-dasharray: 10, 20;
          stroke-dashoffset: 0;
          animation: flow 1s linear infinite;
          opacity: 0.6;
        }

        @keyframes flow {
          0% {
            stroke-dashoffset: 0;
          }
          100% {
            stroke-dashoffset: -30;
          }
        }

        .connection-metrics {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(0, 0, 0, 0.8);
          border: 1px solid ${statusColor};
          border-radius: 6px;
          padding: 6px 10px;
          font-size: 11px;
          color: white;
          pointer-events: none;
          z-index: 10;
          white-space: nowrap;
        }

        .metrics-content {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .status-icon {
          color: ${statusColor};
        }

        .bandwidth,
        .utilization {
          font-weight: var(--font-weight-medium);
        }

        /* Status-specific styles */
        .network-connection--active .connection-path {
          filter: drop-shadow(0 0 2px ${statusColor});
        }

        .network-connection--warning .connection-path {
          filter: drop-shadow(0 0 2px ${statusColor});
          animation: pulse 2s ease-in-out infinite;
        }

        .network-connection--error .connection-path {
          filter: drop-shadow(0 0 4px ${statusColor});
          animation: pulse 1s ease-in-out infinite;
        }

        .network-connection--inactive .connection-path {
          opacity: 0.4;
        }

        /* Interaction states */
        .network-connection--selected .connection-path {
          filter: drop-shadow(0 0 6px rgba(245, 158, 11, 0.5));
        }

        .network-connection--hover .connection-path {
          filter: drop-shadow(0 0 4px rgba(59, 130, 246, 0.5));
          stroke-width: 3 !important;
        }

        /* Focus states for accessibility */
        .network-connection:focus {
          outline: none;
        }

        .network-connection:focus .connection-path {
          filter: drop-shadow(0 0 6px var(--color-primary-500));
          stroke-width: 4;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .connection-flow {
            animation: none;
            opacity: 0.3;
          }

          .network-connection--warning .connection-path,
          .network-connection--error .connection-path {
            animation: none;
            opacity: 0.7;
          }

          .network-connection {
            transition: none;
          }

          .connection-path {
            transition: none;
          }
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
          .connection-path {
            stroke-width: 3 !important;
          }
        }
      `}</style>
    </div>
  );
};

// Collection component for rendering multiple connections
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
  onConnectionHover 
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
