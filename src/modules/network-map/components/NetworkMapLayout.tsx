"use client";

import React from 'react';
import { Card } from "@shohojdhara/atomix";
import { RESPONSIVE_BREAKPOINTS } from '../constants';

interface NetworkMapLayoutProps {
  mapComponent: React.ReactNode;
  searchPanel: React.ReactNode;
  toolbar: React.ReactNode;
  layerControls: React.ReactNode;
  inspectorPanel: React.ReactNode;
  mobileControls?: React.ReactNode;
}

export const NetworkMapLayout: React.FC<NetworkMapLayoutProps> = ({
  mapComponent,
  searchPanel,
  toolbar,
  layerControls,
  inspectorPanel,
  mobileControls
}) => {
  return (
    <div className="network-map-layout" role="application" aria-label="Network Map">
      {/* Skip link for keyboard users */}
      <a href="#map-main-content" className="skip-link">
        Skip to map content
      </a>

      {/* Map canvas - always full screen */}
      <main id="map-main-content" className="map-container" role="region" aria-label="Interactive network map">
        {mapComponent}
      </main>

      {/* Desktop layout */}
      <div className="desktop-controls hidden md:block" role="presentation">
        {/* Top left - Search panel */}
        <nav className="search-panel" aria-label="Search">
          <Card appearance="elevated" glass={true} className="search-card">
            {searchPanel}
          </Card>
        </nav>

        {/* Top right - Toolbar */}
        <aside className="toolbar-panel" aria-label="Tools">
          {toolbar}
        </aside>

        {/* Bottom left - Layer controls */}
        <aside className="layer-controls-panel" aria-label="Layer controls">
          <Card appearance="elevated" glass={true} className="layer-card">
            {layerControls}
          </Card>
        </aside>

        {/* Right side - Inspector panel */}
        <aside className="inspector-panel" aria-label="Inspector details">
          {inspectorPanel}
        </aside>
      </div>

      {/* Mobile layout */}
      <div className="mobile-controls md:hidden" role="presentation">
        {mobileControls}
      </div>

      <style jsx>{`
        .network-map-layout {
          position: relative;
          width: 100%;
          height: 100vh;
          overflow: hidden;
        }

        .skip-link {
          position: absolute;
          top: -40px;
          left: 0;
          background: var(--color-primary-500);
          color: white;
          padding: 8px 16px;
          z-index: 10000;
          text-decoration: none;
          font-size: 14px;
          font-weight: var(--font-weight-medium);
          border-radius: 0 0 4px 0;
          transition: top 0.2s ease;
        }

        .skip-link:focus {
          top: 0;
          outline: 2px solid white;
          outline-offset: 2px;
        }

        .map-container {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        .desktop-controls {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .search-panel {
          position: absolute;
          top: 16px;
          left: 16px;
          width: 320px;
          pointer-events: auto;
        }

        .toolbar-panel {
          position: absolute;
          top: 16px;
          right: 16px;
          pointer-events: auto;
        }

        .layer-controls-panel {
          position: absolute;
          bottom: 16px;
          left: 16px;
          pointer-events: auto;
        }

        .inspector-panel {
          position: absolute;
          top: 16px;
          right: 16px;
          width: 320px;
          pointer-events: auto;
        }

        .mobile-controls {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          pointer-events: auto;
        }

        .search-card {
          width: 100%;
          max-width: 320px;
        }

        .layer-card {
          width: 240px;
        }

        @media (max-width: ${RESPONSIVE_BREAKPOINTS.TABLET}px) {
          .search-panel {
            width: 280px;
          }
          
          .inspector-panel {
            width: 280px;
          }
        }

        @media (max-width: ${RESPONSIVE_BREAKPOINTS.MOBILE}px) {
          .search-panel,
          .inspector-panel {
            width: calc(100% - 32px);
            max-width: none;
          }
        }
      `}</style>
    </div>
  );
};