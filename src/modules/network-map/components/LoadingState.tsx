"use client";

import React from "react";
import { Icon, Card } from "@shohojdhara/atomix";

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
  const sizeMap = {
    sm: { icon: 16, text: "u-text-xs" },
    md: { icon: 24, text: "u-text-sm" },
    lg: { icon: 32, text: "u-text-base" },
  };

  const currentSize = sizeMap[size];

  const content = (
    <div className={`u-flex u-items-center u-justify-center u-gap-3 ${className}`}>
      {showSpinner && (
        <Icon name="SpinnerGap" size={currentSize.icon} className=" u-animate-spin" />
      )}
      <span className={`${currentSize.text} u-font-bold `}>{message}</span>
    </div>
  );

  if (variant === "overlay") {
    return (
      <div className="u-absolute u-inset-0 u-flex u-items-center u-justify-center u-z-modal">
        <Card glass={true} className="u-p-6 u-shadow-lg">
          {content}
        </Card>
      </div>
    );
  }

  if (variant === "fullscreen") {
    return (
      <div className="u-fixed u-inset-0 u-flex u-items-center u-justify-center u-bg-dark u-z-modal">
        <div className="u-flex u-flex-column u-items-center u-gap-4">
          <Icon name="SpinnerGap" size={48} className=" u-animate-spin" />
          <span
            className="u-text-lg u-font-bold  u-text-uppercase"
            style={{ letterSpacing: "2px" }}
          >
            {message}
          </span>
        </div>
      </div>
    );
  }

  return content;
};

export const SkeletonLoader: React.FC<{
  width?: string;
  height?: string;
  variant?: "text" | "rect" | "circle";
  className?: string;
}> = ({ width = "100%", height = "1rem", variant = "rect", className = "" }) => {
  const variantClasses = {
    text: "u-rounded-sm",
    rect: "u-rounded",
    circle: "u-rounded-circle",
  };

  return (
    <div
      className={`u-bg-white-opacity-5 u-animate-pulse ${variantClasses[variant]} ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
};
