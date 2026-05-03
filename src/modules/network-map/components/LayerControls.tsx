"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Icon, Card, Toggle, Button, Badge } from "@shohojdhara/atomix";
import { useNetworkMapStore, useLayers } from "../stores/useNetworkMapStore";
import { NetworkMapLayer, NetworkStatus } from "../types";

interface LayerControlsProps {
  className?: string;
  persistKey?: string;
}

interface LayerConfig extends NetworkMapLayer {
  icon: string;
  description: string;
  color: string;
  stats?: {
    total: number;
    active: number;
    alerts: number;
  };
}

const LAYER_CONFIGS: LayerConfig[] = [
  {
    id: "fiber-routes",
    name: "Fiber Routes",
    visible: true,
    type: "connections",
    icon: "GitBranch",
    description: "Fiber optic backbone & distribution",
    color: "#06b6d4",
    stats: { total: 124, active: 120, alerts: 4 },
  },
  {
    id: "infrastructure",
    name: "Core Nodes",
    visible: true,
    type: "nodes",
    icon: "HardDrive",
    description: "Core and Distribution infrastructure",
    color: "#8b5cf6",
    stats: { total: 12, active: 12, alerts: 0 },
  },
  {
    id: "pops",
    name: "Points of Presence",
    visible: true,
    type: "nodes",
    icon: "Pulse",
    description: "Network service hubs",
    color: "#ec4899",
    stats: { total: 8, active: 7, alerts: 1 },
  },
  {
    id: "splitters",
    name: "Splitters",
    visible: true,
    type: "nodes",
    icon: "GitFork",
    description: "Passive optical splitters",
    color: "#8b5cf6",
    stats: { total: 32, active: 30, alerts: 2 },
  },
  {
    id: "junction-boxes",
    name: "Junction Boxes",
    visible: true,
    type: "nodes",
    icon: "Package",
    description: "Fiber termination points",
    color: "#94a3b8",
    stats: { total: 45, active: 44, alerts: 1 },
  },
  {
    id: "poles",
    name: "Utility Poles",
    visible: true,
    type: "nodes",
    icon: "MapPin",
    description: "Aerial distribution points",
    color: "#64748b",
    stats: { total: 156, active: 150, alerts: 6 },
  },
  {
    id: "onus",
    name: "ONU Units",
    visible: true,
    type: "nodes",
    icon: "HardDrive",
    description: "Optical Network Units",
    color: "#f59e0b",
    stats: { total: 85, active: 82, alerts: 3 },
  },
  {
    id: "customers",
    name: "Client Endpoints",
    visible: true,
    type: "nodes",
    icon: "Users",
    description: "Customer connection points",
    color: "#f59e0b",
    stats: { total: 1240, active: 1198, alerts: 42 },
  },
  {
    id: "customer-connections",
    name: "Drop Cables",
    visible: true,
    type: "connections",
    icon: "Link",
    description: "Last-mile customer connections",
    color: "#38bdf8",
    stats: { total: 1240, active: 1198, alerts: 42 },
  },
  {
    id: "outages",
    name: "Active Outages",
    visible: true,
    type: "outages",
    icon: "WarningCircle",
    description: "Current service interruptions",
    color: "#ef4444",
    stats: { total: 8, active: 8, alerts: 8 },
  },
  {
    id: "coverage",
    name: "Service Coverage",
    visible: true,
    type: "coverage",
    icon: "MapTrifold",
    description: "Regional network availability",
    color: "#10b981",
    stats: { total: 12, active: 12, alerts: 0 },
  },
];

