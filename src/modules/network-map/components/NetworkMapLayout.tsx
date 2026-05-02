"use client";

import React from "react";
import { Card } from "@shohojdhara/atomix";

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
  mobileControls,
}) => {
  return (
    <div
      className="u-relative u-w-100 u-h-100 u-overflow-hidden"
      role="application"
      aria-label="Network Map"
    >
      {/* Skip link for keyboard users */}
      <a
        href="#map-main-content"
        className="u-absolute u-z-modal u-bg-primary  u-px-4 u-py-2 u-text-sm u-font-bold u-rounded-bottom u-transition-all"
        style={{ top: "-100px", left: "20px" }}
      >
        Skip to map content
      </a>

      {/* Map canvas - always full screen */}
      <main
        id="map-main-content"
        className="u-absolute u-inset-0 u-w-100 u-h-100"
        role="region"
        aria-label="Interactive network map"
      >
        {mapComponent}
      </main>

      {/* Desktop layout */}
      <div
        className="u-absolute u-inset-0 u-w-100 u-h-100 u-pointer-events-none u-display-none u-display-md-block"
        role="presentation"
      >
        {/* Top left - Search panel */}
        <nav
          className="u-absolute u-top-4 u-start-4 u-w-80 u-pointer-events-auto"
          aria-label="Search"
        >
          <Card glass={true} className="u-p-0 u-shadow-xl">
            {searchPanel}
          </Card>
        </nav>

        {/* Top right - Toolbar */}
        <aside
          className="u-absolute u-top-4 u-end-4 u-pointer-events-auto"
          aria-label="Tools"
        >
          {toolbar}
        </aside>

        {/* Bottom left - Layer controls */}
        <aside
          className="u-absolute u-bottom-4 u-start-4 u-pointer-events-auto"
          aria-label="Layer controls"
        >
          <Card glass={true} className="u-p-0 u-shadow-xl" style={{ width: "240px" }}>
            {layerControls}
          </Card>
        </aside>

        {/* Right side - Inspector panel */}
        <aside
          className="u-absolute u-top-20 u-end-4 u-w-80 u-pointer-events-auto"
          aria-label="Inspector details"
        >
          {inspectorPanel}
        </aside>
      </div>

      {/* Mobile layout */}
      <div
        className="u-absolute u-bottom-0 u-start-0 u-w-100 u-pointer-events-auto u-display-block u-display-md-none"
        role="presentation"
      >
        {mobileControls}
      </div>

      <style jsx>{`
        a:focus {
          top: 0 !important;
          outline: 2px solid white;
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
};
