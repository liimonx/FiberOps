"use client";

import { useEffect, useRef } from 'react';
import { useNetworkMapStore } from '../stores/useNetworkMapStore';
import { MeasurementPoint, TracePath, HeatmapData } from '../types';

interface ToolVisualizationsProps {
  mapInstance?: any; // Mapbox GL JS map instance
}

// Render measurement lines and points on the map
export function MeasurementVisualization({ mapInstance }: ToolVisualizationsProps) {
  const measurements = useNetworkMapStore((state) => state.measurements);
  const markersRef = useRef<any[]>([]);
  const sourceId = 'measurements';
  const lineLayerId = 'measurements-line';
  const pointLayerId = 'measurements-points';
  const labelLayerId = 'measurements-labels';

  useEffect(() => {
    if (!mapInstance || measurements.length === 0) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Update GeoJSON source
    if (mapInstance.getSource(sourceId)) {
      updateMeasurementSource(mapInstance, measurements);
    } else {
      addMeasurementLayers(mapInstance, measurements);
    }

    return () => {
      cleanupMeasurementLayers(mapInstance);
    };
  }, [mapInstance, measurements]);

  return null;
}

// Render trace path on the map
export function TracePathVisualization({ mapInstance }: ToolVisualizationsProps) {
  const tracePath = useNetworkMapStore((state) => state.tracePath);
  const selectedElementId = useNetworkMapStore((state) => state.interaction.selectedElementId);
  const sourceId = 'trace-path';

  useEffect(() => {
    if (!mapInstance) return;

    if (tracePath) {
      renderTracePath(mapInstance, tracePath);
    } else {
      cleanupTracePath(mapInstance);
    }

    return () => {
      if (!tracePath) {
        cleanupTracePath(mapInstance);
      }
    };
  }, [mapInstance, tracePath]);

  return null;
}

// Render heatmap on the map
export function HeatmapVisualization({ mapInstance }: ToolVisualizationsProps) {
  const heatmapData = useNetworkMapStore((state) => state.heatmapData);
  const sourceId = 'heatmap';
  const layerId = 'heatmap-layer';

  useEffect(() => {
    if (!mapInstance) return;

    if (heatmapData) {
      renderHeatmap(mapInstance, heatmapData);
    } else {
      cleanupHeatmap(mapInstance);
    }

    return () => {
      if (!heatmapData) {
        cleanupHeatmap(mapInstance);
      }
    };
  }, [mapInstance, heatmapData]);

  return null;
}

// Helper functions for measurements
function addMeasurementLayers(map: any, measurements: MeasurementPoint[]) {
  // Add GeoJSON source
  map.addSource('measurements', {
    type: 'geojson',
    data: createMeasurementGeoJSON(measurements)
  });

  // Add line layer connecting points
  map.addLayer({
    id: 'measurements-line',
    type: 'line',
    source: 'measurements',
    layout: {
      'line-cap': 'round',
      'line-join': 'round'
    },
    paint: {
      'line-color': '#3B82F6',
      'line-width': 3,
      'line-dasharray': [2, 2]
    }
  });

  // Add point layers
  map.addLayer({
    id: 'measurements-points',
    type: 'circle',
    source: 'measurements',
    paint: {
      'circle-radius': 6,
      'circle-color': '#3B82F6',
      'circle-stroke-width': 2,
      'circle-stroke-color': '#FFFFFF'
    }
  });

  // Add distance labels
  map.addLayer({
    id: 'measurements-labels',
    type: 'symbol',
    source: 'measurements',
    layout: {
      'text-field': ['get', 'distance'],
      'text-offset': [0, -1.5],
      'text-anchor': 'bottom',
      'text-size': 11
    },
    paint: {
      'text-color': '#3B82F6',
      'text-halo-color': '#FFFFFF',
      'text-halo-width': 2
    }
  });
}

function updateMeasurementSource(map: any, measurements: MeasurementPoint[]) {
  const source = map.getSource('measurements');
  if (source) {
    source.setData(createMeasurementGeoJSON(measurements));
  }
}

function createMeasurementGeoJSON(measurements: MeasurementPoint[]) {
  return {
    type: 'FeatureCollection',
    features: measurements.map((point, index) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [point.position.lng, point.position.lat]
      },
      properties: {
        id: point.id,
        index: index + 1,
        distance: point.distance ? `${Math.round(point.distance)}m` : ''
      }
    }))
  };
}

function cleanupMeasurementLayers(map: any) {
  ['measurements-labels', 'measurements-points', 'measurements-line'].forEach(layerId => {
    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }
  });

  if (map.getSource('measurements')) {
    map.removeSource('measurements');
  }
}

