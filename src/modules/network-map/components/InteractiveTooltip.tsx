"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Icon } from "@shohojdhara/atomix";
import { Card, Button } from "@shohojdhara/atomix";
import { NetworkNode, NetworkConnection, NetworkStatus, NetworkNodeType } from '../types';
import { StatusIndicator, StatusBadge } from './StatusIndicator';
import { NETWORK_STATUS_COLORS, NODE_TYPE_ICONS } from '../constants';

export interface TooltipContent {
  title: string;
  subtitle?: string;
  status: NetworkStatus;
  details: Array<{ label: string; value: string | number; icon?: string }>;
  actions?: Array<{ label: string; icon: string; onClick: () => void; variant?: 'primary' | 'secondary' }>;
  metadata?: Record<string, any>;
}

interface InteractiveTooltipProps {
  content: TooltipContent;
  node?: NetworkNode;
  connection?: NetworkConnection;
  position: { x: number; y: number };
  visible: boolean;
  onClose?: () => void;
  onActionClick?: (actionId: string) => void;
  anchor?: 'top' | 'bottom' | 'left' | 'right';
  offset?: number;
  className?: string;
  maxWidth?: number;
  interactive?: boolean;
}

export const InteractiveTooltip: React.FC<InteractiveTooltipProps> = ({
  content,
  node,
  connection,
  position,
  visible,
  onClose,
  onActionClick,
  anchor = 'top',
  offset = 12,
  className = '',
  maxWidth = 280,
  interactive = true
}) => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);
  const [isExpanded, setIsExpanded] = useState(false);

  // Adjust position to keep tooltip within viewport
  useEffect(() => {
    if (!visible || !tooltipRef.current) return;

    const tooltip = tooltipRef.current;
    const rect = tooltip.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    let adjusted = { ...position };

    // Horizontal adjustment
    if (rect.right > viewport.width) {
      adjusted.x = position.x - rect.width - offset;
    } else if (rect.left < 0) {
      adjusted.x = offset;
    }

    // Vertical adjustment
    if (rect.bottom > viewport.height) {
      adjusted.y = position.y - rect.height - offset;
    } else if (rect.top < 0) {
      adjusted.y = offset;
    }

    setAdjustedPosition(adjusted);
  }, [position, visible, offset]);

  const getAnchorStyles = useCallback(() => {
    const base = {
      position: 'absolute' as const,
      zIndex: 1000,
      maxWidth: `${maxWidth}px`
    };

    switch (anchor) {
      case 'top':
        return {
          ...base,
          left: adjustedPosition.x,
          bottom: `calc(100vh - ${adjustedPosition.y - offset}px)`
        };
      case 'bottom':
        return {
          ...base,
          left: adjustedPosition.x,
          top: adjustedPosition.y + offset
        };
      case 'left':
        return {
          ...base,
          right: `calc(100vw - ${adjustedPosition.x - offset}px)`,
          top: adjustedPosition.y
        };
      case 'right':
        return {
          ...base,
          left: adjustedPosition.x + offset,
          top: adjustedPosition.y
        };
    }
  }, [adjustedPosition, anchor, offset, maxWidth]);

  const handleActionClick = (actionIndex: number) => {
    const action = content.actions?.[actionIndex];
    if (action) {
      action.onClick();
      onActionClick?.(`${actionIndex}`);
    }
  };

  const getNodeIcon = () => {
    if (!node) return 'Circle';
    return NODE_TYPE_ICONS[node.type] || 'Circle';
  };

  const getNodeTypeLabel = () => {
    if (!node) return '';
    return node.type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (!visible) return null;

  return (
    <div
      ref={tooltipRef}
      className={`interactive-tooltip ${className}`}
      style={getAnchorStyles()}
      role="dialog"
      aria-label={`${content.title} details`}
      aria-modal={interactive}
    >
      <Card appearance="elevated" glass={true} className="tooltip-card">
        {/* Header */}
        <div className="tooltip-header">
          <div className="header-icon">
            {node && (
              <div 
                className="node-icon-wrapper"
                style={{ backgroundColor: NETWORK_STATUS_COLORS[node.status] }}
              >
                <Icon name={getNodeIcon() as any} size={20} />
              </div>
            )}
            {connection && (
              <div 
                className="connection-icon-wrapper"
                style={{ backgroundColor: NETWORK_STATUS_COLORS[connection.status] }}
              >
                <Icon name={"Activity" as any} size={20} />
              </div>
            )}
          </div>
          
          <div className="header-content">
            <h4 className="tooltip-title">{content.title}</h4>
            {content.subtitle && (
              <span className="tooltip-subtitle">{content.subtitle}</span>
            )}
            {node && (
              <span className="node-type-label">{getNodeTypeLabel()}</span>
            )}
          </div>
          
          <div className="header-status">
            <StatusIndicator 
              status={content.status} 
              size="sm" 
              showLabel={false}
              pulse={content.status === NetworkStatus.ERROR || content.status === NetworkStatus.WARNING}
            />
            {onClose && (
              <Button
                variant="secondary"
                size="sm"
                iconName="X"
                onClick={onClose}
                aria-label="Close tooltip"
                className="close-button"
              />
            )}
          </div>
        </div>

        {/* Details Section */}
        <div className="tooltip-details">
          {content.details.map((detail, index) => (
            <div key={index} className="detail-row">
              {detail.icon && (
                <Icon name={detail.icon as any} size={14} className="detail-icon" />
              )}
              <span className="detail-label">{detail.label}:</span>
              <span className="detail-value">{detail.value}</span>
            </div>
          ))}
        </div>

        {/* Expandable Metadata Section */}
        {content.metadata && Object.keys(content.metadata).length > 0 && (
          <div className={`metadata-section ${isExpanded ? 'expanded' : ''}`}>
            <button
              className="expand-toggle"
              onClick={() => setIsExpanded(!isExpanded)}
              aria-expanded={isExpanded}
            >
              <span>Additional Information</span>
              <Icon 
                name={isExpanded ? "CaretUp" : "CaretDown"} 
                size={14} 
                className="toggle-icon"
              />
            </button>
            
            {isExpanded && (
              <div className="metadata-content">
                {Object.entries(content.metadata).map(([key, value]) => (
                  <div key={key} className="metadata-item">
                    <span className="metadata-key">{key}:</span>
                    <span className="metadata-value">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {content.actions && content.actions.length > 0 && (
          <div className="tooltip-actions" role="group" aria-label="Available actions">
            {content.actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'secondary'}
                size="sm"
                iconName={action.icon as any}
                onClick={() => handleActionClick(index)}
                className={`action-button action-button--${action.variant || 'secondary'}`}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}

        {/* Arrow indicator */}
        <div className={`tooltip-arrow tooltip-arrow--${anchor}`} />
      </Card>

      <style jsx>{`
        .interactive-tooltip {
          pointer-events: auto;
          animation: tooltip-in 0.2s ease-out;
        }

        @keyframes tooltip-in {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .tooltip-card {
          padding: 0;
          overflow: hidden;
        }

        .tooltip-header {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px;
          border-bottom: 1px solid var(--color-gray-700);
        }

        .header-icon {
          flex-shrink: 0;
        }

        .node-icon-wrapper,
        .connection-icon-wrapper {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .header-content {
          flex: 1;
          min-width: 0;
        }

        .tooltip-title {
          margin: 0;
          font-size: 14px;
          font-weight: var(--font-weight-semibold);
          color: var(--color-gray-100);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .tooltip-subtitle {
          display: block;
          font-size: 12px;
          color: var(--color-gray-400);
          margin-top: 2px;
        }

        .node-type-label {
          display: block;
          font-size: 11px;
          color: var(--color-gray-500);
          margin-top: 2px;
          text-transform: capitalize;
        }

        .header-status {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .close-button {
          padding: 4px;
          min-width: auto;
        }

        .tooltip-details {
          padding: 12px 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .detail-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
        }

        .detail-icon {
          color: var(--color-gray-500);
          flex-shrink: 0;
        }

        .detail-label {
          color: var(--color-gray-400);
          white-space: nowrap;
        }

        .detail-value {
          color: var(--color-gray-200);
          font-weight: var(--font-weight-medium);
          margin-left: auto;
        }

        .metadata-section {
          border-top: 1px solid var(--color-gray-700);
        }

        .expand-toggle {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 16px;
          background: none;
          border: none;
          color: var(--color-gray-400);
          font-size: 12px;
          cursor: pointer;
          transition: color var(--duration-normal) ease;
        }

        .expand-toggle:hover {
          color: var(--color-gray-200);
        }

        .toggle-icon {
          transition: transform var(--duration-normal) ease;
        }

        .metadata-content {
          padding: 0 16px 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .metadata-item {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
        }

        .metadata-key {
          color: var(--color-gray-500);
        }

        .metadata-value {
          color: var(--color-gray-300);
          font-family: monospace;
          max-width: 60%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .tooltip-actions {
          display: flex;
          gap: 8px;
          padding: 12px 16px;
          border-top: 1px solid var(--color-gray-700);
          flex-wrap: wrap;
        }

        .action-button {
          flex: 1;
          min-width: 80px;
        }

        .tooltip-arrow {
          position: absolute;
          width: 12px;
          height: 12px;
          background: var(--color-gray-800);
          border: 1px solid var(--color-gray-700);
        }

        .tooltip-arrow--top {
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%) rotate(45deg);
          border-top: none;
          border-left: none;
        }

        .tooltip-arrow--bottom {
          top: -6px;
          left: 50%;
          transform: translateX(-50%) rotate(45deg);
          border-bottom: none;
          border-right: none;
        }

        .tooltip-arrow--left {
          right: -6px;
          top: 50%;
          transform: translateY(-50%) rotate(45deg);
          border-bottom: none;
          border-left: none;
        }

        .tooltip-arrow--right {
          left: -6px;
          top: 50%;
          transform: translateY(-50%) rotate(45deg);
          border-top: none;
          border-right: none;
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .interactive-tooltip {
            animation: none;
          }

          .toggle-icon {
            transition: none;
          }

          .expand-toggle {
            transition: none;
          }
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
          .tooltip-card {
            border: 2px solid white;
          }

          .tooltip-header {
            border-bottom-width: 2px;
          }

          .detail-label {
            color: white;
          }

          .detail-value {
            color: white;
            font-weight: bold;
          }
        }
      `}</style>
    </div>
  );
};

// Simple tooltip for basic use cases
export const SimpleTooltip: React.FC<{
  title: string;
  content: React.ReactNode;
  visible: boolean;
  position: { x: number; y: number };
  className?: string;
}> = ({ title, content, visible, position, className = '' }) => {
  if (!visible) return null;

  return (
    <div
      className={`simple-tooltip ${className}`}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y - 12,
        transform: 'translate(-50%, -100%)',
        zIndex: 1000
      }}
      role="tooltip"
    >
      <Card appearance="elevated" glass={true} className="simple-tooltip-card">
        <div className="simple-tooltip-content">
          <strong className="simple-tooltip-title">{title}</strong>
          <div className="simple-tooltip-body">{content}</div>
        </div>
      </Card>

      <style jsx>{`
        .simple-tooltip {
          pointer-events: none;
          animation: simple-tooltip-in 0.15s ease-out;
        }

        @keyframes simple-tooltip-in {
          from {
            opacity: 0;
            transform: translate(-50%, calc(-100% + 4px));
          }
          to {
            opacity: 1;
            transform: translate(-50%, -100%);
          }
        }

        .simple-tooltip-card {
          padding: 12px 16px;
          max-width: 240px;
        }

        .simple-tooltip-title {
          display: block;
          font-size: 13px;
          color: var(--color-gray-100);
          margin-bottom: 4px;
        }

        .simple-tooltip-body {
          font-size: 12px;
          color: var(--color-gray-400);
        }

        @media (prefers-reduced-motion: reduce) {
          .simple-tooltip {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
};

// Utility to create tooltip content from node
export const createNodeTooltipContent = (node: NetworkNode): TooltipContent => ({
  title: node.name,
  status: node.status,
  details: [
    { label: 'Type', value: node.type, icon: 'Tag' },
    { label: 'ID', value: node.id, icon: 'Fingerprint' },
    ...(node.capacity ? [{ label: 'Capacity', value: `${node.capacity} ports`, icon: 'HardDrives' }] : []),
    ...(node.utilization !== undefined ? [{ label: 'Utilization', value: `${node.utilization}%`, icon: 'Gauge' }] : []),
    { label: 'Location', value: `${node.position.lat.toFixed(4)}, ${node.position.lng.toFixed(4)}`, icon: 'MapPin' }
  ],
  actions: [
    { label: 'View Details', icon: 'Eye', onClick: () => {}, variant: 'primary' },
    { label: 'Trace Path', icon: 'GitBranch', onClick: () => {}, variant: 'secondary' }
  ],
  metadata: node.metadata
});

// Utility to create tooltip content from connection
export const createConnectionTooltipContent = (connection: NetworkConnection): TooltipContent => ({
  title: `Connection ${connection.id}`,
  status: connection.status,
  details: [
    { label: 'From', value: connection.sourceNodeId, icon: 'ArrowRight' },
    { label: 'To', value: connection.targetNodeId, icon: 'ArrowLeft' },
    ...(connection.bandwidth ? [{ label: 'Bandwidth', value: `${connection.bandwidth} Mbps`, icon: 'Speed' }] : []),
    ...(connection.utilization !== undefined ? [{ label: 'Utilization', value: `${connection.utilization}%`, icon: 'Gauge' }] : [])
  ],
  actions: [
    { label: 'View Route', icon: 'MapTrifold', onClick: () => {}, variant: 'primary' },
    { label: 'Check Health', icon: 'Heartbeat', onClick: () => {}, variant: 'secondary' }
  ]
});
