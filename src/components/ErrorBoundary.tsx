"use client";

import { Component, ErrorInfo, ReactNode } from "react";
import { Card, Button, Icon } from "@shohojdhara/atomix";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="u-p-6 u-text-center">
          <div className="u-flex u-flex-column u-items-center u-gap-4">
            <Icon name="WarningCircle" size="xl" className="u-text-error" />
            <div>
              <h2 className="u-text-lg u-font-bold u-mb-2">Something went wrong</h2>
              <p className="u-text-secondary-subtle u-mb-4">
                {this.state.error?.message || "An unexpected error occurred"}
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Try Again
            </Button>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}
