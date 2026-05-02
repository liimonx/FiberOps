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

export const LayerControls: React.FC<LayerControlsProps> = ({ className = "" }) => {
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
      glass={{ blurAmount: 5, mode: "shader", shaderVariant: "plasma" }}
      appearance="ghost"
      className={`u-overflow-hidden ${className}`}
    >
      {/* Header with Progress Indicator */}
      <div className="u-flex u-items-center u-justify-between u-p-4 u-bg-primary-subtle u-opacity-90">
        <div className="u-flex u-items-center u-gap-3">
          <div className="u-rounded u-flex u-items-center u-justify-center u-bg-primary-subtle u-shadow-sm u-w-8 u-h-8">
            <Icon name="Stack" size={18} className="" />
          </div>
          <div className="u-flex u-flex-column u-gap-1">
            <span className="u-fs-sm u-font-bold ">Map Layers</span>
            <span className="u-fs-xs u-text-secondary-emphasis">
              {activeCount} of {totalLayers} active
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="u-rounded u-relative u-flex u-items-center u-justify-center u-w-10 u-h-10">
          <svg width="40" height="40" viewBox="0 0 40 40">
            <circle
              cx="20"
              cy="20"
              r="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="u-text-secondary-emphasis u-opacity-10"
            />
            <circle
              cx="20"
              cy="20"
              r="16"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${progressPercentage} 100`}
              transform="rotate(-90 20 20)"
              className="u-transition-base"
            />
          </svg>
          <span
            className={`u-fs-xs u-font-bold u-absolute ${
              activeCount > 0 ? "" : "u-text-secondary"
            }`}
          >
            {activeCount}
          </span>
        </div>
      </div>

      {/* Layer List */}
      <div
        className="u-p-2 u-overflow-y-auto"
        role="group"
        aria-label="Map layers"
        style={{ maxHeight: "360px" }}
      >
        {LAYER_CONFIGS.map((config) => {
          const layer = layers.find((l) => l.id === config.id);
          const isVisible = layer?.visible ?? config.visible;
          const isHovered = hoveredLayer === config.id;

          return (
            <div
              key={config.id}
              className={`u-mb-2 u-rounded u-transition-base ${isHovered ? "u-bg-surface-hover" : "u-bg-surface-subtle"}`}
              style={{
                opacity: isVisible ? 1 : 0.6,
              }}
              onMouseEnter={() => setHoveredLayer(config.id)}
              onMouseLeave={() => setHoveredLayer(null)}
            >
              <div className="u-flex u-items-center u-justify-between u-gap-3 u-p-3">
                <div
                  className="u-rounded u-flex-shrink-0 u-w-1 u-h-8"
                  style={{ backgroundColor: config.color }}
                />

                <div className="u-flex u-flex-1 u-items-center u-gap-3 u-min-w-0">
                  <div
                    className="u-rounded u-flex u-items-center u-justify-center u-flex-shrink-0 u-w-8 u-h-8"
                    style={{
                      backgroundColor: `${config.color}15`,
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
                      className={`u-fs-sm u-font-semibold u-text-truncate u-transition-base ${
                        isVisible ? "u-text-primary" : "u-text-secondary"
                      }`}
                    >
                      {config.name}
                    </span>
                    <span
                      className={`u-fs-xs u-mt-1 u-text-truncate ${
                        isVisible
                          ? "u-text-secondary-emphasis"
                          : "u-text-secondary-emphasis u-opacity-50"
                      }`}
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
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="u-flex u-gap-2 u-p-4">
        <Button
          variant="success"
          fullWidth
          size="sm"
          onClick={() => handleToggleAll(true)}
          disabled={activeCount === totalLayers}
          iconName="Eye"
        >
          Show All
        </Button>
        <Button
          variant="error"
          fullWidth
          size="sm"
          onClick={() => handleToggleAll(false)}
          disabled={activeCount === 0}
          iconName="EyeSlash"
        >
          Hide All
        </Button>
      </div>
    </Card>
  );
};
