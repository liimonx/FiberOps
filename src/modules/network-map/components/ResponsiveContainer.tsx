"use client";

import React from 'react';
import { useResponsive, Breakpoint } from '../hooks/useResponsive';

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
    <div className={`u-transition-all ${className} ${breakpointClasses[breakpoint]}`}>
      {children}
    </div>
  );
};

// Component that conditionally renders based on breakpoint
export const ResponsiveShow: React.FC<{ children: React.ReactNode; at: Breakpoint | Breakpoint[] }> = ({ children, at }) => {
  const { breakpoint } = useResponsive();
  const breakpoints = Array.isArray(at) ? at : [at];
  if (!breakpoints.includes(breakpoint)) return null;
  return <>{children}</>;
};

// Component that hides at specific breakpoints
export const ResponsiveHide: React.FC<{ children: React.ReactNode; at: Breakpoint | Breakpoint[] }> = ({ children, at }) => {
  const { breakpoint } = useResponsive();
  const breakpoints = Array.isArray(at) ? at : [at];
  if (breakpoints.includes(breakpoint)) return null;
  return <>{children}</>;
};

export const ResponsiveGrid: React.FC<{
  children: React.ReactNode;
  className?: string;
  mobileColumns?: number;
  tabletColumns?: number;
  desktopColumns?: number;
  gap?: number;
}> = ({
  children,
  className = '',
  mobileColumns = 1,
  tabletColumns = 2,
  desktopColumns = 3,
  gap = 4
}) => {
  const { breakpoint } = useResponsive();
  const columns =
    breakpoint === 'desktop' ? desktopColumns
    : breakpoint === 'tablet' ? tabletColumns
    : mobileColumns;

  return (
    <div
      className={`u-grid u-gap-${gap} ${className}`}
      style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
    >
      {children}
    </div>
  );
};

export const ResponsiveStack: React.FC<{
  children: React.ReactNode;
  className?: string;
  mobileDirection?: 'vertical' | 'horizontal';
  tabletDirection?: 'vertical' | 'horizontal';
  desktopDirection?: 'vertical' | 'horizontal';
  gap?: number;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
}> = ({
  children,
  className = '',
  mobileDirection = 'vertical',
  tabletDirection = 'horizontal',
  desktopDirection = 'horizontal',
  gap = 4,
  align = 'stretch',
  justify = 'start'
}) => {
  const { breakpoint } = useResponsive();
  const direction =
    breakpoint === 'desktop' ? desktopDirection
    : breakpoint === 'tablet' ? tabletDirection
    : mobileDirection;

  const getAlignClass = (val: string) => `u-items-${val === 'stretch' ? 'stretch' : val}`;
  const getJustifyClass = (val: string) => `u-justify-${val}`;

  return (
    <div
      className={`u-flex u-gap-${gap} ${direction === 'vertical' ? 'u-flex-column' : 'u-flex-row'} ${getAlignClass(align)} ${getJustifyClass(justify)} ${className}`}
    >
      {children}
    </div>
  );
};

// Touch-optimized wrapper
export const TouchFriendly: React.FC<{
  children: React.ReactNode;
  className?: string;
  minTouchSize?: number;
}> = ({
  children,
  className = '',
  minTouchSize = 44,
}) => {
  return (
    <div 
      className={`u-flex u-items-center u-justify-center u-cursor-pointer u-transition-all active:u-opacity-80 active:u-transform-scale-95 ${className}`}
      style={{
        minHeight: `${minTouchSize}px`,
        minWidth: `${minTouchSize}px`
      }}
    >
      {children}
    </div>
  );
};

// Safe area inset wrapper for notched devices
export const SafeAreaWrapper: React.FC<{
  children: React.ReactNode;
  className?: string;
  edges?: Array<'top' | 'bottom' | 'left' | 'right'>;
}> = ({
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
    <div className={`u-w-100 ${className}`} style={paddingStyles}>
      {children}
    </div>
  );
};
