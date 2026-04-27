"use client";

import React, { useEffect, useState } from 'react';
import { Icon, Button, Card } from '@shohojdhara/atomix';
import { 
  AlertTriangle, 
  WifiOff, 
  Clock, 
  Lock, 
  Ban, 
  FileX, 
  ServerCrash,
  RefreshCw,
  Home,
  Bug
} from 'lucide-react';
import { ErrorType, AppError, classifyError, errorMessages, OfflineDetector } from '../utils/errorHandler';
import { fadeIn, shake } from '../utils/animations';

interface UserFriendlyErrorProps {
  error?: any;
  title?: string;
  message?: string;
  onRetry?: () => void;
  onGoHome?: () => void;
  showRetry?: boolean;
  showHome?: boolean;
  variant?: 'inline' | 'overlay' | 'fullscreen';
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
  variant = 'inline',
  className = ''
}: UserFriendlyErrorProps) {
  const [appError, setAppError] = useState<AppError | null>(null);
  const [isOffline, setIsOffline] = useState(!OfflineDetector.isCurrentlyOnline());
  const cardRef = React.useRef<HTMLDivElement>(null);

  // Classify the error
  useEffect(() => {
    if (error) {
      const classified = classifyError(error);
      setAppError(classified);
      
      // Animate error appearance
      if (cardRef.current) {
        shake(cardRef.current, { distance: 5, duration: 0.4 });
      }
    } else if (title && message) {
      // Create custom error from props
      setAppError({
        type: ErrorType.UNKNOWN,
        message: title,
        userMessage: message,
        retryable: !!onRetry,
        timestamp: new Date()
      });
    }
  }, [error, title, message, onRetry]);

  // Listen for online/offline status
  useEffect(() => {
    const unsubscribe = OfflineDetector.onStatusChange(setIsOffline);
    return unsubscribe;
  }, []);

  // Get error configuration
  const errorConfig = appError ? errorMessages[appError.type] : errorMessages[ErrorType.UNKNOWN];
  
  // Determine icon based on error type
  const getIcon = () => {
    if (isOffline) return WifiOff;
    
    switch (appError?.type) {
      case ErrorType.NETWORK:
        return WifiOff;
      case ErrorType.TIMEOUT:
        return Clock;
      case ErrorType.AUTHENTICATION:
        return Lock;
      case ErrorType.AUTHORIZATION:
        return Ban;
      case ErrorType.NOT_FOUND:
        return FileX;
      case ErrorType.SERVER:
        return ServerCrash;
      default:
        return AlertTriangle;
    }
  };

  const IconComponent = getIcon();

  // Variant styles
  const variantClasses = {
    inline: 'u-p-6 u-max-w-full',
    overlay: 'u-p-8 u-shadow-2xl u-max-w-md',
    fullscreen: 'u-p-12 u-min-h-screen u-flex u-items-center u-justify-center'
  };

  return (
    <div
      ref={cardRef}
      className={`error-container ${variant === 'fullscreen' ? 'u-fixed u-inset-0 u-z-50 u-bg-dark/95 u-backdrop-blur-sm' : ''} ${className}`}
      role="alert"
      aria-live="assertive"
    >
      <Card 
        appearance="elevated" 
        glass={true} 
        className={`${variantClasses[variant]} u-text-center`}
      >
        {/* Icon */}
        <div className="u-mb-4">
          <div 
            className="u-inline-flex u-items-center u-justify-center u-rounded-full"
            style={{
              width: '80px',
              height: '80px',
              backgroundColor: isOffline ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
              border: `2px solid ${isOffline ? '#EF4444' : '#F59E0B'}`
            }}
          >
            <IconComponent 
              size={40} 
              color={isOffline ? '#EF4444' : '#F59E0B'} 
            />
          </div>
        </div>

        {/* Title */}
        <h2 className="u-fs-xl u-font-bold u-mb-2 u-text-white">
          {title || errorConfig.title}
        </h2>

        {/* Message */}
        <p className="u-fs-sm u-text-secondary-subtle u-mb-6 u-leading-relaxed">
          {message || appError?.userMessage || errorConfig.description}
        </p>

        {/* Offline indicator */}
        {isOffline && (
          <div 
            className="u-mb-6 u-p-3 u-rounded u-bg-danger-subtle u-border u-border-danger"
            style={{ animation: 'pulse-active 2s infinite' }}
          >
            <div className="u-flex u-items-center u-justify-center u-gap-2 u-fs-xs u-text-danger">
              <WifiOff size={16} />
              <span>You are currently offline</span>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="u-flex u-gap-3 u-justify-center u-flex-wrap">
          {showRetry && onRetry && (
            <Button
              variant="primary"
              onClick={() => {
                onRetry();
                if (cardRef.current) {
                  fadeIn(cardRef.current, { duration: 0.3 });
                }
              }}
              iconName="RefreshCw"
              disabled={isOffline}
            >
              {errorConfig.action}
            </Button>
          )}

          {showHome && onGoHome && (
            <Button
              variant="secondary"
              onClick={onGoHome}
              iconName="Home"
            >
              Go Home
            </Button>
          )}

          {!onRetry && !onGoHome && (
            <Button
              variant="primary"
              onClick={() => window.location.reload()}
              iconName="RefreshCw"
            >
              Reload Page
            </Button>
          )}
        </div>

        {/* Technical details (development only) */}
        {process.env.NODE_ENV === 'development' && appError && (
          <details className="u-mt-6 u-text-left">
            <summary className="u-cursor-pointer u-fs-xs u-text-secondary-subtle u-mb-2">
              Technical Details (Development)
            </summary>
            <div className="u-bg-dark u-p-3 u-rounded u-fs-2xs u-font-mono u-text-danger u-overflow-auto u-max-h-48">
              <div><strong>Type:</strong> {appError.type}</div>
              <div><strong>Message:</strong> {appError.message}</div>
              {appError.code && <div><strong>Code:</strong> {appError.code}</div>}
              <div><strong>Time:</strong> {appError.timestamp.toLocaleTimeString()}</div>
              {appError.details && (
                <pre className="u-mt-2 u-whitespace-pre-wrap">
                  {JSON.stringify(appError.details, null, 2)}
                </pre>
              )}
            </div>
          </details>
        )}
      </Card>
    </div>
  );
}

// Inline error message component
interface InlineErrorMessageProps {
  error?: any;
  message?: string;
  onRetry?: () => void;
  compact?: boolean;
  className?: string;
}

export function InlineErrorMessage({
  error,
  message,
  onRetry,
  compact = false,
  className = ''
}: InlineErrorMessageProps) {
  const appError = error ? classifyError(error) : null;

  return (
    <div 
      className={`u-flex u-items-start u-gap-3 u-p-3 u-rounded u-bg-danger-subtle u-border u-border-danger ${className}`}
      role="alert"
    >
      <AlertTriangle className="u-text-danger u-flex-shrink-0 u-mt-0.5" size={compact ? 16 : 20} />
      
      <div className="u-flex-grow">
        <p className={`u-text-danger ${compact ? 'u-fs-2xs' : 'u-fs-xs'}`}>
          {message || appError?.userMessage || 'An error occurred'}
        </p>
        
        {onRetry && !compact && (
          <button
            onClick={onRetry}
            className="u-mt-1 u-fs-2xs u-text-primary u-hover:underline u-flex u-items-center u-gap-1"
          >
            <RefreshCw size={12} />
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

// Toast notification for errors
interface ErrorToastProps {
  error?: any;
  message?: string;
  onClose?: () => void;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export function ErrorToast({
  error,
  message,
  onClose,
  autoClose = true,
  autoCloseDelay = 5000
}: ErrorToastProps) {
  const appError = error ? classifyError(error) : null;
  const toastRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Animate in
    if (toastRef.current) {
      fadeIn(toastRef.current, { duration: 0.3 });
    }

    // Auto-close
    if (autoClose && onClose) {
      const timer = setTimeout(onClose, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [autoClose, autoCloseDelay, onClose]);

  return (
    <div
      ref={toastRef}
      className="u-fixed u-top-4 u-right-4 u-z-50 u-max-w-sm"
      role="alert"
      aria-live="assertive"
    >
      <Card appearance="elevated" className="u-shadow-2xl u-p-4 u-bg-danger u-text-white">
        <div className="u-flex u-items-start u-gap-3">
          <AlertTriangle className="u-flex-shrink-0 u-mt-0.5" size={20} />
          
          <div className="u-flex-grow">
            <h4 className="u-font-bold u-fs-sm u-mb-1">Error</h4>
            <p className="u-fs-xs u-opacity-90">
              {message || appError?.userMessage || 'An unexpected error occurred'}
            </p>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="u-flex-shrink-0 u-opacity-75 u-hover:opacity-100 u-transition-opacity"
              aria-label="Close notification"
            >
              ×
            </button>
          )}
        </div>
      </Card>
    </div>
  );
}

// Retry button with countdown
interface RetryWithCountdownProps {
  onRetry: () => void;
  initialDelay?: number;
  label?: string;
  className?: string;
}

export function RetryWithCountdown({
  onRetry,
  initialDelay = 5,
  label = 'Retrying in',
  className = ''
}: RetryWithCountdownProps) {
  const [countdown, setCountdown] = useState(initialDelay);

  useEffect(() => {
    if (countdown <= 0) {
      onRetry();
      setCountdown(initialDelay);
      return;
    }

    const timer = setInterval(() => {
      setCountdown(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, initialDelay, onRetry]);

  return (
    <div className={`u-flex u-items-center u-gap-2 u-fs-xs u-text-secondary-subtle ${className}`}>
      <RefreshCw size={14} className="animate-spin" />
      <span>{label} {countdown}s...</span>
      <button
        onClick={() => {
          setCountdown(0);
          onRetry();
        }}
        className="u-text-primary u-hover:underline"
      >
        Retry now
      </button>
    </div>
  );
}
