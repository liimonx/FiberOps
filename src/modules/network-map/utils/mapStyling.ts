// Map styling utilities for Mapbox GL JS

import { MAPBOX_CONFIG } from '../constants';
import type { LayerSpecification } from 'mapbox-gl';
import type { NetworkNode, NetworkConnection } from '../types';

export interface MapStyleConfig {
  id: string;
  name: string;
  url: string;
  isDark?: boolean;
}

export const AVAILABLE_STYLES: MapStyleConfig[] = [
  {
    id: 'dark',
    name: 'Dark',
    url: 'mapbox://styles/mapbox/dark-v11',
    isDark: true
  },
  {
    id: 'light',
    name: 'Light',
    url: 'mapbox://styles/mapbox/light-v11',
    isDark: false
  },
  {
    id: 'satellite',
    name: 'Satellite',
    url: 'mapbox://styles/mapbox/satellite-v9',
    isDark: false
  },
  {
    id: 'streets',
    name: 'Streets',
    url: 'mapbox://styles/mapbox/streets-v12',
    isDark: false
  }
];

// Custom layer configurations for network visualization
export const CUSTOM_LAYERS = {
  // Node layer configuration
  nodes: {
    id: 'network-nodes-layer',
    type: 'circle' as const,
    source: 'network-nodes',
    paint: {
      'circle-radius': [
        'interpolate',
        ['linear'],
        ['zoom'],
        5, 4,   // At zoom 5, radius 4px
        10, 8,  // At zoom 10, radius 8px
        15, 12  // At zoom 15, radius 12px
      ],
      'circle-color': [
        'match',
        ['get', 'status'],
        'active', '#10b981',
        'inactive', '#6b7280',
        'warning', '#f59e0b',
        'error', '#ef4444',
        '#6b7280' // Default
      ],
      'circle-stroke-width': [
        'case',
        ['boolean', ['feature-state', 'selected'], false], 3,
        ['boolean', ['feature-state', 'hovered'], false], 2,
        1
      ],
      'circle-stroke-color': [
        'case',
        ['boolean', ['feature-state', 'selected'], false], '#f59e0b',
        ['boolean', ['feature-state', 'hovered'], false], '#3b82f6',
        '#ffffff'
      ],
      'circle-opacity': 0.9
    }
  } as LayerSpecification,

  // Connection layer configuration
  connections: {
    id: 'network-connections-layer',
    type: 'line' as const,
    source: 'network-connections',
    paint: {
      'line-width': [
        'interpolate',
        ['linear'],
        ['zoom'],
        5, 1,
        10, 2,
        15, 3
      ],
      'line-color': [
        'match',
        ['get', 'status'],
        'active', '#10b981',
        'inactive', '#6b7280',
        'warning', '#f59e0b',
        'error', '#ef4444',
        '#6b7280' // Default
      ],
      'line-opacity': 0.8,
      'line-dasharray': [
        'case',
        ['==', ['get', 'status'], 'inactive'], [2, 2],
        [1, 0]
      ]
    }
  } as LayerSpecification,

  // Outage highlights
  outages: {
    id: 'network-outages-layer',
    type: 'fill' as const,
    source: 'network-outages',
    paint: {
      'fill-color': '#ef4444',
      'fill-opacity': 0.3,
      'fill-outline-color': '#ef4444'
    }
  },
  
  // Coverage area visualization
  coverage: {
    id: 'network-coverage-layer',
    type: 'fill' as const,
    source: 'network-coverage',
    paint: {
      'fill-color': '#8b5cf6',
      'fill-opacity': 0.2,
      'fill-outline-color': '#8b5cf6'
    }
  }
};

