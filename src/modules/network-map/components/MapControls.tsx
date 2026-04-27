"use client";

import React, { useCallback } from 'react';
import { Button, Card } from "@shohojdhara/atomix";
import { getMapInstance } from './MapCanvas';
import { useResponsive } from '../hooks/useResponsive';
import { useAccessibilityAnnounce } from './AccessibilityAnnouncer';

interface MapControlsProps {
  className?: string;
  position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
  showCompass?: boolean;
}

export const MapControls: React.FC<MapControlsProps> = ({
  className = '',
  position = 'top-right',
  showCompass = true
}) => {
  const { isMobile } = useResponsive();
  const { announce } = useAccessibilityAnnounce();

  const handleZoomIn = useCallback(() => {
    const map = getMapInstance();
    if (map) {
      map.zoomIn();
      announce('Map zoomed in', 'polite');
    }
  }, [announce]);

  const handleZoomOut = useCallback(() => {
    const map = getMapInstance();
    if (map) {
      map.zoomOut();
      announce('Map zoomed out', 'polite');
    }
  }, [announce]);

  const handleResetBearing = useCallback(() => {
    const map = getMapInstance();
    if (map) {
      map.resetNorth();
      announce('Map orientation reset to north', 'polite');
    }
  }, [announce]);

  const handleResetPitch = useCallback(() => {
    const map = getMapInstance();
    if (map) {
      map.resetPitch();
      announce('Map pitch reset', 'polite');
    }
  }, [announce]);

  const positionClasses = {
    'top-right': 'u-absolute u-top-4 u-end-4',
    'bottom-right': 'u-absolute u-bottom-4 u-end-4',
    'top-left': 'u-absolute u-top-4 u-start-4',
    'bottom-left': 'u-absolute u-bottom-4 u-start-4'
  };

  return (
    <div className={`map-controls ${positionClasses[position]} ${className}`}>
      <Card appearance="elevated" glass={true} className="controls-card">
        <div className="controls-grid" role="toolbar" aria-label="地图控制">
          {/* Zoom controls */}
          <div className="zoom-controls" role="group" aria-label="缩放控制">
            <Button
              variant="secondary"
              size={isMobile ? 'sm' : 'md'}
              iconName="Plus"
              onClick={handleZoomIn}
              aria-label="放大"
              className="zoom-in"
            />
            <Button
              variant="secondary"
              size={isMobile ? 'sm' : 'md'}
              iconName="Minus"
              onClick={handleZoomOut}
              aria-label="缩小"
              className="zoom-out"
            />
          </div>

          {/* Compass controls */}
          {showCompass && (
            <div className="compass-controls" role="group" aria-label="方向控制">
              <Button
                variant="secondary"
                size={isMobile ? 'sm' : 'md'}
                iconName="Compass"
                onClick={handleResetBearing}
                aria-label="重置北向"
                className="compass-reset"
              />
              <Button
                variant="secondary"
                size={isMobile ? 'sm' : 'md'}
                iconName="Navigation"
                onClick={handleResetPitch}
                aria-label="重置俯仰角"
                className="pitch-reset"
              />
            </div>
          )}
        </div>
      </Card>

      <style jsx>{`
        .map-controls {
          pointer-events: auto;
          z-index: var(--z-index-controls);
        }

        .controls-card {
          padding: var(--spacing-sm);
          background: rgba(31, 41, 55, 0.9);
          backdrop-filter: blur(8px);
        }

        .controls-grid {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }

        .zoom-controls,
        .compass-controls {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }

        /* Mobile optimization */
        @media (max-width: 768px) {
          .map-controls {
            // Adjust spacing for mobile
          }
          
          .controls-card {
            padding: var(--spacing-xs);
          }
          
          .controls-grid {
            gap: var(--spacing-xs);
          }
        }

        /* Focus and hover states for better accessibility */
        :global(.zoom-in:focus),
        :global(.zoom-out:focus),
        :global(.compass-reset:focus),
        :global(.pitch-reset:focus) {
          outline: 2px solid var(--color-primary-500);
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
};

// Enhanced controls component with bearing indicator
export const CompassControl: React.FC = () => {
  const [bearing, setBearing] = React.useState(0);

  React.useEffect(() => {
    const map = getMapInstance();
    if (!map) return;

    const updateBearing = () => {
      setBearing(map.getBearing());
    };

    map.on('rotate', updateBearing);
    updateBearing(); // Initial value

    return () => {
      map.off('rotate', updateBearing);
    };
  }, []);

  const handleResetBearing = () => {
    const map = getMapInstance();
    if (map) {
      map.resetNorth();
    }
  };

  return (
    <Button
      variant="secondary"
      size="sm"
      onClick={handleResetBearing}
      aria-label={`重置地图方向，当前角度: ${Math.round(bearing)}度`}
      className="compass-button"
    >
      <div className="compass-indicator">
        <span 
          className="compass-arrow"
          style={{ transform: `rotate(${-bearing}deg)` }}
          aria-hidden="true"
        >
          ↑
        </span>
      </div>
      
      <style jsx>{`
        .compass-indicator {
          position: relative;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .compass-arrow {
          font-size: 14px;
          font-weight: bold;
          transition: transform 0.3s ease;
          color: currentColor;
        }

        .compass-button:hover .compass-arrow {
          color: var(--color-primary-500);
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .compass-arrow {
            transition: none;
          }
        }
      `}</style>
    </Button>
  );
};