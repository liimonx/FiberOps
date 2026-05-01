'use client';

import React from 'react';
import { Icon } from "@shohojdhara/atomix";
import type { NetworkNode } from '../types';
import { NETWORK_STATUS_COLORS, NETWORK_STATUS_LABELS } from '../constants';

interface NodeTooltipProps {
  node: NetworkNode;
  position: { x: number; y: number };
  visible?: boolean;
  className?: string;
}

export const NodeTooltip: React.FC<NodeTooltipProps> = ({
  node,
  position,
  visible = true,
  className = ''
}) => {
  if (!visible) return null;

  const {
    id,
    name,
    status,
    type,
    location,
    capacity,
    utilization,
    lastSeen,
    properties
  } = node;

  const statusColor = NETWORK_STATUS_COLORS[status];
  const statusLabel = NETWORK_STATUS_LABELS[status];

  const formatLastSeen = (timestamp?: string) => {
    if (!timestamp) return 'Unknown';
    
    const now = new Date();
    const lastSeenDate = new Date(timestamp);
    const diffMinutes = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getNodeIcon = () => {
    switch (type) {
      case 'switch':
        return 'Server';
      case 'router':
        return 'Network';
      case 'server':
        return 'HardDrive';
      case 'access_point':
        return 'Wifi';
      case 'core':
        return 'Cpu';
      case 'distribution':
        return 'Share';
      default:
        return 'Circle';
    }
  };

  const getUtilizationClass = (utilization?: number) => {
    if (!utilization) return '';
    if (utilization >= 90) return 'critical';
    if (utilization >= 75) return 'high';
    if (utilization >= 50) return 'medium';
    return 'low';
  };

  return (
    <div 
      className={`node-tooltip ${className}`}
      style={{
        position: 'absolute',
        left: position.x + 20,
        top: position.y + 20,
        zIndex: 1000,
      }}
      role="tooltip"
      aria-live="polite"
    >
      <div className="tooltip-content">
        {/* Header */}
        <div className="tooltip-header">
          <div className="node-type-badge">
            <Icon name={getNodeIcon() as any} size={16} />
            <span className="node-type">{type}</span>
          </div>
          <div 
            className="status-badge"
            style={{ backgroundColor: statusColor }}
          >
            <Icon name="Activity" size={12} />
            <span>{statusLabel}</span>
          </div>
        </div>

        {/* Node Information */}
        <div className="node-info">
          <div className="info-row">
            <Icon name="Hash" size={14} className="info-icon" />
            <span className="info-label">ID:</span>
            <code className="node-id">{id}</code>
          </div>
          
          <div className="info-row">
            <Icon name="Tag" size={14} className="info-icon" />
            <span className="info-label">Name:</span>
            <span className="node-name">{name}</span>
          </div>
          
          {location && (
            <div className="info-row">
              <Icon name="MapPin" size={14} className="info-icon" />
              <span className="info-label">Location:</span>
              <span className="node-location">{location.address}</span>
            </div>
          )}
        </div>

        {/* Capacity and Utilization */}
        <div className="metrics-section">
          <h4 className="metrics-title">Metrics</h4>
          
          {capacity && (
            <div className="metric-row">
              <span className="metric-label">Capacity:</span>
              <span className="metric-value">{capacity.total} Gbps</span>
            </div>
          )}
          
          {utilization !== undefined && (
            <div className="metric-row">
              <span className="metric-label">Utilization:</span>
              <div className="utilization-bar-container">
                <div 
                  className={`utilization-bar ${getUtilizationClass(utilization)}`}
                  style={{ width: `${utilization}%` }}
                />
                <span className="utilization-text">{utilization}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Additional Properties */}
        {properties && Object.keys(properties).length > 0 && (
          <div className="properties-section">
            <h4 className="properties-title">Properties</h4>
            <div className="properties-grid">
              {Object.entries(properties).map(([key, value]) => (
                <div key={key} className="property-item">
                  <span className="property-key">{key}:</span>
                  <span className="property-value">{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="metadata-section">
          <div className="metadata-row">
            <Icon name="Clock" size={12} />
            <span>Last seen: {formatLastSeen(lastSeen)}</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .node-tooltip {
          background: var(--color-background-elevated);
          border: 1px solid var(--color-border);
          border-radius: var(--border-radius-lg);
          box-shadow: var(--shadow-lg);
          backdrop-filter: blur(10px);
          max-width: 320px;
          min-width: 280px;
          animation: fadeIn var(--duration-fast) ease;
        }

        .tooltip-content {
          padding: var(--spacing-md);
        }

        .tooltip-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-md);
          padding-bottom: var(--spacing-sm);
          border-bottom: 1px solid var(--color-border-subtle);
        }

        .node-type-badge {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          background: var(--color-background-subtle);
          padding: var(--spacing-xs) var(--spacing-sm);
          border-radius: var(--border-radius-md);
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-medium);
          text-transform: capitalize;
        }

        .status-badge {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          padding: var(--spacing-xs) var(--spacing-sm);
          border-radius: var(--border-radius-md);
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-medium);
          color: white;
        }

        .node-info {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
          margin-bottom: var(--spacing-md);
        }

        .info-row {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }

        .info-icon {
          color: var(--color-text-tertiary);
          flex-shrink: 0;
        }

        .info-label {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-secondary);
          min-width: 70px;
        }

        .node-id {
          background: var(--color-background-subtle);
          padding: 2px 6px;
          border-radius: var(--border-radius-sm);
          font-family: var(--font-family-mono);
          font-size: var(--font-size-xs);
          color: var(--color-text-primary);
        }

        .metrics-section {
          margin-bottom: var(--spacing-md);
        }

        .metrics-title,
        .properties-title {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-semibold);
          margin: 0 0 var(--spacing-sm) 0;
          color: var(--color-text-primary);
        }

        .metric-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-xs);
        }

        .metric-label {
          font-size: var(--font-size-sm);
          color: var(--color-text-secondary);
        }

        .metric-value {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          color: var(--color-text-primary);
        }

        .utilization-bar-container {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          width: 120px;
        }

        .utilization-bar {
          height: 6px;
          background: var(--color-success-500);
          border-radius: 3px;
          transition: width var(--duration-normal) ease;
          flex: 1;
        }

        .utilization-bar.medium {
          background: var(--color-warning-500);
        }

        .utilization-bar.high {
          background: var(--color-warning-600);
        }

        .utilization-bar.critical {
          background: var(--color-error-500);
        }

        .utilization-text {
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-medium);
          min-width: 30px;
          text-align: right;
        }

        .properties-section {
          margin-bottom: var(--spacing-md);
        }

        .properties-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--spacing-sm);
        }

        .property-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .property-key {
          font-size: var(--font-size-xs);
          color: var(--color-text-tertiary);
          font-weight: var(--font-weight-medium);
          text-transform: capitalize;
        }

        .property-value {
          font-size: var(--font-size-sm);
          color: var(--color-text-primary);
          word-break: break-all;
        }

        .metadata-section {
          border-top: 1px solid var(--color-border-subtle);
          padding-top: var(--spacing-sm);
        }

        .metadata-row {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          font-size: var(--font-size-xs);
          color: var(--color-text-tertiary);
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        /* Responsive adjustments */
        @media (max-width: 480px) {
          .node-tooltip {
            max-width: 280px;
            min-width: 240px;
          }

          .tooltip-content {
            padding: var(--spacing-sm);
          }

          .properties-grid {
            grid-template-columns: 1fr;
          }
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
          .node-tooltip {
            border: 2px solid var(--color-border);
          }

          .tooltip-header {
            border-bottom-width: 2px;
          }

          .metadata-section {
            border-top-width: 2px;
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .node-tooltip {
            animation: none;
          }

          .utilization-bar {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
};