"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<any>;
}

export interface ErrorBoundaryFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    errorCount: 0,
  };

  private resetTimer: NodeJS.Timeout | null = null;

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
      errorCount: this.state.errorCount + 1,
    });

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // Report to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      this.reportError(error, errorInfo);
    }
  }

  public componentDidUpdate(prevProps: Props) {
    // Reset error state if reset keys change
    if (this.props.resetKeys && prevProps.resetKeys !== this.props.resetKeys) {
      const hasChanged = this.props.resetKeys.some((key, index) => 
        key !== prevProps.resetKeys?.[index]
      );
      
      if (hasChanged && this.state.hasError) {
        this.handleReset();
      }
    }
  }

  public componentWillUnmount() {
    if (this.resetTimer) {
      clearTimeout(this.resetTimer);
    }
  }

  private reportError(error: Error, errorInfo: ErrorInfo) {
    // In production, send to error tracking service (Sentry, LogRocket, etc.)
    // Example: Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
    console.error('Error reported to monitoring service');
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleRetry = () => {
    this.handleReset();
    // Force remount by briefly setting error, then clearing
    this.setState({ hasError: true }, () => {
      if (this.resetTimer) {
        clearTimeout(this.resetTimer);
      }
      this.resetTimer = setTimeout(this.handleReset, 50);
    });
  };

  public render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-red-50 dark:bg-red-950/20 border-2 border-red-200 dark:border-red-800 rounded-lg">
          <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
          
          <h2 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-2">
            Something went wrong
          </h2>
          
          <p className="text-gray-600 dark:text-gray-400 text-center mb-6 max-w-md">
            The component encountered an unexpected error. You can try refreshing or return to the home page.
          </p>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="w-full max-w-2xl mb-6 bg-white dark:bg-gray-900 p-4 rounded border border-gray-300 dark:border-gray-700">
              <summary className="cursor-pointer font-medium text-gray-700 dark:text-gray-300 mb-2">
                Error Details (Development Mode)
              </summary>
              <div className="mt-2 text-sm font-mono text-red-600 dark:text-red-400 overflow-auto max-h-64">
                <p className="font-semibold">{this.state.error.toString()}</p>
                {this.state.error.stack && (
                  <pre className="mt-2 whitespace-pre-wrap">{this.state.error.stack}</pre>
                )}
                {this.state.errorInfo && (
                  <div className="mt-4">
                    <p className="font-semibold text-gray-700 dark:text-gray-300">Component Stack:</p>
                    <pre className="mt-2 whitespace-pre-wrap text-gray-600 dark:text-gray-400">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}

          <div className="flex gap-3">
            <button
              onClick={this.handleRetry}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
            
            <a
              href="/"
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md transition-colors"
            >
              <Home className="w-4 h-4" />
              Go Home
            </a>
          </div>

          {this.state.errorCount > 3 && (
            <p className="mt-4 text-sm text-orange-600 dark:text-orange-400">
              This component has failed multiple times. Consider refreshing the entire page.
            </p>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional wrapper for easier use with hooks
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);

  const showError = React.useCallback((err: Error) => {
    setError(err);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return { error, showError, clearError };
}

// Simple fallback component
export function DefaultErrorFallback({ error, resetErrorBoundary }: ErrorBoundaryFallbackProps) {
  return (
    <div role="alert" className="p-6 bg-red-50 border-l-4 border-red-500 rounded">
      <h3 className="text-lg font-semibold text-red-800 mb-2">Something went wrong</h3>
      <pre className="text-sm text-red-700 mb-4 overflow-auto">{error.message}</pre>
      <button
        onClick={resetErrorBoundary}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
      >
        Try again
      </button>
    </div>
  );
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
