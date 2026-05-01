"use client";

import React, { useEffect, useState } from "react";
import { Icon, Card, Toggle, Button } from "@shohojdhara/atomix";
import { useNetworkMapStore, useLayers } from "../stores/useNetworkMapStore";
import { NetworkMapLayer } from "../types";

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
    id: "fiber-routes",
    name: "Fiber Routes",
    visible: true,
    type: "connections",
    icon: "GitBranch",
    description: "Show fiber optic cable routes",
    color: "#10b981",
  },
  {
    id: "nodes-splitters",
    name: "Nodes & Splitters",
    visible: true,
    type: "nodes",
    icon: "HardDrives",
    description: "Display network nodes and splitters",
    color: "#3b82f6",
  },
  {
    id: "outages",
    name: "Outages",
    visible: true,
    type: "outages",
    icon: "WarningCircle",
    description: "Highlight current service outages",
    color: "#ef4444",
  },
  {
    id: "customers",
    name: "Customers",
    visible: true,
    type: "nodes",
    icon: "Users",
    description: "Show customer connection points",
    color: "#f59e0b",
  },
  {
    id: "coverage",
    name: "Coverage Area",
    visible: true,
    type: "nodes",
    icon: "MapTrifold",
    description: "Display network coverage zones",
    color: "#8b5cf6",
  },
];

