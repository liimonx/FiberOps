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
      return `${nodeCount}N, ${connectionCount}C`;
    } else if (nodeCount > 0) {
      return `${nodeCount} nodes`;
    } else if (connectionCount > 0) {
      return `${connectionCount} conn`;
    } else {
      return "0";
    }
  };

  return (
    <Card
      glass={true}
      className={`u-overflow-hidden u-transition-all ${compact ? "u-p-2" : "u-p-4"} ${className}`}
      role="region"
      aria-label="Network Status Legend"
      style={{ minWidth: compact ? "160px" : "240px" }}
    >
      <div
        className={`u-flex u-items-center u-gap-2 u-mb-3 u-pb-2 u-border-bottom u-border-secondary-subtle u-opacity-80 ${compact ? "u-mb-2 u-pb-1" : "u-mb-3 u-pb-2"}`}
      >
        <Icon name="List" size={compact ? 16 : 18} className="" />
        <h3 className={`u-m-0 u-font-bold  ${compact ? "u-text-xs" : "u-text-sm"}`}>
          Status Legend
        </h3>
      </div>

      <div className="u-flex u-flex-column u-gap-2">
        {legendItems.map((item) => (
          <div
            key={item.status}
            className={`u-flex u-items-center u-gap-3 u-p-2 u-rounded u-transition-all hover:u-bg-white-opacity-5`}
            role="listitem"
            aria-label={`${item.label} status indicator`}
          >
            <div className="u-flex u-items-center u-gap-2 u-flex-shrink-0">
              <div
                className={`u-rounded-circle u-border u-border-solid u-border-secondary-subtle u-flex-shrink-0 ${compact ? "u-w-3 u-h-3" : "u-w-4 u-h-4"}`}
                style={{
                  backgroundColor: item.color,
                  boxShadow: `0 0 8px ${item.color}40`,
                }}
              />
            </div>

            <div className="u-flex u-flex-column u-flex-1 u-min-w-0">
              <div className="u-flex u-items-center u-justify-between u-gap-2">
                <span
                  className={`u-font-bold  u-text-truncate ${compact ? "u-text-xs" : "u-text-sm"}`}
                >
                  {item.label}
                </span>
                <Icon
                  name={item.icon as any}
                  size={compact ? 12 : 14}
                  style={{ color: item.color }}
                  className="u-opacity-80"
                />
              </div>

              {showCounts && (
                <span className="u-text-xs u-text-secondary-emphasis u-opacity-60 u-mt-1">
                  {getCountText(item.status)}
                </span>
              )}
            </div>
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
