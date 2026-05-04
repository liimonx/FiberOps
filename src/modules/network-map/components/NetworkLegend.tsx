"use client";

import React from "react";
import { Icon, Card } from "@shohojdhara/atomix";
import { NetworkStatus } from "../types";
import { NETWORK_STATUS_COLORS, NETWORK_STATUS_LABELS } from "../constants";

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
  className = "",
}) => {
  const legendItems: LegendItem[] = [
    {
      status: NetworkStatus.ACTIVE,
      label: NETWORK_STATUS_LABELS[NetworkStatus.ACTIVE],
      color: NETWORK_STATUS_COLORS[NetworkStatus.ACTIVE],
      icon: "Activity",
    },
    {
      status: NetworkStatus.WARNING,
      label: NETWORK_STATUS_LABELS[NetworkStatus.WARNING],
      color: NETWORK_STATUS_COLORS[NetworkStatus.WARNING],
      icon: "Warning",
    },
    {
      status: NetworkStatus.ERROR,
      label: NETWORK_STATUS_LABELS[NetworkStatus.ERROR],
      color: NETWORK_STATUS_COLORS[NetworkStatus.ERROR],
      icon: "WarningCircle",
    },
    {
      status: NetworkStatus.INACTIVE,
      label: NETWORK_STATUS_LABELS[NetworkStatus.INACTIVE],
      color: NETWORK_STATUS_COLORS[NetworkStatus.INACTIVE],
      icon: "Power",
    },
  ];

  const getCountText = (status: NetworkStatus) => {
    const nodeCount = nodeCounts?.[status] || 0;
    const connectionCount = connectionCounts?.[status] || 0;

    if (!showCounts) return null;

    if (nodeCount > 0 && connectionCount > 0) {
      return `${nodeCount}N · ${connectionCount}C`;
    } else if (nodeCount > 0) {
      return `${nodeCount} nodes`;
    } else if (connectionCount > 0) {
      return `${connectionCount} conn`;
    } else {
      return "—";
    }
  };

  return (
    <Card
      glass={true}
      className={`u-overflow-hidden u-transition-all ${compact ? "u-p-2" : "u-p-3"} ${className}`}
      role="region"
      aria-label="Network Status Legend"
    >
      <div
        className={`u-flex u-items-center u-gap-2 u-pb-2 u-border-bottom u-border-secondary-subtle u-opacity-70 ${compact ? "u-mb-2" : "u-mb-3"}`}
      >
        <Icon name="CircleHalf" size={compact ? 14 : 16} className="u-opacity-60" />
        <h3 className={`u-m-0 u-font-bold ${compact ? "u-text-xs" : "u-text-sm"}`}>
          Status
        </h3>
      </div>

      <div className={`u-flex ${compact ? "u-flex-row u-flex-wrap u-gap-3" : "u-flex-column u-gap-1"}`}>
        {legendItems.map((item) => (
          <div
            key={item.status}
            className={`u-flex u-items-center u-gap-2 ${compact ? "" : "u-p-1"} u-rounded u-transition-all`}
            role="listitem"
            aria-label={`${item.label} status`}
          >
            {/* Status dot */}
            <span
              className="u-rounded-circle u-flex-shrink-0"
              style={{
                width: compact ? 8 : 10,
                height: compact ? 8 : 10,
                backgroundColor: item.color,
                boxShadow: `0 0 6px ${item.color}40`,
              }}
            />

            <span
              className={`u-font-bold u-text-truncate ${compact ? "u-text-xs" : "u-text-sm"}`}
            >
              {item.label}
            </span>

            {showCounts && !compact && (
              <span className="u-ms-auto u-text-xs u-text-secondary-emphasis u-opacity-50 u-font-normal"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {getCountText(item.status)}
              </span>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};

// Export component variants
export const CompactNetworkLegend: React.FC<NetworkLegendProps> = (props) => (
  <NetworkLegend compact={true} {...props} />
);

export const DetailedNetworkLegend: React.FC<NetworkLegendProps> = (props) => (
  <NetworkLegend showCounts={true} compact={false} {...props} />
);
