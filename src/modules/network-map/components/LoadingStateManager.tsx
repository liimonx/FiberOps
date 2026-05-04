"use client";

import React, { createContext, useContext, useReducer, useCallback } from "react";
import { EnhancedLoadingState } from "./EnhancedLoadingState";

// Loading state types
export interface LoadingState {
  id: string;
  message: string;
  progress?: number;
  showProgress: boolean;
}

interface LoadingStateMap {
  [key: string]: LoadingState;
}

type LoadingAction =
  | { type: "START_LOADING"; payload: LoadingState }
  | { type: "UPDATE_PROGRESS"; payload: { id: string; progress: number } }
  | { type: "STOP_LOADING"; payload: { id: string } }
  | { type: "CLEAR_ALL" };

function loadingReducer(state: LoadingStateMap, action: LoadingAction): LoadingStateMap {
  switch (action.type) {
    case "START_LOADING":
      return {
        ...state,
        [action.payload.id]: action.payload,
      };

    case "UPDATE_PROGRESS":
      return {
        ...state,
        [action.payload.id]: {
          ...state[action.payload.id],
          progress: action.payload.progress,
        },
      };

    case "STOP_LOADING":
      const newState = { ...state };
      delete newState[action.payload.id];
      return newState;

    case "CLEAR_ALL":
      return {};

    default:
      return state;
  }
}

// Context
interface LoadingContextType {
  startLoading: (id: string, message: string, showProgress?: boolean) => void;
  updateProgress: (id: string, progress: number) => void;
  stopLoading: (id: string) => void;
  isLoading: (id: string) => boolean;
  getLoadingState: (id: string) => LoadingState | undefined;
  hasAnyLoading: boolean;
}

const LoadingContext = createContext<LoadingContextType | null>(null);

// Provider component
export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [loadingStates, dispatch] = useReducer(loadingReducer, {});

  const startLoading = useCallback(
    (id: string, message: string, showProgress: boolean = false) => {
      dispatch({
        type: "START_LOADING",
        payload: { id, message, progress: 0, showProgress },
      });
    },
    []
  );

  const updateProgress = useCallback((id: string, progress: number) => {
    dispatch({
      type: "UPDATE_PROGRESS",
      payload: { id, progress: Math.min(100, Math.max(0, progress)) },
    });
  }, []);

  const stopLoading = useCallback((id: string) => {
    dispatch({
      type: "STOP_LOADING",
      payload: { id },
    });
  }, []);

  const isLoading = useCallback(
    (id: string) => {
      return !!loadingStates[id];
    },
    [loadingStates]
  );

  const getLoadingState = useCallback(
    (id: string) => {
      return loadingStates[id];
    },
    [loadingStates]
  );

  const hasAnyLoading = Object.keys(loadingStates).length > 0;

  return (
    <LoadingContext.Provider
      value={{
        startLoading,
        updateProgress,
        stopLoading,
        isLoading,
        getLoadingState,
        hasAnyLoading,
      }}
    >
      {children}
    </LoadingContext.Provider>
  );
}

// Hook to use loading context
export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within LoadingProvider");
  }
  return context;
}

// Loading overlay component
interface LoadingOverlayProps {
  loadingId?: string;
  fallbackMessage?: string;
  className?: string;
}

export function LoadingOverlay({
  loadingId,
  fallbackMessage = "Processing...",
  className = "",
}: LoadingOverlayProps) {
  const { hasAnyLoading, getLoadingState } = useLoading();

  const state = loadingId ? getLoadingState(loadingId) : null;
  const shouldShow = loadingId ? !!state : hasAnyLoading;

  if (!shouldShow) return null;

  const displayState = state || {
    id: "default",
    message: fallbackMessage,
    progress: 0,
    showProgress: false,
  };

  return (
    <div
      className={`u-absolute u-inset-0 u-z-modal u-flex u-items-center u-justify-center u-bg-black-opacity-50 u-backdrop-blur-sm ${className}`}
    >
      <EnhancedLoadingState
        message={displayState.message}
        showProgress={displayState.showProgress}
        progress={displayState.progress}
        variant="overlay"
      />
    </div>
  );
}

// Higher-order component for wrapping components with loading state
export function withLoading<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    loadingId?: string;
    fallbackMessage?: string;
    fullScreen?: boolean;
  } = {}
) {
  return function WithLoading(props: P) {
    const { hasAnyLoading, getLoadingState } = useLoading();

    const state = options.loadingId ? getLoadingState(options.loadingId) : null;
    const shouldShow = options.loadingId ? !!state : hasAnyLoading;

    return (
      <div className="u-relative">
        <Component {...props} />

        {shouldShow && (
          <LoadingOverlay
            loadingId={options.loadingId}
            fallbackMessage={options.fallbackMessage}
            className={options.fullScreen ? "u-fixed u-inset-0" : ""}
          />
        )}
      </div>
    );
  };
}

// Async operation wrapper with automatic loading states
export function useAsyncOperation<TArgs extends unknown[], TResult>(
  operation: (...args: TArgs) => Promise<TResult>,
  options: {
    loadingId?: string;
    loadingMessage?: string;
    showProgress?: boolean;
    onSuccess?: (result: TResult) => void;
    onError?: (error: unknown) => void;
  } = {}
) {
  const { startLoading, stopLoading, isLoading: contextIsLoading } = useLoading();
  const [error, setError] = React.useState<unknown>(null);
  const [result, setResult] = React.useState<TResult | null>(null);
  const [isExecuting, setIsExecuting] = React.useState(false);

  const execute = React.useCallback(
    async (...args: TArgs) => {
      const loadingId = options.loadingId || `async_${Date.now()}`;
      const loadingMessage = options.loadingMessage || "Processing...";

      try {
        setError(null);
        setIsExecuting(true);
        startLoading(loadingId, loadingMessage, options.showProgress);

        const result = await operation(...args);
        setResult(result);
        options.onSuccess?.(result);

        return result;
      } catch (err) {
        setError(err);
        options.onError?.(err);
        throw err;
      } finally {
        setIsExecuting(false);
        stopLoading(loadingId);
      }
    },
    [operation, options, startLoading, stopLoading]
  );

  const loadingId = options.loadingId;
  const isCurrentlyLoading = loadingId ? contextIsLoading(loadingId) : isExecuting;

  return {
    execute,
    isLoading: isCurrentlyLoading,
    error,
    result,
  };
}