// Style utility functions
export const addCustomLayers = (map: mapboxgl.Map) => {
  // Add custom sources (only if they don't already exist)
  if (!map.getSource('network-nodes')) {
    map.addSource('network-nodes', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });
  }

  if (!map.getSource('network-connections')) {
    map.addSource('network-connections', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });
  }

  if (!map.getSource('network-outages')) {
    map.addSource('network-outages', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });
  }

  if (!map.getSource('network-coverage')) {
    map.addSource('network-coverage', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: []
      }
    });
  }

  // Add custom layers (only if they don't already exist)
  if (!map.getLayer('network-connections-layer')) {
    map.addLayer(CUSTOM_LAYERS.connections);
  }
  
  if (!map.getLayer('network-nodes-layer')) {
    map.addLayer(CUSTOM_LAYERS.nodes);
  }
  
  if (!map.getLayer('network-outages-layer')) {
    map.addLayer(CUSTOM_LAYERS.outages);
  }

  if (!map.getLayer('network-coverage-layer')) {
    map.addLayer(CUSTOM_LAYERS.coverage as any);
  }
};

export const updateLayerVisibility = (map: mapboxgl.Map, layerId: string, visible: boolean) => {
  const visibility = visible ? 'visible' : 'none';
  map.setLayoutProperty(layerId, 'visibility', visibility);
};

export const setFeatureState = (
  map: mapboxgl.Map,
  source: string,
  featureId: string | number,
  state: Record<string, any>
) => {
  map.setFeatureState({
    source,
    id: featureId
  }, state);
};

export const clearFeatureState = (
  map: mapboxgl.Map,
  source: string,
  featureId?: string | number
) => {
  if (featureId) {
    map.setFeatureState({
      source,
      id: featureId
    }, {});
  } else {
    // Clear all feature states for the source
    // Check if source exists before querying
    if (!map.getSource(source)) {
      return;
    }
    
    const features = map.querySourceFeatures(source);
    features.forEach(feature => {
      map.setFeatureState({
        source,
        id: feature.id as number
      }, {});
    });
  }
};

// Performance optimization utilities
export const optimizeMapPerformance = (map: mapboxgl.Map) => {
  // Note: Mapbox GL JS doesn't expose setMaxTileCacheSize in public API
  // Tile cache management is handled internally by Mapbox
  
  // Enable progressive enhancement for raster tiles
  if (map.getStyle().sources?.['raster']) {
    map.setPaintProperty('raster-layer', 'raster-fade-duration', 300);
  }
  
  // Optimize layer updates
  map.on('idle', () => {
    // Batch updates during idle periods
  });
};

// Theme management
export const applyTheme = (map: mapboxgl.Map, theme: 'light' | 'dark') => {
  const styleConfig = AVAILABLE_STYLES.find(s => s.id === theme) || AVAILABLE_STYLES[0];
  
  map.setStyle(styleConfig.url);
  
  // Re-add custom layers after style change
  map.once('style.load', () => {
    addCustomLayers(map);
  });
};

// Export utility for creating GeoJSON features
export const createNodeFeature = (node: NetworkNode): GeoJSON.Feature => ({
  type: 'Feature' as const,
  geometry: {
    type: 'Point' as const,
    coordinates: [node.position.lng, node.position.lat]
  },
  properties: {
    id: node.id,
    name: node.name,
    type: node.type,
    status: node.status,
    capacity: node.capacity,
    utilization: node.utilization
  }
});

export const createConnectionFeature = (connection: NetworkConnection, nodes?: NetworkNode[]): GeoJSON.Feature => {
  let coordinates: [number, number][] = [];
  
  // If route is provided, use it
  if (connection.route && connection.route.length > 0) {
    coordinates = connection.route.map((pos) => [pos.lng, pos.lat]);
  } 
  // Otherwise, create a straight line between source and target nodes
  else if (nodes) {
    const sourceNode = nodes.find((n) => n.id === connection.sourceNodeId);
    const targetNode = nodes.find((n) => n.id === connection.targetNodeId);
    
    if (sourceNode && targetNode) {
      coordinates = [
        [sourceNode.position.lng, sourceNode.position.lat],
        [targetNode.position.lng, targetNode.position.lat]
      ];
    }
  }
  
  return {
    type: 'Feature' as const,
    geometry: {
      type: 'LineString' as const,
      coordinates
    },
    properties: {
      id: connection.id,
      sourceNodeId: connection.sourceNodeId,
      targetNodeId: connection.targetNodeId,
      status: connection.status,
      bandwidth: connection.bandwidth,
      utilization: connection.utilization
    }
  };
};