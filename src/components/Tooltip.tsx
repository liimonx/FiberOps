import React, { useId, ReactNode } from 'react';
import { Card } from '@shohojdhara/atomix';
import { useVisibility } from '../hooks/useVisibility';

export interface TooltipProps {
  /** The element that triggers the tooltip */
  children: React.ReactElement;
  /** The content to display inside the tooltip */
  content: ReactNode;
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
  position = 'top',
  className = '',
  id,
}) => {
  const generatedId = useId();
  const tooltipId = id || `tooltip-${generatedId}`;
  const { visible, show, hide } = useVisibility();

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

  return (
    <div className="u-relative u-inline-block">
      <div
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        aria-describedby={visible ? tooltipId : undefined}
      >
        {children}
      </div>
      
      {visible && (
        <div
          id={tooltipId}
          role="tooltip"
          className={`u-absolute u-z-tooltip ${className}`}
          style={getPositionStyles()}
          onMouseEnter={show}
          onMouseLeave={hide}
        >
          <Card
            className="u-px-3 u-py-2 u-bg-gray-900  u-shadow-lg u-rounded-md"
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
