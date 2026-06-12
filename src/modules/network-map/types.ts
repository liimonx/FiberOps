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
  CORE_NODE = "core_node",
  DISTRIBUTION_NODE = "distribution_node",
  ACCESS_NODE = "access_node",
  SPLITTER = "splitter",
  CUSTOMER = "customer",
  POLE = "pole",
  JUNCTION_BOX = "junction_box",
  ONU = "onu",
  POP = "pop",
}

export enum ConnectionType {
  FIBER_ROUTE = "fiber_route",
  CUSTOMER_CONNECTION = "customer_connection",
}

export enum NetworkStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  WARNING = "warning",
  DEGRADED = "degraded",
  ERROR = "error",
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
  metadata?: Record<string, unknown>;
}

export interface NetworkConnection {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  type: ConnectionType;
  status: NetworkStatus;
  bandwidth?: number;
  utilization?: number;
  route?: LatLng[];
}

export interface NetworkMapLayer {
  id: string;
  name: string;
  visible: boolean;
  type: "nodes" | "connections" | "outages" | "coverage" | "customers" | "planning";
}

export type ToolType =
  | "select"
  | "trace"
  | "measure"
  | "heatmap"
  | "impairment"
  | "plan";

export type PlanDrawMode = "area" | "route";

export interface SearchResult {
  id: string;
  name: string;
  type: "node" | "connection" | "customer";
  matchScore: number;
}

export type AssetCategory = "all" | "nodes" | "connections" | "customers";

/**
 * Extended search result with category information for filtering
 * Inherits all properties from SearchResult plus category field
 */
export interface CategorizedResult extends SearchResult {
  category: AssetCategory;
  /** Secondary line in search results (type, endpoints, id). */
  detail?: string;
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
