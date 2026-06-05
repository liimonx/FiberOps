"use client";

import React from "react";
import { NetworkStatus } from "../types";
import { NETWORK_STATUS_COLORS } from "../constants";

interface StatusIndicatorProps {
  status: NetworkStatus;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  pulse?: boolean;
  animated?: boolean;
  className?: string;
  label?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  size = "md",
  showLabel = true,
  pulse = false,
  className = "",
  label,
}) => {
  const statusColor = NETWORK_STATUS_COLORS[status];
  const displayLabel = label || status.charAt(0).toUpperCase() + status.slice(1);

  const sizeMap = {
    sm: { dot: "u-w-2 u-h-2", text: "u-text-xs" },
    md: { dot: "u-w-3 u-h-3", text: "u-text-sm" },
    lg: { dot: "u-w-4 u-h-4", text: "u-text-base" },
  };

  const sizes = sizeMap[size];

  const getStatusDescription = () => {
    switch (status) {
      case NetworkStatus.ACTIVE:
        return "System is operating normally";
      case NetworkStatus.INACTIVE:
        return "System is offline or disabled";
      case NetworkStatus.WARNING:
        return "System has potential issues";
      case NetworkStatus.ERROR:
        return "System has critical errors";
      default:
        return "Status unknown";
    }
  };

  return (
    <div
      className={`u-inline-flex u-items-center u-gap-2 ${className}`}
      role="status"
      aria-label={`${displayLabel}: ${getStatusDescription()}`}
      title={getStatusDescription()}
    >
      <div className="u-relative u-flex u-items-center u-justify-center">
        <div
          className={`u-rounded-circle u-flex-shrink-0 ${sizes.dot}`}
          style={{
            backgroundColor: statusColor,
            boxShadow: `0 0 10px ${statusColor}60`,
          }}
        />
        {pulse && (
          <div
            className="u-absolute u-w-100 u-h-100 u-rounded-circle u-border u-border-solid"
            style={{
              borderColor: statusColor,
              animation: "atomix-pulse 2s infinite",
            }}
          />
        )}
      </div>

      {showLabel && (
        <span className={`u-font-bold  u-text-capitalize ${sizes.text}`}>
          {displayLabel}
        </span>
      )}
    </div>
  );
};

// Badge variant for inline status display
export const StatusBadge: React.FC<{
  status: NetworkStatus;
  count?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}> = ({ status, count, size = "md", className = "" }) => {
  const statusColor = NETWORK_STATUS_COLORS[status];
  const displayText = count !== undefined ? `${count} ${status}` : status;

  return (
    <span
      className={`u-inline-flex u-items-center u-gap-2 u-px-3 u-py-1 u-rounded-circle u-border u-border-solid ${className}`}
      style={{
        backgroundColor: `${statusColor}15`,
        borderColor: `${statusColor}30`,
        color: statusColor,
      }}
      role="status"
    >
      <StatusIndicator
        status={status}
        size="sm"
        showLabel={false}
        pulse={status === NetworkStatus.ERROR}
      />
      <span
        className={`u-font-bold u-text-uppercase ${size === "lg" ? "u-text-sm" : "u-text-xs"}`}
      >
        {displayText}
      </span>
    </span>
  );
};

// Summary component for displaying multiple status counts
export const StatusSummary: React.FC<{
  counts: Record<NetworkStatus, number>;
  showZero?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}> = ({ counts, showZero = false, size = "md", className = "" }) => {
  const statuses = [
    NetworkStatus.ACTIVE,
    NetworkStatus.WARNING,
    NetworkStatus.ERROR,
    NetworkStatus.INACTIVE,
  ];

  return (
    <div
      className={`u-flex u-flex-wrap u-gap-2 ${className}`}
      role="region"
      aria-label="Network status summary"
    >
      {statuses.map((status) => {
        const count = counts[status] || 0;
        if (!showZero && count === 0) return null;

        return <StatusBadge key={status} status={status} count={count} size={size} />;
      })}
    </div>
  );
};
