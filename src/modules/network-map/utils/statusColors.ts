"use client";

import { NetworkStatus } from '../types';

// Status color configuration
export interface StatusColorConfig {
  primary: string;
  secondary: string;
  background: string;
  border: string;
  icon: string;
  glow?: string;
}

export const statusColors: Record<NetworkStatus, StatusColorConfig> = {
  [NetworkStatus.ACTIVE]: {
    primary: '#10B981', // Emerald 500
    secondary: '#059669', // Emerald 600
    background: 'rgba(16, 185, 129, 0.1)',
    border: 'rgba(16, 185, 129, 0.3)',
    icon: '#10B981',
    glow: 'rgba(16, 185, 129, 0.5)'
  },
  [NetworkStatus.INACTIVE]: {
    primary: '#6B7280', // Gray 500
    secondary: '#4B5563', // Gray 600
    background: 'rgba(107, 114, 128, 0.1)',
    border: 'rgba(107, 114, 128, 0.3)',
    icon: '#6B7280'
  },
  [NetworkStatus.WARNING]: {
    primary: '#F59E0B', // Amber 500
    secondary: '#D97706', // Amber 600
    background: 'rgba(245, 158, 11, 0.1)',
    border: 'rgba(245, 158, 11, 0.3)',
    icon: '#F59E0B',
    glow: 'rgba(245, 158, 11, 0.5)'
  },
  [NetworkStatus.DEGRADED]: {
    primary: '#FB923C', // Orange 400
    secondary: '#F97316', // Orange 500
    background: 'rgba(251, 146, 60, 0.1)',
    border: 'rgba(251, 146, 60, 0.3)',
    icon: '#FB923C',
    glow: 'rgba(251, 146, 60, 0.5)'
  },
  [NetworkStatus.ERROR]: {
    primary: '#EF4444', // Red 500
    secondary: '#DC2626', // Red 600
    background: 'rgba(239, 68, 68, 0.1)',
    border: 'rgba(239, 68, 68, 0.3)',
    icon: '#EF4444',
    glow: 'rgba(239, 68, 68, 0.5)'
  }
};

// Get status color by string value (for backward compatibility)
export function getStatusColor(status: string | NetworkStatus): StatusColorConfig {
  const normalizedStatus = status.toString().toUpperCase() as NetworkStatus;
  return statusColors[normalizedStatus] || statusColors[NetworkStatus.INACTIVE];
}

// CSS class names for status colors
export const statusClasses: Record<NetworkStatus, string> = {
  [NetworkStatus.ACTIVE]: 'status-active',
  [NetworkStatus.INACTIVE]: 'status-inactive',
  [NetworkStatus.WARNING]: 'status-warning',
  [NetworkStatus.DEGRADED]: 'status-degraded',
  [NetworkStatus.ERROR]: 'status-error'
};

// Icon mapping for different statuses
export const statusIcons: Record<NetworkStatus, string> = {
  [NetworkStatus.ACTIVE]: 'CheckCircle',
  [NetworkStatus.INACTIVE]: 'MinusCircle',
  [NetworkStatus.WARNING]: 'Warning',
  [NetworkStatus.DEGRADED]: 'Warning',
  [NetworkStatus.ERROR]: 'XCircle'
};

// Status label mapping
export const statusLabels: Record<NetworkStatus, string> = {
  [NetworkStatus.ACTIVE]: 'Active',
  [NetworkStatus.INACTIVE]: 'Inactive',
  [NetworkStatus.WARNING]: 'Warning',
  [NetworkStatus.DEGRADED]: 'Degraded',
  [NetworkStatus.ERROR]: 'Down'
};

// Node type icons
export const nodeTypeIcons: Record<string, string> = {
  CORE_NODE: 'Server',
  DISTRIBUTION_NODE: 'Network',
  ACCESS_NODE: 'Antenna',
  SPLITTER: 'Share',
  CUSTOMER: 'User'
};

// Connection status styles for Mapbox
export function getConnectionPaintProperties(status: NetworkStatus) {
  const colors = getStatusColor(status);
  
  return {
    'line-color': colors.primary,
    'line-width': status === NetworkStatus.ERROR ? 4 : 3,
    'line-opacity': status === NetworkStatus.INACTIVE ? 0.4 : 0.8,
    'line-dasharray': status === NetworkStatus.INACTIVE ? [2, 2] : [1, 0]
  };
}

// Node marker styles
export function getNodeMarkerStyle(status: NetworkStatus, size: number = 12) {
  const colors = getStatusColor(status);
  
  return {
    width: `${size}px`,
    height: `${size}px`,
    backgroundColor: colors.primary,
    borderColor: colors.border,
    boxShadow: `0 0 0 2px ${colors.background}, 0 0 10px ${colors.glow || 'transparent'}`
  };
}

// Generate CSS variables for status colors
export function generateStatusCSS(): string {
  return Object.entries(statusColors).map(([status, colors]) => `
    .${statusClasses[status as NetworkStatus]} {
      --status-primary: ${colors.primary};
      --status-secondary: ${colors.secondary};
      --status-background: ${colors.background};
      --status-border: ${colors.border};
      --status-icon: ${colors.icon};
      --status-glow: ${colors.glow || 'transparent'};
    }
  `).join('\n');
}

// Hover effect configurations
export const hoverEffects = {
  node: {
    scale: 1.2,
    duration: 0.2,
  },
  connection: {
    lineWidthMultiplier: 1.5,
    opacity: 1,
    duration: 0.15
  },
  card: {
    translateY: -2,
    shadowLift: true,
    duration: 0.2
  }
};

// Focus ring styles for accessibility
export const focusStyles = {
  default: 'outline: 2px solid var(--color-primary); outline-offset: 2px;',
  inset: 'outline: 2px solid var(--color-primary); outline-offset: -2px;',
  none: 'outline: none;'
};

// Animation keyframes for status indicators
export const statusAnimations = `
  @keyframes pulse-active {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
  }
  
  @keyframes pulse-warning {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.7; transform: scale(1.1); }
  }
  
  @keyframes pulse-error {
    0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
    50% { opacity: 0.8; box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
  }
  
  .status-pulse-active {
    animation: pulse-active 2s ease-in-out infinite;
  }
  
  .status-pulse-warning {
    animation: pulse-warning 1.5s ease-in-out infinite;
  }
  
  .status-pulse-error {
    animation: pulse-error 2s ease-out infinite;
  }
`;
