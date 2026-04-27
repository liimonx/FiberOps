"use client";

import { useState, useEffect } from 'react';
import { RESPONSIVE_BREAKPOINTS } from '../constants';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

export const useResponsive = () => {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('desktop');

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      
      if (width < RESPONSIVE_BREAKPOINTS.MOBILE) {
        setBreakpoint('mobile');
      } else if (width < RESPONSIVE_BREAKPOINTS.TABLET) {
        setBreakpoint('tablet');
      } else {
        setBreakpoint('desktop');
      }
    };

    // Initial check
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = breakpoint === 'mobile';
  const isTablet = breakpoint === 'tablet';
  const isDesktop = breakpoint === 'desktop';

  return {
    breakpoint,
    isMobile,
    isTablet,
    isDesktop,
    screenWidth: typeof window !== 'undefined' ? window.innerWidth : 0
  };
};

// Hook for checking specific breakpoints
export const useBreakpoint = (breakpointName: Breakpoint) => {
  const { breakpoint } = useResponsive();
  return breakpoint === breakpointName;
};

// Hook for responsive values
export const useResponsiveValue = <T>(
  mobileValue: T,
  tabletValue: T,
  desktopValue: T
): T => {
  const { isMobile, isTablet } = useResponsive();
  
  if (isMobile) return mobileValue;
  if (isTablet) return tabletValue;
  return desktopValue;
};