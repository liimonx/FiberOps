"use client";

import React, { useEffect, useState, useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { useViewport } from "../stores/useNetworkMapStore";
import { withErrorBoundary } from "./ErrorBoundary";
import { sanitizeSearchQuery } from "../utils/sanitization";

/**
 * MapOverlayAesthetics component adds high-fidelity visual effects
 * to the map, creating a premium "command center" aesthetic.
 */
const MapOverlayAestheticsBase: React.FC = () => {
  const viewport = useViewport();
  const [timestamp, setTimestamp] = useState("");
  const scanlineRef = useRef<HTMLDivElement>(null);

  // Update HUD timestamp periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setTimestamp(new Date().toISOString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // GSAP animation for the scanning line
  useGSAP(
    () => {
      if (scanlineRef.current) {
        gsap.to(scanlineRef.current, {
          top: "100%",
          duration: 8,
          ease: "none",
          repeat: -1,
        });
      }
    },
    { dependencies: [], scope: scanlineRef }
  );

  return (
    <div className="u-absolute u-inset-0 u-pointer-events-none u-z-0 u-overflow-hidden">
      {/* 1. Pulsing Neural Grid */}
      <div className="u-absolute u-inset-0 u-grid-overlay u-opacity-20" />

      {/* 2. Moving Scanline */}
      <div
        ref={scanlineRef}
        className="u-absolute u-w-100 u-h-32 u-bg-gradient-to-b u-from-transparent u-via-primary-subtle u-to-transparent u-opacity-10 u-top-0"
        style={{ height: "150px" }}
      />

      {/* 3. Vignette Overlay */}
      <div className="u-absolute u-inset-0 u-map-vignette" />

      {/* 4. Decorative HUD Corners */}
      <div className="u-corner-bracket u-corner-tl" />
      <div className="u-corner-bracket u-corner-tr" />
      <div className="u-corner-bracket u-corner-bl" />
      <div className="u-corner-bracket u-corner-br" />

      {/* 5. Dynamic Data Feed (Bottom Right) */}
      <div className="u-absolute u-bottom-4 u-end-24 u-text-xs u-font-mono u-text-primary u-opacity-40 u-flex u-flex-column u-items-end u-gap-1">
        <div>SYSTEM STATUS: OPTIMAL</div>
        <div>LAT: {viewport.center.lat.toFixed(6)}</div>
        <div>LNG: {viewport.center.lng.toFixed(6)}</div>
        <div>ZOOM: {viewport.zoom.toFixed(2)}</div>
        <div>{sanitizeSearchQuery(timestamp)}</div>
      </div>

      {/* 6. Active Region Label (Top Center) */}
      <div className="u-absolute u-top-4 u-start-50 u-transform-center-x">
        <div className="u-px-4 u-py-1 u-bg-dark-opacity-50 u-backdrop-blur-sm u-border u-border-solid u-border-primary-subtle u-rounded-pill u-text-xs u-font-bold u-text-primary u-tracking-widest u-opacity-60">
          NEURAL NETWORK MAP // SECTOR_ALPHA_01
        </div>
      </div>
    </div>
  );
};

export const MapOverlayAesthetics = withErrorBoundary(MapOverlayAestheticsBase, {
  fallback: (
    <div className="u-absolute u-inset-0 u-pointer-events-none u-border u-border-dashed u-border-error u-opacity-20" />
  ),
});
