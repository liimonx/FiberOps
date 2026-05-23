import { useState, useCallback, useRef, useEffect } from "react";
import { TooltipContent } from "../components/InteractiveTooltip";

export interface TooltipState {
  content: TooltipContent | null;
  x: number;
  y: number;
  visible: boolean;
}

/**
 * Options for useTooltipHover
 */
export interface UseTooltipHoverOptions {
  /** Delay before hiding after pointer leaves (ms). */
  delay?: number;
  /** Delay before showing after hover starts (ms). */
  showDelay?: number;
  autoHide?: boolean;
}

/**
 * Custom hook to handle tooltip hover logic.
 * Fixed 300ms delay and hover-aware hide logic.
 */
export function useTooltipHover(options: UseTooltipHoverOptions = {}) {
  const { delay = 300, showDelay = 0, autoHide = true } = options;
  const [tooltip, setTooltip] = useState<TooltipState>({
    content: null,
    x: 0,
    y: 0,
    visible: false,
  });

  const hoverRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingShowRef = useRef<{ content: TooltipContent; x: number; y: number } | null>(
    null
  );

  const clearPendingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    pendingShowRef.current = null;
  }, []);

  const showTooltip = useCallback(
    (content: TooltipContent, x: number, y: number) => {
      clearPendingTimeout();
      pendingShowRef.current = { content, x, y };

      if (showDelay <= 0) {
        setTooltip({ content, x, y, visible: true });
        return;
      }

      setTooltip((prev) => ({
        content,
        x,
        y,
        visible: prev.visible,
      }));

      timeoutRef.current = setTimeout(() => {
        const pending = pendingShowRef.current;
        if (pending) {
          setTooltip({
            content: pending.content,
            x: pending.x,
            y: pending.y,
            visible: true,
          });
        }
      }, showDelay);
    },
    [clearPendingTimeout, showDelay]
  );

  const hideTooltip = useCallback(
    (immediate = false) => {
      if (immediate) {
        clearPendingTimeout();
        hoverRef.current = false;
        setTooltip((prev) => ({ ...prev, visible: false }));
        return;
      }

      if (!hoverRef.current && autoHide) {
        clearPendingTimeout();
        timeoutRef.current = setTimeout(() => {
          if (!hoverRef.current) {
            setTooltip((prev) => ({ ...prev, visible: false }));
          }
        }, delay);
      }
    },
    [clearPendingTimeout, autoHide, delay]
  );

  const handleMouseEnter = useCallback(() => {
    hoverRef.current = true;
    clearPendingTimeout();
  }, [clearPendingTimeout]);

  const handleMouseLeave = useCallback(() => {
    hoverRef.current = false;
    clearPendingTimeout();
    if (autoHide) {
      timeoutRef.current = setTimeout(() => {
        if (!hoverRef.current) {
          setTooltip((prev) => ({ ...prev, visible: false }));
        }
      }, delay);
    }
  }, [clearPendingTimeout, autoHide, delay]);

  useEffect(() => {
    return () => {
      clearPendingTimeout();
    };
  }, [clearPendingTimeout]);

  return {
    tooltip,
    showTooltip,
    hideTooltip,
    handleMouseEnter,
    handleMouseLeave,
  };
}

