"use client";

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from "@shohojdhara/atomix";
import { useNetworkMapStore, useViewport, useNodes, useConnections } from '../stores/useNetworkMapStore';
import { MAPBOX_CONFIG } from '../constants';
import { LoadingState } from './LoadingState';
import { addCustomLayers, createNodeFeature, createConnectionFeature } from '../utils/mapStyling';
import { NetworkNodeType, NetworkStatus } from '../types';
import type { NetworkNode, NetworkConnection } from '../types';

// Module-level variable to store map instance for external access
let globalMapInstance: mapboxgl.Map | null = null;

interface MapCanvasProps {
  onMapLoad?: (map: mapboxgl.Map) => void;
  onMapError?: (error: Error) => void;
}

export const MapCanvas: React.FC<MapCanvasProps> = ({ onMapLoad, onMapError }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  // Check for Mapbox access token at render time to avoid cascading renders in useEffect
  const tokenError = !MAPBOX_CONFIG.ACCESS_TOKEN 
    ? 'Mapbox access token not configured. Please set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN environment variable.' 
    : null;

  const [mapLoading, setMapLoading] = useState(!tokenError);
  const [mapError, setMapError] = useState<string | null>(tokenError);
  
  const viewport = useViewport();
  const nodes = useNodes();
  const connections = useConnections();
  const layers = useNetworkMapStore((state) => state.layers);
  const setViewport = useNetworkMapStore((state) => state.setViewport);
  const setDragging = useNetworkMapStore((state) => state.setDragging);
  const setZooming = useNetworkMapStore((state) => state.setZooming);

  // Report configuration errors to parent
  useEffect(() => {
    if (tokenError) {
      onMapError?.(new Error(tokenError));
    }
  }, [tokenError, onMapError]);

  // Helper to create circle coordinates for coverage polygons
  const createCircleCoordinates = (lng: number, lat: number, radius: number, points = 32) => {
    const coords = [];
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2;
      coords.push([
        lng + radius * Math.cos(angle),
        lat + radius * Math.sin(angle)
      ]);
    }
    coords.push(coords[0]); // Close the polygon
    return coords;
  };

  // Initialize custom map layers
  const initializeLayers = (map: mapboxgl.Map) => {
    try {
      // Add custom GeoJSON sources and Mapbox layers using utility function
      addCustomLayers(map);
      
      console.log('[MapCanvas] Custom layers initialized successfully');
    } catch (error) {
      console.error('[MapCanvas] Failed to initialize layers:', error);
      throw error;
    }
  };

  // Update map data sources with current nodes and connections
  const updateMapData = (map: mapboxgl.Map, nodes: NetworkNode[], connections: NetworkConnection[]) => {
    try {
      // Update nodes source
      const nodeFeatures = nodes.map(createNodeFeature);
      console.log('[MapCanvas] Created', nodeFeatures.length, 'node features');
      
      const nodesGeoJSON: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: nodeFeatures
      };
      
      const nodesSource = map.getSource('network-nodes') as mapboxgl.GeoJSONSource | undefined;
      if (nodesSource) {
        console.log('[MapCanvas] Updating network-nodes source with', nodeFeatures.length, 'features');
        nodesSource.setData(nodesGeoJSON);
      } else {
        console.warn('[MapCanvas] network-nodes source not found!');
      }
      
      // Update connections source (pass nodes for route calculation)
      const connectionFeatures = connections.map(conn => 
        createConnectionFeature(conn, nodes)
      );
      console.log('[MapCanvas] Created', connectionFeatures.length, 'connection features');
      
      const connectionsGeoJSON: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: connectionFeatures
      };
      
      const connectionsSource = map.getSource('network-connections') as mapboxgl.GeoJSONSource | undefined;
      if (connectionsSource) {
        console.log('[MapCanvas] Updating network-connections source with', connectionFeatures.length, 'features');
        connectionsSource.setData(connectionsGeoJSON);
      } else {
        console.warn('[MapCanvas] network-connections source not found!');
      }
      
      // Update outages source (filter connections with error status)
      const outageConnections = connections.filter(
        conn => conn.status === NetworkStatus.ERROR
      );
      const outageFeatures = outageConnections.map(conn => 
        createConnectionFeature(conn, nodes)
      );
      const outagesGeoJSON: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: outageFeatures
      };
      
      const outagesSource = map.getSource('network-outages') as mapboxgl.GeoJSONSource | undefined;
      if (outagesSource) {
        console.log('[MapCanvas] Updating network-outages source with', outageFeatures.length, 'features');
        outagesSource.setData(outagesGeoJSON);
      } else {
        console.warn('[MapCanvas] network-outages source not found!');
      }

      // Update coverage source (mock polygons around core and distribution nodes)
      const coverageNodes = nodes.filter(
        node => node.type === NetworkNodeType.CORE_NODE || node.type === NetworkNodeType.DISTRIBUTION_NODE
      );
      
      const coverageFeatures = coverageNodes.map(node => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Polygon' as const,
          coordinates: [createCircleCoordinates(node.position.lng, node.position.lat, 0.015)] // approx 1.5km radius
        },
        properties: {
          id: `coverage-${node.id}`,
          nodeId: node.id,
          name: `${node.name} Coverage`
        }
      }));

      const coverageGeoJSON: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: coverageFeatures
      };

      const coverageSource = map.getSource('network-coverage') as mapboxgl.GeoJSONSource | undefined;
      if (coverageSource) {
        console.log('[MapCanvas] Updating network-coverage source with', coverageFeatures.length, 'features');
        coverageSource.setData(coverageGeoJSON);
      }
    } catch (error) {
      console.error('[MapCanvas] Failed to update map data:', error);
    }
  };

  // Initialize Mapbox map
  useEffect(() => {
    // Skip initialization if container missing, map already exists, or there is a config error
    if (!mapContainer.current || mapRef.current || tokenError) return;

    mapboxgl.accessToken = MAPBOX_CONFIG.ACCESS_TOKEN as string;

    try {
      const map = new mapboxgl.Map({
        container: mapContainer.current,
        style: MAPBOX_CONFIG.STYLE,
        center: [viewport.center.lng, viewport.center.lat],
        zoom: viewport.zoom,
        bearing: viewport.bearing,
        pitch: viewport.pitch,
        minZoom: MAPBOX_CONFIG.MIN_ZOOM,
        maxZoom: MAPBOX_CONFIG.MAX_ZOOM,
        attributionControl: false,
        preserveDrawingBuffer: true, // For better performance with overlays
        maxTileCacheSize: 50, // Optimize tile cache for memory management
      });

      mapRef.current = map;
      globalMapInstance = map; // Store reference for external access

      // Map load event
      map.on('load', () => {
        setMapLoading(false);
        onMapLoad?.(map);
        
        // Add custom layers and sources here
        initializeLayers(map);
        
        // Force data update after layers are initialized
        console.log('[MapCanvas] Map loaded, triggering data update with', nodes.length, 'nodes and', connections.length, 'connections');
        updateMapData(map, nodes, connections);
      });

      // Map error event
      map.on('error', (e) => {
        const error = new Error(`Map error: ${e.error?.message || 'Unknown error'}`);
        setMapError(error.message);
        onMapError?.(error);
      });

      // Viewport synchronization
      map.on('move', () => {
        if (!mapRef.current) return;
        
        const center = map.getCenter();
        setViewport({
          center: { lat: center.lat, lng: center.lng },
          zoom: map.getZoom(),
          bearing: map.getBearing(),
          pitch: map.getPitch()
        });
      });

      // Interaction state tracking
      map.on('dragstart', () => setDragging(true));
      map.on('dragend', () => setDragging(false));
      map.on('zoomstart', () => setZooming(true));
      map.on('zoomend', () => setZooming(false));

      // Cleanup function
      return () => {
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
          globalMapInstance = null; // Clear global reference
        }
      };
    } catch (error) {
      const mapError = error instanceof Error ? error : new Error('Failed to initialize map');
      // Defer state update to avoid cascading renders warning
      setTimeout(() => {
        setMapError(mapError.message);
        onMapError?.(mapError);
        setMapLoading(false);
      }, 0);
    }
  }, []);

  // Sync viewport changes from store to map
  useEffect(() => {
    if (!mapRef.current || !mapRef.current.isStyleLoaded()) return;

    const map = mapRef.current;
    const currentCenter = map.getCenter();
    const currentZoom = map.getZoom();
    const currentBearing = map.getBearing();
    const currentPitch = map.getPitch();

    // Only update if there are actual changes to avoid unnecessary updates
    if (
      currentCenter.lat !== viewport.center.lat ||
      currentCenter.lng !== viewport.center.lng ||
      currentZoom !== viewport.zoom ||
      currentBearing !== viewport.bearing ||
      currentPitch !== viewport.pitch
    ) {
      map.jumpTo({
        center: [viewport.center.lng, viewport.center.lat],
        zoom: viewport.zoom,
        bearing: viewport.bearing,
        pitch: viewport.pitch
      });
    }
  }, [viewport]);


  // Update map data when store changes
  useEffect(() => {
    console.log('[MapCanvas] useEffect triggered - nodes:', nodes.length, 'connections:', connections.length);
    
    if (!mapRef.current || !mapRef.current.isStyleLoaded()) {
      console.log('[MapCanvas] Map not ready yet');
      return;
    }
    
    const map = mapRef.current;
    updateMapData(map, nodes, connections);
  }, [nodes, connections]);

  // Sync layer visibility from store to Mapbox
  useEffect(() => {
    if (!mapRef.current || !mapRef.current.isStyleLoaded()) return;
    
    const map = mapRef.current;
    
    // Define layer mapping between store layer IDs and Mapbox layer IDs
    const layerMapping: Record<string, string[]> = {
      'fiber-routes': ['network-connections-layer'],
      'outages': ['network-outages-layer'],
      'coverage': ['network-coverage-layer']
    };
    
    // Handle standard layer mappings
    Object.entries(layerMapping).forEach(([storeLayerId, mapboxLayerIds]) => {
      const layer = layers.find(l => l.id === storeLayerId);
      if (layer) {
        mapboxLayerIds.forEach(mapboxLayerId => {
          if (map.getLayer(mapboxLayerId)) {
            const visibility = layer.visible ? 'visible' : 'none';
            map.setLayoutProperty(mapboxLayerId, 'visibility', visibility);
          }
        });
      }
    });

    // Special logic for network-nodes-layer (split between nodes-splitters and customers)
    const nodesLayer = layers.find(l => l.id === 'nodes-splitters');
    const customersLayer = layers.find(l => l.id === 'customers');
    const nodesVisible = nodesLayer?.visible ?? true;
    const customersVisible = customersLayer?.visible ?? false;

    if (map.getLayer('network-nodes-layer')) {
      // Show layer if either nodes or customers are visible
      map.setLayoutProperty('network-nodes-layer', 'visibility', (nodesVisible || customersVisible) ? 'visible' : 'none');
      
      // Apply filter based on which one is visible
      if (nodesVisible && customersVisible) {
        map.setFilter('network-nodes-layer', null); // Show all
      } else if (nodesVisible) {
        map.setFilter('network-nodes-layer', ['!=', ['get', 'type'], 'customer']);
      } else if (customersVisible) {
        map.setFilter('network-nodes-layer', ['==', ['get', 'type'], 'customer']);
      } else {
        // Both off
        map.setFilter('network-nodes-layer', ['==', ['get', 'type'], 'NONE']);
      }
    }
  }, [layers]);

  if (mapError) {
    return (
      <Card appearance="elevated" className="error-card">
        <div className="error-content">
          <h3>Map Error</h3>
          <p>{mapError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="retry-button"
          >
            Retry
          </button>
        </div>
        
        <style jsx>{`
          .error-card {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            max-width: 400px;
            text-align: center;
          }
          
          .error-content {
            padding: 2rem;
          }
          
          .retry-button {
            margin-top: 1rem;
            padding: 0.5rem 1rem;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          }
        `}</style>
      </Card>
    );
  }

  return (
    <div className="map-canvas-container">
      <div 
        ref={mapContainer} 
        className="map-container"
        data-testid="mapbox-canvas"
        role="application"
        aria-label="Network Map. Use arrow keys to pan, plus/minus to zoom, Enter to select nodes."
        tabIndex={0}
        onKeyDown={(e) => {
          if (!mapRef.current) return;
          
          const map = mapRef.current;
          const panDistance = 50; // pixels to pan per keypress
          
          switch(e.key) {
            case 'ArrowUp':
              e.preventDefault();
              map.panBy([0, -panDistance], { duration: 200 });
              break;
            case 'ArrowDown':
              e.preventDefault();
              map.panBy([0, panDistance], { duration: 200 });
              break;
            case 'ArrowLeft':
              e.preventDefault();
              map.panBy([-panDistance, 0], { duration: 200 });
              break;
            case 'ArrowRight':
              e.preventDefault();
              map.panBy([panDistance, 0], { duration: 200 });
              break;
            case '+':
            case '=':
              e.preventDefault();
              map.zoomIn({ duration: 200 });
              break;
            case '-':
            case '_':
              e.preventDefault();
              map.zoomOut({ duration: 200 });
              break;
            case '0':
              e.preventDefault();
              map.setZoom(MAPBOX_CONFIG.DEFAULT_ZOOM, { duration: 300 });
              map.setCenter(MAPBOX_CONFIG.DEFAULT_CENTER as [number, number], { duration: 300 });
              break;
            case 'Enter':
            case ' ':
              e.preventDefault();
              // Trigger selection of center point or nearest node
              const center = map.getCenter();
              const features = map.queryRenderedFeatures({
                filter: ['==', '$type', 'Point']
              });
              
              if (features.length > 0) {
                const featureId = features[0].properties?.id;
                if (featureId) {
                  useNetworkMapStore.getState().setSelectedElement(featureId);
                  useNetworkMapStore.getState().addToSelectionHistory(featureId);
                }
              }
              break;
            case 'Escape':
              e.preventDefault();
              useNetworkMapStore.getState().setSelectedElement(null);
              break;
          }
        }}
      />
      
      {mapLoading && (
        <LoadingState 
          message="Loading map..."
          variant="overlay"
        />
      )}
      
      <style jsx>{`
        .map-canvas-container {
          position: relative;
          width: 100%;
          height: 100%;
        }
        
        .map-container {
          width: 100%;
          height: 100%;
          background: #1f2937; // Fallback background
        }
        
        .map-container :global(.mapboxgl-canvas) {
          outline: none; // Remove focus outline that might conflict with our styling
        }
        
        .map-container:focus {
          outline: 2px solid var(--color-primary-500);
          outline-offset: -2px;
        }
        
        @media (max-width: 768px) {
          .map-container {
            min-height: 400px; // Ensure reasonable mobile height
          }
        }
      `}</style>
    </div>
  );
};

// Export the map instance for external use
export const getMapInstance = (): mapboxgl.Map | null => {
  return globalMapInstance;
};