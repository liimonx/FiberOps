"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Icon, Card, Button } from "@shohojdhara/atomix";
import { useResponsive } from '../hooks/useResponsive';
import { useNetworkMapStore } from '../stores/useNetworkMapStore';

interface MobileLayoutProps {
  children: React.ReactNode;
  searchPanel: React.ReactNode;
  toolbar: React.ReactNode;
  layerControls: React.ReactNode;
  inspectorPanel: React.ReactNode;
  mapControls: React.ReactNode;
}

type BottomSheetType = 'search' | 'layers' | 'inspector' | null;

export const MobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  searchPanel,
  toolbar,
  layerControls,
  inspectorPanel,
  mapControls
}) => {
  const { isMobile } = useResponsive();
  const [activeSheet, setActiveSheet] = useState<BottomSheetType>(null);
  const [sheetHeight, setSheetHeight] = useState(50); // percentage
  const [isDragging, setIsDragging] = useState(false);
  const selectedElement = useNetworkMapStore((state) => state.interaction.selectedElementId);

  // Refs for focus management
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  const openSheet = useCallback((sheet: BottomSheetType) => {
    lastFocusedRef.current = document.activeElement as HTMLElement;
    setActiveSheet(sheet);
    setSheetHeight(sheet === 'inspector' ? 85 : 70);
  }, []);

  const closeSheet = useCallback(() => {
    setActiveSheet(null);
    setSheetHeight(50);
    setTimeout(() => lastFocusedRef.current?.focus(), 0);
  }, []);

  const toggleSheet = useCallback((sheet: BottomSheetType) => {
    if (activeSheet === sheet) {
      closeSheet();
    } else {
      openSheet(sheet);
    }
  }, [activeSheet, openSheet, closeSheet]);

  // Auto-open inspector when element is selected
  useEffect(() => {
    if (selectedElement && isMobile) {
      openSheet('inspector');
    }
  }, [selectedElement, isMobile, openSheet]);

  // Focus trap and keyboard handling for bottom sheet
  useEffect(() => {
    if (!activeSheet || !sheetRef.current) return;

    setTimeout(() => closeButtonRef.current?.focus(), 100);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeSheet();
      }
      if (e.key === 'Tab' && sheetRef.current) {
        const focusable = sheetRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0] as HTMLElement;
        const last = focusable[focusable.length - 1] as HTMLElement;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [activeSheet, closeSheet]);

  // Handle touch gestures for bottom sheet
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !activeSheet) return;
    
    const touch = e.touches[0];
    const windowHeight = window.innerHeight;
    const newHeight = ((windowHeight - touch.clientY) / windowHeight) * 100;
    
    // Constrain between 30% and 90%
    setSheetHeight(Math.max(30, Math.min(90, newHeight)));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    // Snap to nearest breakpoint
    if (sheetHeight < 45) {
      closeSheet();
    } else if (sheetHeight < 65) {
      setSheetHeight(70);
    } else {
      setSheetHeight(85);
    }
  };

  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div className="mobile-layout">
      {/* Main content area */}
      <div className="mobile-content">
        {children}
      </div>

      {/* Floating Action Buttons */}
      <div className="mobile-fab-container">
        <div className="mobile-toolbar-fab">
          {toolbar}
        </div>
        
        <div className="mobile-map-controls">
          {mapControls}
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <nav className="mobile-bottom-bar" role="tablist" aria-label="Mobile navigation">
        <button
          role="tab"
          aria-selected={activeSheet === 'search'}
          aria-expanded={activeSheet === 'search'}
          aria-controls="mobile-bottom-sheet"
          className={`mobile-nav-button ${activeSheet === 'search' ? 'active' : ''}`}
          onClick={() => toggleSheet('search')}
        >
          <Icon name="MagnifyingGlass" size={20} />
          <span>Search</span>
        </button>

        <button
          role="tab"
          aria-selected={activeSheet === 'layers'}
          aria-expanded={activeSheet === 'layers'}
          aria-controls="mobile-bottom-sheet"
          className={`mobile-nav-button ${activeSheet === 'layers' ? 'active' : ''}`}
          onClick={() => toggleSheet('layers')}
        >
          <Icon name="Stack" size={20} />
          <span>Layers</span>
        </button>

        <button
          role="tab"
          aria-selected={activeSheet === 'inspector'}
          aria-expanded={activeSheet === 'inspector'}
          aria-controls="mobile-bottom-sheet"
          className={`mobile-nav-button ${activeSheet === 'inspector' ? 'active' : ''}`}
          onClick={() => toggleSheet('inspector')}
          disabled={!selectedElement}
          aria-disabled={!selectedElement}
        >
          <Icon name="Info" size={20} />
          <span>Details</span>
          {selectedElement && <span className="nav-badge" aria-hidden="true" />}
        </button>
      </nav>

      {/* Bottom Sheet */}
      {activeSheet && (
        <div
          ref={sheetRef}
          id="mobile-bottom-sheet"
          className="bottom-sheet"
          style={{ height: `${sheetHeight}%` }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="sheet-title"
        >
          {/* Sheet Handle */}
          <div
            className="sheet-handle"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={() => {
              if (sheetHeight > 70) {
                setSheetHeight(50);
              } else {
                setSheetHeight(85);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (sheetHeight > 70) {
                  setSheetHeight(50);
                } else {
                  setSheetHeight(85);
                }
              }
            }}
            role="button"
            aria-label="Drag to resize sheet or press Enter to toggle size"
            tabIndex={0}
          >
            <div className="handle-bar" />
          </div>

          {/* Sheet Header */}
          <div className="sheet-header">
            <h3 id="sheet-title" className="sheet-title">
              {activeSheet === 'search' && 'Search Assets'}
              {activeSheet === 'layers' && 'Map Layers'}
              {activeSheet === 'inspector' && 'Asset Details'}
            </h3>
            <Button
              ref={closeButtonRef}
              variant="secondary"
              size="sm"
              iconName="X"
              onClick={closeSheet}
              aria-label="Close sheet"
              className="sheet-close"
            />
          </div>

          {/* Sheet Content */}
          <div className="sheet-content">
            {activeSheet === 'search' && searchPanel}
            {activeSheet === 'layers' && layerControls}
            {activeSheet === 'inspector' && inspectorPanel}
          </div>
        </div>
      )}

      {/* Backdrop */}
      {activeSheet && (
        <div 
          className="sheet-backdrop"
          onClick={closeSheet}
        />
      )}

      <style jsx>{`
        .mobile-layout {
          position: relative;
          width: 100%;
          height: 100vh;
          overflow: hidden;
        }

        .mobile-content {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          padding-bottom: 80px; /* Space for bottom bar */
        }

        .mobile-fab-container {
          position: absolute;
          top: 16px;
          right: 16px;
          z-index: 20;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .mobile-toolbar-fab,
        .mobile-map-controls {
          pointer-events: auto;
        }

        .mobile-bottom-bar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 64px;
          background: rgba(31, 41, 55, 0.95);
          backdrop-filter: blur(10px);
          border-top: 1px solid var(--color-gray-700);
          display: flex;
          justify-content: space-around;
          align-items: center;
          z-index: 50;
          padding: 0 8px;
          padding-bottom: env(safe-area-inset-bottom, 0);
        }

        .mobile-nav-button {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 12px 16px;
          min-height: 48px;
          min-width: 48px;
          background: none;
          border: none;
          color: var(--color-gray-400);
          font-size: 11px;
          cursor: pointer;
          transition: color 0.2s ease;
          position: relative;
          flex: 1;
          max-width: 80px;
        }

        .mobile-nav-button.active {
          color: var(--color-primary-500);
        }

        .mobile-nav-button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .nav-badge {
          position: absolute;
          top: 4px;
          right: 16px;
          width: 8px;
          height: 8px;
          background: var(--color-primary-500);
          border-radius: 50%;
        }

        .bottom-sheet {
          position: fixed;
          bottom: 64px; /* Above bottom bar */
          left: 0;
          right: 0;
          background: rgba(31, 41, 55, 0.98);
          backdrop-filter: blur(10px);
          border-radius: 20px 20px 0 0;
          z-index: 40;
          display: flex;
          flex-direction: column;
          transition: height 0.3s ease;
          box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
        }

        .sheet-handle {
          padding: 12px 16px 8px;
          cursor: grab;
          display: flex;
          justify-content: center;
          flex-shrink: 0;
        }

        .sheet-handle:active {
          cursor: grabbing;
        }

        .handle-bar {
          width: 40px;
          height: 4px;
          background: var(--color-gray-600);
          border-radius: 2px;
        }

        .sheet-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 16px 16px;
          border-bottom: 1px solid var(--color-gray-700);
          flex-shrink: 0;
        }

        .sheet-title {
          margin: 0;
          font-size: 16px;
          font-weight: var(--font-weight-semibold);
          color: var(--color-gray-100);
        }

        .sheet-close {
          min-width: auto;
          padding: 6px;
        }

        .sheet-content {
          flex: 1;
          overflow-y: auto;
          padding: 0 16px 16px;
          -webkit-overflow-scrolling: touch;
        }

        .sheet-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 64px;
          background: rgba(0, 0, 0, 0.5);
          z-index: 35;
          animation: backdrop-in 0.2s ease;
        }

        @keyframes backdrop-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        /* Landscape mode optimization */
        @media (orientation: landscape) and (max-height: 500px) {
          .mobile-bottom-bar {
            height: 48px;
          }

          .mobile-nav-button {
            flex-direction: row;
            gap: 8px;
            font-size: 12px;
          }

          .bottom-sheet {
            bottom: 48px;
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .bottom-sheet {
            transition: none;
          }

          .mobile-nav-button {
            transition: none;
          }

          .sheet-backdrop {
            animation: none;
          }
        }

        /* Safe area support for notched devices */
        @supports (padding-bottom: env(safe-area-inset-bottom)) {
          .mobile-bottom-bar {
            padding-bottom: max(8px, env(safe-area-inset-bottom));
            height: calc(64px + env(safe-area-inset-bottom));
          }

          .bottom-sheet {
            bottom: calc(64px + env(safe-area-inset-bottom));
          }
        }
      `}</style>
    </div>
  );
};
