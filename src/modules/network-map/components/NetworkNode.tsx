"use client";

import React from "react";
import { Icon } from "@shohojdhara/atomix";
import { NetworkNode as NetworkNodeType } from "../types";
import { NODE_TYPE_ICONS, NETWORK_STATUS_COLORS } from "../constants";

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
  className = "",
}) => {
  const statusColor = NETWORK_STATUS_COLORS[node.status];
  const iconName = NODE_TYPE_ICONS[node.type];

  const handleClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    onClick?.(node);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick(e);
    }
  };

  return (
    <div
      className={`u-absolute u-transform-center u-cursor-pointer u-transition-all u-z-10 ${className}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => onMouseEnter?.(node)}
      onMouseLeave={onMouseLeave}
      role="button"
      aria-label={`${node.name}, status: ${node.status}, type: ${node.type}`}
      tabIndex={0}
      style={{
        left: `${node.position.lat}%`, // Assuming normalized coordinates for demo, usually this is handled by parent canvas
        top: `${node.position.lng}%`,
      }}
    >
      <div className="u-relative u-flex u-items-center u-justify-center">
        {/* Node Indicator */}
        <div
          className={`u-w-8 u-h-8 u-rounded-circle u-border u-border-solid u-flex u-items-center u-justify-center u-shadow-md u-transition-all ${
            selected
              ? "u-border-primary u-border-2"
              : hovered
                ? "u-border-white"
                : "u-border-white-opacity-20"
          }`}
          style={{
            backgroundColor: statusColor,
            boxShadow: selected
              ? `0 0 15px ${statusColor}`
              : hovered
                ? `0 0 10px ${statusColor}80`
                : "none",
            transform: hovered || selected ? "scale(1.1)" : "scale(1)",
          }}
        >
          <Icon name={iconName as any} size={16} className="" aria-hidden="true" />
        </div>

        {/* Utilization Ring */}
        {node.utilization !== undefined && (
          <div
            className="u-absolute u-inset-n1 u-rounded-circle u-border u-border-solid u-animate-spin"
            style={{
              borderColor: statusColor,
              borderLeftColor: "transparent",
              opacity: 0.5,
              animationDuration: "3s",
            }}
          />
        )}
      </div>

    </div>
  );
};

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
