"use client";

import React, { useState, useCallback, useRef, useLayoutEffect } from "react";
import { Icon, Card, Button, PhosphorIconsType, ButtonGroup } from "@shohojdhara/atomix";
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

  // Handle position adjustment
  useLayoutEffect(() => {
    if (!visible) return;

    if (tooltipRef.current) {
      const tooltip = tooltipRef.current;
      const rect = tooltip.getBoundingClientRect();
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
      };

      const adjusted = { ...position };

      // Adjust X if out of bounds
      if (rect.right > viewport.width) {
        adjusted.x = position.x - rect.width - offset;
      } else if (rect.left < 0) {
        adjusted.x = offset;
      }

      // Adjust Y if out of bounds
      if (rect.bottom > viewport.height) {
        adjusted.y = position.y - rect.height - offset;
      } else if (rect.top < 0) {
        adjusted.y = offset;
      }

      setAdjustedPosition(adjusted);
    }
  }, [position, visible, offset]);

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

  if (!content) return null;

  return (
    <div
      ref={tooltipRef}
      className={`${className} u-transition-all u-z-tooltip`}
      style={{
        ...getAnchorStyles(),
        opacity: visible ? 1 : 0,
        visibility: visible ? "visible" : "hidden",
        transition: "opacity 200ms cubic-bezier(0.4, 0, 0.2, 1), visibility 200ms",
      }}
      role="tooltip"
      aria-label={`${content?.title || "Tooltip"} details`}
      aria-hidden={!visible}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {content && (
        <Card>
          {/* Header */}
          <Card.Header>
            <div className="u-flex-shrink-0">
              <div
                className="u-w-10 u-h-10 u-rounded-circle u-flex u-items-center u-justify-center  u-shadow-sm"
                style={{ backgroundColor: NETWORK_STATUS_COLORS[content.status] }}
              >
                <Icon name={node ? getNodeIcon() : "GitBranch"} />
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
          </Card.Header>
          <Card.Body>
            {/* Details Section */}
            <div className="u-flex u-flex-column u-gap-3">
              {content.details.map((detail, index) => {
                const isUtilization =
                  detail.label.toLowerCase().includes("utilization") ||
                  detail.label.toLowerCase().includes("usage");
                const val =
                  typeof detail.value === "string"
                    ? parseFloat(detail.value)
                    : detail.value;

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
                            (val as number) > 90
                              ? "u-bg-error"
                              : (val as number) > 70
                                ? "u-bg-warning"
                                : "u-bg-success"
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
                  className="u-w-100 u-flex u-items-center u-justify-between u-px-4 u-py-2 u-bg-transparent u-border-0 u-text-secondary-emphasis u-text-xs u-font-bold u-text-uppercase u-cursor-pointer u-transition-all"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  <span>More Info</span>
                  <Icon name={isExpanded ? "CaretUp" : "CaretDown"} size={14} />
                </button>

                {isExpanded && (
                  <div className="u-px-4 u-pb-3 u-flex u-flex-column u-gap-1">
                    {(content.metadata
                      ? Object.entries(sanitizeMetadata(content.metadata))
                      : []
                    ).map(([key, value]) => (
                      <div
                        key={key}
                        className="u-flex u-justify-between u-gap-2 u-text-xs"
                      >
                        <span className="u-text-secondary-emphasis u-opacity-60">
                          {sanitizeSearchQuery(key)}:
                        </span>
                        <span className="u-font-mono u-opacity-80 u-text-truncate u-max-w-60">
                          {typeof value === "object"
                            ? JSON.stringify(value)
                            : sanitizeSearchQuery(String(value))}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card.Body>

          {/* Actions */}
          {content.actions && content.actions.length > 0 && (
            <Card.Footer>
              <ButtonGroup className="u-w-100">
                {content.actions.map((action, index) => (
                  <Button
                    key={index}
                    variant={action.variant || "secondary"}
                    size="sm"
                    iconName={action.icon}
                    onClick={() => handleActionClick(index)}
                    fullWidth
                  >
                    {action.label}
                  </Button>
                ))}
              </ButtonGroup>
            </Card.Footer>
          )}
        </Card>
      )}
    </div>
  );
};

export {
  createNodeTooltipContent,
  createConnectionTooltipContent,
} from "../utils/tooltipContent";
export type { TooltipContentCallbacks } from "../utils/tooltipContent";
