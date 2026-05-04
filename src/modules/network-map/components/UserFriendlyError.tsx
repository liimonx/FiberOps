"use client";

import React, { useEffect, useState } from "react";
import { Icon, Button, Card, PhosphorIconsType } from "@shohojdhara/atomix";
import {
  ErrorType,
  AppError,
  classifyError,
  errorMessages,
  OfflineDetector,
} from "../utils/errorHandler";

interface UserFriendlyErrorProps {
  error?: unknown;
  title?: string;
  message?: string;
  onRetry?: () => void;
  onGoHome?: () => void;
  showRetry?: boolean;
  showHome?: boolean;
  variant?: "inline" | "overlay" | "fullscreen";
  className?: string;
}

export function UserFriendlyError({
  error,
  title,
  message,
  onRetry,
  onGoHome,
  showRetry = true,
  showHome = true,
  variant = "inline",
  className = "",
}: UserFriendlyErrorProps) {
  const [appError, setAppError] = useState<AppError | null>(null);
  const [isOffline, setIsOffline] = useState(!OfflineDetector.isCurrentlyOnline());

  useEffect(() => {
    if (error) {
      setAppError(classifyError(error));
    } else if (title && message) {
      setAppError({
        type: ErrorType.UNKNOWN,
        message: title,
        userMessage: message,
        retryable: !!onRetry,
        timestamp: new Date(),
      });
    }
  }, [error, title, message, onRetry]);

  useEffect(() => {
    const unsubscribe = OfflineDetector.onStatusChange(setIsOffline);
    return unsubscribe;
  }, []);

  const errorConfig = appError
    ? errorMessages[appError.type]
    : errorMessages[ErrorType.UNKNOWN];

  const getIcon = () => {
    if (isOffline) return "WifiSlash";
    switch (appError?.type) {
      case ErrorType.NETWORK:
        return "WifiSlash";
      case ErrorType.TIMEOUT:
        return "Clock";
      case ErrorType.AUTHENTICATION:
        return "Lock";
      case ErrorType.AUTHORIZATION:
        return "Prohibit";
      case ErrorType.NOT_FOUND:
        return "FileX";
      case ErrorType.SERVER:
        return "HardDrives";
      default:
        return "Warning";
    }
  };

  const content = (
    <Card
      glass={true}
      className={`u-text-center ${variant === "inline" ? "u-p-6" : variant === "overlay" ? "u-p-8 u-max-w-md" : "u-p-12 u-max-w-lg"} u-bg-white-opacity-5`}
    >
      <div className="u-mb-6">
        <div
          className={`u-inline-flex u-items-center u-justify-center u-w-20 u-h-20 u-rounded-circle u-bg-white-opacity-5 u-border u-border-solid u-shadow-lg ${isOffline ? "u-border-error" : "u-border-warning"}`}
        >
          <Icon
            name={getIcon() as PhosphorIconsType}
            size={40}
            className={isOffline ? "u-text-error" : "u-text-warning"}
          />
        </div>
      </div>

      <h2 className="u-m-0 u-text-xl u-font-bold u-text-uppercase u-mb-2">
        {title || errorConfig.title}
      </h2>

      <p className="u-text-sm u-text-secondary-emphasis u-mb-8 u-leading-normal">
        {message || appError?.userMessage || errorConfig.description}
      </p>

      {isOffline && (
        <div className="u-mb-8 u-p-3 u-bg-error-subtle u-border u-border-solid u-border-error u-rounded u-animate-pulse">
          <div className="u-flex u-items-center u-justify-center u-gap-2 u-text-xs u-font-bold u-text-error u-text-uppercase">
            <Icon name="WifiSlash" size={16} />
            <span>Connection Offline</span>
          </div>
        </div>
      )}

      <div className="u-flex u-gap-3 u-justify-center u-flex-wrap">
        {showRetry && onRetry && (
          <Button
            variant="primary"
            onClick={onRetry}
            iconName="ArrowsCounterClockwise"
            disabled={isOffline}
          >
            {errorConfig.action}
          </Button>
        )}

        {showHome && onGoHome && (
          <Button variant="secondary" onClick={onGoHome} iconName="House">
            Go Home
          </Button>
        )}

        {!onRetry && !onGoHome && (
          <Button
            variant="primary"
            onClick={() => window.location.reload()}
            iconName="ArrowsCounterClockwise"
          >
            Reload Page
          </Button>
        )}
      </div>

      {process.env.NODE_ENV === "development" && appError && (
        <details className="u-mt-8 u-text-start u-opacity-60">
          <summary className="u-text-xs u-font-bold u-text-secondary-emphasis u-cursor-pointer">
            Diagnostic Info
          </summary>
          <div className="u-mt-2 u-p-4 u-bg-black-opacity-20 u-rounded u-text-xs u-font-mono u-text-error u-overflow-auto u-max-h-48">
            <pre className="u-m-0">{JSON.stringify(appError, null, 2)}</pre>
          </div>
        </details>
      )}
    </Card>
  );

  if (variant === "fullscreen") {
    return (
      <div
        className="u-fixed u-inset-0 u-flex u-items-center u-justify-center u-bg-dark u-z-modal u-p-6"
        role="alert"
      >
        {content}
      </div>
    );
  }

  if (variant === "overlay") {
    return (
      <div
        className="u-absolute u-inset-0 u-flex u-items-center u-justify-center u-z-modal u-bg-black-opacity-50 u-backdrop-blur-sm u-p-6"
        role="alert"
      >
        {content}
      </div>
    );
  }

  return (
    <div className={`u-w-100 ${className}`} role="alert">
      {content}
    </div>
  );
}

