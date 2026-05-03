"use client";

import React, { useRef } from "react";
import { Icon, Card, Badge } from "@shohojdhara/atomix";
import { NetworkNode, NetworkStatus } from "../types";
import {
  getStatusColor,
  statusLabels,
  nodeTypeIcons,
  getNodeMarkerStyle,
  statusIcons,
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

/**
 * Enhanced Network Node component refactored for Atomix Design System.
 */
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
      {/* Glow effect - centered using absolute positioning utilities */}
      {(isSelected || isHovered) && (
        <div
          className="u-absolute u-rounded-circle u-backdrop-blur-sm u-start-50 u-top-50 u-transform-center"
          style={{
            zIndex: 1,
            width: `${size * 2.5}px`,
            height: `${size * 2.5}px`,
            backgroundColor: colors.glow || "transparent",
            opacity: isSelected ? 0.35 : 0.25,
            filter: "blur(12px)",
          }}
        />
      )}

      {/* Main node marker */}
      <div
        className="u-relative u-flex u-items-center u-justify-center u-rounded-circle u-transition-all u-shadow-md"
        style={{
          ...markerStyle,
          zIndex: 2,
          width: `${size}px`,
          height: `${size}px`,
          transform: isHovered ? "scale(1.15)" : "scale(1)",
        }}
      >
        {/* Status indicator ring for alerts */}
        {node.status !== NetworkStatus.ACTIVE && (
          <div
            className="u-absolute u-inset-0 u-rounded-circle u-border u-border-solid u-animate-pulse"
            style={{
              borderColor: colors.primary,
              borderWidth: "1.5px",
            }}
          />
        )}

        {/* Icon (Phosphor via Atomix) */}
        {size >= 16 && <Icon name={icon as any} size={Math.max(size * 0.55, 10)} />}
      </div>

      {/* Label - Using Atomix Card with Glass UI */}
      {showLabel && (isHovered || isSelected) && (
        <Card
          glass={true}
          className="u-absolute u-start-50 u-transform-center-x u-mt-2 u-px-2 u-py-0.5 u-z-modal"
          style={{ top: `${size}px` }}
        >
          <span
            className="u-text-xs u-font-bold u-text-uppercase u-leading-none u-text-nowrap"
            style={{ letterSpacing: "1px" }}
          >
            {node.name}
          </span>
        </Card>
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
    isHovered || isSelected ? 1 : status === NetworkStatus.INACTIVE ? 0.3 : 0.8;

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
      {/* Invisible hit area for easier interaction */}
      <line
        x1={source.x}
        y1={source.y}
        x2={target.x}
        y2={target.y}
        stroke="transparent"
        strokeWidth={lineWidth + 12}
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
            ? "4,4"
            : animated && status === NetworkStatus.ACTIVE
              ? "8,4"
              : "none"
        }
        className="u-transition-all"
        style={{
          filter:
            isHovered || isSelected ? `drop-shadow(0 0 6px ${colors.glow})` : "none",
        }}
      />

      {/* Utilization indicator */}
      {utilization !== undefined && utilization > 70 && (
        <circle
          cx={(source.x + target.x) / 2}
          cy={(source.y + target.y) / 2}
          r={3.5}
          fill={
            utilization > 90
              ? "var(--color-error, #EF4444)"
              : "var(--color-warning, #F59E0B)"
          }
          className="u-animate-pulse"
        />
      )}
    </g>
  );
}

/**
 * Animated Status Badge component refactored to use Atomix Badge.
 */
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

  // Map network status to Atomix semantic variants
  const variantMap: Record<NetworkStatus, "success" | "warning" | "error" | "secondary"> =
    {
      [NetworkStatus.ACTIVE]: "success",
      [NetworkStatus.WARNING]: "warning",
      [NetworkStatus.ERROR]: "error",
      [NetworkStatus.INACTIVE]: "secondary",
    };

  return (
    <div className="u-inline-flex u-relative">
      <Badge
        label={showLabel ? statusLabels[status] : ""}
        variant={variantMap[status]}
        size={size}
        icon={
          <Icon
            name={statusIcons[status] as any}
            size={size === "sm" ? 12 : size === "md" ? 16 : 20}
          />
        }
        className={className}
      />

      {animated && status !== NetworkStatus.INACTIVE && (
        <div
          className="u-absolute u-top-0 u-right-0 u-transform-center u-w-2 u-h-2 u-rounded-circle u-animate-pulse u-z-1"
          style={{
            backgroundColor: colors.primary,
            transform: "translate(25%, -25%)",
          }}
        />
      )}
    </div>
  );
}
