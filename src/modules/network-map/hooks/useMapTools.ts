"use client";

import { useEffect, useCallback, useRef } from 'react';
import { getToolManager, MapTool, MapMouseEvent } from '../tools/toolManager';
import { useNetworkMapStore } from '../stores/useNetworkMapStore';
import { ToolType } from '../types';

interface UseMapToolsOptions {
  mapInstance?: any; // Mapbox GL JS map instance
  enabled?: boolean;
}

export function useMapTools(options: UseMapToolsOptions = {}) {
  const { mapInstance, enabled = true } = options;
  
  const toolManagerRef = useRef(getToolManager());
  const mapRef = useRef(mapInstance);
  
  // Get current tool from store
  const activeToolId = useNetworkMapStore((state) => state.interaction.activeTool);
  const setActiveTool = useNetworkMapStore((state) => state.setActiveTool);

  // Update map ref when it changes
  useEffect(() => {
    mapRef.current = mapInstance;
  }, [mapInstance]);

  // Initialize tool manager and sync with store
  useEffect(() => {
    if (!enabled) return;

    const toolManager = toolManagerRef.current;
    
    // Set initial tool from store
    if (activeToolId) {
      toolManager.setActiveTool(activeToolId);
    }

    return () => {
      // Cleanup on unmount
      const activeTool = toolManager.getActiveTool();
      if (activeTool) {
        activeTool.deactivate();
      }
    };
  }, [enabled, activeToolId]);

  // Handle tool switching
  const switchTool = useCallback((toolId: ToolType) => {
    const toolManager = toolManagerRef.current;
    toolManager.setActiveTool(toolId);
    setActiveTool(toolId);
  }, [setActiveTool]);

  // Event handlers that delegate to active tool
  const handleClick = useCallback((event: MapMouseEvent) => {
    if (!enabled) return;
    toolManagerRef.current.handleEvent('onClick', event);
  }, [enabled]);

  const handleDoubleClick = useCallback((event: MapMouseEvent) => {
    if (!enabled) return;
    toolManagerRef.current.handleEvent('onDoubleClick', event);
  }, [enabled]);

  const handleMouseMove = useCallback((event: MapMouseEvent) => {
    if (!enabled) return;
    toolManagerRef.current.handleEvent('onMouseMove', event);
  }, [enabled]);

  const handleMouseDown = useCallback((event: MapMouseEvent) => {
    if (!enabled) return;
    toolManagerRef.current.handleEvent('onMouseDown', event);
  }, [enabled]);

  const handleMouseUp = useCallback((event: MapMouseEvent) => {
    if (!enabled) return;
    toolManagerRef.current.handleEvent('onMouseUp', event);
  }, [enabled]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;
    toolManagerRef.current.handleEvent('onKeyDown', event);
  }, [enabled]);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;
    toolManagerRef.current.handleEvent('onKeyUp', event);
  }, [enabled]);

  // Get current cursor style
  const cursor = useCallback(() => {
    const activeTool = toolManagerRef.current.getActiveTool();
    return activeTool?.cursor || 'default';
  }, []);

  // Get all available tools
  const tools = useCallback(() => {
    return toolManagerRef.current.getAllTools();
  }, []);

  // Get active tool
  const activeTool = useCallback(() => {
    return toolManagerRef.current.getActiveTool();
  }, []);

  // Helper to get specific tool
  const getTool = useCallback((toolId: string) => {
    return toolManagerRef.current.getTool(toolId);
  }, []);

  return {
    switchTool,
    handleClick,
    handleDoubleClick,
    handleMouseMove,
    handleMouseDown,
    handleMouseUp,
    handleKeyDown,
    handleKeyUp,
    cursor,
    tools,
    activeTool,
    getTool,
    toolManager: toolManagerRef.current,
  };
}

// Hook for measurement-specific functionality
export function useMeasurementTool() {
  const measurements = useNetworkMapStore((state) => state.measurements);
  const clearMeasurements = useNetworkMapStore((state) => state.clearMeasurements);
  const toolManagerRef = useRef(getToolManager());

  const getTotalDistance = useCallback(() => {
    return measurements.reduce((sum, point) => sum + (point.distance || 0), 0);
  }, [measurements]);

  const formatDistance = useCallback((meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(2)} km`;
  }, []);

  const getLastPoint = useCallback(() => {
    return measurements.length > 0 ? measurements[measurements.length - 1] : null;
  }, [measurements]);

  return {
    measurements,
    totalDistance: getTotalDistance(),
    formattedDistance: formatDistance(getTotalDistance()),
    clearMeasurements,
    lastPoint: getLastPoint(),
    pointCount: measurements.length,
  };
}

// Hook for trace-specific functionality
export function useTraceTool() {
  const tracePath = useNetworkMapStore((state) => state.tracePath);
  const setTracePath = useNetworkMapStore((state) => state.setTracePath);

  const clearTrace = useCallback(() => {
    setTracePath(null);
  }, [setTracePath]);

  const formatDistance = useCallback((meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(2)} km`;
  }, []);

  return {
    tracePath,
    hasTrace: !!tracePath,
    totalDistance: tracePath?.totalDistance || 0,
    formattedDistance: formatDistance(tracePath?.totalDistance || 0),
    nodeCount: tracePath?.path.length || 0,
    connectionCount: tracePath?.connections.length || 0,
    clearTrace,
  };
}

// Hook for heatmap-specific functionality
export function useHeatmapTool() {
  const heatmapData = useNetworkMapStore((state) => state.heatmapData);
  const setHeatmapData = useNetworkMapStore((state) => state.setHeatmapData);
  const toolManagerRef = useRef(getToolManager());

  const setHeatmapType = useCallback((type: 'density' | 'utilization' | 'incidents') => {
    const heatmapTool = toolManagerRef.current.getTool('heatmap') as any;
    if (heatmapTool && heatmapTool.setHeatmapType) {
      heatmapTool.setHeatmapType(type);
    }
  }, []);

  const clearHeatmap = useCallback(() => {
    setHeatmapData(null);
  }, [setHeatmapData]);

  return {
    heatmapData,
    hasHeatmap: !!heatmapData,
    setHeatmapType,
    clearHeatmap,
    dataPointCount: heatmapData?.dataPoints.length || 0,
  };
}
