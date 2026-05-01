'use client';

import React from 'react';
import { Icon } from "@shohojdhara/atomix";
import { NetworkStatus } from '../types';
import { NETWORK_STATUS_COLORS, NETWORK_STATUS_LABELS } from '../constants';

interface LegendItem {
  status: NetworkStatus;
  label: string;
  color: string;
  count?: number;
  icon: string;
}

interface NetworkLegendProps {
  nodeCounts?: Partial<Record<NetworkStatus, number>>;
  connectionCounts?: Partial<Record<NetworkStatus, number>>;
  showCounts?: boolean;
  compact?: boolean;
  className?: string;
}

export const NetworkLegend: React.FC<NetworkLegendProps> = ({
  nodeCounts,
  connectionCounts,
  showCounts = true,
  compact = false,
  className = ''
}) => {
  const legendItems: LegendItem[] = [
    {
      status: NetworkStatus.ACTIVE,
      label: NETWORK_STATUS_LABELS[NetworkStatus.ACTIVE],
      color: NETWORK_STATUS_COLORS[NetworkStatus.ACTIVE],
      icon: 'Activity',
    },
    {
      status: NetworkStatus.WARNING,
      label: NETWORK_STATUS_LABELS[NetworkStatus.WARNING],
      color: NETWORK_STATUS_COLORS[NetworkStatus.WARNING],
      icon: 'Warning',
    },
    {
      status: NetworkStatus.ERROR,
      label: NETWORK_STATUS_LABELS[NetworkStatus.ERROR],
      color: NETWORK_STATUS_COLORS[NetworkStatus.ERROR],
      icon: 'WarningCircle',
    },
    {
      status: NetworkStatus.INACTIVE,
      label: NETWORK_STATUS_LABELS[NetworkStatus.INACTIVE],
      color: NETWORK_STATUS_COLORS[NetworkStatus.INACTIVE],
      icon: 'Power',
    },
  ];

  const getCountText = (status: NetworkStatus) => {
    const nodeCount = nodeCounts?.[status] || 0;
    const connectionCount = connectionCounts?.[status] || 0;
    
    if (!showCounts) return null;
    
    if (nodeCount > 0 && connectionCount > 0) {
      return `(${nodeCount} nodes, ${connectionCount} connections)`;
    } else if (nodeCount > 0) {
      return `(${nodeCount} nodes)`;
    } else if (connectionCount > 0) {
      return `(${connectionCount} connections)`;
    } else {
      return '(0)';
    }
  };

  return (
    <div 
      className={`network-legend ${compact ? 'network-legend--compact' : ''} ${className}`}
      role="region" 
      aria-label="Network Status Legend"
    >
      <div className="legend-header">
        <Icon name="List" size={compact ? 16 : 20} />
        <h3>Status Legend</h3>
      </div>
      
      <div className="legend-items">
        {legendItems.map((item) => (
          <div 
            key={item.status}
            className="legend-item"
            role="listitem"
            aria-label={`${item.label} status indicator`}
          >
            <div className="legend-color-indicator">
              <div 
                className="color-circle"
                style={{ backgroundColor: item.color }}
              />
              {compact && (
                <Icon 
                  name={item.icon as any} 
                  size={compact ? 12 : 16}
                  color={item.color}
                />
              )}
            </div>
            
            <div className="legend-content">
              <div className="legend-text">
                <span className="label">{item.label}</span>
                {!compact && (
                  <Icon 
                    name={item.icon as any} 
                    size={16}
                    color={item.color}
                    className="status-icon"
                  />
                )}
              </div>
              
              {getCountText(item.status) && (
                <span className="count-text">
                  {getCountText(item.status)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .network-legend {
          background: var(--color-background-elevated);
          border: 1px solid var(--color-border);
          border-radius: var(--border-radius-lg);
          padding: var(--spacing-md);
          box-shadow: var(--shadow-sm);
          min-width: ${compact ? '180px' : '240px'};
          backdrop-filter: blur(10px);
          max-height: ${compact ? '160px' : 'auto'};
          overflow-y: auto;
        }

        .network-legend--compact {
          padding: var(--spacing-sm);
        }

        .legend-header {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          margin-bottom: var(--spacing-md);
          padding-bottom: var(--spacing-sm);
          border-bottom: 1px solid var(--color-border-subtle);
        }

        .legend-header h3 {
          margin: 0;
          font-size: ${compact ? 'var(--font-size-sm)' : 'var(--font-size-lg)'};
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
        }

        .legend-items {
          display: flex;
          flex-direction: column;
          gap: ${compact ? 'var(--spacing-xs)' : 'var(--spacing-sm)'};
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: ${compact ? 'var(--spacing-xs)' : 'var(--spacing-sm)'};
          border-radius: var(--border-radius-md);
          transition: background-color var(--duration-fast) ease;
        }

        .legend-item:hover {
          background-color: var(--color-background-hover);
        }

        .legend-color-indicator {
          display: flex;
          align-items: center;
          gap: ${compact ? 'var(--spacing-xs)' : 'var(--spacing-sm)'};
          min-width: ${compact ? '20px' : '28px'};
        }

        .color-circle {
          width: ${compact ? '12px' : '16px'};
          height: ${compact ? '12px' : '16px'};
          border-radius: 50%;
          border: ${compact ? '1px' : '2px'} solid var(--color-border);
          flex-shrink: 0;
        }

        .legend-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;
        }

        .legend-text {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
        }

        .label {
          font-size: ${compact ? 'var(--font-size-xs)' : 'var(--font-size-sm)'};
          font-weight: var(--font-weight-medium);
          color: var(--color-text-primary);
        }

        .status-icon {
          flex-shrink: 0;
        }

        .count-text {
          font-size: var(--font-size-xs);
          color: var(--color-text-tertiary);
          font-weight: var(--font-weight-normal);
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .network-legend {
            min-width: 200px;
          }

          .network-legend--compact {
            min-width: 160px;
          }
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .color-circle {
            border-width: 3px;
          }

          .legend-header {
            border-bottom-width: 2px;
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .legend-item {
            transition: none;
          }
        }

        /* Accessibility focus styles */
        .legend-item:focus {
          outline: 2px solid var(--color-primary-500);
          outline-offset: 2px;
        }

        .legend-item:focus:not(:focus-visible) {
          outline: none;
        }
      `}</style>
    </div>
  );
};

// Export component variants
export const CompactNetworkLegend: React.FC<NetworkLegendProps> = (props) => (
  <NetworkLegend compact={true} {...props} />
);

export const DetailedNetworkLegend: React.FC<NetworkLegendProps> = (props) => (
  <NetworkLegend showCounts={true} compact={false} {...props} />
);