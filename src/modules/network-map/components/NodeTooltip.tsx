"use client";

import React from "react";
import { Icon, Card, Badge } from "@shohojdhara/atomix";
import type { NetworkNode } from "../types";
import {
  NETWORK_STATUS_COLORS,
  NETWORK_STATUS_LABELS,
  NODE_TYPE_ICONS,
} from "../constants";
import { StatusIndicator } from "./StatusIndicator";

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
  className = "",
}) => {
  if (!visible) return null;

  const { id, name, status, type, capacity, utilization, metadata } = node;

  const address = (metadata as any)?.address || (metadata as any)?.location?.address;
  const lastSeen = (metadata as any)?.lastSeen;

  const formatLastSeen = (timestamp?: string) => {
    if (!timestamp) return "Unknown";
    const now = new Date();
    const lastSeenDate = new Date(timestamp);
    const diffMinutes = Math.floor(
      (now.getTime() - lastSeenDate.getTime()) / (1000 * 60)
    );
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getNodeIcon = () => {
    return NODE_TYPE_ICONS[type] || "Circle";
  };

  return (
    <div
      className={`u-absolute ${className}`}
      style={{
        left: position.x + 20,
        top: position.y + 20,
      }}
      role="tooltip"
      aria-live="polite"
    >
      <Card glass={true} className="u-w-auto">
        {/* Header */}
        <div className="u-flex u-justify-between u-items-center u-mb-4 u-pb-2 u-border-bottom u-border-secondary-subtle">
          <div className="u-flex u-items-center u-gap-2 u-px-2 u-py-1 u-bg-secondary-subtle u-rounded u-border u-border-solid u-border-secondary-subtle">
            <Icon name={getNodeIcon() as any} size={16} className="" />
            <span className="u-text-xs u-font-bold u-text-uppercase u-leading-none">
              {type}
            </span>
          </div>
          <StatusIndicator
            status={status}
            size="sm"
            showLabel={true}
            pulse={status === "error"}
          />
        </div>

        {/* Node Info */}
        <div className="u-flex u-flex-column u-gap-3 u-mb-4">
          <div className="u-flex u-justify-between u-items-center">
            <span className="u-text-xs u-text-secondary-emphasis u-font-bold u-text-uppercase">
              Node ID
            </span>
            <code className="u-text-xs u-font-mono u-px-2 u-py-1 u-bg-secondary-subtle u-rounded-sm">
              {id}
            </code>
          </div>
          <div className="u-flex u-justify-between u-items-center">
            <span className="u-text-xs u-text-secondary-emphasis u-font-bold u-text-uppercase">
              Name
            </span>
            <span className="u-text-sm u-font-bold ">{name}</span>
          </div>
          {address && (
            <div className="u-flex u-flex-column u-gap-1">
              <span className="u-text-xs u-text-secondary-emphasis u-font-bold u-text-uppercase">
                Location
              </span>
              <span className="u-text-xs u-opacity-80">{address}</span>
            </div>
          )}
        </div>

        {/* Metrics */}
        {(capacity || utilization !== undefined) && (
          <div className="u-p-3 u-bg-secondary-subtle u-rounded u-border u-border-solid u-border-secondary-subtle u-mb-4">
            <h4 className="u-m-0 u-text-xs u-font-bold u-text-uppercase u-mb-3">
              Live Metrics
            </h4>
            {capacity !== undefined && (
              <div className="u-flex u-justify-between u-items-center u-mb-2">
                <span className="u-text-xs u-text-secondary-emphasis">Capacity</span>
                <span className="u-text-xs u-font-bold ">{capacity} Gbps</span>
              </div>
            )}
            {utilization !== undefined && (
              <div className="u-flex u-flex-column u-gap-2">
                <div className="u-flex u-justify-between u-items-center">
                  <span className="u-text-xs u-text-secondary-emphasis">Utilization</span>
                  <span className="u-text-xs u-font-bold ">{utilization}%</span>
                </div>
                <div className="u-w-100 u-h-1 u-bg-primary-subtle u-rounded-circle u-overflow-hidden">
                  <div
                    className="u-h-100 u-transition-all"
                    style={{
                      width: `${utilization}%`,
                      backgroundColor:
                        utilization > 80
                          ? "var(--atomix-error)"
                          : utilization > 60
                            ? "var(--atomix-warning)"
                            : "var(--atomix-success)",
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Metadata */}
        <div className="u-flex u-items-center u-gap-2 u-text-xs u-text-secondary-emphasis u-opacity-60">
          <Icon name="Clock" size={12} />
          <span>Last seen: {formatLastSeen(lastSeen)}</span>
        </div>
      </Card>
    </div>
  );
};
