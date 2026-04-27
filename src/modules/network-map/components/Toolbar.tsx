"use client";

import React, { useRef, useCallback } from 'react';
import { Button, Card, Tooltip } from "@shohojdhara/atomix";
import { useNetworkMapStore } from '../stores/useNetworkMapStore';
import { useAccessibilityAnnounce } from './AccessibilityAnnouncer';
import { ToolType } from '../types';

interface ToolbarProps {
  className?: string;
  position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
}

interface ToolConfig {
  id: ToolType;
  icon: string;
  label: string;
  description: string;
  shortcut?: string;
}

const TOOLS: ToolConfig[] = [
  {
    id: 'select',
    icon: 'CursorClick',
    label: 'Select',
    description: 'Select and inspect network elements',
    shortcut: 'V'
  },
  {
    id: 'trace',
    icon: 'GitCommit',
    label: 'Trace Path',
    description: 'Trace connection paths between nodes',
    shortcut: 'T'
  },
  {
    id: 'measure',
    icon: 'Ruler',
    label: 'Measure',
    description: 'Measure distances on the map',
    shortcut: 'M'
  },
  {
    id: 'heatmap',
    icon: 'Fire',
    label: 'Heatmap',
    description: 'Show network density heatmap',
    shortcut: 'H'
  }
];

export const Toolbar: React.FC<ToolbarProps> = ({
  className = '',
  position = 'top-right'
}) => {
  const activeTool = useNetworkMapStore((state) => state.interaction.activeTool);
  const setActiveTool = useNetworkMapStore((state) => state.setActiveTool);
  const { announce } = useAccessibilityAnnounce();
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleToolClick = useCallback((toolId: ToolType, index: number) => {
    setActiveTool(toolId);
    announce(`${TOOLS[index].label} tool activated`, 'polite');
  }, [setActiveTool, announce]);

  const handleToolbarKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    const currentIndex = buttonRefs.current.findIndex(
      (ref) => ref === document.activeElement
    );
    if (currentIndex === -1) return;

    let nextIndex = currentIndex;

    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault();
        nextIndex = (currentIndex + 1) % TOOLS.length;
        buttonRefs.current[nextIndex]?.focus();
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault();
        nextIndex = currentIndex === 0 ? TOOLS.length - 1 : currentIndex - 1;
        buttonRefs.current[nextIndex]?.focus();
        break;
      case 'Home':
        e.preventDefault();
        buttonRefs.current[0]?.focus();
        break;
      case 'End':
        e.preventDefault();
        buttonRefs.current[TOOLS.length - 1]?.focus();
        break;
    }
  }, []);

  const positionClasses = {
    'top-right': 'u-absolute u-top-4 u-end-4',
    'bottom-right': 'u-absolute u-bottom-4 u-end-4',
    'top-left': 'u-absolute u-top-4 u-start-4',
    'bottom-left': 'u-absolute u-bottom-4 u-start-4'
  };

  return (
    <div className={`toolbar ${positionClasses[position]} ${className}`} role="toolbar" aria-label="Map tools">
      <Card appearance="elevated" glass={true} className="toolbar-card">
        <div className="tools-grid" role="group" aria-label="Tool selection" onKeyDown={handleToolbarKeyDown}>
          {TOOLS.map((tool, index) => (
            <Tooltip
              key={tool.id}
              content={
                <div className="tooltip-content">
                  <strong>{tool.label}</strong>
                  <span className="tooltip-description">{tool.description}</span>
                  {tool.shortcut && (
                    <kbd className="shortcut">{tool.shortcut}</kbd>
                  )}
                </div>
              }
              position="left"
            >
              <Button
                ref={(el: HTMLButtonElement | HTMLAnchorElement | null) => { buttonRefs.current[index] = el as HTMLButtonElement | null; }}
                variant={activeTool === tool.id ? 'primary' : 'secondary'}
                size="sm"
                iconName={tool.icon as any}
                onClick={() => handleToolClick(tool.id, index)}
                aria-label={`${tool.label}${tool.shortcut ? `, shortcut ${tool.shortcut}` : ''}`}
                aria-pressed={activeTool === tool.id}
                aria-keyshortcuts={tool.shortcut}
                className={`tool-button ${activeTool === tool.id ? 'tool-button--active' : ''}`}
              />
            </Tooltip>
          ))}
        </div>
      </Card>

      <style jsx>{`
        .toolbar {
          pointer-events: auto;
          z-index: var(--z-index-toolbar);
        }

        .toolbar-card {
          padding: 8px;
          background: rgba(31, 41, 55, 0.9);
          backdrop-filter: blur(8px);
        }

        .tools-grid {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .tooltip-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 12px;
        }

        .tooltip-content strong {
          color: var(--color-gray-100);
        }

        .tooltip-description {
          color: var(--color-gray-400);
          font-size: 11px;
        }

        .shortcut {
          display: inline-block;
          padding: 2px 6px;
          background: var(--color-gray-700);
          border: 1px solid var(--color-gray-600);
          border-radius: 4px;
          font-size: 10px;
          font-family: monospace;
          color: var(--color-gray-300);
          margin-top: 4px;
          align-self: flex-start;
        }

        .tool-button {
          min-width: 36px;
          min-height: 36px;
          padding: 0;
          transition: all 0.2s ease;
        }

        .tool-button:hover {
          transform: scale(1.05);
        }

        .tool-button--active {
          box-shadow: 0 0 0 2px var(--color-primary-500);
        }

        /* Mobile optimization */
        @media (max-width: 768px) {
          .toolbar-card {
            padding: 6px;
          }

          .tools-grid {
            flex-direction: row;
            gap: 6px;
          }

          .tool-button {
            min-width: 40px;
            min-height: 40px;
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .tool-button {
            transition: none;
          }

          .tool-button:hover {
            transform: none;
          }
        }
      `}</style>
    </div>
  );
};

