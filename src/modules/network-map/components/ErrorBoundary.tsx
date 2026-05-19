"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Icon, Button, Card } from "@shohojdhara/atomix";
import { classifyError, ErrorLogger } from "../utils/errorHandler";

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
    console.error("[ErrorBoundary] Caught error:", error, errorInfo);

    this.setState({
      error,
      errorInfo,
      errorCount: this.state.errorCount + 1,
    });

    const appError = classifyError(error);
    ErrorLogger.log(appError);

    this.props.onError?.(error, errorInfo);
  }

  public componentDidUpdate(prevProps: Props) {
    if (this.props.resetKeys && prevProps.resetKeys !== this.props.resetKeys) {
      const hasChanged = this.props.resetKeys.some(
        (key, index) => key !== prevProps.resetKeys?.[index]
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

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleRetry = () => {
    this.handleReset();
    this.setState({ hasError: true }, () => {
      if (this.resetTimer) clearTimeout(this.resetTimer);
      this.resetTimer = setTimeout(this.handleReset, 50);
    });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="u-flex u-flex-column u-items-center u-justify-center u-h-100 u-w-100 u-p-10">
          <Card
            className="u-max-w-md u-w-100 u-p-8 u-text-center u-border-solid u-border-error"
          >
            <div className="u-inline-flex u-items-center u-justify-center u-w-16 u-h-16 u-rounded-circle u-bg-error-subtle u-border u-border-solid u-border-error u-mb-6">
              <Icon name="Warning" size={32} className="u-text-error" />
            </div>

            <h2
              className="u-m-0 u-text-xl u-font-bold u-text-uppercase u-mb-2"
              style={{ letterSpacing: "1px" }}
            >
              System Exception
            </h2>

            <p className="u-text-sm u-text-secondary-emphasis u-mb-8 u-leading-normal">
              An unexpected error occurred in the map interface. You can try to recover
              the component or return home.
            </p>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <div className="u-text-start u-mb-8">
                <details className="u-bg-dark u-rounded u-p-4 u-border u-border-solid u-border-secondary-subtle">
                  <summary className="u-text-xs u-font-bold u-text-secondary-emphasis u-cursor-pointer">
                    Error Trace
                  </summary>
                  <pre className="u-mt-2 u-text-xs u-font-mono u-text-error u-overflow-auto u-max-h-40">
                    {this.state.error.toString()}
                  </pre>
                </details>
              </div>
            )}

            <div className="u-flex u-gap-3 u-justify-center">
              <Button
                variant="primary"
                iconName="ArrowsCounterClockwise"
                onClick={this.handleRetry}
              >
                Try Again
              </Button>

              <Button as="a" href="/" variant="secondary" iconName="House">
                Go Home
              </Button>
            </div>

            {this.state.errorCount > 3 && (
              <p className="u-mt-6 u-text-xs u-font-bold u-text-warning u-text-uppercase">
                Multiple failures detected. Page refresh recommended.
              </p>
            )}
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export function DefaultErrorFallback({
  error,
  resetErrorBoundary,
}: ErrorBoundaryFallbackProps) {
  return (
    <div
      role="alert"
      className="u-p-6 u-bg-error-subtle u-border-start u-border-solid u-border-error u-border-4 u-rounded"
    >
      <h3 className="u-m-0 u-text-sm u-font-bold u-text-error u-text-uppercase u-mb-2">
        Critical Failure
      </h3>
      <pre className="u-text-xs u-text-error u-opacity-80 u-mb-4 u-overflow-auto">
        {error.message}
      </pre>
      <Button
        variant="primary"
        size="sm"
        iconName="ArrowsCounterClockwise"
        onClick={resetErrorBoundary}
      >
        Try Again
      </Button>
    </div>
  );
}

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, "children">
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
