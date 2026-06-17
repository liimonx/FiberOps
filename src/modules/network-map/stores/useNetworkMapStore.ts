"use client";
import type mapboxgl from "mapbox-gl";
import { LatLng, NetworkStatus } from "../types";

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { useMemo } from 'react';
import { 
  ViewportState, 
  NetworkMapLayer, 
  ToolType, 
  PlanDrawMode,
  MapInteractionState, 
  NetworkNode, 
  NetworkConnection,
  MeasurementPoint,
  HeatmapData,
  TracePath,
  CategorizedResult
} from '../types';
import type {
  LatLng as DomainLatLng,
  PlanningAreaGeometry,
  PlanningProposal,
  PlanningRouteGeometry,
} from '@/types/domain';
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
  nodeMap: Record<string, NetworkNode>;
  connections: NetworkConnection[];
  connectionMap: Record<string, NetworkConnection>;
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
  searchResults: CategorizedResult[];
  setSearchResults: (results: CategorizedResult[]) => void;
  
  // Map instance (set by MapCanvas when ready — avoids polling)
  mapInstance: mapboxgl.Map | null;
  setMapInstance: (map: mapboxgl.Map | null) => void;

  // Tool-specific state
  measurements: MeasurementPoint[];
  addMeasurement: (point: MeasurementPoint) => void;
  removeLastMeasurement: () => void;
  clearMeasurements: () => void;
  
  tracePath: TracePath | null;
  setTracePath: (path: TracePath | null) => void;
  
  heatmapData: HeatmapData | null;
  setHeatmapData: (data: HeatmapData | null) => void;
  
  // Impairment Tool state
  impairmentArea: { center: LatLng; radius: number } | null;
  setImpairmentArea: (area: { center: LatLng; radius: number } | null) => void;
  simulatedOutageActive: boolean;
  originalStatuses: Record<string, NetworkStatus>;
  simulateImpairmentOutage: (affectedNodes: string[], affectedConnections: string[]) => void;
  restoreImpairmentServices: () => void;

  // Planning overlays
  planningOverlays: PlanningProposal[];
  setPlanningOverlays: (proposals: PlanningProposal[]) => void;
  activePlanningProposalId: string | null;
  setActivePlanningProposalId: (id: string | null) => void;
  planDrawMode: PlanDrawMode;
  setPlanDrawMode: (mode: PlanDrawMode) => void;
  planDraftAreas: PlanningAreaGeometry[];
  planDraftRoutes: PlanningRouteGeometry[];
  planPendingArea: { center: DomainLatLng; radiusMeters: number } | null;
  planRouteWaypoints: DomainLatLng[];
  setPlanPendingArea: (
    area: { center: DomainLatLng; radiusMeters: number } | null
  ) => void;
  addPlanRouteWaypoint: (point: DomainLatLng) => void;
  removeLastPlanRouteWaypoint: () => void;
  clearPlanRouteWaypoints: () => void;
  commitPlanPendingArea: () => void;
  commitPlanRoute: () => void;
  clearPlanPendingDraw: () => void;
  discardPlanDraftChanges: () => void;
  setPlanDraftFromProposal: (proposal: PlanningProposal) => void;
  clearPlanDraft: () => void;

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
  bearing: MAPBOX_CONFIG.DEFAULT_BEARING,
  pitch: MAPBOX_CONFIG.DEFAULT_PITCH
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
      (set) => ({
        // Initial state
        viewport: initialViewport,
        layers: DEFAULT_LAYERS,
        interaction: initialInteraction,
        nodes: [],
        nodeMap: {},
        connections: [],
        connectionMap: {},
        isLoading: false,
        loadingProgress: 0,
        error: null,
        lastUpdated: null,
        searchQuery: '',
        searchResults: [],
        mapInstance: null,
        measurements: [],
        tracePath: null,
        heatmapData: null,
        impairmentArea: null,
        simulatedOutageActive: false,
        originalStatuses: {},
        planningOverlays: [],
        activePlanningProposalId: null,
        planDrawMode: "area",
        planDraftAreas: [],
        planDraftRoutes: [],
        planPendingArea: null,
        planRouteWaypoints: [],
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
          set((state) => {
            const leavingPlan =
              state.interaction.activeTool === "plan" && tool !== "plan";

            return {
              interaction: { ...state.interaction, activeTool: tool },
              ...(leavingPlan
                ? { planPendingArea: null, planRouteWaypoints: [] }
                : {}),
            };
          }, false, 'setActiveTool'),

        setSelectedElement: (elementId) =>
          set((state) => ({
            interaction: { ...state.interaction, selectedElementId: elementId }
          }), false, 'setSelectedElement'),

        setHoveredElement: (elementId) =>
          set((state) => {
            if (state.interaction.hoveredElementId === elementId) {
              return state;
            }
            return {
              interaction: { ...state.interaction, hoveredElementId: elementId },
            };
          }, false, 'setHoveredElement'),

        setDragging: (dragging) =>
          set((state) => ({
            interaction: { ...state.interaction, isDragging: dragging }
          }), false, 'setDragging'),

        setZooming: (zooming) =>
          set((state) => ({
            interaction: { ...state.interaction, isZooming: zooming }
          }), false, 'setZooming'),

        // Data actions - Optimistic updates
        setNodes: (nodes) => {
          const nodeMap: Record<string, NetworkNode> = {};
          for (const node of nodes) {
            nodeMap[node.id] = node;
          }
          set({ nodes, nodeMap, lastUpdated: new Date() }, false, 'setNodes');
        },
        
        setConnections: (connections) => {
          const connectionMap: Record<string, NetworkConnection> = {};
          for (const conn of connections) {
            connectionMap[conn.id] = conn;
          }
          set({ connections, connectionMap, lastUpdated: new Date() }, false, 'setConnections');
        },
        
        addNode: (node) =>
          set((state) => {
            const nodes = [...state.nodes, node];
            return { 
              nodes,
              nodeMap: { ...state.nodeMap, [node.id]: node },
              lastUpdated: new Date()
            };
          }, false, 'addNode'),
        
        updateNode: (nodeId, updates) =>
          set((state) => {
            const existingNode = state.nodeMap[nodeId];
            if (!existingNode) return state;

            const updatedNode = { ...existingNode, ...updates };
            const nodes = [...state.nodes];
            const idx = nodes.findIndex((n) => n.id === nodeId);
            if (idx !== -1) nodes[idx] = updatedNode;

            return {
              nodes,
              nodeMap: { ...state.nodeMap, [nodeId]: updatedNode },
              lastUpdated: new Date()
            };
          }, false, 'updateNode'),
        
        removeNode: (nodeId) =>
          set((state) => {
            const newNodeMap = { ...state.nodeMap };
            delete newNodeMap[nodeId];
            return {
              nodes: state.nodes.filter(node => node.id !== nodeId),
              nodeMap: newNodeMap,
              connections: state.connections.filter(
                conn => conn.sourceNodeId !== nodeId && conn.targetNodeId !== nodeId
              ),
              // We should also update connectionMap here, but for simplicity let's just filter it in the next sync or do it now
              connectionMap: Object.fromEntries(
                Object.entries(state.connectionMap).filter(([, c]) =>
                  c.sourceNodeId !== nodeId && c.targetNodeId !== nodeId
                )
              ),
              lastUpdated: new Date()
            };
          }, false, 'removeNode'),
        
        addConnection: (connection) =>
          set((state) => {
            const connections = [...state.connections, connection];
            return { 
              connections,
              connectionMap: { ...state.connectionMap, [connection.id]: connection },
              lastUpdated: new Date()
            };
          }, false, 'addConnection'),
        
        updateConnection: (connectionId, updates) =>
          set((state) => {
            const existingConn = state.connectionMap[connectionId];
            if (!existingConn) return state;

            const updatedConn = { ...existingConn, ...updates };
            const connections = [...state.connections];
            const idx = connections.findIndex((c) => c.id === connectionId);
            if (idx !== -1) connections[idx] = updatedConn;

            return {
              connections,
              connectionMap: { ...state.connectionMap, [connectionId]: updatedConn },
              lastUpdated: new Date()
            };
          }, false, 'updateConnection'),
        
        removeConnection: (connectionId) =>
          set((state) => {
            const newConnMap = { ...state.connectionMap };
            delete newConnMap[connectionId];
            return {
              connections: state.connections.filter(conn => conn.id !== connectionId),
              connectionMap: newConnMap,
              lastUpdated: new Date()
            };
          }, false, 'removeConnection'),
        
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

        setMapInstance: (mapInstance) =>
          set({ mapInstance }, false, 'setMapInstance'),

        // Tool-specific actions
        addMeasurement: (measurement) =>
          set((state) => ({
            measurements: [...state.measurements, measurement]
          }), false, 'addMeasurement'),

        removeLastMeasurement: () =>
          set((state) => ({
            measurements: state.measurements.slice(0, -1),
          }), false, 'removeLastMeasurement'),
        
        clearMeasurements: () =>
          set({ measurements: [] }, false, 'clearMeasurements'),
        
        setTracePath: (tracePath) =>
          set({ tracePath }, false, 'setTracePath'),
        
        setHeatmapData: (heatmapData) =>
          set({ heatmapData }, false, 'setHeatmapData'),

        // Impairment actions
        setImpairmentArea: (impairmentArea) =>
          set({ impairmentArea }, false, 'setImpairmentArea'),

        simulateImpairmentOutage: (affectedNodes, affectedConnections) =>
          set((state) => {
            const originalStatuses: Record<string, NetworkStatus> = {};
            const nodes = [...state.nodes];
            const connections = [...state.connections];
            const nodeMap = { ...state.nodeMap };
            const connectionMap = { ...state.connectionMap };

            const layers = state.layers.map((layer) =>
              layer.id === "outages" ? { ...layer, visible: true } : layer
            );

            affectedNodes.forEach((nodeId) => {
              const node = state.nodeMap[nodeId];
              if (node) {
                originalStatuses[nodeId] = node.status;
                const updatedNode = { ...node, status: 'error' as NetworkStatus };
                const idx = nodes.findIndex((n) => n.id === nodeId);
                if (idx !== -1) nodes[idx] = updatedNode;
                nodeMap[nodeId] = updatedNode;
              }
            });

            affectedConnections.forEach((connId) => {
              const conn = state.connectionMap[connId];
              if (conn) {
                originalStatuses[connId] = conn.status;
                const updatedConn = { ...conn, status: 'error' as NetworkStatus };
                const idx = connections.findIndex((c) => c.id === connId);
                if (idx !== -1) connections[idx] = updatedConn;
                connectionMap[connId] = updatedConn;
              }
            });

            return {
              simulatedOutageActive: true,
              originalStatuses: { ...state.originalStatuses, ...originalStatuses },
              nodes,
              connections,
              nodeMap,
              connectionMap,
              layers,
              lastUpdated: new Date(),
            };
          }, false, 'simulateImpairmentOutage'),

        setPlanningOverlays: (planningOverlays) =>
          set({ planningOverlays }, false, "setPlanningOverlays"),

        setActivePlanningProposalId: (activePlanningProposalId) =>
          set({ activePlanningProposalId }, false, "setActivePlanningProposalId"),

        setPlanDrawMode: (planDrawMode) =>
          set({ planDrawMode }, false, "setPlanDrawMode"),

        setPlanPendingArea: (planPendingArea) =>
          set({ planPendingArea }, false, "setPlanPendingArea"),

        addPlanRouteWaypoint: (point) =>
          set(
            (state) => ({
              planRouteWaypoints: [...state.planRouteWaypoints, point],
            }),
            false,
            "addPlanRouteWaypoint"
          ),

        removeLastPlanRouteWaypoint: () =>
          set(
            (state) => ({
              planRouteWaypoints: state.planRouteWaypoints.slice(0, -1),
            }),
            false,
            "removeLastPlanRouteWaypoint"
          ),

        clearPlanRouteWaypoints: () =>
          set({ planRouteWaypoints: [] }, false, "clearPlanRouteWaypoints"),

        commitPlanPendingArea: () =>
          set((state) => {
            if (!state.planPendingArea) return state;
            return {
              planDraftAreas: [
                ...state.planDraftAreas,
                {
                  type: "circle" as const,
                  center: state.planPendingArea.center,
                  radiusMeters: state.planPendingArea.radiusMeters,
                },
              ],
              planPendingArea: null,
            };
          }, false, "commitPlanPendingArea"),

        commitPlanRoute: () =>
          set((state) => {
            if (state.planRouteWaypoints.length < 2) return state;
            return {
              planDraftRoutes: [
                ...state.planDraftRoutes,
                { waypoints: [...state.planRouteWaypoints] },
              ],
              planRouteWaypoints: [],
            };
          }, false, "commitPlanRoute"),

        clearPlanPendingDraw: () =>
          set(
            { planPendingArea: null, planRouteWaypoints: [] },
            false,
            "clearPlanPendingDraw"
          ),

        discardPlanDraftChanges: () =>
          set((state) => {
            const proposal = state.planningOverlays.find(
              (item) => item.id === state.activePlanningProposalId
            );
            if (!proposal) {
              return {
                planDraftAreas: [],
                planDraftRoutes: [],
                planPendingArea: null,
                planRouteWaypoints: [],
              };
            }
            return {
              planDraftAreas: [...proposal.areas],
              planDraftRoutes: [...proposal.routes],
              planPendingArea: null,
              planRouteWaypoints: [],
            };
          }, false, "discardPlanDraftChanges"),

        setPlanDraftFromProposal: (proposal) =>
          set({
            planDraftAreas: [...proposal.areas],
            planDraftRoutes: [...proposal.routes],
            planPendingArea: null,
            planRouteWaypoints: [],
            activePlanningProposalId: proposal.id,
          }, false, "setPlanDraftFromProposal"),

        clearPlanDraft: () =>
          set({
            planDraftAreas: [],
            planDraftRoutes: [],
            planPendingArea: null,
            planRouteWaypoints: [],
            activePlanningProposalId: null,
          }, false, "clearPlanDraft"),

        restoreImpairmentServices: () =>
          set((state) => {
            if (!state.simulatedOutageActive) return state;
            const nodes = [...state.nodes];
            const connections = [...state.connections];
            const nodeMap = { ...state.nodeMap };
            const connectionMap = { ...state.connectionMap };

            Object.entries(state.originalStatuses).forEach(([id, status]) => {
              if (nodeMap[id]) {
                const updatedNode = { ...nodeMap[id], status };
                const idx = nodes.findIndex((n) => n.id === id);
                if (idx !== -1) nodes[idx] = updatedNode;
                nodeMap[id] = updatedNode;
              } else if (connectionMap[id]) {
                const updatedConn = { ...connectionMap[id], status };
                const idx = connections.findIndex((c) => c.id === id);
                if (idx !== -1) connections[idx] = updatedConn;
                connectionMap[id] = updatedConn;
              }
            });

            return {
              simulatedOutageActive: false,
              originalStatuses: {},
              nodes,
              connections,
              nodeMap,
              connectionMap,
              lastUpdated: new Date(),
            };
          }, false, 'restoreImpairmentServices'),

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
            mapInstance: null,
            measurements: [],
            tracePath: null,
            heatmapData: null,
            selectionHistory: [],
            isWebSocketConnected: false,
            connectionQuality: 'disconnected',
            renderTime: 0,
        fps: 60,
        impairmentArea: null,
        simulatedOutageActive: false,
        originalStatuses: {},
        planningOverlays: [],
        activePlanningProposalId: null,
        planDrawMode: "area",
        planDraftAreas: [],
        planDraftRoutes: [],
        planPendingArea: null,
        planRouteWaypoints: [],
          }, false, 'reset')
      }),
      {
        name: 'network-map-store-v3',
        partialize: (state) => ({
          viewport: state.viewport,
          layers: state.layers,
          searchQuery: state.searchQuery
        }),
        onRehydrateStorage: () => (state) => {
          if (state) {
            // Merge persisted visibility onto canonical DEFAULT_LAYERS only.
            // Use ?? so missing/stale `visible` does not become Boolean(undefined) → false (all layers off).
            const currentLayers = state.layers || [];
            const persistedById = new Map(currentLayers.map((l) => [l.id, l]));

            state.layers = DEFAULT_LAYERS.map((def) => ({
              ...def,
              visible: persistedById.get(def.id)?.visible ?? def.visible,
            }));
          }
        }
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
    nodeId ? state.nodeMap[nodeId] : undefined
  );

export const useConnectionById = (connectionId: string | null) =>
  useNetworkMapStore((state) => 
    connectionId ? state.connectionMap[connectionId] : undefined
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