export const LayerControls: React.FC<LayerControlsProps> = ({ className = "" }) => {
  const layers = useLayers();
  const toggleLayer = useNetworkMapStore((state) => state.toggleLayer);
  const setLayerVisibility = useNetworkMapStore((state) => state.setLayerVisibility);
  const updateLayers = useNetworkMapStore((state) => state.updateLayers);
  const [hoveredLayer, setHoveredLayer] = useState<string | null>(null);

  // Sync configured layers with store layers
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

  const activeCount = useMemo(() => layers.filter((l) => l.visible).length, [layers]);
  const totalLayers = LAYER_CONFIGS.length;
  const progressPercentage = (activeCount / totalLayers) * 100;
  const circumference = 2 * Math.PI * 16;
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;

  const handleToggleAll = (visible: boolean) => {
    layers.forEach((layer) => {
      setLayerVisibility(layer.id, visible);
    });
  };

  return (
    <Card
      glass={{ blurAmount: 12, mode: "shader", shaderVariant: "plasma" }}
      appearance="ghost"
      className={`u-overflow-hidden u-border-primary-subtle u-shadow-lg ${className}`}
      style={{ width: "320px" }}
    >
      {/* Premium Header */}
      <div className="u-relative u-p-4 u-bg-primary-subtle u-opacity-95 u-border-bottom u-border-primary-subtle">
        <div className="u-flex u-items-center u-justify-between">
          <div className="u-flex u-items-center u-gap-3">
            <div className="u-rounded-circle u-flex u-items-center u-justify-center u-bg-primary u-text-white u-shadow-lg u-w-9 u-h-9">
              <Icon name="Stack" size={20} weight="bold" />
            </div>
            <div className="u-flex u-flex-column">
              <span className="u-fs-base u-font-bold u-text-primary">Map Layers</span>
              <span className="u-fs-xs u-text-secondary-emphasis u-opacity-75">
                {activeCount} of {totalLayers} visibility layers
              </span>
            </div>
          </div>

          {/* Realistic Progress Ring */}
          <div className="u-relative u-flex u-items-center u-justify-center u-w-12 u-h-12">
            <svg
              width="48"
              height="48"
              viewBox="0 0 40 40"
              className="u-transform-rotate--90"
            >
              <circle
                cx="20"
                cy="20"
                r="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="u-text-primary-subtle u-opacity-20"
              />
              <circle
                cx="20"
                cy="20"
                r="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={circumference}
                style={{
                  strokeDashoffset,
                  transition: "stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                  color: "var(--atomix-primary)",
                }}
              />
            </svg>
            <span className="u-fs-xs u-font-bold u-absolute u-text-primary">
              {Math.round(progressPercentage)}%
            </span>
          </div>
        </div>
      </div>

      {/* Meaningful Layer List */}
      <div
        className="u-p-2 u-overflow-y-auto u-flex u-flex-column u-gap-2"
        role="group"
        aria-label="Map layers"
        style={{ maxHeight: "400px", scrollbarWidth: "none" }}
      >
        {LAYER_CONFIGS.map((config) => {
          const layer = layers.find((l) => l.id === config.id);
          const isVisible = layer?.visible ?? config.visible;
          const isHovered = hoveredLayer === config.id;
          const hasAlerts = config.stats && config.stats.alerts > 0;

          return (
            <div
              key={config.id}
              className={`u-rounded-sm u-transition-base u-border u-border-transparent ${
                isHovered
                  ? "u-bg-surface-hover u-border-primary-subtle u-shadow-sm"
                  : "u-bg-surface-subtle"
              }`}
              style={{
                opacity: isVisible ? 1 : 0.5,
              }}
              onMouseEnter={() => setHoveredLayer(config.id)}
              onMouseLeave={() => setHoveredLayer(null)}
            >
              <div className="u-flex u-items-center u-gap-3 u-p-2">
                {/* Visual Identity */}
                <div className="u-relative">
                  <div
                    className="u-rounded u-flex u-items-center u-justify-center u-w-10 u-h-10 u-shadow-sm"
                    style={{
                      backgroundColor: `${config.color}15`,
                      border: `1px solid ${config.color}30`,
                    }}
                  >
                    <Icon
                      name={config.icon as any}
                      size={18}
                      style={{ color: config.color }}
                      weight={isVisible ? "duotone" : "regular"}
                    />
                  </div>
                  {hasAlerts && isVisible && (
                    <div
                      className="u-absolute u-top-0 u-right-0 u-w-3 u-h-3 u-rounded-circle u-border-white u-border-solid u-border-2"
                      style={{
                        backgroundColor: "#ef4444",
                        transform: "translate(25%, -25%)",
                      }}
                    />
                  )}
                </div>

                <div className="u-flex u-flex-column u-flex-1 u-min-w-0">
                  <div className="u-flex u-items-center u-justify-between u-gap-2">
                    <span
                      className={`u-fs-sm u-font-bold u-text-truncate ${isVisible ? "u-text-primary" : "u-text-secondary"}`}
                    >
                      {config.name}
                    </span>
                    {config.stats && isVisible && (
                      <Badge
                        variant={hasAlerts ? "error" : "success"}
                        label={hasAlerts ? `${config.stats.alerts} Issues` : "Healthy"}
                        className="u-fs-xs"
                        style={{ fontSize: "10px", padding: "1px 4px" }}
                      />
                    )}
                  </div>
                  <span className="u-fs-xs u-text-secondary-emphasis u-text-truncate u-opacity-70">
                    {config.description}
                  </span>
                </div>

                {/* Compact Toggle */}
                <div className="u-ms-auto">
                  <Toggle
                    checked={isVisible}
                    onChange={() => handleToggle(config.id)}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Footer */}
      <div className="u-flex u-gap-2 u-p-3 u-bg-surface-subtle u-border-top u-border-primary-subtle">
        <Button
          variant="primary"
          fullWidth
          size="sm"
          onClick={() => handleToggleAll(true)}
          disabled={activeCount === totalLayers}
          iconName="Eye"
        >
          Enable All
        </Button>
        <Button
          variant="secondary"
          fullWidth
          size="sm"
          onClick={() => handleToggleAll(false)}
          disabled={activeCount === 0}
          iconName="EyeSlash"
        >
          Disable All
        </Button>
      </div>
    </Card>
  );
};
