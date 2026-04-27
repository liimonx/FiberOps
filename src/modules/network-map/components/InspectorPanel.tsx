"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Icon, Card, Button, Tabs } from "@shohojdhara/atomix";
import { NetworkNode, NetworkConnection, NetworkNodeType, NetworkStatus } from '../types';
import { StatusIndicator, StatusBadge } from './StatusIndicator';
import { NODE_TYPE_ICONS, NETWORK_STATUS_COLORS } from '../constants';

interface InspectorPanelProps {
  selectedNode: NetworkNode | null;
  selectedConnection: NetworkConnection | null;
  onClose: () => void;
  onNavigate?: (elementId: string, type: 'node' | 'connection') => void;
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
  className = '',
  defaultTab = 0
}) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const previousSelectionRef = useRef<string | null>(null);

  const hasSelection = selectedNode || selectedConnection;

  // Focus the panel when a new selection is made
  useEffect(() => {
    const currentId = selectedNode?.id || selectedConnection?.id || null;
    if (currentId && currentId !== previousSelectionRef.current) {
      previousSelectionRef.current = currentId;
      // Focus the panel header for screen readers
      setTimeout(() => {
        panelRef.current?.focus();
      }, 100);
    }
  }, [selectedNode, selectedConnection]);

  // Keyboard shortcut to close panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && hasSelection) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [hasSelection, onClose]);

  if (!hasSelection) {
    return (
      <Card appearance="elevated" glass={true} className={`inspector-panel inspector-panel--empty ${className}`}>
        <div className="empty-state">
          <Icon name="CursorClick" size={32} className="empty-icon" />
          <h3 className="empty-title">No Selection</h3>
          <p className="empty-text">Click on a node or connection to view details</p>
        </div>

        <style jsx>{`
          .inspector-panel--empty {
            width: 280px;
            padding: 24px;
            text-align: center;
          }

          .empty-icon {
            color: var(--color-gray-600);
            margin-bottom: 12px;
          }

          .empty-title {
            font-size: 14px;
            font-weight: var(--font-weight-semibold);
            color: var(--color-gray-400);
            margin: 0 0 4px;
          }

          .empty-text {
            font-size: 12px;
            color: var(--color-gray-500);
            margin: 0;
          }

          @media (max-width: 768px) {
            .inspector-panel--empty {
              width: 100%;
            }
          }
        `}</style>
      </Card>
    );
  }

  const getNodeIcon = (type: NetworkNodeType) => NODE_TYPE_ICONS[type] || 'Circle';
  const getNodeTypeLabel = (type: NetworkNodeType) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div
      ref={panelRef}
      role="region"
      aria-label="Inspector panel"
      tabIndex={-1}
      className="inspector-focus-wrapper"
    >
    <Card
      appearance="elevated"
      glass={true}
      className={`inspector-panel ${isCollapsed ? 'inspector-panel--collapsed' : ''} ${className}`}
    >
      {/* Header */}
      <div className="panel-header">
        {selectedNode && (
          <>
            <div 
              className="header-icon"
              style={{ backgroundColor: NETWORK_STATUS_COLORS[selectedNode.status] }}
            >
              <Icon name={getNodeIcon(selectedNode.type) as any} size={20} />
            </div>
            <div className="header-content">
              <h3 className="header-title">{selectedNode.name}</h3>
              <span className="header-subtitle">{getNodeTypeLabel(selectedNode.type)}</span>
            </div>
          </>
        )}

        {selectedConnection && (
          <>
            <div 
              className="header-icon"
              style={{ backgroundColor: NETWORK_STATUS_COLORS[selectedConnection.status] }}
            >
              <Icon name="GitBranch" size={20} />
            </div>
            <div className="header-content">
              <h3 className="header-title">Connection {selectedConnection.id}</h3>
              <span className="header-subtitle">{selectedConnection.sourceNodeId} → {selectedConnection.targetNodeId}</span>
            </div>
          </>
        )}

        <div className="header-actions">
          <Button
            variant="secondary"
            size="sm"
            iconName={isCollapsed ? "ArrowClockwise" : "ArrowLineUp"}
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? "Expand panel" : "Collapse panel"}
            className="collapse-button"
          />
          <Button
            variant="secondary"
            size="sm"
            iconName="X"
            onClick={onClose}
            aria-label="Close panel"
            className="close-button"
          />
        </div>
      </div>

      {/* Status Badge */}
      <div className="panel-status">
        <StatusIndicator 
          status={selectedNode?.status || selectedConnection?.status || NetworkStatus.ACTIVE}
          size="md"
          showLabel={true}
          pulse={selectedNode?.status === NetworkStatus.ERROR || selectedConnection?.status === NetworkStatus.ERROR}
        />
      </div>

      {/* Tabs */}
      {!isCollapsed && (
        <Tabs activeIndex={activeTab} onTabChange={setActiveTab} className="panel-tabs">
          <Tabs.List className="tabs-list">
            <Tabs.Trigger index={0}>Details</Tabs.Trigger>
            <Tabs.Trigger index={1}>Actions</Tabs.Trigger>
            {selectedNode && <Tabs.Trigger index={2}>Links</Tabs.Trigger>}
          </Tabs.List>

          <Tabs.Panels className="tabs-panels">
            {/* Details Tab */}
            <Tabs.Panel index={0} className="tab-panel tab-panel--details">
              {selectedNode && (
                <div className="details-list">
                  <div className="detail-row">
                    <span className="detail-label">ID</span>
                    <code className="detail-value detail-value--code">{selectedNode.id}</code>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Type</span>
                    <span className="detail-value">{getNodeTypeLabel(selectedNode.type)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Coordinates</span>
                    <span className="detail-value detail-value--code">
                      {selectedNode.position.lat.toFixed(6)}, {selectedNode.position.lng.toFixed(6)}
                    </span>
                  </div>
                  {selectedNode.capacity && (
                    <div className="detail-row">
                      <span className="detail-label">Capacity</span>
                      <span className="detail-value">{selectedNode.capacity} ports</span>
                    </div>
                  )}
                  {selectedNode.utilization !== undefined && (
                    <div className="detail-row">
                      <span className="detail-label">Utilization</span>
                      <div className="detail-value detail-value--with-bar">
                        <span>{selectedNode.utilization}%</span>
                        <div className="utilization-bar">
                          <div 
                            className="utilization-fill"
                            style={{ 
                              width: `${selectedNode.utilization}%`,
                              backgroundColor: selectedNode.utilization > 80 ? '#ef4444' : 
                                            selectedNode.utilization > 60 ? '#f59e0b' : '#10b981'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {selectedConnection && (
                <div className="details-list">
                  <div className="detail-row">
                    <span className="detail-label">ID</span>
                    <code className="detail-value detail-value--code">{selectedConnection.id}</code>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Source</span>
                    <span className="detail-value">{selectedConnection.sourceNodeId}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Target</span>
                    <span className="detail-value">{selectedConnection.targetNodeId}</span>
                  </div>
                  {selectedConnection.bandwidth && (
                    <div className="detail-row">
                      <span className="detail-label">Bandwidth</span>
                      <span className="detail-value">{selectedConnection.bandwidth} Mbps</span>
                    </div>
                  )}
                  {selectedConnection.utilization !== undefined && (
                    <div className="detail-row">
                      <span className="detail-label">Utilization</span>
                      <span className="detail-value">{selectedConnection.utilization}%</span>
                    </div>
                  )}
                </div>
              )}
            </Tabs.Panel>

            {/* Actions Tab */}
            <Tabs.Panel index={1} className="tab-panel tab-panel--actions">
              <div className="actions-list">
                <Button
                  variant="primary"
                  size="sm"
                  iconName="GitBranch"
                  onClick={() => onTracePath?.(selectedNode?.id || selectedConnection?.id || '')}
                  className="action-button"
                >
                  Trace Path
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  iconName="ArrowsOutCardinal"
                  onClick={() => onNavigate?.(selectedNode?.id || selectedConnection?.id || '', selectedNode ? 'node' : 'connection')}
                  className="action-button"
                >
                  Center on Map
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  iconName="Copy"
                  onClick={() => navigator.clipboard.writeText(selectedNode?.id || selectedConnection?.id || '')}
                  className="action-button"
                >
                  Copy ID
                </Button>
              </div>
            </Tabs.Panel>

            {/* Links Tab (only for nodes) */}
            {selectedNode && (
              <Tabs.Panel index={2} className="tab-panel tab-panel--links">
                <div className="links-list">
                  {selectedNode.connectedNodes && selectedNode.connectedNodes.length > 0 ? (
                    selectedNode.connectedNodes.map((nodeId) => (
                      <button
                        key={nodeId}
                        className="link-item"
                        onClick={() => onNavigate?.(nodeId, 'node')}
                      >
                        <Icon name="ArrowRight" size={14} className="link-icon" />
                        <span className="link-text">{nodeId}</span>
                        <Icon name="CaretRight" size={14} className="link-arrow" />
                      </button>
                    ))
                  ) : (
                    <div className="empty-links">
                      <Icon name="LinkBreak" size={24} className="empty-links-icon" />
                      <span>No connected nodes</span>
                    </div>
                  )}
                </div>
              </Tabs.Panel>
            )}
          </Tabs.Panels>
        </Tabs>
      )}

      <style jsx>{`
        .inspector-panel {
          width: 320px;
          max-width: 100%;
          padding: 0;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .inspector-panel--collapsed {
          width: auto;
        }

        .panel-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          border-bottom: 1px solid var(--color-gray-700);
        }

        .header-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }

        .header-content {
          flex: 1;
          min-width: 0;
        }

        .header-title {
          margin: 0;
          font-size: 14px;
          font-weight: var(--font-weight-semibold);
          color: var(--color-gray-100);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .header-subtitle {
          display: block;
          font-size: 12px;
          color: var(--color-gray-500);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .header-actions {
          display: flex;
          gap: 4px;
        }

        .collapse-button,
        .close-button {
          min-width: auto;
          padding: 6px;
        }

        .panel-status {
          padding: 12px 16px;
          border-bottom: 1px solid var(--color-gray-700);
        }

        .panel-tabs {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }

        .tabs-list {
          padding: 0 16px;
          border-bottom: 1px solid var(--color-gray-700);
        }

        .tabs-panels {
          flex: 1;
          overflow-y: auto;
          max-height: 300px;
        }

        .tab-panel {
          padding: 16px;
        }

        .details-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        .detail-label {
          font-size: 12px;
          color: var(--color-gray-500);
          flex-shrink: 0;
        }

        .detail-value {
          font-size: 12px;
          color: var(--color-gray-200);
          font-weight: var(--font-weight-medium);
          text-align: right;
        }

        .detail-value--code {
          font-family: monospace;
          padding: 2px 6px;
          background: var(--color-gray-800);
          border-radius: 4px;
          font-size: 11px;
        }

        .detail-value--with-bar {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }

        .utilization-bar {
          width: 80px;
          height: 4px;
          background: var(--color-gray-700);
          border-radius: 2px;
          overflow: hidden;
        }

        .utilization-fill {
          height: 100%;
          transition: width 0.3s ease;
        }

        .actions-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .action-button {
          justify-content: flex-start;
          text-align: left;
        }

        .links-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .link-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: var(--color-gray-800);
          border: 1px solid var(--color-gray-700);
          border-radius: 6px;
          color: var(--color-gray-300);
          font-size: 12px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .link-item:hover {
          background: var(--color-gray-700);
          border-color: var(--color-primary-500);
          color: var(--color-gray-100);
        }

        .link-icon {
          color: var(--color-primary-500);
        }

        .link-text {
          flex: 1;
          font-family: monospace;
          font-size: 11px;
        }

        .link-arrow {
          color: var(--color-gray-500);
          opacity: 0;
          transition: opacity 0.15s ease;
        }

        .link-item:hover .link-arrow {
          opacity: 1;
          color: var(--color-primary-500);
        }

        .empty-links {
          padding: 24px;
          text-align: center;
          color: var(--color-gray-500);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .empty-links-icon {
          color: var(--color-gray-600);
        }

        /* Mobile optimization */
        @media (max-width: 768px) {
          .inspector-panel {
            width: 100%;
            max-height: 60vh;
          }

          .tabs-panels {
            max-height: 200px;
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .inspector-panel {
            transition: none;
          }

          .utilization-fill {
            transition: none;
          }

          .link-item,
          .link-arrow {
            transition: none;
          }
        }
      `}</style>
    </Card>
    </div>
  );
};
