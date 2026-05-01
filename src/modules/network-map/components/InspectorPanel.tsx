"use client";

import React, { useState, useEffect, useRef } from "react";
import { Icon, Card, Button, Tabs, Badge } from "@shohojdhara/atomix";
import { NetworkNode, NetworkConnection, NetworkNodeType, NetworkStatus } from "../types";
import { StatusIndicator } from "./StatusIndicator";
import { NODE_TYPE_ICONS, NETWORK_STATUS_COLORS } from "../constants";

interface InspectorPanelProps {
  selectedNode: NetworkNode | null;
  selectedConnection: NetworkConnection | null;
  onClose: () => void;
  onNavigate?: (elementId: string, type: "node" | "connection") => void;
  onTracePath?: (elementId: string) => void;
  className?: string;
  defaultTab?: number;
}

export const InspectorPanel: React.FC<InspectorPanelProps> = ({
  selectedNode,
  selectedConnection,
  onClose,
  onNavigate,
  onTracePath,
  className = "",
  defaultTab = 0,
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const hasSelection = selectedNode || selectedConnection;

  // Focus the panel when a new selection is made
  useEffect(() => {
    if (hasSelection) {
      setTimeout(() => {
        panelRef.current?.focus();
      }, 100);
    }
  }, [selectedNode, selectedConnection, hasSelection]);

  // Keyboard shortcut to close panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && hasSelection) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [hasSelection, onClose]);

  if (!hasSelection) {
    return (
      <Card glass={true} className={`${className}`} style={{ width: "280px" }}>
        <div className="u-flex u-flex-column u-items-center u-gap-4">
          <Icon
            name="CursorClick"
            size={40}
            className="u-text-secondary-subtle u-opacity-30"
          />
          <div className="u-flex u-flex-column u-gap-1">
            <h3 className="u-m-0 u-text-sm u-font-bold u-text-primary">No Selection</h3>
            <p className="u-m-0 u-text-xs u-text-secondary-subtle">
              Select a node or link to view details
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const getNodeTypeLabel = (type: NetworkNodeType) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const status =
    selectedNode?.status || selectedConnection?.status || NetworkStatus.ACTIVE;

  return (
    <div
      ref={panelRef}
      role="region"
      aria-label="Inspector panel"
      tabIndex={-1}
      className="u-outline-none u-z-modal"
    >
      <Card
        glass={true}
        className={`u-p-0 u-overflow-hidden u-transition-all u-bg-white-opacity-5 ${isCollapsed ? "u-h-auto" : ""} ${className}`}
        style={{ width: isCollapsed ? "auto" : "320px" }}
      >
        {/* Header */}
        <div className="u-flex u-items-center u-gap-3 u-p-4 u-border-bottom u-border-secondary-subtle u-bg-white-opacity-5">
          <div
            className="u-w-10 u-h-10 u-rounded-circle u-flex u-items-center u-justify-center u-text-white u-flex-shrink-0 u-shadow-sm"
            style={{ backgroundColor: NETWORK_STATUS_COLORS[status] }}
          >
            <Icon
              name={
                (selectedNode ? NODE_TYPE_ICONS[selectedNode.type] : "GitBranch") as any
              }
              size={20}
            />
          </div>

          {!isCollapsed && (
            <div className="u-flex-1 u-min-w-0">
              <h3 className="u-m-0 u-text-sm u-font-bold u-text-primary u-text-truncate">
                {selectedNode ? selectedNode.name : `Link ${selectedConnection?.id}`}
              </h3>
              <span className="u-text-xs u-text-secondary-subtle u-text-truncate u-block">
                {selectedNode
                  ? getNodeTypeLabel(selectedNode.type)
                  : `${selectedConnection?.sourceNodeId} → ${selectedConnection?.targetNodeId}`}
              </span>
            </div>
          )}

          <div className="u-flex u-gap-1">
            <Button
              variant="secondary"
              size="sm"
              iconName={isCollapsed ? "ArrowsInLineDown" : "ArrowsInLineUp"}
              iconOnly
              onClick={() => setIsCollapsed(!isCollapsed)}
              aria-label={isCollapsed ? "Expand panel" : "Collapse panel"}
            />
            <Button
              variant="secondary"
              size="sm"
              iconName="X"
              iconOnly
              onClick={onClose}
              aria-label="Close panel"
            />
          </div>
        </div>

        {!isCollapsed && (
          <>
            {/* Status Section */}
            <div className="u-px-4 u-py-3 u-border-bottom u-border-secondary-subtle u-bg-white-opacity-5">
              <StatusIndicator
                status={status}
                size="md"
                showLabel={true}
                pulse={status === NetworkStatus.ERROR}
              />
            </div>

            {/* Content Tabs */}
            <Tabs
              activeIndex={activeTab}
              onTabChange={setActiveTab}
              className="u-flex u-flex-column"
            >
              <div className="u-px-4 u-border-bottom u-border-secondary-subtle">
                <Tabs.List className="u-flex u-gap-4">
                  <Tabs.Trigger
                    index={0}
                    className="u-py-3 u-text-xs u-font-bold u-text-uppercase u-border-bottom-2 u-border-transparent data-[state=active]:u-border-primary data-[state=active]:u-text-primary"
                  >
                    Details
                  </Tabs.Trigger>
                  <Tabs.Trigger
                    index={1}
                    className="u-py-3 u-text-xs u-font-bold u-text-uppercase u-border-bottom-2 u-border-transparent data-[state=active]:u-border-primary data-[state=active]:u-text-primary"
                  >
                    Actions
                  </Tabs.Trigger>
                  {selectedNode && (
                    <Tabs.Trigger
                      index={2}
                      className="u-py-3 u-text-xs u-font-bold u-text-uppercase u-border-bottom-2 u-border-transparent data-[state=active]:u-border-primary data-[state=active]:u-text-primary"
                    >
                      Links
                    </Tabs.Trigger>
                  )}
                </Tabs.List>
              </div>

              <div className="u-overflow-y-auto u-p-4" style={{ maxHeight: "350px" }}>
                <Tabs.Panel index={0}>
                  <div className="u-flex u-flex-column u-gap-3">
                    {[
                      {
                        label: "ID",
                        value: selectedNode?.id || selectedConnection?.id,
                        code: true,
                      },
                      {
                        label: "Type",
                        value: selectedNode
                          ? getNodeTypeLabel(selectedNode.type)
                          : "Fiber Connection",
                      },
                      ...(selectedNode
                        ? [
                            {
                              label: "Coordinates",
                              value: `${selectedNode.position.lat.toFixed(6)}, ${selectedNode.position.lng.toFixed(6)}`,
                              code: true,
                            },
                            {
                              label: "Capacity",
                              value: selectedNode.capacity
                                ? `${selectedNode.capacity} ports`
                                : null,
                            },
                            {
                              label: "Utilization",
                              value:
                                selectedNode.utilization !== undefined
                                  ? `${selectedNode.utilization}%`
                                  : null,
                              progress: selectedNode.utilization,
                            },
                          ]
                        : [
                            {
                              label: "Bandwidth",
                              value: selectedConnection?.bandwidth
                                ? `${selectedConnection.bandwidth} Mbps`
                                : null,
                            },
                            {
                              label: "Load",
                              value:
                                selectedConnection?.utilization !== undefined
                                  ? `${selectedConnection.utilization}%`
                                  : null,
                            },
                          ]),
                    ]
                      .filter((item) => item.value !== null)
                      .map((item, i) => (
                        <div
                          key={i}
                          className="u-flex u-justify-between u-items-center u-gap-3"
                        >
                          <span className="u-text-xs u-text-secondary-subtle u-font-bold u-text-uppercase">
                            {item.label}
                          </span>
                          <div className="u-flex u-flex-column u-items-end u-gap-1">
                            {item.code ? (
                              <code className="u-text-xs u-font-mono u-px-2 u-py-1 u-bg-white-opacity-10 u-rounded-sm u-text-primary">
                                {item.value}
                              </code>
                            ) : (
                              <span className="u-text-sm u-font-medium u-text-primary">
                                {item.value}
                              </span>
                            )}
                            {item.progress !== undefined && (
                              <div className="u-w-20 u-h-1 u-bg-white-opacity-10 u-rounded-pill u-overflow-hidden">
                                <div
                                  className={`u-h-100 u-transition-all ${item.progress > 80 ? "u-bg-error" : item.progress > 60 ? "u-bg-warning" : "u-bg-success"}`}
                                  style={{ width: `${item.progress}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </Tabs.Panel>

                <Tabs.Panel index={1}>
                  <div className="u-flex u-flex-column u-gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      iconName="GitBranch"
                      fullWidth
                      onClick={() =>
                        onTracePath?.(selectedNode?.id || selectedConnection?.id || "")
                      }
                    >
                      Trace Route Path
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      iconName="ArrowsOutCardinal"
                      fullWidth
                      onClick={() =>
                        onNavigate?.(
                          selectedNode?.id || selectedConnection?.id || "",
                          selectedNode ? "node" : "connection"
                        )
                      }
                    >
                      Focus on Map
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      iconName="Copy"
                      fullWidth
                      onClick={() =>
                        navigator.clipboard.writeText(
                          selectedNode?.id || selectedConnection?.id || ""
                        )
                      }
                    >
                      Copy Reference ID
                    </Button>
                  </div>
                </Tabs.Panel>

                {selectedNode && (
                  <Tabs.Panel index={2}>
                    <div className="u-flex u-flex-column u-gap-1">
                      {selectedNode.connectedNodes &&
                      selectedNode.connectedNodes.length > 0 ? (
                        selectedNode.connectedNodes.map((nodeId) => (
                          <button
                            key={nodeId}
                            className="u-flex u-items-center u-gap-3 u-p-3 u-bg-white-opacity-5 u-border u-border-solid u-border-secondary-subtle u-rounded u-transition-all hover:u-bg-white-opacity-10 hover:u-border-primary u-text-start u-w-100"
                            onClick={() => onNavigate?.(nodeId, "node")}
                          >
                            <Icon
                              name="ArrowRight"
                              size={14}
                              className="u-text-primary"
                            />
                            <span className="u-flex-1 u-text-xs u-font-mono u-text-primary">
                              {nodeId}
                            </span>
                            <Icon
                              name="CaretRight"
                              size={12}
                              className="u-text-secondary-subtle u-opacity-50"
                            />
                          </button>
                        ))
                      ) : (
                        <div className="u-py-8 u-text-center u-text-secondary-subtle">
                          <Icon
                            name="LinkBreak"
                            size={24}
                            className="u-opacity-30 u-mb-2"
                          />
                          <span className="u-text-xs u-block">No linked nodes found</span>
                        </div>
                      )}
                    </div>
                  </Tabs.Panel>
                )}
              </div>
            </Tabs>
          </>
        )}
      </Card>
    </div>
  );
};
