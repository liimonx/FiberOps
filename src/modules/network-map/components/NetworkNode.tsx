"use client";

import React from 'react';
import { Icon } from "@shohojdhara/atomix";
import { NetworkNode as NetworkNodeType, NetworkStatus } from '../types';
import { NODE_TYPE_ICONS, NETWORK_STATUS_COLORS } from '../constants';

interface NetworkNodeProps {
  node: NetworkNodeType;
  selected?: boolean;
  hovered?: boolean;
  onClick?: (node: NetworkNodeType) => void;
  onMouseEnter?: (node: NetworkNodeType) => void;
  onMouseLeave?: () => void;
  className?: string;
}

export const NetworkNode: React.FC<NetworkNodeProps> = ({
  node,
  selected = false,
  hovered = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
  className = ''
}) => {
  const statusColor = NETWORK_STATUS_COLORS[node.status];
  const iconName = NODE_TYPE_ICONS[node.type];
  
  const nodeClasses = [
    'network-node',
    `network-node--${node.status}`,
    selected && 'network-node--selected',
    hovered && 'network-node--hover',
    className
  ].filter(Boolean).join(' ');

  const handleClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    onClick?.(node);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick(e);
    }
  };

  const handleMouseEnter = () => {
    onMouseEnter?.(node);
  };

  return (
    <div
      className={nodeClasses}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onMouseLeave}
      role="button"
      aria-label={`${node.name}, status: ${node.status}, type: ${node.type}`}
      tabIndex={0}
      data-node-id={node.id}
      data-node-type={node.type}
      data-node-status={node.status}
    >
      <div className="node-visual">
        <div 
          className="node-indicator"
          style={{
            backgroundColor: statusColor,
            borderColor: selected ? '#f59e0b' : hovered ? '#3b82f6' : '#ffffff'
          }}
        >
          <Icon 
            name={iconName as any} 
            size="16" 
            className="node-icon"
            aria-hidden="true"
          />
        </div>
        
        {node.utilization !== undefined && (
          <div 
            className="utilization-ring"
            style={{
              '--utilization': `${node.utilization}%`,
              '--ring-color': statusColor
            } as React.CSSProperties}
          />
        )}
      </div>

      {/* Tooltip content that appears on hover */}
      {hovered && (
        <div className="node-tooltip">
          <div className="tooltip-header">
            <strong>{node.name}</strong>
            <span className={`status-badge status-${node.status}`}>
              {node.status}
            </span>
          </div>
          
          <div className="tooltip-details">
            <span>Type: {node.type}</span>
            {node.capacity && (
              <span>Capacity: {node.capacity} ports</span>
            )}
            {node.utilization !== undefined && (
              <span>Utilization: {node.utilization}%</span>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .network-node {
          position: absolute;
          transform: translate(-50%, -50%);
          cursor: pointer;
          transition: all var(--duration-normal) ease;
          z-index: 10;
        }

        .node-visual {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .node-indicator {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          transition: all var(--duration-normal) ease;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }

        .node-icon {
          color: currentColor;
        }

        .utilization-ring {
          position: absolute;
          top: -4px;
          left: -4px;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 2px solid var(--ring-color);
          border-left-color: transparent;
          transform: rotate(-45deg);
          clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%);
          animation: rotate-ring 2s linear infinite;
        }

        .node-tooltip {
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%) translateY(-8px);
          background: var(--color-gray-800);
          border: 1px solid var(--color-gray-600);
          border-radius: 8px;
          padding: 12px;
          color: white;
          font-size: 12px;
          min-width: 160px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          z-index: 100;
          pointer-events: none;
        }

        .tooltip-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
          gap: 8px;
        }

        .tooltip-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .status-badge {
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: bold;
          text-transform: uppercase;
        }

        .status-active { background: var(--color-status-active); color: white; }
        .status-inactive { background: var(--color-status-inactive); color: white; }
        .status-warning { background: var(--color-status-warning); color: black; }
        .status-error { background: var(--color-status-error); color: white; }

        /* Interaction states */
        .network-node:hover .node-indicator {
          transform: scale(1.1);
        }

        .network-node--selected .node-indicator {
          border-width: 3px;
          box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.3);
        }

        .network-node--hover .node-indicator {
          border-width: 3px;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
        }

        /* Focus states for accessibility */
        .network-node:focus {
          outline: 2px solid var(--color-primary-500);
          outline-offset: 4px;
          border-radius: 50%;
        }

        /* Animation for utilization ring */
        @keyframes rotate-ring {
          0% { transform: rotate(-45deg); }
          100% { transform: rotate(315deg); }
        }

        /* Mobile optimization */
        @media (max-width: 768px) {
          .node-indicator {
            width: 24px;
            height: 24px;
          }

          .utilization-ring {
            width: 32px;
            height: 32px;
            top: -4px;
            left: -4px;
          }

          .node-tooltip {
            font-size: 11px;
            min-width: 140px;
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .network-node {
            transition: none;
          }
          
          .utilization-ring {
            animation: none;
            opacity: 0.7;
          }
        }
      `}</style>
    </div>
  );
};

// Collection component for rendering multiple nodes
export const NetworkNodes: React.FC<{
  nodes: NetworkNodeType[];
  selectedNodeId?: string;
  hoveredNodeId?: string;
  onNodeClick?: (node: NetworkNodeType) => void;
  onNodeHover?: (node: NetworkNodeType | null) => void;
}> = ({ nodes, selectedNodeId, hoveredNodeId, onNodeClick, onNodeHover }) => {
  return (
    <>
      {nodes.map((node) => (
        <NetworkNode
          key={node.id}
          node={node}
          selected={node.id === selectedNodeId}
          hovered={node.id === hoveredNodeId}
          onClick={onNodeClick}
          onMouseEnter={onNodeHover}
          onMouseLeave={() => onNodeHover?.(null)}
        />
      ))}
    </>
  );
};