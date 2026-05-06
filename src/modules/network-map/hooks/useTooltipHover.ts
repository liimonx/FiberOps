import { useState, useCallback, useRef, useEffect } from 'react';
import { TooltipContent } from '../components/InteractiveTooltip';

export interface TooltipState {
  content: TooltipContent | null;
  x: number;
  y: number;
  visible: boolean;
}

interface UseTooltipHoverOptions {
  delayEnter?: number;
  delayLeave?: number;
}

export function useTooltipHover(options: UseTooltipHoverOptions = {}) {
  const { delayEnter = 0, delayLeave = 150 } = options;
  
  const [tooltip, setTooltip] = useState<TooltipState>({
    content: null,
    x: 0,
    y: 0,
    visible: false
  });
  
  const hoverRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearPendingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const showTooltip = useCallback((content: TooltipContent, x: number, y: number) => {
    clearPendingTimeout();
    hoverRef.current = false;

    if (delayEnter > 0) {
      timeoutRef.current = setTimeout(() => {
        setTooltip({ content, x, y, visible: true });
      }, delayEnter);
    } else {
      setTooltip({ content, x, y, visible: true });
    }
  }, [clearPendingTimeout, delayEnter]);

  const hideTooltip = useCallback((immediate = false) => {
    if (immediate) {
      clearPendingTimeout();
      setTooltip(prev => ({ ...prev, visible: false }));
      return;
    }

    if (!hoverRef.current) {
      clearPendingTimeout();
      timeoutRef.current = setTimeout(() => {
        setTooltip(prev => ({ ...prev, visible: false }));
      }, delayLeave);
    }
  }, [clearPendingTimeout, delayLeave]);

  const handleMouseEnter = useCallback(() => {
    hoverRef.current = true;
    clearPendingTimeout();
  }, [clearPendingTimeout]);

  const handleMouseLeave = useCallback(() => {
    hoverRef.current = false;
    clearPendingTimeout();
    timeoutRef.current = setTimeout(() => {
      setTooltip(prev => ({ ...prev, visible: false }));
    }, delayLeave);
  }, [clearPendingTimeout, delayLeave]);

  const handleFocus = useCallback(() => {
    hoverRef.current = true;
    clearPendingTimeout();
  }, [clearPendingTimeout]);

  const handleBlur = useCallback(() => {
    hoverRef.current = false;
    clearPendingTimeout();
    timeoutRef.current = setTimeout(() => {
      setTooltip(prev => ({ ...prev, visible: false }));
    }, delayLeave);
  }, [clearPendingTimeout, delayLeave]);

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
