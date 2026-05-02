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
            className="u-text-secondary-emphasis"
            style={{ opacity: 0.3 }}
          />
          <div className="u-flex u-flex-column u-gap-1">
            <h3 className="u-m-0 u-fs-sm u-font-bold">No Selection</h3>
            <p className="u-m-0 u-fs-xs u-text-secondary-emphasis">
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
      className="u-z-modal"
      style={{ outline: "none" }}
    >
      <Card
        glass={{ blurAmount: 5 }}
        className={`u-p-0 ${isCollapsed ? "u-h-auto" : ""} ${className}`}
        style={{
          width: isCollapsed ? "auto" : "320px",
          overflow: "hidden",
        }}
        size="sm"
      >
        {/* Header */}
        <div
          className="u-flex u-items-center u-gap-3 u-p-4"
          style={{
            borderBottom:
              "1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.1))",
            backgroundColor: "rgba(255, 255, 255, 0.05)",
          }}
        >
          <div
            className="u-rounded-circle u-flex u-items-center u-justify-center u-shadow-sm"
            style={{
              backgroundColor: NETWORK_STATUS_COLORS[status],
              width: "40px",
              height: "40px",
              flexShrink: 0,
            }}
          >
            <Icon
              name={
                (selectedNode ? NODE_TYPE_ICONS[selectedNode.type] : "GitBranch") as any
              }
              size={20}
            />
          </div>

          {!isCollapsed && (
            <div className="u-flex-1" style={{ minWidth: 0 }}>
              <h3
                className="u-m-0 u-fs-sm u-font-bold"
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {selectedNode ? selectedNode.name : `Link ${selectedConnection?.id}`}
              </h3>
              <span
                className="u-fs-xs u-text-secondary-emphasis u-block"
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
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
              iconName={isCollapsed ? "ArrowUp" : "ArrowDown"}
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
            <div
              className="u-px-4 u-py-3"
              style={{
                borderBottom:
                  "1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.1))",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
              }}
            >
              <StatusIndicator
                status={status}
                size="md"
                showLabel={true}
                pulse={status === NetworkStatus.ERROR}
              />
            </div>

            {/* Content Tabs */}
            <Tabs activeIndex={activeTab} onTabChange={setActiveTab}>
              <div
                style={{
                  borderBottom:
                    "1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.1))",
                }}
              >
                <Tabs.List>
                  <Tabs.Trigger index={0}>Details</Tabs.Trigger>
                  <Tabs.Trigger index={1}>Actions</Tabs.Trigger>
                  {selectedNode && <Tabs.Trigger index={2}>Links</Tabs.Trigger>}
                </Tabs.List>
              </div>

              <div className="u-p-4" style={{ maxHeight: "350px", overflowY: "auto" }}>
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
                          <span
                            className="u-fs-xs u-text-secondary-emphasis u-font-bold"
                            style={{ textTransform: "uppercase" }}
                          >
                            {item.label}
                          </span>
                          <div className="u-flex u-flex-column u-items-end u-gap-1">
                            {item.code ? (
                              <code
                                className="u-fs-xs u-px-2 u-py-1 u-rounded-sm"
                                style={{
                                  fontFamily: "monospace",
                                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                                }}
                              >
                                {item.value}
                              </code>
                            ) : (
                              <span className="u-fs-sm" style={{ fontWeight: 500 }}>
                                {item.value}
                              </span>
                            )}
                            {item.progress !== undefined && (
                              <div
                                style={{
                                  width: "80px",
                                  height: "4px",
                                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                                  borderRadius: "9999px",
                                  overflow: "hidden",
                                }}
                              >
                                <div
                                  className="u-h-100"
                                  style={{
                                    width: `${item.progress}%`,
                                    transition: "all 0.3s ease",
                                    backgroundColor:
                                      item.progress > 80
                                        ? "var(--color-error, #f44336)"
                                        : item.progress > 60
                                          ? "var(--color-warning, #ff9800)"
                                          : "var(--color-success, #4caf50)",
                                  }}
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
                            className="u-flex u-items-center u-gap-3 u-p-3 u-border u-border-solid u-border-secondary-subtle u-rounded u-w-100"
                            style={{
                              backgroundColor: "rgba(255, 255, 255, 0.05)",
                              cursor: "pointer",
                              textAlign: "start",
                              transition: "all 0.3s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor =
                                "rgba(255, 255, 255, 0.1)";
                              e.currentTarget.style.borderColor =
                                "var(--color-primary, #1976d2)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor =
                                "rgba(255, 255, 255, 0.05)";
                              e.currentTarget.style.borderColor =
                                "var(--color-border-subtle, rgba(255, 255, 255, 0.2))";
                            }}
                            onClick={() => onNavigate?.(nodeId, "node")}
                          >
                            <Icon name="ArrowRight" size={14} className="" />
                            <span
                              className="u-flex-1 u-fs-xs"
                              style={{ fontFamily: "monospace" }}
                            >
                              {nodeId}
                            </span>
                            <Icon
                              name="CaretRight"
                              size={12}
                              className="u-text-secondary-emphasis"
                              style={{ opacity: 0.5 }}
                            />
                          </button>
                        ))
                      ) : (
                        <div className="u-py-8 u-text-center u-text-secondary-emphasis">
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
