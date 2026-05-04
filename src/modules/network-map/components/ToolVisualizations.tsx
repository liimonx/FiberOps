"use client";

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { useNetworkMapStore } from '../stores/useNetworkMapStore';
import { MeasurementPoint, TracePath, HeatmapData } from '../types';

interface ToolVisualizationsProps {
  mapInstance?: mapboxgl.Map | null;
}

// Render measurement lines and points on the map
export function MeasurementVisualization({ mapInstance }: ToolVisualizationsProps) {
  const measurements = useNetworkMapStore((state) => state.measurements);

  useEffect(() => {
    if (!mapInstance) return;

    // Always sync the source (even when empty, so layers show nothing)
    if (mapInstance.getSource('measurements')) {
      updateMeasurementSource(mapInstance, measurements);
    } else if (measurements.length > 0) {
      // Only add layers when we have the first point
      addMeasurementLayers(mapInstance, measurements);
    }

    // Only clean up on true unmount, not on every measurements change
    return () => {
      // noop - cleanup happens in the dedicated unmount effect below
    };
  }, [mapInstance, measurements]);

  // Separate effect for unmount cleanup only
  useEffect(() => {
    return () => {
      if (mapInstance) cleanupMeasurementLayers(mapInstance);
    };
  }, [mapInstance]);

  return null;
}

// Render trace path on the map
export function TracePathVisualization({ mapInstance }: ToolVisualizationsProps) {
  const tracePath = useNetworkMapStore((state) => state.tracePath);

  useEffect(() => {
    if (!mapInstance) return;

    if (tracePath) {
      renderTracePath(mapInstance, tracePath);
    } else {
      cleanupTracePath(mapInstance);
    }

    return () => {
      // noop - cleanup on unmount handled below
    };
  }, [mapInstance, tracePath]);

  // Separate unmount cleanup
  useEffect(() => {
    return () => {
      if (mapInstance) cleanupTracePath(mapInstance);
    };
  }, [mapInstance]);

  return null;
}

// Render heatmap on the map
export function HeatmapVisualization({ mapInstance }: ToolVisualizationsProps) {
  const heatmapData = useNetworkMapStore((state) => state.heatmapData);

  useEffect(() => {
    if (!mapInstance) return;

    if (heatmapData) {
      renderHeatmap(mapInstance, heatmapData);
    } else {
      cleanupHeatmap(mapInstance);
    }

    return () => {
      // noop
    };
  }, [mapInstance, heatmapData]);

  useEffect(() => {
    return () => {
      if (mapInstance) cleanupHeatmap(mapInstance);
    };
  }, [mapInstance]);

  return null;
}

// Helper functions for measurements
function addMeasurementLayers(map: mapboxgl.Map, measurements: MeasurementPoint[]) {
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

function updateMeasurementSource(map: mapboxgl.Map, measurements: MeasurementPoint[]) {
  const source = map.getSource('measurements') as mapboxgl.GeoJSONSource;
  if (source) {
    source.setData(createMeasurementGeoJSON(measurements));
  }
}

function createMeasurementGeoJSON(measurements: MeasurementPoint[]): GeoJSON.FeatureCollection {
  const coords = measurements.map(p => [p.position.lng, p.position.lat]);

  const features: GeoJSON.Feature[] = [
    // Points
    ...measurements.map((point, index) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [point.position.lng, point.position.lat]
      },
      properties: {
        id: point.id,
        index: index + 1,
        distance: point.distance ? `${Math.round(point.distance)}m` : ''
      }
    }))
  ];

  // Add a LineString only when there are 2+ points
  if (coords.length >= 2) {
    features.unshift({
      type: 'Feature' as const,
      geometry: {
        type: 'LineString' as const,
        coordinates: coords
      },
      properties: { id: 'measurement-line', distance: '' }
    });
  }

  return { type: 'FeatureCollection', features };
}

function cleanupMeasurementLayers(map: mapboxgl.Map) {
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
function renderTracePath(map: mapboxgl.Map, tracePath: TracePath) {
  const coordinates = tracePath.path.map(node => [
    node.position.lng,
    node.position.lat
  ]);

  // Create GeoJSON for the path
  const geojson: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection' as const,
    features: [
      {
        type: 'Feature' as const,
        geometry: {
          type: 'LineString' as const,
          coordinates: coordinates
        },
        properties: {}
      },
      // Add nodes as points
      ...tracePath.path.map((node, index) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
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
    const bounds = new mapboxgl.LngLatBounds(
      coordinates[0] as [number, number],
      coordinates[0] as [number, number]
    );
    coordinates.forEach((coord) => bounds.extend(coord as [number, number]));

    map.fitBounds(bounds, {
      padding: 50,
      duration: 1000
    });
  }
}

function cleanupTracePath(map: mapboxgl.Map) {
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
function renderHeatmap(map: mapboxgl.Map, heatmapData: HeatmapData) {
  const geojson: GeoJSON.FeatureCollection = {
    type: 'FeatureCollection' as const,
    features: heatmapData.dataPoints.map(point => ({
      type: 'Feature' as const,
      properties: {
        intensity: point.intensity,
        value: point.value || 0
      },
      geometry: {
        type: 'Point' as const,
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

function cleanupHeatmap(map: mapboxgl.Map) {
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
