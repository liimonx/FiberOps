"use client";

import React, { useEffect, useState } from 'react';
import { WifiOff, CloudOff, RefreshCw } from 'lucide-react';
import { OfflineDetector, OfflineQueue } from '../utils/errorHandler';
import { fadeIn, fadeOut } from '../utils/animations';

interface OfflineIndicatorProps {
  className?: string;
}

export function OfflineIndicator({ className = '' }: OfflineIndicatorProps) {
  const [isOffline, setIsOffline] = useState(!OfflineDetector.isCurrentlyOnline());
  const [showBanner, setShowBanner] = useState(false);
  const bannerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = OfflineDetector.onStatusChange((online) => {
      setIsOffline(!online);
      
      if (!online) {
        // Show banner immediately when going offline
        setShowBanner(true);
        if (bannerRef.current) {
          fadeIn(bannerRef.current, { duration: 0.3 });
        }
      } else {
        // Delay hiding to show reconnection message
        setTimeout(() => {
          if (bannerRef.current) {
            fadeOut(bannerRef.current, { 
              duration: 0.3,
              onComplete: () => setShowBanner(false)
            });
          }
        }, 2000);
      }
    });

    return unsubscribe;
  }, []);

  if (!showBanner) return null;

  return (
    <div
      ref={bannerRef}
      className={`fixed top-0 left-0 right-0 z-50 ${className}`}
      role="status"
      aria-live="polite"
    >
      <div 
        className={`px-4 py-3 text-white text-center text-sm font-medium ${
          isOffline ? 'bg-danger' : 'bg-success'
        }`}
      >
        <div className="flex items-center justify-center gap-2">
          {isOffline ? (
            <>
              <WifiOff size={18} />
              <span>You're offline. Some features may be unavailable.</span>
            </>
          ) : (
            <>
              <RefreshCw size={18} className="animate-spin" />
              <span>Reconnected! Syncing data...</span>
            </>
          )}
        </div>
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
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full bg-danger-subtle border border-danger text-danger ${
        compact ? 'text-2xs' : 'text-xs'
      }`}
      title="You are currently offline"
    >
      <CloudOff size={compact ? 10 : 12} />
      {!compact && <span>Offline</span>}
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
  className = ''
}: DataFreshnessIndicatorProps) {
  const [isStale, setIsStale] = useState(false);
  const [lastUpdateText, setLastUpdateText] = useState('');

  useEffect(() => {
    if (!lastUpdated) {
      setIsStale(true);
      setLastUpdateText('Never updated');
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
      className={`inline-flex items-center gap-1.5 text-xs ${
        isStale ? 'text-warning' : 'text-success'
      } ${className}`}
      title={lastUpdated ? `Last updated: ${lastUpdated.toLocaleString()}` : 'No data yet'}
    >
      <div 
        className={`w-2 h-2 rounded-full ${
          isStale ? 'bg-warning' : 'bg-success'
        } ${isStale ? 'animate-pulse' : ''}`}
      />
      <span>{lastUpdateText}</span>
    </div>
  );
}

// Connection quality indicator
export function ConnectionQualityIndicator({
  quality,
  className = ''
}: {
  quality: 'good' | 'fair' | 'poor' | 'disconnected';
  className?: string;
}) {
  const config = {
    good: { color: 'text-success', bgColor: 'bg-success', label: 'Excellent connection' },
    fair: { color: 'text-warning', bgColor: 'bg-warning', label: 'Fair connection' },
    poor: { color: 'text-danger', bgColor: 'bg-danger', label: 'Poor connection' },
    disconnected: { color: 'text-danger', bgColor: 'bg-danger', label: 'Disconnected' }
  };

  const { color, bgColor, label } = config[quality];

  return (
    <div 
      className={`inline-flex items-center gap-2 ${className}`}
      title={label}
    >
      <div className="flex gap-0.5">
        {[1, 2, 3, 4].map((bar) => (
          <div
            key={bar}
            className={`w-1 rounded-full transition-all ${
              bar <= getBarCount(quality) ? bgColor : 'bg-secondary-subtle'
            }`}
            style={{ height: `${bar * 4}px` }}
          />
        ))}
      </div>
      <span className={`text-xs ${color}`}>{label}</span>
    </div>
  );
}

function getBarCount(quality: string): number {
  switch (quality) {
    case 'good': return 4;
    case 'fair': return 3;
    case 'poor': return 2;
    default: return 0;
  }
}

// Export singleton queue instance
export const offlineQueue = new OfflineQueue();
