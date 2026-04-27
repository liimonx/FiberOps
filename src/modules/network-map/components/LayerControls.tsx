"use client";

import React, { useEffect } from 'react';
import { Icon, Card } from "@shohojdhara/atomix";
import { useNetworkMapStore, useLayers } from '../stores/useNetworkMapStore';
import { NetworkMapLayer } from '../types';

interface LayerControlsProps {
  className?: string;
  persistKey?: string;
}

interface LayerConfig extends NetworkMapLayer {
  icon: string;
  description: string;
  color: string;
}

const LAYER_CONFIGS: LayerConfig[] = [
  {
    id: 'fiber-routes',
    name: 'Fiber Routes',
    visible: true,
    type: 'connections',
    icon: 'GitBranch',
    description: 'Show fiber optic cable routes',
    color: '#10b981'
  },
  {
    id: 'nodes-splitters',
    name: 'Nodes & Splitters',
    visible: true,
    type: 'nodes',
    icon: 'HardDrives',
    description: 'Display network nodes and splitters',
    color: '#3b82f6'
  },
  {
    id: 'outages',
    name: 'Outages',
    visible: false,
    type: 'outages',
    icon: 'WarningCircle',
    description: 'Highlight current service outages',
    color: '#ef4444'
  },
  {
    id: 'customers',
    name: 'Customers',
    visible: false,
    type: 'nodes',
    icon: 'Users',
    description: 'Show customer connection points',
    color: '#f59e0b'
  },
  {
    id: 'coverage',
    name: 'Coverage Area',
    visible: false,
    type: 'outages',
    icon: 'MapTrifold',
    description: 'Display network coverage zones',
    color: '#8b5cf6'
  }
];

