"use client";

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from "@shohojdhara/atomix";
import { useNetworkMapStore, useViewport, useNodes, useConnections } from '../stores/useNetworkMapStore';
import { MAPBOX_CONFIG } from '../constants';
import { LoadingState } from './LoadingState';
import { addCustomLayers, createNodeFeature, createConnectionFeature } from '../utils/mapStyling';

// Module-level variable to store map instance for external access
let globalMapInstance: mapboxgl.Map | null = null;

interface MapCanvasProps {
  onMapLoad?: (map: mapboxgl.Map) => void;
  onMapError?: (error: Error) => void;
}

export const MapCanvas: React.FC<MapCanvasProps> = ({ onMapLoad, onMapError }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  
  const viewport = useViewport();
  const nodes = useNodes();
  const connections = useConnections();
  const setViewport = useNetworkMapStore((state) => state.setViewport);
  const setDragging = useNetworkMapStore((state) => state.setDragging);
  const setZooming = useNetworkMapStore((state) => state.setZooming);

  // Initialize Mapbox map
  useEffect(() => {
    if (!mapContainer.current) return;
    if (mapRef.current) return; // Already initialized

    // Check for Mapbox access token
    if (!MAPBOX_CONFIG.ACCESS_TOKEN) {
      const error = new Error('Mapbox access token not configured. Please set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN environment variable.');
      setMapError(error.message);
      onMapError?.(error);
      return;
    }

    mapboxgl.accessToken = MAPBOX_CONFIG.ACCESS_TOKEN;

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
      setMapError(mapError.message);
      onMapError?.(mapError);
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

  // Update map data when store changes
  useEffect(() => {
    if (!mapRef.current || !mapRef.current.isStyleLoaded()) return;
    
    const map = mapRef.current;
    
    try {
      // Update nodes source
      const nodeFeatures = nodes.map(createNodeFeature);
      const nodesGeoJSON: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: nodeFeatures
      };
      
      const nodesSource = map.getSource('network-nodes') as mapboxgl.GeoJSONSource | undefined;
      if (nodesSource) {
        nodesSource.setData(nodesGeoJSON);
      }
      
      // Update connections source (pass nodes for route calculation)
      const connectionFeatures = connections.map(conn => 
        createConnectionFeature(conn, nodes)
      );
      const connectionsGeoJSON: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: connectionFeatures
      };
      
      const connectionsSource = map.getSource('network-connections') as mapboxgl.GeoJSONSource | undefined;
      if (connectionsSource) {
        connectionsSource.setData(connectionsGeoJSON);
      }
      
      // Update outages source (filter connections with error status)
      const outageConnections = connections.filter(
        conn => conn.status === 'error'
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
        outagesSource.setData(outagesGeoJSON);
      }
    } catch (error) {
      console.error('[MapCanvas] Failed to update map data:', error);
    }
  }, [nodes, connections]);

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
        aria-label="Network Map"
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