import { useState, useCallback, useRef, useEffect } from "react";
import { TooltipContent } from "../components/InteractiveTooltip";

export interface TooltipState {
  content: TooltipContent | null;
  x: number;
  y: number;
  visible: boolean;
}

export interface TooltipState {
  content: TooltipContent | null;
  x: number;
  y: number;
  visible: boolean;
}

/**
 * Custom hook to handle tooltip hover logic.
 * Fixed 300ms delay and hover-aware hide logic.
 */
export function useTooltipHover() {
  const [tooltip, setTooltip] = useState<TooltipState>({
    content: null,
    x: 0,
    y: 0,
    visible: false,
  });

  const hoverRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearPendingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const showTooltip = useCallback(
    (content: TooltipContent, x: number, y: number) => {
      clearPendingTimeout();
      setTooltip({ content, x, y, visible: true });
    },
    [clearPendingTimeout]
  );

  const hideTooltip = useCallback(
    (immediate = false) => {
      if (immediate) {
        clearPendingTimeout();
        hoverRef.current = false;
        setTooltip((prev) => ({ ...prev, visible: false }));
        return;
      }

      if (!hoverRef.current) {
        clearPendingTimeout();
        timeoutRef.current = setTimeout(() => {
          if (!hoverRef.current) {
            setTooltip((prev) => ({ ...prev, visible: false }));
          }
        }, 300);
      }
    },
    [clearPendingTimeout]
  );

  const handleMouseEnter = useCallback(() => {
    hoverRef.current = true;
    clearPendingTimeout();
  }, [clearPendingTimeout]);

  const handleMouseLeave = useCallback(() => {
    hoverRef.current = false;
    clearPendingTimeout();
    timeoutRef.current = setTimeout(() => {
      if (!hoverRef.current) {
        setTooltip((prev) => ({ ...prev, visible: false }));
      }
    }, 300);
  }, [clearPendingTimeout]);

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