export const LayerControls: React.FC<LayerControlsProps> = ({
  className = '',
  persistKey = 'network-map-layers'
}) => {
  const layers = useLayers();
  const toggleLayer = useNetworkMapStore((state) => state.toggleLayer);
  const setLayerVisibility = useNetworkMapStore((state) => state.setLayerVisibility);

  // Load persisted layer states on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const persisted = localStorage.getItem(persistKey);
      if (persisted) {
        const parsed = JSON.parse(persisted);
        Object.entries(parsed).forEach(([layerId, visible]) => {
          if (typeof visible === 'boolean') {
            setLayerVisibility(layerId, visible);
          }
        });
      }
    } catch (error) {
      console.warn('Failed to load persisted layer states:', error);
    }
  }, [persistKey, setLayerVisibility]);

  // Persist layer states when they change
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const visibilityState: Record<string, boolean> = {};
    layers.forEach(layer => {
      visibilityState[layer.id] = layer.visible;
    });

    try {
      localStorage.setItem(persistKey, JSON.stringify(visibilityState));
    } catch (error) {
      console.warn('Failed to persist layer states:', error);
    }
  }, [layers, persistKey]);

  const handleToggle = (layerId: string) => {
    toggleLayer(layerId);
  };

  const getActiveLayerCount = () => {
    return layers.filter(l => l.visible).length;
  };

  const handleToggleAll = (visible: boolean) => {
    layers.forEach(layer => {
      setLayerVisibility(layer.id, visible);
    });
  };

  return (
    <Card appearance="elevated" glass={true} className={`layer-controls ${className}`}>
      <div className="layer-header">
        <div className="header-title">
          <Icon name="Stack" size={16} className="header-icon" />
          <span className="header-text">Map Layers</span>
        </div>
        <span className="layer-count">{getActiveLayerCount()} active</span>
      </div>

      <div className="layer-list" role="group" aria-label="Map layers">
        {LAYER_CONFIGS.map((config) => {
          const layer = layers.find(l => l.id === config.id);
          const isVisible = layer?.visible ?? config.visible;

          return (
            <div 
              key={config.id}
              className={`layer-item ${isVisible ? 'layer-item--active' : ''}`}
            >
              <div 
                className="layer-color-indicator"
                style={{ backgroundColor: config.color }}
              />
              
              <div className="layer-content">
                <div className="layer-info">
                  <Icon name={config.icon as any} size={16} className="layer-icon" />
                  <div className="layer-text">
                    <span className="layer-name">{config.name}</span>
                    <span className="layer-description">{config.description}</span>
                  </div>
                </div>
                
                <button
                  className={`layer-toggle ${isVisible ? 'layer-toggle--active' : ''}`}
                  onClick={() => handleToggle(config.id)}
                  aria-label={`Toggle ${config.name} layer`}
                  aria-pressed={isVisible}
                  role="switch"
                >
                  <span className="toggle-track">
                    <span className="toggle-thumb" />
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="layer-actions">
        <button 
          className="action-button"
          onClick={() => handleToggleAll(true)}
        >
          Show All
        </button>
        <button 
          className="action-button"
          onClick={() => handleToggleAll(false)}
        >
          Hide All
        </button>
      </div>

      <style jsx>{`
        .layer-controls {
          width: 280px;
          max-width: 100%;
          padding: 0;
          overflow: hidden;
        }

        .layer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          border-bottom: 1px solid var(--color-gray-700);
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .header-icon {
          color: var(--color-primary-500);
        }

        .header-text {
          font-size: 14px;
          font-weight: var(--font-weight-semibold);
          color: var(--color-gray-100);
        }

        .layer-count {
          font-size: 12px;
          color: var(--color-gray-500);
          padding: 2px 8px;
          background: var(--color-gray-800);
          border-radius: 12px;
        }

        .layer-list {
          max-height: 300px;
          overflow-y: auto;
          padding: 8px;
        }

        .layer-item {
          display: flex;
          align-items: stretch;
          border-radius: 8px;
          overflow: hidden;
          transition: background 0.15s ease;
        }

        .layer-item:hover {
          background: var(--color-gray-800);
        }

        .layer-item--active .layer-color-indicator {
          opacity: 1;
        }

        .layer-color-indicator {
          width: 4px;
          opacity: 0.3;
          transition: opacity 0.15s ease;
        }

        .layer-content {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 10px 12px;
        }

        .layer-info {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
          min-width: 0;
        }

        .layer-icon {
          color: var(--color-gray-500);
          flex-shrink: 0;
        }

        .layer-text {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .layer-name {
          font-size: 13px;
          color: var(--color-gray-200);
          font-weight: var(--font-weight-medium);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .layer-description {
          font-size: 11px;
          color: var(--color-gray-500);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .layer-actions {
          display: flex;
          gap: 8px;
          padding: 12px 16px;
          border-top: 1px solid var(--color-gray-700);
        }

        .action-button {
          flex: 1;
          padding: 8px 12px;
          background: var(--color-gray-800);
          border: 1px solid var(--color-gray-700);
          border-radius: 6px;
          color: var(--color-gray-300);
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .action-button:hover {
          background: var(--color-gray-700);
          border-color: var(--color-primary-500);
          color: var(--color-gray-100);
        }

        .layer-toggle {
          background: none;
          border: none;
          padding: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
        }

        .toggle-track {
          width: 40px;
          height: 20px;
          background: var(--color-gray-600);
          border-radius: 10px;
          position: relative;
          transition: background 0.2s ease;
        }

        .layer-toggle--active .toggle-track {
          background: var(--color-primary-500);
        }

        .toggle-thumb {
          width: 16px;
          height: 16px;
          background: white;
          border-radius: 50%;
          position: absolute;
          top: 2px;
          left: 2px;
          transition: transform 0.2s ease;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        }

        .layer-toggle--active .toggle-thumb {
          transform: translateX(20px);
        }

        .layer-toggle:hover .toggle-track {
          background: var(--color-gray-500);
        }

        .layer-toggle--active:hover .toggle-track {
          background: var(--color-primary-600);
        }

        /* Mobile optimization */
        @media (max-width: 768px) {
          .layer-controls {
            width: 100%;
          }

          .layer-list {
            max-height: 200px;
          }

          .layer-content {
            padding: 8px;
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .layer-item,
          .layer-color-indicator,
          .action-button {
            transition: none;
          }
        }
      `}</style>
    </Card>
  );
};
