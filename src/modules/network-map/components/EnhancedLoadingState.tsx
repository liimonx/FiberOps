"use client";

import React from "react";
import { Spinner, Card } from "@shohojdhara/atomix";
import { LoadingIndicator } from "./loading/LoadingIndicator";

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
  const progressBar = showProgress && progress !== undefined && (
    <div className="u-w-100 u-mt-4">
      <div className="u-flex u-justify-between u-text-xs u-text-secondary-emphasis u-mb-2">
        <span className="u-font-bold u-text-uppercase">Progress</span>
        <span className="u-font-mono">{Math.round(progress)}%</span>
      </div>
      <div className="u-progress-track">
        <div
          className="u-progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );

  if (variant === "overlay") {
    return (
      <div
        className="u-overlay-center u-bg-black-opacity-50"
        aria-busy="true"
        aria-label={message}
      >
        <Card className="u-p-8 u-shadow-xl">
          <LoadingIndicator
            message={message}
            subMessage={subMessage}
            size={size}
            aria-label={message}
          />
          {progressBar}
        </Card>
      </div>
    );
  }

  if (variant === "fullscreen") {
    return (
      <div
        className="u-fixed u-inset-0 u-flex u-items-center u-justify-center u-bg-dark u-z-modal"
        aria-busy="true"
        aria-label={message}
      >
        <div className="u-flex u-flex-column u-items-center u-gap-6">
          <Spinner size="lg" variant="primary" aria-label={message} />
          <div className="u-text-center">
            <h2 className="u-m-0 u-text-xxl u-font-bold u-text-uppercase">
              {message}
            </h2>
            {subMessage && (
              <p className="u-mt-2 u-mb-0 u-text-sm u-text-secondary-emphasis">
                {subMessage}
              </p>
            )}
          </div>
          {showProgress && progress !== undefined && (
            <div className="u-progress-track u-w-64">
              <div
                className="u-progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  if (variant === "minimal" || !showSpinner) {
    return (
      <div
        className={`u-flex u-items-center u-justify-center u-p-2 ${className}`}
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <span className="u-text-sm u-font-bold">{message}</span>
      </div>
    );
  }

  return (
    <div
      className={`u-flex u-items-center u-justify-center u-p-4 ${className}`}
      aria-busy="true"
    >
      <div className="u-flex u-flex-column u-items-center">
        <LoadingIndicator
          message={message}
          subMessage={subMessage}
          size={size}
          aria-label={message}
        />
        {progressBar}
      </div>
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