export function InlineErrorMessage({
  error,
  message,
  onRetry,
  compact = false,
  className = "",
}: {
  error?: unknown;
  message?: string;
  onRetry?: () => void;
  compact?: boolean;
  className?: string;
}) {
  const appError = error ? classifyError(error) : null;

  return (
    <div
      className={`u-flex u-items-center u-gap-3 u-p-3 u-rounded u-bg-error-subtle u-border u-border-solid u-border-error ${className}`}
      role="alert"
    >
      <Icon name="Warning" size={compact ? 16 : 20} className="u-text-error" />
      <div className="u-flex-1">
        <p
          className={`u-m-0 u-text-error u-font-bold ${compact ? "u-text-xs" : "u-text-xs"}`}
        >
          {message || appError?.userMessage || "An error occurred"}
        </p>
      </div>
      {onRetry && !compact && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onRetry}
          iconName="ArrowsCounterClockwise"
          className="u-bg-transparent u-border-0  u-p-0 hover:u-bg-transparent"
        >
          Retry
        </Button>
      )}
    </div>
  );
}

export function ErrorToast({
  error,
  onClose,
  duration = 5000,
}: {
  error: unknown;
  onClose: () => void;
  duration?: number;
}) {
  const appError = classifyError(error);

  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className="u-fixed u-bottom-6 u-end-6 u-z-tooltip u-animate-slide-in-right">
      <Card glass={true} className="u-p-4 u-min-w-xs u-border-error u-bg-error-subtle">
        <div className="u-flex u-items-start u-gap-3">
          <div className="u-flex-shrink-0 u-mt-1">
            <Icon name="WarningCircle" size={20} className="u-text-error" />
          </div>
          <div className="u-flex-1">
            <h4 className="u-m-0 u-text-sm u-font-bold  u-mb-1">Error Detected</h4>
            <p className="u-m-0 u-text-xs u-text-secondary-emphasis">
              {appError.userMessage}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            iconName="X"
            iconOnly
            onClick={onClose}
            className="u-opacity-50 hover:u-opacity-100"
          />
        </div>
        <div
          className="u-absolute u-bottom-0 u-start-0 u-h-1 u-bg-error u-w-100"
          style={{
            animationName: "shrinkWidth",
            animationDuration: `${duration}ms`,
            animationTimingFunction: "linear",
            animationFillMode: "forwards",
          }}
        />
      </Card>
    </div>
  );
}

export function RetryWithCountdown({
  onRetry,
  countdownSeconds = 10,
}: {
  onRetry: () => void;
  countdownSeconds?: number;
}) {
  const [secondsLeft, setSecondsLeft] = useState(countdownSeconds);

  useEffect(() => {
    if (secondsLeft <= 0) {
      onRetry();
      return;
    }
    const timer = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft, onRetry]);

  return (
    <div className="u-flex u-flex-column u-items-center u-gap-4">
      <div className="u-relative u-w-16 u-h-16 u-flex u-items-center u-justify-center">
        <svg className="u-absolute u-inset-0 u-w-100 u-h-100" viewBox="0 0 36 36">
          <circle
            className="u-text-secondary-emphasis u-opacity-10"
            stroke="currentColor"
            strokeWidth="3"
            fill="transparent"
            r="16"
            cx="18"
            cy="18"
          />
          <circle
            className=" u-transition-all"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray="100"
            strokeDashoffset={100 - (secondsLeft / countdownSeconds) * 100}
            strokeLinecap="round"
            fill="transparent"
            r="16"
            cx="18"
            cy="18"
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <span className="u-text-lg u-font-bold ">{secondsLeft}</span>
      </div>
      <div className="u-text-center">
        <p className="u-m-0 u-text-sm u-text-secondary-emphasis u-mb-4">
          Retrying connection in {secondsLeft} seconds...
        </p>
        <Button variant="secondary" onClick={onRetry} iconName="ArrowsCounterClockwise">
          Retry Now
        </Button>
      </div>
    </div>
  );
}
