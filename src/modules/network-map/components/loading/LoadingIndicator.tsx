"use client";

import { Spinner } from "@shohojdhara/atomix";

export type LoadingIndicatorSize = "sm" | "md" | "lg";
export type LoadingIndicatorLayout = "vertical" | "horizontal";

export interface LoadingIndicatorProps {
  message?: string;
  subMessage?: string;
  size?: LoadingIndicatorSize;
  layout?: LoadingIndicatorLayout;
  "aria-label"?: string;
  className?: string;
}

const SPINNER_SIZES: Record<LoadingIndicatorSize, "sm" | "md" | "lg"> = {
  sm: "sm",
  md: "md",
  lg: "lg",
};

const MESSAGE_SIZE_CLASSES: Record<LoadingIndicatorSize, string> = {
  sm: "u-text-xs",
  md: "u-text-sm",
  lg: "u-text-base",
};

export function LoadingIndicator({
  message = "Loading...",
  subMessage,
  size = "md",
  layout = "vertical",
  "aria-label": ariaLabel,
  className = "",
}: LoadingIndicatorProps) {
  const label = ariaLabel ?? message;
  const isHorizontal = layout === "horizontal";

  return (
    <div
      className={`u-flex u-items-center ${
        isHorizontal ? "u-flex-row u-gap-4" : "u-flex-column u-gap-3"
      } ${className}`}
      aria-busy="true"
    >
      <Spinner
        size={SPINNER_SIZES[size]}
        variant="primary"
        aria-label={label}
      />

      <div className={isHorizontal ? "" : "u-text-center"}>
        <p
          className={`u-m-0 u-font-bold ${MESSAGE_SIZE_CLASSES[size]}`}
        >
          {message}
        </p>

        {subMessage && (
          <p className="u-m-0 u-mt-1 u-text-xs u-text-secondary-emphasis u-opacity-70">
            {subMessage}
          </p>
        )}
      </div>
    </div>
  );
}
