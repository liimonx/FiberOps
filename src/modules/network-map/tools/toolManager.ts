"use client";

import {
  NetworkNode,
  NetworkConnection,
  LatLng,
  MeasurementPoint,
  TracePath,
  NetworkStatus,
} from "../types";
import { useNetworkMapStore } from "../stores/useNetworkMapStore";

// Tool interface defining common methods
export interface MapTool {
  id: string;
  name: string;
  icon: string;
  description: string;

  // Lifecycle methods
  activate: () => void;
  deactivate: () => void;

  // Event handlers
  onClick?: (event: MapMouseEvent) => void;
  onDoubleClick?: (event: MapMouseEvent) => void;
  onMouseMove?: (event: MapMouseEvent) => void;
  onMouseDown?: (event: MapMouseEvent) => void;
  onMouseUp?: (event: MapMouseEvent) => void;
  onKeyDown?: (event: KeyboardEvent) => void;
  onKeyUp?: (event: KeyboardEvent) => void;

  // Cursor style
  cursor?: string;
}

// Map mouse event wrapper
export interface MapMouseEvent {
  lngLat: LatLng;
  point: { x: number; y: number };
  originalEvent: MouseEvent;
  features?: Array<{
    layer?: { id: string };
    properties?: Record<string, any> | null;
    geometry?: {
      type: string;
      coordinates?: any;
    } | null;
  }>;
}

// Base tool implementation
abstract class BaseTool implements MapTool {
  public abstract readonly id: string;
  public abstract readonly name: string;
  public abstract readonly icon: string;
  public abstract readonly description: string;
  public cursor: string = "default";

  activate(): void {
    console.log(`[Tool] ${this.name} activated`);
  }

  deactivate(): void {
    console.log(`[Tool] ${this.name} deactivated`);
  }
}

// Select Tool - Default selection and inspection
export class SelectTool extends BaseTool {
  public readonly id = "select";
  public readonly name = "Select";
  public readonly icon = "CursorClick";
  public readonly description = "Select and inspect network elements";
  public cursor = "pointer";

  onClick(event: MapMouseEvent): void {
    const store = useNetworkMapStore.getState();

    // Find clicked feature
    if (event.features && event.features.length > 0) {
      const feature = event.features[0];
      const elementId = feature.properties?.id;

      if (elementId) {
        store.setSelectedElement(elementId);
        store.addToSelectionHistory(elementId);
      }
    } else {
      // Deselect if clicking empty space
      store.setSelectedElement(null);
    }
  }
}

// Trace Tool - Connection path tracing
export class TraceTool extends BaseTool {
  public readonly id = "trace";
  public readonly name = "Trace";
  public readonly icon = "GitCommit";
  public readonly description = "Trace connections between nodes";
  public cursor = "crosshair";

  private sourceNode: string | null = null;

  activate(): void {
    super.activate();
    this.sourceNode = null;
    useNetworkMapStore.getState().setTracePath(null);
  }

  deactivate(): void {
    super.deactivate();
    this.sourceNode = null;
  }

  onClick(event: MapMouseEvent): void {
    const store = useNetworkMapStore.getState();

    if (!event.features || event.features.length === 0) return;

    const feature = event.features[0];
    const nodeId = feature.properties?.id;

    if (!nodeId) return;

    // If no source node selected, set it
    if (!this.sourceNode) {
      this.sourceNode = nodeId;
      store.setSelectedElement(nodeId);
      console.log("[Trace] Source node selected:", nodeId);
      return;
    }

    // If source node exists, trace path to target
    if (this.sourceNode && nodeId !== this.sourceNode) {
      this.tracePath(this.sourceNode, nodeId);
      this.sourceNode = null; // Reset for next trace
    }
  }

  private async tracePath(sourceId: string, targetId: string): Promise<void> {
    const store = useNetworkMapStore.getState();
    const nodes = store.nodes;
    const connections = store.connections;

    console.log("[Trace] Tracing path from", sourceId, "to", targetId);

    // BFS to find path
    const path = this.findPathBFS(sourceId, targetId, nodes, connections);

    if (path) {
      const tracePath: TracePath = {
        id: `trace_${Date.now()}`,
        sourceNodeId: sourceId,
        targetNodeId: targetId,
        path: path.nodes,
        connections: path.connections,
        totalDistance: this.calculatePathDistance(path.nodes),
        calculatedAt: new Date(),
      };

      store.setTracePath(tracePath);
      console.log("[Trace] Path found:", tracePath);
    } else {
      console.warn("[Trace] No path found between", sourceId, "and", targetId);
      store.setTracePath(null);
    }
  }

