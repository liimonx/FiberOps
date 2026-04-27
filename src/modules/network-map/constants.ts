// Network map constants and configuration

import { NetworkStatus, NetworkNodeType, NetworkMapLayer } from './types';

export const MAPBOX_CONFIG = {
  ACCESS_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '',
  STYLE: 'mapbox://styles/mapbox/dark-v11',
  DEFAULT_CENTER: [40.7128, -74.0060] as [number, number],
  DEFAULT_ZOOM: 10,
  MIN_ZOOM: 5,
  MAX_ZOOM: 18
} as const;

export const RESPONSIVE_BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1280
} as const;

export const NETWORK_STATUS_COLORS = {
  [NetworkStatus.ACTIVE]: '#10b981',   // Green
  [NetworkStatus.INACTIVE]: '#6b7280',  // Gray
  [NetworkStatus.WARNING]: '#f59e0b',  // Orange
  [NetworkStatus.ERROR]: '#ef4444'      // Red
} as const;

export const NODE_TYPE_ICONS = {
  [NetworkNodeType.CORE_NODE]: 'Server',
  [NetworkNodeType.DISTRIBUTION_NODE]: 'Cpu',
  [NetworkNodeType.ACCESS_NODE]: 'Router',
  [NetworkNodeType.SPLITTER]: 'ShareNetwork',
  [NetworkNodeType.CUSTOMER]: 'User'
} as const;

export const DEFAULT_LAYERS: NetworkMapLayer[] = [
  { id: 'fiber-routes', name: 'Fiber Routes', visible: true, type: 'connections' },
  { id: 'nodes-splitters', name: 'Nodes & Splitters', visible: true, type: 'nodes' },
  { id: 'outages', name: 'Outages', visible: false, type: 'outages' }
];

// Animation constants
export const ANIMATION_DURATIONS = {
  SHORT: 150,
  MEDIUM: 300,
  LONG: 500
} as const;

export const Z_INDEX = {
  MAP: 0,
  CONTROLS: 10,
  TOOLBAR: 20,
  PANEL: 30,
  MODAL: 40,
  TOOLTIP: 50
} as const;