// Compact toolbar for mobile
export const MobileToolbar: React.FC<{
  className?: string;
}> = ({ className = '' }) => {
  const activeTool = useNetworkMapStore((state) => state.interaction.activeTool);
  const setActiveTool = useNetworkMapStore((state) => state.setActiveTool);
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div className={`mobile-toolbar ${className}`}>
      <Card appearance="elevated" glass={true} className="mobile-toolbar-card">
        {!isExpanded ? (
          <div className="mobile-toolbar-collapsed">
            <Button
              variant="primary"
              size="md"
              iconName={TOOLS.find(t => t.id === activeTool)?.icon as any}
              onClick={() => setIsExpanded(true)}
              aria-label="Open tools menu"
              className="active-tool-button"
            />
            <span className="active-tool-label">
              {TOOLS.find(t => t.id === activeTool)?.label}
            </span>
          </div>
        ) : (
          <div className="mobile-toolbar-expanded">
            <div className="mobile-tools-list">
              {TOOLS.map((tool) => (
                <button
                  key={tool.id}
                  className={`mobile-tool-item ${activeTool === tool.id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTool(tool.id);
                    setIsExpanded(false);
                  }}
                >
                  <span className="tool-icon">{tool.icon}</span>
                  <span className="tool-label">{tool.label}</span>
                  {activeTool === tool.id && (
                    <span className="active-indicator" />
                  )}
                </button>
              ))}
            </div>
            <Button
              variant="secondary"
              size="sm"
              iconName="X"
              onClick={() => setIsExpanded(false)}
              className="close-button"
            >
              Close
            </Button>
          </div>
        )}
      </Card>

      <style jsx>{`
        .mobile-toolbar {
          pointer-events: auto;
        }

        .mobile-toolbar-card {
          padding: 12px;
        }

        .mobile-toolbar-collapsed {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .active-tool-button {
          min-width: 44px;
          min-height: 44px;
        }

        .active-tool-label {
          font-size: 14px;
          color: var(--color-gray-200);
          font-weight: var(--font-weight-medium);
        }

        .mobile-toolbar-expanded {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .mobile-tools-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .mobile-tool-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: transparent;
          border: none;
          border-radius: 8px;
          color: var(--color-gray-300);
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }

        .mobile-tool-item:hover {
          background: var(--color-gray-800);
        }

        .mobile-tool-item.active {
          background: var(--color-primary-500);
          color: white;
        }

        .tool-icon {
          width: 20px;
          height: 20px;
        }

        .tool-label {
          flex: 1;
          text-align: left;
        }

        .active-indicator {
          width: 8px;
          height: 8px;
          background: currentColor;
          border-radius: 50%;
        }

        .close-button {
          align-self: stretch;
        }
      `}</style>
    </div>
  );
};
