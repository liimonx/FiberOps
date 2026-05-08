import { useState, useCallback, useRef, useEffect } from 'react';

export interface UseVisibilityOptions {
  /** Initial visibility state */
  initialVisible?: boolean;
  /** Delay in milliseconds before showing */
  showDelay?: number;
  /** Delay in milliseconds before hiding */
  hideDelay?: number;
  /** Callback when visibility changes */
  onVisibilityChange?: (visible: boolean) => void;
}

export interface UseVisibilityReturn {
  /** Current visibility state */
  visible: boolean;
  /** Function to show the element */
  show: () => void;
  /** Function to hide the element */
  hide: () => void;
  /** Function to toggle visibility */
  toggle: () => void;
  /** Function to set visibility directly */
  setVisible: (visible: boolean) => void;
}

/**
 * A reusable hook for managing component visibility with optional delays
 * and callback support. Follows DRY principles by consolidating common
 * visibility management patterns.
 *
 * @example
 * // Basic usage
 * const { visible, show, hide, toggle } = useVisibility();
 *
 * // With delays
 * const { visible, show, hide } = useVisibility({
 *   showDelay: 200,
 *   hideDelay: 300
 * });
 *
 * // With initial state and callback
 * const { visible, setVisible } = useVisibility({
 *   initialVisible: true,
 *   onVisibilityChange: (visible) => console.log('Visibility changed:', visible)
 * });
 */
export function useVisibility(options: UseVisibilityOptions = {}): UseVisibilityReturn {
  const {
    initialVisible = false,
    showDelay = 0,
    hideDelay = 0,
    onVisibilityChange,
  } = options;

  const [visible, setVisibleState] = useState(initialVisible);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearPendingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const setVisible = useCallback((newVisible: boolean) => {
    clearPendingTimeout();
    setVisibleState(newVisible);
    onVisibilityChange?.(newVisible);
  }, [clearPendingTimeout, onVisibilityChange]);

  const show = useCallback(() => {
    clearPendingTimeout();
    if (showDelay > 0) {
      timeoutRef.current = setTimeout(() => {
        setVisibleState(true);
        onVisibilityChange?.(true);
      }, showDelay);
    } else {
      setVisibleState(true);
      onVisibilityChange?.(true);
    }
  }, [clearPendingTimeout, showDelay, onVisibilityChange]);

  const hide = useCallback(() => {
    clearPendingTimeout();
    if (hideDelay > 0) {
      timeoutRef.current = setTimeout(() => {
        setVisibleState(false);
        onVisibilityChange?.(false);
      }, hideDelay);
    } else {
      setVisibleState(false);
      onVisibilityChange?.(false);
    }
  }, [clearPendingTimeout, hideDelay, onVisibilityChange]);

  const toggle = useCallback(() => {
    if (visible) {
      hide();
    } else {
      show();
    }
  }, [visible, show, hide]);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    visible,
    show,
    hide,
    toggle,
    setVisible,
  };
}

export default useVisibility;