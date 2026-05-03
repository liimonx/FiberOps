// Map styling utilities for Mapbox GL JS

import { MAPBOX_CONFIG } from '../constants';
import type { ExpressionSpecification, LayerSpecification } from 'mapbox-gl';
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

/**
 * Purpose-driven map styling: reads like field / GIS fiber documentation —
 * backbone vs drops, plant assets (poles, cabinets), and status as overlay.
 */
const NODE_FILL_ACTIVE: ExpressionSpecification = [
  'match',
  ['get', 'type'],
  'core_node',
  '#1e3a8a',
  'pop',
  '#3730a3',
  'distribution_node',
  '#0f766e',
  'access_node',
  '#047857',
  'splitter',
  '#b45309',
  'junction_box',
  '#57534e',
  'pole',
  '#92400e',
  'onu',
  '#0369a1',
  'customer',
  '#6d28d9',
  '#64748b',
];

const NODE_FILL_INACTIVE: ExpressionSpecification = [
  'match',
  ['get', 'type'],
  'core_node',
  '#475569',
  'pop',
  '#475569',
  'distribution_node',
  '#475569',
  'access_node',
  '#475569',
  'splitter',
  '#78716c',
  'junction_box',
  '#78716c',
  'pole',
  '#78716c',
  'onu',
  '#64748b',
  'customer',
  '#64748b',
  '#94a3b8',
];

// Connection colors: backbone trunk (buried / aerial bundle) vs last-mile drop
const LINE_COLOR: ExpressionSpecification = [
  'case',
  ['==', ['get', 'status'], 'inactive'],
  '#64748b',
  ['==', ['get', 'status'], 'error'],
  '#b91c1c',
  ['==', ['get', 'status'], 'warning'],
  '#d97706',
  [
    'match',
    ['get', 'type'],
    'fiber_route',
    '#ea580c',
    'customer_connection',
    '#38bdf8',
    '#94a3b8',
  ],
];

