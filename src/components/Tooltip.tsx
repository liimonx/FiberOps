import React, { useState, useRef, useCallback, useEffect, ReactNode } from 'react';
import { Card } from '@shohojdhara/atomix';

export interface TooltipProps {
  /** The element that triggers the tooltip */
  children: React.ReactElement;
  /** The content to display inside the tooltip */
  content: ReactNode;
  /** Delay in milliseconds before showing the tooltip */
  delayShow?: number;
  /** Delay in milliseconds before hiding the tooltip */
  delayHide?: number;
  /** Preferred position of the tooltip relative to the trigger */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Additional CSS classes for the tooltip container */
  className?: string;
  /** ID for ARIA associations */
  id?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  delayShow = 200,
  delayHide = 300,
  position = 'top',
  className = '',
  id,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const triggerRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const tooltipId = useRef(id || `tooltip-${Math.random().toString(36).substr(2, 9)}`);

  const clearPendingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const handleShow = useCallback(() => {
    clearPendingTimeout();
    if (delayShow > 0) {
      timeoutRef.current = setTimeout(() => {
        setIsVisible(true);
        setIsMounted(true);
      }, delayShow);
    } else {
      setIsVisible(true);
      setIsMounted(true);
    }
  }, [clearPendingTimeout, delayShow]);

  const handleHide = useCallback(() => {
    clearPendingTimeout();
    if (delayHide > 0) {
      timeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, delayHide);
    } else {
      setIsVisible(false);
    }
  }, [clearPendingTimeout, delayHide]);

  // Handle escape key to close tooltip
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) {
        handleHide();
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible, handleHide]);

  // Clean up timeouts
  useEffect(() => {
    return () => clearPendingTimeout();
  }, [clearPendingTimeout]);

  // Handle transition out
  const handleTransitionEnd = () => {
    if (!isVisible) {
      setIsMounted(false);
    }
  };

  const getPositionStyles = (): React.CSSProperties => {
    const spacing = 8;
    switch (position) {
      case 'top':
        return { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: spacing };
      case 'bottom':
        return { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: spacing };
      case 'left':
        return { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: spacing };
      case 'right':
        return { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: spacing };
      default:
        return {};
    }
  };

  // Clone children to attach event listeners and ARIA attributes
  const trigger = React.cloneElement(children as React.ReactElement<any>, {
    ref: triggerRef,
    onMouseEnter: (e: React.MouseEvent) => {
      handleShow();
      if (children.props.onMouseEnter) children.props.onMouseEnter(e);
    },
    onMouseLeave: (e: React.MouseEvent) => {
      handleHide();
      if (children.props.onMouseLeave) children.props.onMouseLeave(e);
    },
    onFocus: (e: React.FocusEvent) => {
      handleShow();
      if (children.props.onFocus) children.props.onFocus(e);
    },
    onBlur: (e: React.FocusEvent) => {
      handleHide();
      if (children.props.onBlur) children.props.onBlur(e);
    },
    'aria-describedby': isMounted ? tooltipId.current : undefined,
  });

  return (
    <div className="u-relative u-inline-block">
      {trigger}
      
      {isMounted && (
        <div
          ref={tooltipRef}
          id={tooltipId.current}
          role="tooltip"
          className={`u-absolute u-z-tooltip u-transition-all ${className}`}
          style={{
            ...getPositionStyles(),
            opacity: isVisible ? 1 : 0,
            visibility: isVisible ? 'visible' : 'hidden',
            pointerEvents: isVisible ? 'auto' : 'none',
          }}
          onMouseEnter={handleShow}
          onMouseLeave={handleHide}
          onFocus={handleShow}
          onBlur={handleHide}
          onTransitionEnd={handleTransitionEnd}
        >
          <Card
            glass={{ blurAmount: 8 }}
            className="u-px-3 u-py-2 u-bg-gray-900 u-text-white u-shadow-lg u-rounded-md"
            style={{ minWidth: 'max-content' }}
          >
            {typeof content === 'string' ? (
              <span className="u-text-xs u-font-medium">{content}</span>
            ) : (
              content
            )}
          </Card>
        </div>
      )}
    </div>
  );
};
