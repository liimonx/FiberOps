"use client";

import React, { useState, useCallback, useRef } from "react";
import { Icon, Card, Button, PhosphorIconsType } from "@shohojdhara/atomix";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { NetworkNode, NetworkConnection, NetworkStatus } from "../types";
import { StatusIndicator } from "./StatusIndicator";
import { NETWORK_STATUS_COLORS, NODE_TYPE_ICONS } from "../constants";
import { sanitizeSearchQuery, sanitizeMetadata } from "../utils/sanitization";

export interface TooltipContent {
  title: string;
  subtitle?: string;
  status: NetworkStatus;
  details: Array<{ label: string; value: string | number; icon?: PhosphorIconsType }>;
  actions?: Array<{
    label: string;
    icon: PhosphorIconsType;
    onClick: () => void;
    variant?: "primary" | "secondary";
  }>;
  metadata?: Record<string, unknown>;
}

interface InteractiveTooltipProps {
  content: TooltipContent;
  node?: NetworkNode;
  connection?: NetworkConnection;
  position: { x: number; y: number };
  visible: boolean;
  onClose?: () => void;
  onActionClick?: (actionId: string) => void;
  anchor?: "top" | "bottom" | "left" | "right";
  offset?: number;
  className?: string;
  maxWidth?: number;
  interactive?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export const InteractiveTooltip: React.FC<InteractiveTooltipProps> = ({
  content,
  node,
  connection,
  position,
  visible,
  onClose,
  onActionClick,
  anchor = "top",
  offset = 12,
  className = "",
  maxWidth = 300,
  interactive = true,
  onMouseEnter,
  onMouseLeave,
}) => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);
  const [isExpanded, setIsExpanded] = useState(false);

  // Adjust position and handle animations using GSAP React best practices
  useGSAP(
    () => {
      if (!visible) {
        if (tooltipRef.current) {
          gsap.to(tooltipRef.current, {
            opacity: 0,
            scale: 0.95,
            y: -10,
            duration: 0.2,
            ease: "power2.in",
            onComplete: () => {
              if (tooltipRef.current) tooltipRef.current.style.display = "none";
            },
          });
        }
        return;
      }

      if (tooltipRef.current) {
        tooltipRef.current.style.display = "block";

        const tooltip = tooltipRef.current;
        const rect = tooltip.getBoundingClientRect();
        const viewport = {
          width: window.innerWidth,
          height: window.innerHeight,
        };

        const adjusted = { ...position };

        if (rect.right > viewport.width) {
          adjusted.x = position.x - rect.width - offset;
        } else if (rect.left < 0) {
          adjusted.x = offset;
        }

        if (rect.bottom > viewport.height) {
          adjusted.y = position.y - rect.height - offset;
        } else if (rect.top < 0) {
          adjusted.y = offset;
        }

        setAdjustedPosition(adjusted);

        // Entrance animation
        gsap.fromTo(
          tooltip,
          { opacity: 0, scale: 0.9, y: 10 },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.3,
            ease: "back.out(1.7)",
            clearProps: "transform",
          }
        );
      }
    },
    { dependencies: [position, visible, offset], scope: tooltipRef }
  );

  const getAnchorStyles = useCallback(() => {
    const base: React.CSSProperties = {
      position: "absolute",
      maxWidth: `${maxWidth}px`,
      pointerEvents: interactive ? "auto" : "none",
    };

    switch (anchor) {
      case "top":
        return {
          ...base,
          left: adjustedPosition.x,
          bottom: `calc(100vh - ${adjustedPosition.y - offset}px)`,
        };
      case "bottom":
        return { ...base, left: adjustedPosition.x, top: adjustedPosition.y + offset };
      case "left":
        return {
          ...base,
          right: `calc(100vw - ${adjustedPosition.x - offset}px)`,
          top: adjustedPosition.y,
        };
      case "right":
        return { ...base, left: adjustedPosition.x + offset, top: adjustedPosition.y };
      default:
        return base;
    }
  }, [adjustedPosition, anchor, offset, maxWidth, interactive]);

  const handleActionClick = (actionIndex: number) => {
    const action = content.actions?.[actionIndex];
    if (action) {
      action.onClick();
      onActionClick?.(`${actionIndex}`);
    }
  };

  const getNodeIcon = () => {
    if (!node) return "Circle";
    return NODE_TYPE_ICONS[node.type] || "Circle";
  };

  const getNodeTypeLabel = () => {
    if (!node) return "";
    return node.type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (!visible || !content) return null;

  return (
    <div
      ref={tooltipRef}
      className={`u-transition-all ${className}`}
      style={{ ...getAnchorStyles(), display: visible ? "block" : "none" }}
      role="dialog"
      aria-label={`${content?.title || "Tooltip"} details`}
      aria-hidden={!visible}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {content && (
        <Card
        glass={{ blurAmount: 5 }}
        appearance="ghost"
        className="u-p-0 u-overflow-hidden u-bg-white-opacity-5"
      >
        {/* Header */}
        <div className="u-flex u-items-start u-gap-3 u-p-4 u-border-bottom u-border-secondary-subtle">
          <div className="u-flex-shrink-0">
            <div
              className="u-w-10 u-h-10 u-rounded-circle u-flex u-items-center u-justify-center  u-shadow-sm"
              style={{ backgroundColor: NETWORK_STATUS_COLORS[content.status] }}
            >
              <Icon name={node ? getNodeIcon() : "GitBranch"} size={20} />
            </div>
          </div>

          <div className="u-flex-1 u-min-w-0">
            <h4 className="u-m-0 u-text-sm u-font-bold u-text-truncate">
              {sanitizeSearchQuery(content.title)}
            </h4>
            {content.subtitle && (
              <span className="u-block u-text-xs u-text-secondary-emphasis u-mt-1">
                {sanitizeSearchQuery(content.subtitle)}
              </span>
            )}
            {node && (
              <span className="u-block u-text-xs u-text-secondary-emphasis u-opacity-70 u-text-capitalize">
                {getNodeTypeLabel()}
              </span>
            )}
          </div>

          <div className="u-flex u-items-center u-gap-2">
            <StatusIndicator
              status={content.status}
              size="sm"
              showLabel={false}
              pulse={content.status === "error"}
            />
            {onClose && (
              <Button
                variant="secondary"
                size="sm"
                iconName="X"
                onClick={onClose}
                iconOnly
              />
            )}
          </div>
        </div>

        {/* Details Section */}
        <div className="u-p-4 u-flex u-flex-column u-gap-3">
          {content.details.map((detail, index) => {
            const isUtilization = detail.label.toLowerCase().includes("utilization") || 
                                detail.label.toLowerCase().includes("usage");
            const val = typeof detail.value === "string" ? parseFloat(detail.value) : detail.value;
            
            return (
              <div key={index} className="u-flex u-flex-column u-gap-1.5">
                <div className="u-flex u-items-center u-gap-2 u-text-xs">
                  {detail.icon && (
                    <Icon
                      name={detail.icon}
                      size={14}
                      className="u-text-secondary-emphasis u-opacity-50"
                    />
                  )}
                  <span className="u-text-secondary-emphasis u-font-bold u-text-uppercase u-tracking-wider">
                    {detail.label}
                  </span>
                  <span className="u-ms-auto u-font-bold u-text-primary">
                    {detail.value}
                  </span>
                </div>
                
                {isUtilization && !isNaN(val as number) && (
                  <div className="u-w-100 u-h-1 u-bg-secondary-subtle u-rounded-full u-overflow-hidden">
                    <div 
                      className={`u-h-100 u-transition-all ${
                        (val as number) > 90 ? "u-bg-error" : (val as number) > 70 ? "u-bg-warning" : "u-bg-success"
                      }`}
                      style={{ width: `${Math.min(val as number, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Expandable Metadata */}
        {content.metadata && Object.keys(content.metadata).length > 0 && (
          <div className="u-border-top u-border-secondary-subtle">
            <button
              className="u-w-100 u-flex u-items-center u-justify-between u-px-4 u-py-2 u-bg-transparent u-border-0 u-text-secondary-emphasis u-text-xs u-font-bold u-text-uppercase u-cursor-pointer hover: u-transition-all"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <span>More Info</span>
              <Icon name={isExpanded ? "CaretUp" : "CaretDown"} size={14} />
            </button>

            {isExpanded && (
              <div className="u-px-4 u-pb-3 u-flex u-flex-column u-gap-1">
                {(content.metadata ? Object.entries(sanitizeMetadata(content.metadata)) : []).map(([key, value]) => (
                  <div key={key} className="u-flex u-justify-between u-gap-2 u-text-xs">
                    <span className="u-text-secondary-emphasis u-opacity-60">{sanitizeSearchQuery(key)}:</span>
                    <span className="u-font-mono u-opacity-80 u-text-truncate u-max-w-60">
                      {typeof value === "object" ? JSON.stringify(value) : sanitizeSearchQuery(String(value))}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        {content.actions && content.actions.length > 0 && (
          <div className="u-flex u-gap-2 u-p-3 u-border-top u-border-secondary-subtle u-bg-white-opacity-5">
            {content.actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || "secondary"}
                size="sm"
                iconName={action.icon}
                onClick={action.onClick}
                fullWidth
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </Card>
      )}
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
}> = ({ title, content, visible, position, className = "" }) => {
  if (!visible) return null;

  return (
    <div
      className={`u-fixed u-z-tooltip u-pointer-events-none u-transition-all ${className}`}
      style={{
        left: position.x,
        top: position.y - 12,
        transform: "translate(-50%, -100%)",
      }}
      role="tooltip"
    >
      <Card glass={true} className="u-p-3 u-bg-white-opacity-10 u-shadow-lg">
        <div className="u-flex u-flex-column u-gap-1">
          <strong className="u-text-xs u-font-bold u-text-uppercase">{title}</strong>
          <div className="u-text-xs u-text-secondary-emphasis u-leading-normal">
            {content}
          </div>
        </div>
      </Card>
    </div>
  );
};

// Utility to create tooltip content from node
export const createNodeTooltipContent = (node: NetworkNode): TooltipContent => ({
  title: node.name,
  status: node.status,
  details: [
    { label: "Type", value: node.type, icon: "Tag" as PhosphorIconsType },
    { label: "ID", value: node.id, icon: "Fingerprint" as PhosphorIconsType },
    ...(node.capacity
      ? [{ label: "Capacity", value: `${node.capacity} ports`, icon: "HardDrives" as PhosphorIconsType }]
      : []),
    ...(node.utilization !== undefined
      ? [{ label: "Utilization", value: `${node.utilization}%`, icon: "Gauge" as PhosphorIconsType }]
      : []),
    {
      label: "Location",
      value: `${node.position.lat.toFixed(4)}, ${node.position.lng.toFixed(4)}`,
      icon: "MapPin" as PhosphorIconsType,
    },
  ],
  actions: [
    { label: "View Details", icon: "Eye" as PhosphorIconsType, onClick: () => {}, variant: "primary" },
    { label: "Trace Path", icon: "GitBranch" as PhosphorIconsType, onClick: () => {}, variant: "secondary" },
  ],
  metadata: node.metadata,
});

// Utility to create tooltip content from connection
export const createConnectionTooltipContent = (
  connection: NetworkConnection
): TooltipContent => {
  const { bandwidth, utilization } = connection;
  const currentSpeed =
    bandwidth && utilization !== undefined ? (bandwidth * utilization) / 100 : null;

  return {
    title: `Connection ${connection.id}`,
    status: connection.status,
    details: [
      { label: "From", value: connection.sourceNodeId, icon: "ArrowRight" as PhosphorIconsType },
      { label: "To", value: connection.targetNodeId, icon: "ArrowLeft" as PhosphorIconsType },
      ...(bandwidth
        ? [{ label: "Bandwidth", value: `${bandwidth} Mbps`, icon: "Speed" as PhosphorIconsType }]
        : []),
      ...(currentSpeed !== null
        ? [
            {
              label: "Current Speed",
              value: `${currentSpeed.toFixed(2)} Mbps`,
              icon: "TrendUp" as PhosphorIconsType,
            },
          ]
        : []),
      ...(utilization !== undefined
        ? [{ label: "Utilization", value: `${utilization}%`, icon: "Gauge" as PhosphorIconsType }]
        : []),
    ],
    actions: [
      { label: "View Route", icon: "MapTrifold" as PhosphorIconsType, onClick: () => {}, variant: "primary" },
      { label: "Check Health", icon: "Heartbeat" as PhosphorIconsType, onClick: () => {}, variant: "secondary" },
    ],
  };
};