const COVERAGE_FILL_OPACITY: ExpressionSpecification = [
  'interpolate',
  ['linear'],
  ['zoom'],
  5,
  0.06,
  12,
  0.1,
  16,
  0.14,
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
        5,
        [
          'match',
          ['get', 'type'],
          'core_node',
          6,
          'pop',
          6,
          'distribution_node',
          4,
          'access_node',
          3,
          'onu',
          3,
          'splitter',
          2.5,
          'junction_box',
          2.5,
          'customer',
          2,
          'pole',
          2,
          3,
        ],
        12,
        [
          'match',
          ['get', 'type'],
          'core_node',
          14,
          'pop',
          14,
          'distribution_node',
          10,
          'access_node',
          8,
          'onu',
          8,
          'splitter',
          6,
          'junction_box',
          6,
          'customer',
          5,
          'pole',
          5,
          8,
        ],
        18,
        [
          'match',
          ['get', 'type'],
          'core_node',
          24,
          'pop',
          24,
          'distribution_node',
          18,
          'access_node',
          14,
          'onu',
          14,
          'splitter',
          10,
          'junction_box',
          10,
          'customer',
          8,
          'pole',
          8,
          14,
        ],
      ],
      'circle-color': [
        'case',
        ['==', ['get', 'status'], 'inactive'],
        NODE_FILL_INACTIVE,
        ['==', ['get', 'status'], 'error'],
        [
          'match',
          ['get', 'type'],
          'customer',
          '#991b1b',
          '#b91c1c',
        ],
        ['==', ['get', 'status'], 'warning'],
        [
          'match',
          ['get', 'type'],
          'core_node',
          '#f59e0b',
          'pop',
          '#f59e0b',
          'distribution_node',
          '#fbbf24',
          'pole',
          '#fbbf24',
          '#d97706',
        ],
        NODE_FILL_ACTIVE,
      ],
      'circle-stroke-width': [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        3,
        ['boolean', ['feature-state', 'hovered'], false],
        2.5,
        [
          'match',
          ['get', 'type'],
          'core_node',
          2,
          'pop',
          2,
          'customer',
          1,
          1.5,
        ],
      ],
      'circle-stroke-color': [
        'case',
        ['boolean', ['feature-state', 'selected'], false],
        '#fefce8',
        ['boolean', ['feature-state', 'hovered'], false],
        '#fde68a',
        'rgba(252, 252, 250, 0.85)',
      ],
      'circle-opacity': 0.97,
      'circle-stroke-opacity': 0.92,
    },
  } as LayerSpecification,

  connectionCasing: {
    id: 'network-connections-casing',
    type: 'line' as const,
    source: 'network-connections',
    layout: {
      'line-cap': 'round',
      'line-join': 'round',
    },
    paint: {
      'line-width': [
        'interpolate',
        ['linear'],
        ['zoom'],
        5,
        [
          '+',
          [
            'match',
            ['get', 'type'],
            'fiber_route',
            2,
            'customer_connection',
            1,
            1.5,
          ],
          1.5,
        ],
        10,
        [
          '+',
          [
            'match',
            ['get', 'type'],
            'fiber_route',
            4,
            'customer_connection',
            2,
            3,
          ],
          2.5,
        ],
        15,
        [
          '+',
          [
            'match',
            ['get', 'type'],
            'fiber_route',
            7,
            'customer_connection',
            3.5,
            5,
          ],
          3,
        ],
      ],
      'line-color': '#0f172a',
      'line-opacity': 0.45,
    },
  } as LayerSpecification,

  connections: {
    id: 'network-connections-layer',
    type: 'line' as const,
    source: 'network-connections',
    layout: {
      'line-cap': 'round',
      'line-join': 'round',
    },
    paint: {
      'line-width': [
        'interpolate',
        ['linear'],
        ['zoom'],
        5,
        [
          'match',
          ['get', 'type'],
          'fiber_route',
          1.25,
          'customer_connection',
          0.65,
          0.9,
        ],
        10,
        [
          'match',
          ['get', 'type'],
          'fiber_route',
          2.75,
          'customer_connection',
          1.35,
          2,
        ],
        15,
        [
          'match',
          ['get', 'type'],
          'fiber_route',
          4.5,
          'customer_connection',
          2,
          3.25,
        ],
      ],
      'line-color': LINE_COLOR,
      'line-opacity': 0.92,
      'line-dasharray': [
        'case',
        ['==', ['get', 'status'], 'inactive'],
        [2, 2],
        ['==', ['get', 'type'], 'customer_connection'],
        [4, 3],
        ['==', ['get', 'status'], 'warning'],
        [6, 2],
        [1, 0],
      ],
    },
  } as LayerSpecification,

  /** Soft corridor under outage segments (LineString data — not fill). */
  outagesGlow: {
    id: 'network-outages-glow',
    type: 'line' as const,
    source: 'network-outages',
    layout: {
      'line-cap': 'round',
      'line-join': 'round',
    },
    paint: {
      'line-width': [
        'interpolate',
        ['linear'],
        ['zoom'],
        5,
        6,
        10,
        12,
        15,
        18,
      ],
      'line-color': '#f87171',
      'line-opacity': 0.35,
      'line-blur': 2,
    },
  } as LayerSpecification,

  outages: {
    id: 'network-outages-layer',
    type: 'line' as const,
    source: 'network-outages',
    layout: {
      'line-cap': 'round',
      'line-join': 'round',
    },
    paint: {
      'line-width': [
        'interpolate',
        ['linear'],
        ['zoom'],
        5,
        2,
        10,
        3.5,
        15,
        5,
      ],
      'line-color': '#fecaca',
      'line-opacity': 0.95,
    },
  } as LayerSpecification,

  coverage: {
    id: 'network-coverage-layer',
    type: 'fill' as const,
    source: 'network-coverage',
    paint: {
      'fill-color': '#14b8a6',
      'fill-opacity': COVERAGE_FILL_OPACITY,
      'fill-outline-color': '#5eead4',
    },
  } as LayerSpecification,
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
  if (!map.getLayer('network-connections-casing')) {
    map.addLayer(CUSTOM_LAYERS.connectionCasing);
  }

  if (!map.getLayer('network-connections-layer')) {
    map.addLayer(CUSTOM_LAYERS.connections);
  }
  
  if (!map.getLayer('network-nodes-layer')) {
    map.addLayer(CUSTOM_LAYERS.nodes);
  }
  
  if (!map.getLayer('network-outages-glow')) {
    map.addLayer(CUSTOM_LAYERS.outagesGlow);
  }

  if (!map.getLayer('network-outages-layer')) {
    map.addLayer(CUSTOM_LAYERS.outages);
  }

  if (!map.getLayer('network-coverage-layer')) {
    map.addLayer(CUSTOM_LAYERS.coverage);
  }
};

export const updateLayerVisibility = (map: mapboxgl.Map, layerId: string, visible: boolean) => {
  const visibility = visible ? 'visible' : 'none';

  if (layerId === 'network-connections-layer') {
    if (map.getLayer('network-connections-casing')) {
      map.setLayoutProperty('network-connections-casing', 'visibility', visibility);
    }
  }

  if (layerId === 'network-outages-layer') {
    if (map.getLayer('network-outages-glow')) {
      map.setLayoutProperty('network-outages-glow', 'visibility', visibility);
    }
  }

  if (map.getLayer(layerId)) {
    map.setLayoutProperty(layerId, 'visibility', visibility);
  }
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
    // Mapbox workers expect JSON-serializable strings for match/get filters
    type: String(node.type),
    status: String(node.status),
    capacity: node.capacity,
    utilization: node.utilization
  }
});

export const createConnectionFeature = (
  connection: NetworkConnection,
  nodes?: NetworkNode[]
): GeoJSON.Feature | null => {
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
  
  if (coordinates.length < 2) {
    return null;
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
      type: String(connection.type),
      status: String(connection.status),
      bandwidth: connection.bandwidth,
      utilization: connection.utilization
    }
  };
};