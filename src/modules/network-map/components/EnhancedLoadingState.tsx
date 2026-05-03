"use client";

import React from "react";
import { Icon, Card } from "@shohojdhara/atomix";

interface EnhancedLoadingStateProps {
  message?: string;
  subMessage?: string;
  variant?: "inline" | "overlay" | "fullscreen" | "minimal";
  size?: "sm" | "md" | "lg";
  showSpinner?: boolean;
  showProgress?: boolean;
  progress?: number;
  className?: string;
}

export function EnhancedLoadingState({
  message = "Loading...",
  subMessage,
  variant = "inline",
  size = "md",
  showSpinner = true,
  showProgress = false,
  progress,
  className = "",
}: EnhancedLoadingStateProps) {
  const spinnerSizes = {
    sm: 24,
    md: 32,
    lg: 48,
  };

  const content = (
    <div className="u-flex u-flex-column u-items-center u-gap-3">
      {showSpinner && (
        <Icon name="SpinnerGap" size={spinnerSizes[size]} className=" u-animate-spin" />
      )}

      <div className="u-text-center">
        <span
          className={`u-text-${size === "sm" ? "xs" : size === "lg" ? "base" : "sm"} u-font-bold `}
        >
          {message}
          <span className="u-animate-pulse">...</span>
        </span>

        {subMessage && (
          <p className="u-text-xs u-text-secondary-emphasis u-mt-1 u-opacity-70">
            {subMessage}
          </p>
        )}
      </div>

      {showProgress && progress !== undefined && (
        <div className="u-w-100 u-mt-4" style={{ minWidth: "200px" }}>
          <div className="u-flex u-justify-between u-text-xs u-text-secondary-emphasis u-mb-2">
            <span
              className="u-font-bold u-text-uppercase"
              style={{ fontSize: "10px", letterSpacing: "1px" }}
            >
              Progress
            </span>
            <span className="u-font-mono">{Math.round(progress)}%</span>
          </div>
          <div className="u-w-100 u-h-1 u-bg-white-opacity-10 u-rounded-pill u-overflow-hidden">
            <div
              className="u-h-100 u-bg-primary u-transition-all u-duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );

  if (variant === "overlay") {
    return (
      <div className="u-absolute u-inset-0 u-flex u-items-center u-justify-center u-z-modal u-bg-black-opacity-20 u-backdrop-blur-sm">
        <Card glass={true} className="u-p-8 u-shadow-xl">
          {content}
        </Card>
      </div>
    );
  }

  if (variant === "fullscreen") {
    return (
      <div className="u-fixed u-inset-0 u-flex u-items-center u-justify-center u-bg-dark u-z-modal">
        <div className="u-flex u-flex-column u-items-center u-gap-6">
          <Icon name="SpinnerGap" size={64} className=" u-animate-spin" />
          <div className="u-text-center">
            <h2
              className="u-m-0 u-text-xxl u-font-bold  u-text-uppercase"
              style={{ letterSpacing: "4px" }}
            >
              {message}
            </h2>
            {subMessage && (
              <p className="u-mt-2 u-text-sm u-text-secondary-emphasis">{subMessage}</p>
            )}
          </div>
          {showProgress && progress !== undefined && (
            <div className="u-w-64 u-h-1 u-bg-white-opacity-10 u-rounded-pill u-overflow-hidden">
              <div
                className="u-h-100 u-bg-primary u-transition-all u-duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`u-flex u-items-center u-justify-center ${variant === "inline" ? "u-p-4" : "u-p-2"} ${className}`}
      role="status"
    >
      {content}
    </div>
  );
}

// Skeleton loader with animation
export function AnimatedSkeletonLoader({
  variant = "text",
  width,
  height,
  count = 1,
  className = "",
}: {
  variant?: "text" | "circle" | "rectangle" | "card";
  width?: string | number;
  height?: string | number;
  count?: number;
  className?: string;
}) {
  const variantClasses = {
    text: "u-rounded-sm u-mb-2",
    circle: "u-rounded-circle",
    rectangle: "u-rounded",
    card: "u-rounded u-p-4 u-bg-white-opacity-5 u-border u-border-solid u-border-secondary-subtle",
  };

  return (
    <div className={`u-flex u-flex-column ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`u-bg-white-opacity-5 u-animate-pulse ${variantClasses[variant]} u-relative u-overflow-hidden`}
          style={{
            width: width || (variant === "text" ? "100%" : undefined),
            height:
              height ||
              (variant === "text" ? "12px" : variant === "circle" ? "40px" : "100px"),
          }}
        >
          {variant === "card" && (
            <div className="u-flex u-flex-column u-gap-3">
              <div className="u-w-40 u-h-4 u-bg-white-opacity-10 u-rounded" />
              <div className="u-w-100 u-h-2 u-bg-white-opacity-5 u-rounded" />
              <div className="u-w-80 u-h-2 u-bg-white-opacity-5 u-rounded" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
