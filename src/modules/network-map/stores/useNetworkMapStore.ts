"use client";

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { useMemo } from 'react';
import { 
  ViewportState, 
  NetworkMapLayer, 
  ToolType, 
  MapInteractionState, 
  NetworkNode, 
  NetworkConnection,
  MeasurementPoint,
  HeatmapData,
  TracePath
} from '../types';
import { DEFAULT_LAYERS, MAPBOX_CONFIG } from '../constants';

interface NetworkMapStore {
  // Viewport state
  viewport: ViewportState;
  setViewport: (viewport: Partial<ViewportState>) => void;
  
  // Layers state
  layers: NetworkMapLayer[];
  toggleLayer: (layerId: string) => void;
  setLayerVisibility: (layerId: string, visible: boolean) => void;
  updateLayers: (layers: NetworkMapLayer[]) => void;
  
  // Interaction state
  interaction: MapInteractionState;
  setActiveTool: (tool: ToolType) => void;
  setSelectedElement: (elementId: string | null) => void;
  setHoveredElement: (elementId: string | null) => void;
  setDragging: (dragging: boolean) => void;
  setZooming: (zooming: boolean) => void;
  
  // Data state
  nodes: NetworkNode[];
  connections: NetworkConnection[];
  isLoading: boolean;
  loadingProgress: number;
  error: string | null;
  lastUpdated: Date | null;
  setNodes: (nodes: NetworkNode[]) => void;
  setConnections: (connections: NetworkConnection[]) => void;
  addNode: (node: NetworkNode) => void;
  updateNode: (nodeId: string, updates: Partial<NetworkNode>) => void;
  removeNode: (nodeId: string) => void;
  addConnection: (connection: NetworkConnection) => void;
  updateConnection: (connectionId: string, updates: Partial<NetworkConnection>) => void;
  removeConnection: (connectionId: string) => void;
  setLoading: (loading: boolean) => void;
  setLoadingProgress: (progress: number) => void;
  setError: (error: string | null) => void;
  setLastUpdated: (date: Date) => void;
  
  // Search state
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: any[];
  setSearchResults: (results: any[]) => void;
  
  // Tool-specific state
  measurements: MeasurementPoint[];
  addMeasurement: (point: MeasurementPoint) => void;
  clearMeasurements: () => void;
  
  tracePath: TracePath | null;
  setTracePath: (path: TracePath | null) => void;
  
  heatmapData: HeatmapData | null;
  setHeatmapData: (data: HeatmapData | null) => void;
  
  // Selection history for undo/redo
  selectionHistory: string[];
  addToSelectionHistory: (elementId: string) => void;
  clearSelectionHistory: () => void;
  
  // Real-time connection state
  isWebSocketConnected: boolean;
  setWebSocketConnected: (connected: boolean) => void;
  connectionQuality: 'good' | 'fair' | 'poor' | 'disconnected';
  setConnectionQuality: (quality: 'good' | 'fair' | 'poor' | 'disconnected') => void;
  
  // Performance metrics
  renderTime: number;
  setRenderTime: (time: number) => void;
  fps: number;
  setFps: (fps: number) => void;
  
  // Reset function
  reset: () => void;
}

const initialViewport: ViewportState = {
  center: { lat: MAPBOX_CONFIG.DEFAULT_CENTER[1], lng: MAPBOX_CONFIG.DEFAULT_CENTER[0] }, // Mapbox uses [lng, lat] format
  zoom: MAPBOX_CONFIG.DEFAULT_ZOOM,
  bearing: 0,
  pitch: 0
};

const initialInteraction: MapInteractionState = {
  activeTool: 'select',
  selectedElementId: null,
  hoveredElementId: null,
  isDragging: false,
  isZooming: false
};

