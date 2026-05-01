"use client";

import React, { useEffect, useState } from "react";
import { Icon, Badge } from "@shohojdhara/atomix";
import { OfflineDetector } from "../utils/errorHandler";

interface OfflineIndicatorProps {
  className?: string;
}

export function OfflineIndicator({ className = "" }: OfflineIndicatorProps) {
  const [isOffline, setIsOffline] = useState(!OfflineDetector.isCurrentlyOnline());
  const [showBanner, setShowBanner] = useState(false);
  const bannerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = OfflineDetector.onStatusChange((online) => {
      setIsOffline(!online);

      if (!online) {
        setShowBanner(true);
      } else {
        // Delay hiding to show reconnection message
        setTimeout(() => {
          setShowBanner(false);
        }, 3000);
      }
    });

    return unsubscribe;
  }, []);

  if (!showBanner) return null;

  return (
    <div
      ref={bannerRef}
      className={`u-fixed u-top-0 u-start-0 u-w-100 u-z-modal u-transition-all ${className}`}
      role="status"
      aria-live="polite"
    >
      <div
        className={`u-px-6 u-py-3 u-text-center u-text-sm u-font-bold u-flex u-items-center u-justify-center u-gap-3 u-shadow-md ${
          isOffline ? "u-bg-error u-text-white" : "u-bg-success u-text-white"
        }`}
      >
        <Icon
          name={isOffline ? "WifiSlash" : "ArrowsCounterClockwise"}
          size={18}
          className={isOffline ? "" : "u-animate-spin"}
        />
        <span className="u-text-uppercase" style={{ letterSpacing: "1px" }}>
          {isOffline
            ? "Network Offline: Some features may be limited"
            : "Reconnected: Synchronizing your changes"}
        </span>
      </div>
    </div>
  );
}

// Offline status badge for components
export function OfflineStatusBadge({ compact = false }: { compact?: boolean }) {
  const [isOffline, setIsOffline] = useState(!OfflineDetector.isCurrentlyOnline());

  useEffect(() => {
    const unsubscribe = OfflineDetector.onStatusChange(setIsOffline);
    return unsubscribe;
  }, []);

  if (!isOffline) return null;

  return (
    <div
      className={`u-inline-flex u-items-center u-gap-2 u-px-3 u-py-1 u-rounded-pill u-bg-error-subtle u-border u-border-solid u-border-error u-text-error ${
        compact ? "u-text-xs" : "u-text-sm"
      }`}
      title="You are currently offline"
    >
      <Icon name="CloudSlash" size={compact ? 12 : 14} />
      {!compact && <span className="u-font-bold u-text-uppercase">Offline</span>}
    </div>
  );
}

// Data freshness indicator
interface DataFreshnessIndicatorProps {
  lastUpdated?: Date | null;
  staleThreshold?: number; // milliseconds
  className?: string;
}

export function DataFreshnessIndicator({
  lastUpdated,
  staleThreshold = 60000, // 1 minute
  className = "",
}: DataFreshnessIndicatorProps) {
  const [isStale, setIsStale] = useState(false);
  const [lastUpdateText, setLastUpdateText] = useState("");

  useEffect(() => {
    if (!lastUpdated) {
      setIsStale(true);
      setLastUpdateText("Never updated");
      return;
    }

    const updateStaleness = () => {
      const now = new Date();
      const age = now.getTime() - lastUpdated.getTime();
      const stale = age > staleThreshold;

      setIsStale(stale);

      // Format relative time
      const minutes = Math.floor(age / 60000);
      const seconds = Math.floor((age % 60000) / 1000);

      if (minutes === 0) {
        setLastUpdateText(`${seconds}s ago`);
      } else if (minutes < 60) {
        setLastUpdateText(`${minutes}m ago`);
      } else {
        const hours = Math.floor(minutes / 60);
        setLastUpdateText(`${hours}h ago`);
      }
    };

    updateStaleness();
    const interval = setInterval(updateStaleness, 1000);

    return () => clearInterval(interval);
  }, [lastUpdated, staleThreshold]);

  return (
    <div
      className={`u-inline-flex u-items-center u-gap-2 u-text-xs u-font-bold ${
        isStale ? "u-text-warning" : "u-text-success"
      } ${className}`}
      title={
        lastUpdated ? `Last updated: ${lastUpdated.toLocaleString()}` : "No data yet"
      }
    >
      <div
        className={`u-w-2 u-h-2 u-rounded-circle ${
          isStale ? "u-bg-warning u-animate-pulse" : "u-bg-success"
        }`}
      />
      <span className="u-text-uppercase" style={{ letterSpacing: "0.5px" }}>
        {lastUpdateText}
      </span>
    </div>
  );
}

// Connection quality indicator
export function ConnectionQualityIndicator({
  quality,
  className = "",
}: {
  quality: "good" | "fair" | "poor" | "disconnected";
  className?: string;
}) {
  const config = {
    good: {
      color: "u-text-success",
      bgColor: "u-bg-success",
      label: "Excellent Connection",
    },
    fair: { color: "u-text-warning", bgColor: "u-bg-warning", label: "Fair Connection" },
    poor: { color: "u-text-error", bgColor: "u-bg-error", label: "Poor Connection" },
    disconnected: { color: "u-text-error", bgColor: "u-bg-error", label: "Disconnected" },
  };

  const { color, bgColor, label } = config[quality];

  const getBarCount = (q: string): number => {
    switch (q) {
      case "good":
        return 4;
      case "fair":
        return 3;
      case "poor":
        return 2;
      default:
        return 0;
    }
  };

  return (
    <div className={`u-inline-flex u-items-center u-gap-3 ${className}`} title={label}>
      <div className="u-flex u-items-end u-gap-1 u-h-5">
        {[1, 2, 3, 4].map((bar) => (
          <div
            key={bar}
            className={`u-w-1 u-rounded-pill u-transition-all ${
              bar <= getBarCount(quality) ? bgColor : "u-bg-white-opacity-10"
            }`}
            style={{ height: `${bar * 25}%` }}
          />
        ))}
      </div>
      <span
        className={`u-text-xs u-font-bold u-text-uppercase ${color}`}
        style={{ letterSpacing: "0.5px" }}
      >
        {label}
      </span>
    </div>
  );
}
