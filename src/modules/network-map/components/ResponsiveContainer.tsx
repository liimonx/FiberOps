"use client";

import React from 'react';
import { useResponsive, useResponsiveValue, Breakpoint } from '../hooks/useResponsive';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  mobileClassName?: string;
  tabletClassName?: string;
  desktopClassName?: string;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className = '',
  mobileClassName = '',
  tabletClassName = '',
  desktopClassName = ''
}) => {
  const { breakpoint } = useResponsive();

  const breakpointClasses = {
    mobile: mobileClassName,
    tablet: tabletClassName,
    desktop: desktopClassName
  };

  return (
    <div className={`responsive-container ${className} ${breakpointClasses[breakpoint]}`}>
      {children}
    </div>
  );
};

// Component that conditionally renders based on breakpoint
interface ResponsiveShowProps {
  children: React.ReactNode;
  at: Breakpoint | Breakpoint[];
}

export const ResponsiveShow: React.FC<ResponsiveShowProps> = ({ children, at }) => {
  const { breakpoint } = useResponsive();
  const breakpoints = Array.isArray(at) ? at : [at];

  if (!breakpoints.includes(breakpoint)) {
    return null;
  }

  return <>{children}</>;
};

// Component that hides at specific breakpoints
interface ResponsiveHideProps {
  children: React.ReactNode;
  at: Breakpoint | Breakpoint[];
}

export const ResponsiveHide: React.FC<ResponsiveHideProps> = ({ children, at }) => {
  const { breakpoint } = useResponsive();
  const breakpoints = Array.isArray(at) ? at : [at];

  if (breakpoints.includes(breakpoint)) {
    return null;
  }

  return <>{children}</>;
};

// Component for responsive grid layouts
interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  mobileColumns?: number;
  tabletColumns?: number;
  desktopColumns?: number;
  gap?: string;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  className = '',
  mobileColumns = 1,
  tabletColumns = 2,
  desktopColumns = 3,
  gap = '16px'
}) => {
  const columnCount = useResponsiveValue(mobileColumns, tabletColumns, desktopColumns);

  return (
    <div 
      className={`responsive-grid ${className}`}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columnCount}, 1fr)`,
        gap
      }}
    >
      {children}
    </div>
  );
};

// Component for responsive stack layouts
interface ResponsiveStackProps {
  children: React.ReactNode;
  className?: string;
  mobileDirection?: 'vertical' | 'horizontal';
  tabletDirection?: 'vertical' | 'horizontal';
  desktopDirection?: 'vertical' | 'horizontal';
  gap?: string;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
}

export const ResponsiveStack: React.FC<ResponsiveStackProps> = ({
  children,
  className = '',
  mobileDirection = 'vertical',
  tabletDirection = 'horizontal',
  desktopDirection = 'horizontal',
  gap = '16px',
  align = 'stretch',
  justify = 'start'
}) => {
  const direction = useResponsiveValue(mobileDirection, tabletDirection, desktopDirection);

  const flexDirection = direction === 'vertical' ? 'column' : 'row';
  const alignItems = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    stretch: 'stretch'
  }[align];

  const justifyContent = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    between: 'space-between',
    around: 'space-around'
  }[justify];

  return (
    <div 
      className={`responsive-stack ${className}`}
      style={{
        display: 'flex',
        flexDirection,
        gap,
        alignItems,
        justifyContent
      }}
    >
      {children}
    </div>
  );
};

// Touch-optimized wrapper
interface TouchFriendlyProps {
  children: React.ReactNode;
  className?: string;
  minTouchSize?: number;
  enableTouchFeedback?: boolean;
}

export const TouchFriendly: React.FC<TouchFriendlyProps> = ({
  children,
  className = '',
  minTouchSize = 44,
  enableTouchFeedback = true
}) => {
  return (
    <div 
      className={`touch-friendly ${enableTouchFeedback ? 'touch-feedback' : ''} ${className}`}
      style={{
        minHeight: minTouchSize,
        minWidth: minTouchSize
      }}
    >
      {children}
      <style jsx>{`
        .touch-friendly {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .touch-feedback {
          transition: transform 0.1s ease, opacity 0.1s ease;
        }

        .touch-feedback:active {
          transform: scale(0.95);
          opacity: 0.8;
        }

        @media (hover: hover) {
          .touch-feedback:active {
            transform: none;
            opacity: 1;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .touch-feedback {
            transition: none;
          }

          .touch-feedback:active {
            transform: none;
          }
        }
      `}</style>
    </div>
  );
};

// Safe area inset wrapper for notched devices
interface SafeAreaWrapperProps {
  children: React.ReactNode;
  className?: string;
  edges?: Array<'top' | 'bottom' | 'left' | 'right'>;
}

export const SafeAreaWrapper: React.FC<SafeAreaWrapperProps> = ({
  children,
  className = '',
  edges = ['top', 'bottom', 'left', 'right']
}) => {
  const paddingStyles: React.CSSProperties = {
    paddingTop: edges.includes('top') ? 'env(safe-area-inset-top)' : undefined,
    paddingBottom: edges.includes('bottom') ? 'env(safe-area-inset-bottom)' : undefined,
    paddingLeft: edges.includes('left') ? 'env(safe-area-inset-left)' : undefined,
    paddingRight: edges.includes('right') ? 'env(safe-area-inset-right)' : undefined
  };

  return (
    <div className={`safe-area-wrapper ${className}`} style={paddingStyles}>
      {children}
    </div>
  );
};
