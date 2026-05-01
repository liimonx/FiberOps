"use client";

import React from "react";
import { Icon } from "@shohojdhara/atomix";

interface LoadingStateProps {
  message?: string;
  variant?: "inline" | "overlay" | "fullscreen";
  size?: "sm" | "md" | "lg";
  showSpinner?: boolean;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Loading...",
  variant = "inline",
  size = "md",
  showSpinner = true,
  className = "",
}) => {
  const sizeClasses = {
    sm: "u-text-sm",
    md: "u-text-base",
    lg: "u-text-lg",
  };

  const spinnerSizes = {
    sm: 16,
    md: 24,
    lg: 32,
  };

  return (
    <div
      className={`loading-state loading-state--${variant} ${className}`}
      role="status"
      aria-live="polite"
    >
      {showSpinner && (
        <div className="loading-spinner" aria-hidden="true">
          <Icon name="SpinnerGap" size={spinnerSizes[size]} className="spinning" />
        </div>
      )}

      <span className={`loading-message ${sizeClasses[size]}`}>{message}</span>

      <style jsx>{`
        .loading-state {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-md);
          color: var(--color-gray-400);
        }

        .loading-state--inline {
          padding: var(--spacing-md);
        }

        .loading-state--overlay {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: rgba(0, 0, 0, 0.8);
          border-radius: var(--border-radius-md);
          padding: var(--spacing-xl);
          z-index: var(--z-index-modal);
        }

        .loading-state--fullscreen {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: var(--color-map-background);
          z-index: var(--z-index-modal);
          flex-direction: column;
        }

        .loading-spinner {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        .loading-message {
          font-weight: var(--font-weight-medium);
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .spinning {
            animation: none;
          }

          .loading-spinner :global(svg) {
            opacity: 0.7;
          }
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
          .loading-state {
            color: #000000;
            background: #ffffff;
            border: 2px solid #000000;
          }
        }
      `}</style>
    </div>
  );
};

export const SkeletonLoader: React.FC<{
  width?: string;
  height?: string;
  variant?: "text" | "rect" | "circle";
  className?: string;
}> = ({ width = "100%", height = "1rem", variant = "rect", className = "" }) => {
  return (
    <div
      className={`skeleton skeleton--${variant} ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    >
      <style jsx>{`
        .skeleton {
          background: linear-gradient(
            90deg,
            var(--color-gray-600) 0%,
            var(--color-gray-500) 50%,
            var(--color-gray-600) 100%
          );
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
          border-radius: var(--border-radius-sm);
        }

        .skeleton--text {
          height: 1rem;
          border-radius: 4px;
        }

        .skeleton--rect {
          border-radius: var(--border-radius-md);
        }

        .skeleton--circle {
          border-radius: 50%;
        }

        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .skeleton {
            animation: none;
            background: var(--color-gray-600);
          }
        }
      `}</style>
    </div>
  );
};
