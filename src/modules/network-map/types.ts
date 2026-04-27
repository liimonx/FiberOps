// Network map specific types and interfaces

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Bounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface ViewportState {
  center: LatLng;
  zoom: number;
  bearing: number;
  pitch: number;
}

export enum NetworkNodeType {
  CORE_NODE = 'core_node',
  DISTRIBUTION_NODE = 'distribution_node',
  ACCESS_NODE = 'access_node',
  SPLITTER = 'splitter',
  CUSTOMER = 'customer'
}

export enum NetworkStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  WARNING = 'warning',
  ERROR = 'error'
}

export interface NetworkNode {
  id: string;
  name: string;
  type: NetworkNodeType;
  position: LatLng;
  status: NetworkStatus;
  capacity?: number;
  utilization?: number;
  connectedNodes?: string[];
  metadata?: Record<string, any>;
}

export interface NetworkConnection {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  status: NetworkStatus;
  bandwidth?: number;
  utilization?: number;
  route?: LatLng[];
}

export interface NetworkMapLayer {
  id: string;
  name: string;
  visible: boolean;
  type: 'nodes' | 'connections' | 'outages';
}

export type ToolType = 'select' | 'trace' | 'measure' | 'heatmap';

export interface SearchResult {
  id: string;
  name: string;
  type: 'node' | 'connection' | 'customer';
  matchScore: number;
}

// Measurement and tracing types
export interface MeasurementPoint {
  id: string;
  position: LatLng;
  timestamp: Date;
  distance?: number; // Distance from previous point in meters
}

export interface TracePath {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  path: NetworkNode[];
  connections: NetworkConnection[];
  totalDistance: number;
  calculatedAt: Date;
}

export interface HeatmapData {
  dataPoints: Array<{
    position: LatLng;
    intensity: number; // 0-1 scale
    value?: number; // Optional numeric value (e.g., bandwidth, latency)
  }>;
  maxIntensity: number;
  radius: number; // Radius of each heat point in pixels
  blur: number; // Blur factor
  gradient?: Record<string, string>; // Color gradient stops
}

// Map interaction types
export interface MapInteractionState {
  activeTool: ToolType;
  selectedElementId: string | null;
  hoveredElementId: string | null;
  isDragging: boolean;
  isZooming: boolean;
}