export const useNetworkMapStore = create<NetworkMapStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        viewport: initialViewport,
        layers: DEFAULT_LAYERS,
        interaction: initialInteraction,
        nodes: [],
        connections: [],
        isLoading: false,
        loadingProgress: 0,
        error: null,
        lastUpdated: null,
        searchQuery: '',
        searchResults: [],
        measurements: [],
        tracePath: null,
        heatmapData: null,
        selectionHistory: [],
        isWebSocketConnected: false,
        connectionQuality: 'disconnected',
        renderTime: 0,
        fps: 60,

        // Viewport actions
        setViewport: (updates) =>
          set((state) => ({ 
            viewport: { ...state.viewport, ...updates } 
          }), false, 'setViewport'),

        // Layer actions
        toggleLayer: (layerId) =>
          set((state) => {
            const layerExists = state.layers.some(l => l.id === layerId);
            if (layerExists) {
              return {
                layers: state.layers.map(layer =>
                  layer.id === layerId 
                    ? { ...layer, visible: !layer.visible }
                    : layer
                )
              };
            }
            // If layer doesn't exist (e.g. newly added to config), we can't easily toggle it without its metadata
            // But we can assume it should be visible if it was missing and we are trying to toggle it
            // Actually, it's better to just ensure all layers are synced.
            return state;
          }, false, 'toggleLayer'),

        setLayerVisibility: (layerId, visible) =>
          set((state) => {
            const layerExists = state.layers.some(l => l.id === layerId);
            if (layerExists) {
              return {
                layers: state.layers.map(layer =>
                  layer.id === layerId 
                    ? { ...layer, visible }
                    : layer
                )
              };
            }
            return state;
          }, false, 'setLayerVisibility'),

        updateLayers: (layers) =>
          set({ layers }, false, 'updateLayers'),

        // Interaction actions
        setActiveTool: (tool) =>
          set((state) => ({
            interaction: { ...state.interaction, activeTool: tool }
          }), false, 'setActiveTool'),

        setSelectedElement: (elementId) =>
          set((state) => ({
            interaction: { ...state.interaction, selectedElementId: elementId }
          }), false, 'setSelectedElement'),

        setHoveredElement: (elementId) =>
          set((state) => ({
            interaction: { ...state.interaction, hoveredElementId: elementId }
          }), false, 'setHoveredElement'),

        setDragging: (dragging) =>
          set((state) => ({
            interaction: { ...state.interaction, isDragging: dragging }
          }), false, 'setDragging'),

        setZooming: (zooming) =>
          set((state) => ({
            interaction: { ...state.interaction, isZooming: zooming }
          }), false, 'setZooming'),

        // Data actions - Optimistic updates
        setNodes: (nodes) => 
          set({ nodes, lastUpdated: new Date() }, false, 'setNodes'),
        
        setConnections: (connections) => 
          set({ connections, lastUpdated: new Date() }, false, 'setConnections'),
        
        addNode: (node) =>
          set((state) => ({ 
            nodes: [...state.nodes, node],
            lastUpdated: new Date()
          }), false, 'addNode'),
        
        updateNode: (nodeId, updates) =>
          set((state) => ({
            nodes: state.nodes.map(node =>
              node.id === nodeId ? { ...node, ...updates } : node
            ),
            lastUpdated: new Date()
          }), false, 'updateNode'),
        
        removeNode: (nodeId) =>
          set((state) => ({
            nodes: state.nodes.filter(node => node.id !== nodeId),
            connections: state.connections.filter(
              conn => conn.sourceNodeId !== nodeId && conn.targetNodeId !== nodeId
            ),
            lastUpdated: new Date()
          }), false, 'removeNode'),
        
        addConnection: (connection) =>
          set((state) => ({ 
            connections: [...state.connections, connection],
            lastUpdated: new Date()
          }), false, 'addConnection'),
        
        updateConnection: (connectionId, updates) =>
          set((state) => ({
            connections: state.connections.map(conn =>
              conn.id === connectionId ? { ...conn, ...updates } : conn
            ),
            lastUpdated: new Date()
          }), false, 'updateConnection'),
        
        removeConnection: (connectionId) =>
          set((state) => ({
            connections: state.connections.filter(conn => conn.id !== connectionId),
            lastUpdated: new Date()
          }), false, 'removeConnection'),
        
        setLoading: (isLoading) => 
          set({ isLoading }, false, 'setLoading'),
        
        setLoadingProgress: (loadingProgress) => 
          set({ loadingProgress }, false, 'setLoadingProgress'),
        
        setError: (error) => 
          set({ error }, false, 'setError'),
        
        setLastUpdated: (lastUpdated) => 
          set({ lastUpdated }, false, 'setLastUpdated'),

        // Search actions
        setSearchQuery: (searchQuery) => 
          set({ searchQuery }, false, 'setSearchQuery'),
        
        setSearchResults: (searchResults) => 
          set({ searchResults }, false, 'setSearchResults'),

        // Tool-specific actions
        addMeasurement: (measurement) =>
          set((state) => ({
            measurements: [...state.measurements, measurement]
          }), false, 'addMeasurement'),
        
        clearMeasurements: () =>
          set({ measurements: [] }, false, 'clearMeasurements'),
        
        setTracePath: (tracePath) =>
          set({ tracePath }, false, 'setTracePath'),
        
        setHeatmapData: (heatmapData) =>
          set({ heatmapData }, false, 'setHeatmapData'),

        // Selection history
        addToSelectionHistory: (elementId) =>
          set((state) => ({
            selectionHistory: [...state.selectionHistory.slice(-19), elementId]
          }), false, 'addToSelectionHistory'),
        
        clearSelectionHistory: () =>
          set({ selectionHistory: [] }, false, 'clearSelectionHistory'),

        // WebSocket connection state
        setWebSocketConnected: (isWebSocketConnected) =>
          set({ isWebSocketConnected }, false, 'setWebSocketConnected'),
        
        setConnectionQuality: (connectionQuality) =>
          set({ connectionQuality }, false, 'setConnectionQuality'),

        // Performance metrics
        setRenderTime: (renderTime) =>
          set({ renderTime }, false, 'setRenderTime'),
        
        setFps: (fps) =>
          set({ fps }, false, 'setFps'),

        // Reset function
        reset: () => 
          set({
            viewport: initialViewport,
            layers: DEFAULT_LAYERS,
            interaction: initialInteraction,
            nodes: [],
            connections: [],
            isLoading: false,
            loadingProgress: 0,
            error: null,
            lastUpdated: null,
            searchQuery: '',
            searchResults: [],
            measurements: [],
            tracePath: null,
            heatmapData: null,
            selectionHistory: [],
            isWebSocketConnected: false,
            connectionQuality: 'disconnected',
            renderTime: 0,
            fps: 60
          }, false, 'reset')
      }),
      {
        name: 'network-map-store',
        partialize: (state) => ({
          // Persist only essential state, exclude transient UI state
          viewport: state.viewport,
          layers: state.layers,
          searchQuery: state.searchQuery
        })
      }
    ),
    {
      name: 'network-map-store-devtools'
    }
  )
);

