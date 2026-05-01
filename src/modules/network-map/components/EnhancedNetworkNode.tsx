"use client";

import React, { useEffect, useRef } from "react";
import { Icon, Card } from "@shohojdhara/atomix";
import { NetworkNode, NetworkStatus } from "../types";
import {
  getStatusColor,
  statusLabels,
  nodeTypeIcons,
  getNodeMarkerStyle,
} from "../utils/statusColors";

interface EnhancedNetworkNodeProps {
  node: NetworkNode;
  isSelected?: boolean;
  isHovered?: boolean;
  onClick?: (node: NetworkNode) => void;
  onHover?: (node: NetworkNode | null) => void;
  size?: number;
  showLabel?: boolean;
  className?: string;
}

export function EnhancedNetworkNode({
  node,
  isSelected = false,
  isHovered = false,
  onClick,
  onHover,
  size = 12,
  showLabel = true,
  className = "",
}: EnhancedNetworkNodeProps) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const colors = getStatusColor(node.status);
  const icon = nodeTypeIcons[node.type] || "Circle";

  const markerStyle = getNodeMarkerStyle(node.status, size);

  return (
    <div
      ref={nodeRef}
      className={`u-relative u-cursor-pointer u-transition-all ${className}`}
      style={{
        zIndex: isSelected ? 1000 : isHovered ? 100 : 1,
      }}
      onClick={() => onClick?.(node)}
      onMouseEnter={() => onHover?.(node)}
      onMouseLeave={() => onHover?.(null)}
      role="button"
      tabIndex={0}
      aria-label={`${node.name} - ${statusLabels[node.status]}`}
    >
      {/* Glow effect */}
      {(isSelected || isHovered) && (
        <div
          className="u-absolute u-rounded-circle u-backdrop-blur-sm"
          style={{
            width: `${size * 2}px`,
            height: `${size * 2}px`,
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: colors.glow || "transparent",
            opacity: isSelected ? 0.3 : 0.2,
            filter: "blur(8px)",
          }}
        />
      )}

      {/* Main node marker */}
      <div
        className="u-relative u-flex u-items-center u-justify-center u-rounded-circle u-transition-all u-shadow-md"
        style={{
          ...markerStyle,
          width: `${size}px`,
          height: `${size}px`,
          transform: isHovered ? "scale(1.2)" : "scale(1)",
        }}
      >
        {/* Status indicator ring */}
        {node.status !== NetworkStatus.ACTIVE && (
          <div
            className="u-absolute u-inset-0 u-rounded-circle u-border u-border-solid u-animate-pulse"
            style={{
              borderColor: colors.primary,
              borderWidth: "2px",
            }}
          />
        )}

        {/* Icon */}
        {size >= 16 && (
          <Icon
            name={icon as any}
            size={Math.max(size * 0.5, 10)}
            className="u-text-white"
          />
        )}
      </div>

      {/* Label */}
      {showLabel && (isHovered || isSelected) && (
        <div
          className="u-absolute u-start-50 u-transform-center-x u-mt-2 u-px-3 u-py-1 u-rounded u-bg-dark u-text-white u-text-2xs u-font-bold u-text-uppercase u-shadow-xl u-z-modal"
          style={{
            top: `${size}px`,
            letterSpacing: "1px",
            whiteSpace: "nowrap",
          }}
        >
          {node.name}
        </div>
      )}
    </div>
  );
}

// Enhanced connection line component
interface EnhancedConnectionLineProps {
  source: { x: number; y: number };
  target: { x: number; y: number };
  status: NetworkStatus;
  utilization?: number;
  isSelected?: boolean;
  isHovered?: boolean;
  onClick?: () => void;
  onHover?: (isHovered: boolean) => void;
  animated?: boolean;
}

export function EnhancedConnectionLine({
  source,
  target,
  status,
  utilization,
  isSelected = false,
  isHovered = false,
  onClick,
  onHover,
  animated = true,
}: EnhancedConnectionLineProps) {
  const lineRef = useRef<SVGLineElement>(null);
  const colors = getStatusColor(status);

  const lineWidth =
    isHovered || isSelected ? 4 : utilization ? 2 + (utilization / 100) * 2 : 2;
  const opacity =
    isHovered || isSelected ? 1 : status === NetworkStatus.INACTIVE ? 0.4 : 0.8;

  return (
    <g
      onClick={onClick}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
      className="u-cursor-pointer"
      role="button"
      tabIndex={0}
      aria-label={`Connection - ${status}`}
    >
      <line
        x1={source.x}
        y1={source.y}
        x2={target.x}
        y2={target.y}
        stroke="transparent"
        strokeWidth={lineWidth + 10}
        fill="none"
      />

      <line
        ref={lineRef}
        x1={source.x}
        y1={source.y}
        x2={target.x}
        y2={target.y}
        stroke={colors.primary}
        strokeWidth={lineWidth}
        opacity={opacity}
        strokeLinecap="round"
        strokeDasharray={
          status === NetworkStatus.INACTIVE
            ? "5,5"
            : animated && status === NetworkStatus.ACTIVE
              ? "10,5"
              : "none"
        }
        className="u-transition-all"
        style={{
          filter:
            isHovered || isSelected ? `drop-shadow(0 0 4px ${colors.glow})` : "none",
        }}
      />

      {/* Utilization indicator */}
      {utilization !== undefined && utilization > 70 && (
        <circle
          cx={(source.x + target.x) / 2}
          cy={(source.y + target.y) / 2}
          r={4}
          fill={utilization > 90 ? "var(--color-error)" : "var(--color-warning)"}
          className="u-animate-pulse"
        />
      )}
    </g>
  );
}

// Status badge component
export function AnimatedStatusBadge({
  status,
  size = "md",
  showLabel = true,
  animated = true,
  className = "",
}: {
  status: NetworkStatus;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
}) {
  const colors = getStatusColor(status);

  const sizeMap = {
    sm: { icon: 12, font: "u-text-2xs", p: "u-px-2 u-py-0.5" },
    md: { icon: 16, font: "u-text-xs", p: "u-px-3 u-py-1" },
    lg: { icon: 20, font: "u-text-sm", p: "u-px-4 u-py-1.5" },
  };

  const config = sizeMap[size];

  return (
    <div
      className={`u-inline-flex u-items-center u-gap-2 u-rounded-pill u-border u-border-solid ${config.p} ${className}`}
      style={{
        backgroundColor: colors.background,
        borderColor: colors.border,
        color: colors.primary,
      }}
    >
      <div className="u-relative u-flex u-items-center u-justify-center">
        <Icon
          name={
            (status === "active"
              ? "CheckCircle"
              : status === "error"
                ? "XCircle"
                : "Warning") as any
          }
          size={config.icon}
        />
        {animated && status !== NetworkStatus.INACTIVE && (
          <div
            className="u-absolute u-top-n1 u-end-n1 u-w-2 u-h-2 u-rounded-circle u-animate-pulse"
            style={{ backgroundColor: colors.primary }}
          />
        )}
      </div>

      {showLabel && (
        <span
          className={`${config.font} u-font-bold u-text-uppercase`}
          style={{ letterSpacing: "0.5px" }}
        >
          {statusLabels[status]}
        </span>
      )}
    </div>
  );
}
