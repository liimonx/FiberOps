"use client";

import React, { useEffect, useRef } from 'react';
import { Icon } from '@shohojdhara/atomix';
import { spin, pulseOpacity, staggerFadeIn, AnimationPerformanceMonitor } from '../utils/animations';

interface EnhancedLoadingStateProps {
  message?: string;
  subMessage?: string;
  variant?: 'inline' | 'overlay' | 'fullscreen' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  showSpinner?: boolean;
  showProgress?: boolean;
  progress?: number;
  className?: string;
}

export function EnhancedLoadingState({
  message = 'Loading...',
  subMessage,
  variant = 'inline',
  size = 'md',
  showSpinner = true,
  showProgress = false,
  progress,
  className = ''
}: EnhancedLoadingStateProps) {
  const spinnerRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    // Start FPS monitoring in development
    if (process.env.NODE_ENV === 'development') {
      AnimationPerformanceMonitor.startMonitoring();
    }

    let spinnerTween: ReturnType<typeof spin> | null = null;
    let dotsTween: ReturnType<typeof pulseOpacity> | null = null;

    // Animate spinner
    if (spinnerRef.current && showSpinner) {
      spinnerTween = spin(spinnerRef.current, { duration: 1 });
    }

    // Animate loading dots
    if (dotsRef.current) {
      dotsTween = pulseOpacity(dotsRef.current, {
        minOpacity: 0.3,
        duration: 1.5,
        repeat: -1
      });
    }

    // Cleanup animations on unmount or when dependencies change
    return () => {
      if (spinnerTween) {
        spinnerTween.kill();
      }
      if (dotsTween) {
        dotsTween.kill();
      }
    };
  }, [showSpinner]);

  const sizeClasses = {
    sm: 'u-fs-sm',
    md: 'u-fs-base',
    lg: 'u-fs-lg'
  };

  const spinnerSizes = {
    sm: '24px',
    md: '32px',
    lg: '48px'
  };

  const variantClasses = {
    inline: 'u-p-4',
    overlay: 'u-absolute u-inset-0 u-bg-dark/80 u-backdrop-blur-sm',
    fullscreen: 'u-fixed u-inset-0 u-z-50 u-bg-dark/90 u-backdrop-blur-md',
    minimal: 'u-p-2'
  };

  return (
    <div 
      className={`loading-state loading-state--${variant} ${variantClasses[variant]} ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="u-flex u-flex-column u-items-center u-gap-3">
        {showSpinner && (
          <div 
            ref={spinnerRef}
            className="loading-spinner" 
            aria-hidden="true"
          >
            <Icon 
              name="SpinnerGap" 
              size={spinnerSizes[size] as any} 
              className="u-text-primary" 
            />
          </div>
        )}
        
        <div className="u-text-center">
          <span className={`loading-message ${sizeClasses[size]} u-font-medium`}>
            {message}
            <span ref={dotsRef}>...</span>
          </span>
          
          {subMessage && (
            <p className="u-fs-xs u-text-secondary-subtle u-mt-1">
              {subMessage}
            </p>
          )}
        </div>

        {showProgress && progress !== undefined && (
          <div className="u-w-100 u-max-w-[300px] u-mt-2">
            <div className="u-flex u-justify-between u-fs-2xs u-text-secondary-subtle u-mb-1">
              <span>Loading progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="u-w-100 u-h-2 u-bg-secondary-subtle u-rounded-full u-overflow-hidden">
              <div 
                className="u-h-100 u-bg-primary u-rounded-full u-transition-all u-duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Skeleton loader with animation
interface SkeletonLoaderProps {
  variant?: 'text' | 'circle' | 'rectangle' | 'card';
  width?: string | number;
  height?: string | number;
  count?: number;
  className?: string;
}

export function AnimatedSkeletonLoader({
  variant = 'text',
  width,
  height,
  count = 1,
  className = ''
}: SkeletonLoaderProps) {
  const itemsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    // Stagger animation for multiple skeletons
    if (itemsRef.current.length > 0) {
      staggerFadeIn(itemsRef.current, {
        stagger: 0.1,
        duration: 0.8
      });
    }
  }, [count]);

  const baseClasses = 'u-bg-secondary-subtle u-relative u-overflow-hidden';
  
  const variantClasses = {
    text: 'u-rounded u-mb-2',
    circle: 'u-rounded-full',
    rectangle: 'u-rounded',
    card: 'u-rounded u-p-4 u-shadow-sm'
  };

  const shimmerEffect = `
    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
    
    .skeleton-shimmer::after {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.1),
        transparent
      );
      animation: shimmer 2s infinite;
    }
  `;

  return (
    <>
      <style>{shimmerEffect}</style>
      <div className={`skeleton-loader ${className}`}>
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            ref={(el) => {
              if (el) itemsRef.current[index] = el;
            }}
            className={`${baseClasses} ${variantClasses[variant]} skeleton-shimmer`}
            style={{
              width: width || (variant === 'text' ? '100%' : undefined),
              height: height || (variant === 'text' ? '16px' : variant === 'circle' ? '40px' : '100px'),
            }}
          >
            {variant === 'card' && (
              <div className="u-flex u-flex-column u-gap-2">
                <div className="u-w-60% u-h-4 u-bg-dark/20 u-rounded" />
                <div className="u-w-100% u-h-3 u-bg-dark/20 u-rounded" />
                <div className="u-w-80% u-h-3 u-bg-dark/20 u-rounded" />
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}

// Progress ring component
interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  showLabel?: boolean;
  className?: string;
}

export function ProgressRing({
  progress,
  size = 60,
  strokeWidth = 4,
  color = 'var(--color-primary)',
  showLabel = true,
  className = ''
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={`u-relative u-inline-flex u-items-center u-justify-center ${className}`}>
      <svg width={size} height={size} className="u-transform--rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-secondary-subtle)"
          strokeWidth={strokeWidth}
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="u-transition-all u-duration-500"
        />
      </svg>
      
      {showLabel && (
        <div className="u-absolute u-text-center">
          <span className="u-fs-sm u-font-bold">{Math.round(progress)}%</span>
        </div>
      )}
    </div>
  );
}

// Loading dots animation
export function LoadingDots({ 
  count = 3, 
  size = 8, 
  spacing = 4,
  color = 'var(--color-primary)' 
}: {
  count?: number;
  size?: number;
  spacing?: number;
  color?: string;
}) {
  const dotsRef = useRef<HTMLSpanElement[]>([]);

  useEffect(() => {
    dotsRef.current.forEach((dot, index) => {
      if (dot) {
        pulseOpacity(dot, {
          minOpacity: 0.3,
          duration: 1.5,
          repeat: -1
        });
      }
    });
  }, []);

  return (
    <div className="u-flex" style={{ gap: `${spacing}px` }}>
      {Array.from({ length: count }).map((_, index) => (
        <span
          key={index}
          ref={(el) => {
            if (el) dotsRef.current[index] = el;
          }}
          className="u-inline-block u-rounded-full"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            backgroundColor: color,
            animationDelay: `${index * 0.2}s`
          }}
        />
      ))}
    </div>
  );
}

// Pulse indicator for live status
export function LivePulseIndicator({ 
  size = 12,
  color = 'var(--color-success)' 
}: {
  size?: number;
  color?: string;
}) {
  const pulseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pulseRef.current) {
      pulseOpacity(pulseRef.current, {
        minOpacity: 0.4,
        duration: 2,
        repeat: -1
      });
    }
  }, []);

  return (
    <div className="u-relative u-inline-flex">
      {/* Outer pulse ring */}
      <div
        className="u-absolute u-inset-0 u-rounded-full"
        style={{
          width: `${size * 1.5}px`,
          height: `${size * 1.5}px`,
          border: `2px solid ${color}`,
          opacity: 0.5
        }}
      />
      
      {/* Inner pulse dot */}
      <div
        ref={pulseRef}
        className="u-rounded-full"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: color
        }}
      />
    </div>
  );
}
