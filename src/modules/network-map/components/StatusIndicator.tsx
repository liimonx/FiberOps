"use client";

import React from 'react';
import { Icon } from "@shohojdhara/atomix";
import { NetworkStatus } from '../types';
import { NETWORK_STATUS_COLORS } from '../constants';

interface StatusIndicatorProps {
  status: NetworkStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  pulse?: boolean;
  animated?: boolean;
  className?: string;
  label?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  size = 'md',
  showLabel = true,
  pulse = false,
  animated = true,
  className = '',
  label
}) => {
  const statusColor = NETWORK_STATUS_COLORS[status];
  const displayLabel = label || status.charAt(0).toUpperCase() + status.slice(1);
  
  const sizeClasses = {
    sm: { dot: '6px', fontSize: '10px', gap: '4px' },
    md: { dot: '10px', fontSize: '12px', gap: '6px' },
    lg: { dot: '14px', fontSize: '14px', gap: '8px' }
  };

  const sizes = sizeClasses[size];

  const getStatusIcon = () => {
    switch (status) {
      case NetworkStatus.ACTIVE:
        return 'CheckCircle';
      case NetworkStatus.INACTIVE:
        return 'Power';
      case NetworkStatus.WARNING:
        return 'Warning';
      case NetworkStatus.ERROR:
        return 'XCircle';
      default:
        return 'Circle';
    }
  };

  const getStatusDescription = () => {
    switch (status) {
      case NetworkStatus.ACTIVE:
        return 'System is operating normally';
      case NetworkStatus.INACTIVE:
        return 'System is offline or disabled';
      case NetworkStatus.WARNING:
        return 'System has potential issues';
      case NetworkStatus.ERROR:
        return 'System has critical errors';
      default:
        return 'Status unknown';
    }
  };

  const indicatorClasses = [
    'status-indicator',
    `status-indicator--${status}`,
    `status-indicator--${size}`,
    pulse && 'status-indicator--pulse',
    animated && 'status-indicator--animated',
    className
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={indicatorClasses}
      role="status"
      aria-label={`${displayLabel}: ${getStatusDescription()}`}
      title={getStatusDescription()}
    >
      <div 
        className="status-dot"
        style={{
          width: sizes.dot,
          height: sizes.dot,
          backgroundColor: statusColor
        }}
      >
        {pulse && <span className="pulse-ring" style={{ borderColor: statusColor }} />}
      </div>
      
      {showLabel && (
        <span 
          className="status-label"
          style={{ fontSize: sizes.fontSize }}
        >
          {displayLabel}
        </span>
      )}

      <style jsx>{`
        .status-indicator {
          display: inline-flex;
          align-items: center;
          gap: ${sizes.gap};
          cursor: default;
          user-select: none;
        }

        .status-dot {
          position: relative;
          border-radius: 50%;
          flex-shrink: 0;
          transition: transform var(--duration-normal) ease;
        }

        .status-label {
          color: var(--color-gray-200);
          font-weight: var(--font-weight-medium);
          text-transform: capitalize;
          white-space: nowrap;
        }

        .pulse-ring {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border: 2px solid;
          animation: pulse-ring 1.5s ease-out infinite;
        }

        @keyframes pulse-ring {
          0% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(2.5);
            opacity: 0;
          }
        }

        /* Status-specific styles */
        .status-indicator--active .status-dot {
          box-shadow: 0 0 4px ${statusColor};
        }

        .status-indicator--warning .status-dot {
          box-shadow: 0 0 6px ${statusColor};
        }

        .status-indicator--error .status-dot {
          box-shadow: 0 0 8px ${statusColor};
        }

        /* Animated states */
        .status-indicator--animated.status-indicator--warning .status-dot {
          animation: glow-warning 2s ease-in-out infinite;
        }

        .status-indicator--animated.status-indicator--error .status-dot {
          animation: glow-error 1s ease-in-out infinite;
        }

        @keyframes glow-warning {
          0%, 100% {
            box-shadow: 0 0 4px ${statusColor};
          }
          50% {
            box-shadow: 0 0 12px ${statusColor};
          }
        }

        @keyframes glow-error {
          0%, 100% {
            box-shadow: 0 0 6px ${statusColor};
          }
          50% {
            box-shadow: 0 0 16px ${statusColor};
          }
        }

        /* Hover effects */
        .status-indicator:hover .status-dot {
          transform: scale(1.2);
        }

        /* Size variations */
        .status-indicator--sm .status-label {
          font-weight: var(--font-weight-normal);
        }

        .status-indicator--lg .status-label {
          font-weight: var(--font-weight-semibold);
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
          .status-dot {
            border: 2px solid currentColor;
          }

          .status-indicator--active .status-dot {
            background: #00ff00 !important;
          }

          .status-indicator--inactive .status-dot {
            background: #808080 !important;
          }

          .status-indicator--warning .status-dot {
            background: #ffff00 !important;
          }

          .status-indicator--error .status-dot {
            background: #ff0000 !important;
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .status-dot {
            transition: none;
          }

          .pulse-ring {
            animation: none;
          }

          .status-indicator--animated.status-indicator--warning .status-dot,
          .status-indicator--animated.status-indicator--error .status-dot {
            animation: none;
          }
        }

        /* Print styles */
        @media print {
          .status-indicator {
            color: black;
          }

          .status-label {
            color: black;
          }
        }
      `}</style>
    </div>
  );
};