// Selector hooks for optimized re-renders
export const useViewport = () => useNetworkMapStore((state) => state.viewport);
export const useLayers = () => useNetworkMapStore((state) => state.layers);
export const useInteraction = () => useNetworkMapStore((state) => state.interaction);
export const useNodes = () => useNetworkMapStore((state) => state.nodes);
export const useConnections = () => useNetworkMapStore((state) => state.connections);
export const useLoading = () => useNetworkMapStore((state) => state.isLoading);
export const useLoadingProgress = () => useNetworkMapStore((state) => state.loadingProgress);
export const useError = () => useNetworkMapStore((state) => state.error);
export const useLastUpdated = () => useNetworkMapStore((state) => state.lastUpdated);
export const useSearchQuery = () => useNetworkMapStore((state) => state.searchQuery);
export const useSearchResults = () => useNetworkMapStore((state) => state.searchResults);
export const useMeasurements = () => useNetworkMapStore((state) => state.measurements);
export const useTracePath = () => useNetworkMapStore((state) => state.tracePath);
export const useHeatmapData = () => useNetworkMapStore((state) => state.heatmapData);

// Fixed composite selectors with useMemo to prevent unnecessary re-renders
export const useWebSocketStatus = () => {
  const isConnected = useNetworkMapStore((state) => state.isWebSocketConnected);
  const quality = useNetworkMapStore((state) => state.connectionQuality);
  return useMemo(() => ({ isConnected, quality }), [isConnected, quality]);
};

export const usePerformanceMetrics = () => {
  const renderTime = useNetworkMapStore((state) => state.renderTime);
  const fps = useNetworkMapStore((state) => state.fps);
  return useMemo(() => ({ renderTime, fps }), [renderTime, fps]);
};

// Utility selectors
export const useVisibleLayers = () => 
  useNetworkMapStore((state) => state.layers.filter(layer => layer.visible));

export const useNodeById = (nodeId: string | null) =>
  useNetworkMapStore((state) => 
    nodeId ? state.nodes.find(n => n.id === nodeId) : undefined
  );

export const useConnectionById = (connectionId: string | null) =>
  useNetworkMapStore((state) => 
    connectionId ? state.connections.find(c => c.id === connectionId) : undefined
  );

export const useSelectedNode = () => {
  const selectedId = useNetworkMapStore((state) => state.interaction.selectedElementId);
  return useNodeById(selectedId);
};

export const useNodesByStatus = (status: string) =>
  useNetworkMapStore((state) => 
    state.nodes.filter(node => node.status === status)
  );

export const useConnectionsByStatus = (status: string) =>
  useNetworkMapStore((state) => 
    state.connections.filter(conn => conn.status === status)
  );