// Helper functions for trace path
function renderTracePath(map: any, tracePath: TracePath) {
  const coordinates = tracePath.path.map(node => [
    node.position.lng,
    node.position.lat
  ]);

  // Create GeoJSON for the path
  const geojson = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: coordinates
        },
        properties: {}
      },
      // Add nodes as points
      ...tracePath.path.map((node, index) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [node.position.lng, node.position.lat]
        },
        properties: {
          isStart: index === 0,
          isEnd: index === tracePath.path.length - 1,
          name: node.name
        }
      }))
    ]
  };

  // Remove existing layers if they exist
  cleanupTracePath(map);

  // Add source
  map.addSource('trace-path', {
    type: 'geojson',
    data: geojson
  });

  // Add animated path line
  map.addLayer({
    id: 'trace-path-line',
    type: 'line',
    source: 'trace-path',
    layout: {
      'line-cap': 'round',
      'line-join': 'round'
    },
    paint: {
      'line-color': '#10B981',
      'line-width': 4,
      'line-opacity': 0.8
    }
  });

  // Add node points
  map.addLayer({
    id: 'trace-path-nodes',
    type: 'circle',
    source: 'trace-path',
    filter: ['==', '$type', 'Point'],
    paint: {
      'circle-radius': [
        'case',
        ['get', 'isStart'], 8,
        ['get', 'isEnd'], 8,
        5
      ],
      'circle-color': [
        'case',
        ['get', 'isStart'], '#10B981',
        ['get', 'isEnd'], '#EF4444',
        '#3B82F6'
      ],
      'circle-stroke-width': 2,
      'circle-stroke-color': '#FFFFFF'
    }
  });

  // Fit map to show entire path
  if (coordinates.length > 0) {
    const bounds = coordinates.reduce((bounds: any, coord: any) => {
      return bounds.extend(coord);
    }, new map.constructor.LngLatBounds(coordinates[0], coordinates[0]));

    map.fitBounds(bounds, {
      padding: 50,
      duration: 1000
    });
  }
}

function cleanupTracePath(map: any) {
  ['trace-path-nodes', 'trace-path-line'].forEach(layerId => {
    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
    }
  });

  if (map.getSource('trace-path')) {
    map.removeSource('trace-path');
  }
}

// Helper functions for heatmap
function renderHeatmap(map: any, heatmapData: HeatmapData) {
  const geojson = {
    type: 'FeatureCollection',
    features: heatmapData.dataPoints.map(point => ({
      type: 'Feature',
      properties: {
        intensity: point.intensity,
        value: point.value || 0
      },
      geometry: {
        type: 'Point',
        coordinates: [point.position.lng, point.position.lat]
      }
    }))
  };

  // Remove existing heatmap if it exists
  cleanupHeatmap(map);

  // Add source
  map.addSource('heatmap', {
    type: 'geojson',
    data: geojson
  });

  // Add heatmap layer
  map.addLayer({
    id: 'heatmap-layer',
    type: 'heatmap',
    source: 'heatmap',
    paint: {
      'heatmap-weight': [
        'interpolate',
        ['linear'],
        ['zoom'],
        0,
        0.5,
        15,
        1
      ],
      'heatmap-intensity': [
        'interpolate',
        ['linear'],
        ['zoom'],
        0,
        1,
        15,
        3
      ],
      'heatmap-color': [
        'interpolate',
        ['linear'],
        ['heatmap-density'],
        0,
        'rgba(0, 0, 255, 0)',
        0.25,
        'rgba(0, 255, 255, 1)',
        0.5,
        'rgba(0, 255, 0, 1)',
        0.75,
        'rgba(255, 255, 0, 1)',
        1,
        'rgba(255, 0, 0, 1)'
      ],
      'heatmap-radius': [
        'interpolate',
        ['linear'],
        ['zoom'],
        0,
        10,
        15,
        heatmapData.radius || 30
      ],
      'heatmap-opacity': 0.8
    }
  });
}

function cleanupHeatmap(map: any) {
  if (map.getLayer('heatmap-layer')) {
    map.removeLayer('heatmap-layer');
  }

  if (map.getSource('heatmap')) {
    map.removeSource('heatmap');
  }
}

// Combined visualization component
export function ToolVisualizations({ mapInstance }: ToolVisualizationsProps) {
  return (
    <>
      <MeasurementVisualization mapInstance={mapInstance} />
      <TracePathVisualization mapInstance={mapInstance} />
      <HeatmapVisualization mapInstance={mapInstance} />
    </>
  );
}