// Badge variant for inline status display
export const StatusBadge: React.FC<{
  status: NetworkStatus;
  count?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ status, count, size = 'md', className = '' }) => {
  const statusColor = NETWORK_STATUS_COLORS[status];
  const displayText = count !== undefined ? `${count} ${status}` : status;

  return (
    <span 
      className={`status-badge status-badge--${status} status-badge--${size} ${className}`}
      role="status"
    >
      <StatusIndicator 
        status={status} 
        size={size === 'lg' ? 'sm' : 'sm'} 
        showLabel={false}
        pulse={status === NetworkStatus.ERROR || status === NetworkStatus.WARNING}
      />
      <span className="badge-text">{displayText}</span>

      <style jsx>{`
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 20px;
          background: ${statusColor}20;
          border: 1px solid ${statusColor}40;
          font-size: ${size === 'sm' ? '10px' : size === 'lg' ? '14px' : '12px'};
          font-weight: var(--font-weight-medium);
          text-transform: capitalize;
          color: ${statusColor};
        }

        .badge-text {
          white-space: nowrap;
        }

        .status-badge--active {
          background: ${NETWORK_STATUS_COLORS[NetworkStatus.ACTIVE]}20;
          border-color: ${NETWORK_STATUS_COLORS[NetworkStatus.ACTIVE]}40;
          color: ${NETWORK_STATUS_COLORS[NetworkStatus.ACTIVE]};
        }

        .status-badge--warning {
          background: ${NETWORK_STATUS_COLORS[NetworkStatus.WARNING]}20;
          border-color: ${NETWORK_STATUS_COLORS[NetworkStatus.WARNING]}40;
          color: ${NETWORK_STATUS_COLORS[NetworkStatus.WARNING]};
        }

        .status-badge--error {
          background: ${NETWORK_STATUS_COLORS[NetworkStatus.ERROR]}20;
          border-color: ${NETWORK_STATUS_COLORS[NetworkStatus.ERROR]}40;
          color: ${NETWORK_STATUS_COLORS[NetworkStatus.ERROR]};
        }

        .status-badge--inactive {
          background: ${NETWORK_STATUS_COLORS[NetworkStatus.INACTIVE]}20;
          border-color: ${NETWORK_STATUS_COLORS[NetworkStatus.INACTIVE]}40;
          color: ${NETWORK_STATUS_COLORS[NetworkStatus.INACTIVE]};
        }
      `}</style>
    </span>
  );
};

// Summary component for displaying multiple status counts
export const StatusSummary: React.FC<{
  counts: Record<NetworkStatus, number>;
  showZero?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ counts, showZero = false, size = 'md', className = '' }) => {
  const statuses = [NetworkStatus.ACTIVE, NetworkStatus.WARNING, NetworkStatus.ERROR, NetworkStatus.INACTIVE];
  
  return (
    <div className={`status-summary ${className}`} role="region" aria-label="Network status summary">
      {statuses.map(status => {
        const count = counts[status] || 0;
        if (!showZero && count === 0) return null;
        
        return (
          <StatusBadge
            key={status}
            status={status}
            count={count}
            size={size}
          />
        );
      })}

      <style jsx>{`
        .status-summary {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
      `}</style>
    </div>
  );
};
