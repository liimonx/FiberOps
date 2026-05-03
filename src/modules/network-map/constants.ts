// Network map constants and configuration

import { NetworkStatus, NetworkNodeType, NetworkMapLayer } from './types';

export const MAPBOX_CONFIG = {
  ACCESS_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '',
  STYLE: 'mapbox://styles/mapbox/dark-v11',
  DEFAULT_CENTER: [90.4125, 23.8103] as [number, number], // Dhaka, Bangladesh [lng, lat]
  DEFAULT_ZOOM: 12,
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

export const NETWORK_STATUS_LABELS = {
  [NetworkStatus.ACTIVE]: 'Active',
  [NetworkStatus.INACTIVE]: 'Inactive',
  [NetworkStatus.WARNING]: 'Warning',
  [NetworkStatus.ERROR]: 'Error'
} as const;

export const NODE_TYPE_ICONS = {
  [NetworkNodeType.CORE_NODE]: 'HardDrive',
  [NetworkNodeType.DISTRIBUTION_NODE]: 'Cpu',
  [NetworkNodeType.ACCESS_NODE]: 'Desktop',
  [NetworkNodeType.SPLITTER]: 'GitFork',
  [NetworkNodeType.CUSTOMER]: 'User',
  [NetworkNodeType.POLE]: 'MapPin',
  [NetworkNodeType.JUNCTION_BOX]: 'Package',
  [NetworkNodeType.ONU]: 'HardDrive',
  [NetworkNodeType.POP]: 'Pulse'
} as const;

export const DEFAULT_LAYERS: NetworkMapLayer[] = [
  { id: 'infrastructure', name: 'Core Infrastructure', visible: true, type: 'nodes' },
  { id: 'pops', name: 'POPs', visible: true, type: 'nodes' },
  { id: 'fiber-routes', name: 'Fiber Routes', visible: true, type: 'connections' },
  { id: 'poles', name: 'Poles', visible: true, type: 'nodes' },
  { id: 'junction-boxes', name: 'Junction Boxes', visible: true, type: 'nodes' },
  { id: 'splitters', name: 'Splitters', visible: true, type: 'nodes' },
  { id: 'onus', name: 'ONUs', visible: true, type: 'nodes' },
  { id: 'customers', name: 'Customers', visible: true, type: 'nodes' },
  { id: 'customer-connections', name: 'Customer Connections', visible: true, type: 'connections' },
  { id: 'outages', name: 'Outages', visible: true, type: 'outages' },
  { id: 'coverage', name: 'Coverage Area', visible: true, type: 'coverage' }
];

// Animation constants
export const ANIMATION_DURATIONS = {
  SHORT: 150,
  MEDIUM: 300,
  LONG: 500
} as const;