  private findPathBFS(
    sourceId: string,
    targetId: string,
    nodes: NetworkNode[],
    connections: NetworkConnection[]
  ): { nodes: NetworkNode[]; connections: NetworkConnection[] } | null {
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const adjacencyList = new Map<
      string,
      Array<{ nodeId: string; connection: NetworkConnection }>
    >();

    // Build adjacency list
    connections.forEach((conn) => {
      if (!adjacencyList.has(conn.sourceNodeId)) {
        adjacencyList.set(conn.sourceNodeId, []);
      }
      if (!adjacencyList.has(conn.targetNodeId)) {
        adjacencyList.set(conn.targetNodeId, []);
      }

      adjacencyList.get(conn.sourceNodeId)!.push({
        nodeId: conn.targetNodeId,
        connection: conn,
      });
      adjacencyList.get(conn.targetNodeId)!.push({
        nodeId: conn.sourceNodeId,
        connection: conn,
      });
    });

    // BFS
    const queue: Array<{
      nodeId: string;
      path: string[];
      connections: NetworkConnection[];
    }> = [{ nodeId: sourceId, path: [sourceId], connections: [] }];
    const visited = new Set<string>([sourceId]);

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (current.nodeId === targetId) {
        const pathNodes = current.path
          .map((id) => nodeMap.get(id))
          .filter(Boolean) as NetworkNode[];
        return { nodes: pathNodes, connections: current.connections };
      }

      const neighbors = adjacencyList.get(current.nodeId) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor.nodeId)) {
          visited.add(neighbor.nodeId);
          queue.push({
            nodeId: neighbor.nodeId,
            path: [...current.path, neighbor.nodeId],
            connections: [...current.connections, neighbor.connection],
          });
        }
      }
    }

    return null;
  }

  private calculatePathDistance(nodes: NetworkNode[]): number {
    let totalDistance = 0;

    for (let i = 0; i < nodes.length - 1; i++) {
      const dist = this.haversineDistance(nodes[i].position, nodes[i + 1].position);
      totalDistance += dist;
    }

    return totalDistance;
  }

  private haversineDistance(p1: LatLng, p2: LatLng): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (p1.lat * Math.PI) / 180;
    const φ2 = (p2.lat * Math.PI) / 180;
    const Δφ = ((p2.lat - p1.lat) * Math.PI) / 180;
    const Δλ = ((p2.lng - p1.lng) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}

// Measure Tool - Distance and area measurement
export class MeasureTool extends BaseTool {
  public readonly id = "measure";
  public readonly name = "Measure";
  public readonly icon = "Ruler";
  public readonly description = "Measure distances and areas on the map";
  public cursor = "crosshair";

  activate(): void {
    super.activate();
    useNetworkMapStore.getState().clearMeasurements();
  }

  deactivate(): void {
    super.deactivate();
  }

  onClick(event: MapMouseEvent): void {
    const store = useNetworkMapStore.getState();
    const measurements = store.measurements;

    // Create new measurement point
    const newPoint: MeasurementPoint = {
      id: `measure_${Date.now()}_${measurements.length}`,
      position: event.lngLat,
      timestamp: new Date(),
      distance:
        measurements.length > 0
          ? this.calculateDistance(
              measurements[measurements.length - 1].position,
              event.lngLat
            )
          : 0,
    };

    store.addMeasurement(newPoint);
    console.log("[Measure] Added point:", newPoint);
  }

  onKeyDown(event: KeyboardEvent): void {
    // Press Escape or Backspace to remove last point
    if (event.key === "Escape" || event.key === "Backspace") {
      const store = useNetworkMapStore.getState();
      const measurements = store.measurements;

      if (measurements.length > 0) {
        // Remove last measurement (need to implement remove in store)
        const updated = measurements.slice(0, -1);
        // For now, just clear all
        store.clearMeasurements();
        console.log("[Measure] Cleared measurements");
      }
    }
  }

  private calculateDistance(p1: LatLng, p2: LatLng): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (p1.lat * Math.PI) / 180;
    const φ2 = (p2.lat * Math.PI) / 180;
    const Δφ = ((p2.lat - p1.lat) * Math.PI) / 180;
    const Δλ = ((p2.lng - p1.lng) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  getTotalDistance(): number {
    const measurements = useNetworkMapStore.getState().measurements;
    return measurements.reduce((sum, point) => sum + (point.distance || 0), 0);
  }
}

// Heatmap Tool - Network density visualization
export class HeatmapTool extends BaseTool {
  public readonly id = "heatmap";
  public readonly name = "Heatmap";
  public readonly icon = "Fire";
  public readonly description = "Visualize network density and utilization";
  public cursor = "default";

  private heatmapType: "density" | "utilization" | "incidents" = "density";

  activate(): void {
    super.activate();
    this.generateHeatmap();
  }

  deactivate(): void {
    super.deactivate();
    useNetworkMapStore.getState().setHeatmapData(null);
  }

  setHeatmapType(type: "density" | "utilization" | "incidents"): void {
    this.heatmapType = type;
    this.generateHeatmap();
  }