export const LayerControls: React.FC<LayerControlsProps> = ({
  className = "",
}) => {
  const layers = useLayers();
  const toggleLayer = useNetworkMapStore((state) => state.toggleLayer);
  const setLayerVisibility = useNetworkMapStore((state) => state.setLayerVisibility);
  const updateLayers = useNetworkMapStore((state) => state.updateLayers);
  const [hoveredLayer, setHoveredLayer] = useState<string | null>(null);

  // Sync configured layers with store layers to ensure new layers are added
  useEffect(() => {
    const missingLayers = LAYER_CONFIGS.filter(
      (config) => !layers.some((l) => l.id === config.id)
    );
    if (missingLayers.length > 0) {
      const updatedLayers = [
        ...layers,
        ...missingLayers.map((config) => ({
          id: config.id,
          name: config.name,
          visible: config.visible,
          type: config.type,
        })),
      ];
      updateLayers(updatedLayers);
    }
  }, [layers, updateLayers]);

  const handleToggle = (layerId: string) => {
    toggleLayer(layerId);
  };

  const getActiveLayerCount = () => {
    return layers.filter((l) => l.visible).length;
  };

  const handleToggleAll = (visible: boolean) => {
    layers.forEach((layer) => {
      setLayerVisibility(layer.id, visible);
    });
  };

  const totalLayers = LAYER_CONFIGS.length;
  const activeCount = getActiveLayerCount();
  const progressPercentage = (activeCount / totalLayers) * 100;

  return (
    <Card
      glass={{blurAmount: 10}}
      className={`u-w-100 u-p-0 u-overflow-hidden ${className}`}
      style={{ 
        // maxWidth: "320px",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12)",
        border: "1px solid rgba(255, 255, 255, 0.1)"
      }}
    >
      {/* Header with Progress Indicator */}
      <div className="u-flex u-items-center u-justify-between u-p-4 u-border">
        <div className="u-flex u-items-center u-gap-3">
          <div 
            className="u-rounded u-flex u-items-center u-justify-center"
            style={{
              width: "32px",
              height: "32px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              boxShadow: "0 2px 8px rgba(102, 126, 234, 0.3)"
            }}
          >
            <Icon name="Stack" size={18} className="u-text-white" />
          </div>
          <div className="u-flex u-flex-column u-gap-1">
            <span className="u-text-sm u-font-bold u-text-gray-100">Map Layers</span>
            <span className="u-fs-xs u-text-gray-500">
              {activeCount} of {totalLayers} active
            </span>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div 
          className="u-rounded"
          style={{
            width: "40px",
            height: "40px",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <svg width="40" height="40" viewBox="0 0 40 40">
            <circle
              cx="20"
              cy="20"
              r="16"
              fill="none"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="3"
            />
            <circle
              cx="20"
              cy="20"
              r="16"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${progressPercentage} 100`}
              transform="rotate(-90 20 20)"
              style={{
                transition: "stroke-dasharray 0.3s ease"
              }}
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#667eea" />
                <stop offset="100%" stopColor="#764ba2" />
              </linearGradient>
            </defs>
          </svg>
          <span 
            className="u-fs-xs u-font-bold"
            style={{
              position: "absolute",
              color: activeCount > 0 ? "#667eea" : "rgba(255, 255, 255, 0.3)"
            }}
          >
            {activeCount}
          </span>
        </div>
      </div>

      {/* Layer List */}
      <div
        className="u-p-2 u-overflow-y-auto"
        style={{ maxHeight: "360px" }}
        role="group"
        aria-label="Map layers"
      >
        {LAYER_CONFIGS.map((config, index) => {
          const layer = layers.find((l) => l.id === config.id);
          const isVisible = layer?.visible ?? config.visible;
          const isHovered = hoveredLayer === config.id;

          return (
            <div
              key={config.id}
              className="u-mb-2 u-rounded u-transition-all u-duration-200"
              onMouseEnter={() => setHoveredLayer(config.id)}
              onMouseLeave={() => setHoveredLayer(null)}
              style={{
                backgroundColor: isVisible 
                  ? isHovered 
                    ? "rgba(255, 255, 255, 0.08)" 
                    : "rgba(255, 255, 255, 0.04)"
                  : "transparent",
                transform: isVisible && isHovered ? "translateX(4px)" : "translateX(0)",
                opacity: isVisible ? 1 : 0.5,
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
              }}
            >
              <div className="u-flex u-items-center u-gap-3 u-p-3">
                {/* Color Indicator with Glow Effect */}
                <div
                  className="u-rounded u-flex-shrink-0"
                  style={{
                    width: "8px",
                    height: "32px",
                    backgroundColor: config.color,
                    opacity: isVisible ? 1 : 0.3,
                    boxShadow: isVisible ? `0 0 12px ${config.color}40` : "none",
                    transition: "all 0.2s ease",
                    transform: isVisible ? "scaleY(1)" : "scaleY(0.7)"
                  }}
                />

                {/* Icon and Text */}
                <div className="u-flex u-flex-1 u-items-center u-gap-3 u-min-w-0">
                  <div 
                    className="u-rounded u-flex u-items-center u-justify-center u-flex-shrink-0"
                    style={{
                      width: "32px",
                      height: "32px",
                      backgroundColor: `${config.color}15`,
                      border: `1px solid ${config.color}30`,
                      opacity: isVisible ? 1 : 0.5
                    }}
                  >
                    <Icon 
                      name={config.icon as any} 
                      size={16} 
                      style={{ color: config.color }}
                    />
                  </div>
                  
                  <div className="u-flex u-flex-column u-min-w-0 u-flex-1">
                    <span
                      className="u-text-sm u-font-semibold u-text-gray-100 u-transition-colors u-duration-200"
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "block",
                        color: isVisible ? "rgba(255, 255, 255, 0.95)" : "rgba(255, 255, 255, 0.5)"
                      }}
                    >
                      {config.name}
                    </span>
                    <span
                      className="u-text-xs u-text-gray-500 u-mt-1"
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "block",
                        opacity: isVisible ? 0.7 : 0.4
                      }}
                    >
                      {config.description}
                    </span>
                  </div>
                </div>

                {/* Toggle Switch */}
                <div className="u-flex-shrink-0">
                  <Toggle
                    checked={isVisible}
                    onChange={() => handleToggle(config.id)}
                    aria-label={`Toggle ${config.name} layer`}
                    style={{
                      transform: "scale(0.9)",
                      transition: "transform 0.2s ease"
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div 
        className="u-flex u-gap-2 u-p-4 u-border-top u-border-solid u-border-secondary-subtle"
        style={{
          background: "linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.1))"
        }}
      >
        <Button
          variant="secondary"
          fullWidth
          size="sm"
          onClick={() => handleToggleAll(true)}
          disabled={activeCount === totalLayers}
          style={{
            opacity: activeCount === totalLayers ? 0.5 : 1,
            cursor: activeCount === totalLayers ? "not-allowed" : "pointer",
            transition: "all 0.2s ease"
          }}
        >
          <Icon name="Eye" size={14} style={{ marginRight: "6px" }} />
          Show All
        </Button>
        <Button
          variant="secondary"
          fullWidth
          size="sm"
          onClick={() => handleToggleAll(false)}
          disabled={activeCount === 0}
          style={{
            opacity: activeCount === 0 ? 0.5 : 1,
            cursor: activeCount === 0 ? "not-allowed" : "pointer",
            transition: "all 0.2s ease"
          }}
        >
          <Icon name="EyeSlash" size={14} style={{ marginRight: "6px" }} />
          Hide All
        </Button>
      </div>
    </Card>
  );
};