  private generateHeatmap(): void {
    const store = useNetworkMapStore.getState();
    const nodes = store.nodes;
    const connections = store.connections;

    console.log("[Heatmap] Generating heatmap:", this.heatmapType);

    let dataPoints: Array<{ position: LatLng; intensity: number; value?: number }> = [];

    switch (this.heatmapType) {
      case "density":
        // Node density heatmap
        dataPoints = nodes.map((node) => ({
          position: node.position,
          intensity: this.calculateNodeDensity(node, nodes),
          value: 1,
        }));
        break;

      case "utilization":
        // Bandwidth utilization heatmap
        dataPoints = connections
          .filter((conn) => conn.utilization !== undefined)
          .map((conn) => {
            const sourceNode = nodes.find((n) => n.id === conn.sourceNodeId);
            if (sourceNode) {
              return {
                position: sourceNode.position,
                intensity: (conn.utilization || 0) / 100,
                value: conn.utilization,
              };
            }
            return null;
          })
          .filter(Boolean) as typeof dataPoints;
        break;

      case "incidents":
        // Incident concentration heatmap
        // This would use incident data from the store
        dataPoints = nodes
          .filter(
            (node) =>
              node.status === NetworkStatus.ERROR || node.status === NetworkStatus.WARNING
          )
          .map((node) => ({
            position: node.position,
            intensity: node.status === NetworkStatus.ERROR ? 1 : 0.5,
            value: 1,
          }));
        break;
    }

    const heatmapData = {
      dataPoints,
      maxIntensity: Math.max(...dataPoints.map((d) => d.intensity), 1),
      radius: 30,
      blur: 15,
      gradient: {
        "0.0": "blue",
        "0.25": "cyan",
        "0.5": "lime",
        "0.75": "yellow",
        "1.0": "red",
      },
    };

    store.setHeatmapData(heatmapData);
    console.log("[Heatmap] Generated with", dataPoints.length, "data points");
  }

  private calculateNodeDensity(node: NetworkNode, allNodes: NetworkNode[]): number {
    // Count nodes within 1km radius
    const radius = 0.01; // ~1km in degrees (rough approximation)
    const nearbyCount = allNodes.filter((other) => {
      if (other.id === node.id) return false;
      const dx = other.position.lat - node.position.lat;
      const dy = other.position.lng - node.position.lng;
      return Math.sqrt(dx * dx + dy * dy) < radius;
    }).length;

    // Normalize to 0-1 range (assuming max 20 nodes in vicinity)
    return Math.min(nearbyCount / 20, 1);
  }
}

// Impairment Tool - Outage simulation and impact analysis
export class ImpairmentTool extends BaseTool {
  public readonly id = "impairment";
  public readonly name = "Impairment Area";
  public readonly icon = "Warning";
  public readonly description = "Define a blast radius to simulate outages";
  public cursor = "crosshair";

  activate(): void {
    super.activate();
  }

  deactivate(): void {
    super.deactivate();
    // Do not automatically restore services or clear area on deactivate,
    // so user can switch tools to inspect while area is active.
    // The panel will provide explicit clear/restore buttons.
  }

  onClick(event: MapMouseEvent): void {
    const store = useNetworkMapStore.getState();
    const currentArea = store.impairmentArea;
    const currentRadius = currentArea ? currentArea.radius : 1000;

    store.setImpairmentArea({
      center: event.lngLat,
      radius: currentRadius,
    });
    console.log("[ImpairmentTool] Set impairment center:", event.lngLat, "Radius:", currentRadius);
  }
}

// Tool Manager - Manages tool lifecycle and switching
export class ToolManager {
  private tools: Map<string, MapTool> = new Map();
  private activeTool: MapTool | null = null;

  constructor() {
    // Register default tools
    this.registerTool(new SelectTool());
    this.registerTool(new TraceTool());
    this.registerTool(new MeasureTool());
    this.registerTool(new HeatmapTool());
    this.registerTool(new ImpairmentTool());
  }

  registerTool(tool: MapTool): void {
    this.tools.set(tool.id, tool);
    console.log("[ToolManager] Registered tool:", tool.name);
  }

  getTool(toolId: string): MapTool | undefined {
    return this.tools.get(toolId);
  }

  getAllTools(): MapTool[] {
    return Array.from(this.tools.values());
  }

  setActiveTool(toolId: string): void {
    // Deactivate current tool
    if (this.activeTool) {
      this.activeTool.deactivate();
    }

    // Activate new tool
    const newTool = this.tools.get(toolId);
    if (newTool) {
      this.activeTool = newTool;
      newTool.activate();

      // Update store
      useNetworkMapStore.getState().setActiveTool(toolId as any);
      console.log("[ToolManager] Active tool changed to:", newTool.name);
    } else {
      console.warn("[ToolManager] Tool not found:", toolId);
    }
  }

  getActiveTool(): MapTool | null {
    return this.activeTool;
  }

  handleEvent(eventName: string, event: MapMouseEvent | KeyboardEvent): void {
    if (!this.activeTool) return;

    const handler = (this.activeTool as any)[eventName];
    if (typeof handler === "function") {
      handler.call(this.activeTool, event);
    }
  }
}

// Singleton instance
let toolManagerInstance: ToolManager | null = null;

export function getToolManager(): ToolManager {
  if (!toolManagerInstance) {
    toolManagerInstance = new ToolManager();
  }
  return toolManagerInstance;
}

export function resetToolManager(): void {
  if (toolManagerInstance) {
    toolManagerInstance = null;
  }
}
