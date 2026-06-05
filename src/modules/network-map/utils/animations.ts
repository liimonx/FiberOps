"use client";

import gsap from 'gsap';
import { createLogger } from '@/lib/logger';

const log = createLogger('Animation');

// Animation presets for consistent timing and easing
export const animationPresets = {
  // Quick transitions (150-200ms)
  quick: {
    duration: 0.15,
    ease: 'power2.out'
  },
  
  // Standard transitions (200-300ms)
  standard: {
    duration: 0.25,
    ease: 'power2.inOut'
  },
  
  // Smooth transitions (300-400ms)
  smooth: {
    duration: 0.35,
    ease: 'power3.inOut'
  },
  
  // Emphasis animations (400-600ms)
  emphasis: {
    duration: 0.5,
    ease: 'elastic.out(1, 0.5)'
  },
  
  // Page transitions (500-700ms)
  page: {
    duration: 0.6,
    ease: 'power3.inOut'
  }
};

// Color transition helper
export function animateColor(
  element: HTMLElement | SVGElement,
  property: string,
  fromColor: string,
  toColor: string,
  duration: number = 0.3
): gsap.core.Tween {
  return gsap.to(element, {
    [property]: toColor,
    duration,
    ease: 'power2.inOut',
    onStart: () => {
      gsap.set(element, { [property]: fromColor });
    }
  });
}

// Fade in animation
export function fadeIn(
  element: HTMLElement | SVGElement | string,
  options?: {
    duration?: number;
    delay?: number;
    onComplete?: () => void;
  }
): gsap.core.Tween {
  return gsap.fromTo(element, {
    opacity: 0,
    y: 10
  }, {
    opacity: 1,
    y: 0,
    duration: options?.duration || animationPresets.standard.duration,
    delay: options?.delay || 0,
    ease: animationPresets.standard.ease,
    onComplete: options?.onComplete
  });
}

// Fade out animation
export function fadeOut(
  element: HTMLElement | SVGElement | string,
  options?: {
    duration?: number;
    onComplete?: () => void;
  }
): gsap.core.Tween {
  return gsap.to(element, {
    opacity: 0,
    y: -10,
    duration: options?.duration || animationPresets.quick.duration,
    ease: animationPresets.quick.ease,
    onComplete: options?.onComplete
  });
}

// Scale animation for emphasis
export function scalePulse(
  element: HTMLElement | SVGElement | string,
  options?: {
    scale?: number;
    duration?: number;
    repeat?: number;
  }
): gsap.core.Tween {
  return gsap.to(element, {
    scale: options?.scale || 1.1,
    duration: (options?.duration || 0.3) / 2,
    ease: 'power2.inOut',
    yoyo: true,
    repeat: options?.repeat || 1
  });
}

// Slide in from direction
export function slideIn(
  element: HTMLElement | SVGElement | string,
  direction: 'left' | 'right' | 'top' | 'bottom' = 'left',
  options?: {
    distance?: number;
    duration?: number;
    delay?: number;
  }
): gsap.core.Tween {
  const directions = {
    left: { x: -1 * (options?.distance || 20), y: 0 },
    right: { x: options?.distance || 20, y: 0 },
    top: { x: 0, y: -1 * (options?.distance || 20) },
    bottom: { x: 0, y: options?.distance || 20 }
  };

  const fromValues = directions[direction];

  return gsap.fromTo(element, {
    ...fromValues,
    opacity: 0
  }, {
    x: 0,
    y: 0,
    opacity: 1,
    duration: options?.duration || animationPresets.smooth.duration,
    delay: options?.delay || 0,
    ease: animationPresets.smooth.ease
  });
}

// Stagger animation for lists
export function staggerFadeIn(
  elements: HTMLElement[] | SVGElement[] | string,
  options?: {
    stagger?: number;
    duration?: number;
    delay?: number;
  }
): gsap.core.Tween {
  return gsap.fromTo(elements, {
    opacity: 0,
    y: 15
  }, {
    opacity: 1,
    y: 0,
    duration: options?.duration || animationPresets.standard.duration,
    stagger: options?.stagger || 0.05,
    delay: options?.delay || 0,
    ease: animationPresets.standard.ease
  });
}

// Rotate animation
export function rotate(
  element: HTMLElement | SVGElement | string,
  degrees: number,
  options?: {
    duration?: number;
    repeat?: number;
  }
): gsap.core.Tween {
  return gsap.to(element, {
    rotation: degrees,
    duration: options?.duration || 0.5,
    ease: 'power2.inOut',
    repeat: options?.repeat || 0
  });
}

// Continuous spin animation
export function spin(
  element: HTMLElement | SVGElement | string,
  options?: {
    duration?: number;
  }
): gsap.core.Tween {
  return gsap.to(element, {
    rotation: 360,
    duration: options?.duration || 1,
    ease: 'none',
    repeat: -1
  });
}

// Bounce animation
export function bounce(
  element: HTMLElement | SVGElement | string,
  options?: {
    height?: number;
    duration?: number;
    repeat?: number;
  }
): gsap.core.Tween {
  return gsap.to(element, {
    y: -1 * (options?.height || 10),
    duration: (options?.duration || 0.4) / 2,
    ease: 'power2.out',
    yoyo: true,
    repeat: options?.repeat || 2
  });
}

// Shake animation for errors
export function shake(
  element: HTMLElement | SVGElement | string,
  options?: {
    distance?: number;
    duration?: number;
  }
): gsap.core.Tween {
  const distance = options?.distance || 5;
  const duration = options?.duration || 0.4;

  return gsap.to(element, {
    x: distance,
    duration: duration / 4,
    ease: 'power2.inOut',
    yoyo: true,
    repeat: 3
  });
}

// Pulse opacity animation
export function pulseOpacity(
  element: HTMLElement | SVGElement | string,
  options?: {
    minOpacity?: number;
    duration?: number;
    repeat?: number;
  }
): gsap.core.Tween {
  return gsap.to(element, {
    opacity: options?.minOpacity || 0.5,
    duration: (options?.duration || 1) / 2,
    ease: 'power2.inOut',
    yoyo: true,
    repeat: options?.repeat || -1 // Infinite by default
  });
}

// Path drawing animation (for SVG lines)
export function drawPath(
  element: SVGElement | string,
  options?: {
    duration?: number;
    delay?: number;
  }
): gsap.core.Tween {
  return gsap.fromTo(element, {
    strokeDasharray: '1000',
    strokeDashoffset: 1000
  }, {
    strokeDashoffset: 0,
    duration: options?.duration || 1,
    delay: options?.delay || 0,
    ease: 'power2.inOut'
  });
}

// Morph between shapes (for SVG)
export function morphShape(
  element: SVGElement | string,
  pathData: string,
  options?: {
    duration?: number;
  }
): gsap.core.Tween {
  return gsap.to(element, {
    attr: { d: pathData },
    duration: options?.duration || 0.5,
    ease: 'power2.inOut'
  });
}

// Timeline creator for complex sequences
export function createTimeline(options?: gsap.TimelineVars): gsap.core.Timeline {
  return gsap.timeline({
    defaults: {
      ease: animationPresets.standard.ease
    },
    ...options
  });
}

// Performance monitoring
export class AnimationPerformanceMonitor {
  private static fps: number = 60;
  private static frameCount: number = 0;
  private static lastTime: number = performance.now();

  static startMonitoring(): void {
    const measure = () => {
      this.frameCount++;
      const currentTime = performance.now();
      
      if (currentTime >= this.lastTime + 1000) {
        this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
        this.frameCount = 0;
        this.lastTime = currentTime;
        
        // Log if FPS drops below threshold
        if (this.fps < 30) {
          log.warn(`Low FPS detected: ${this.fps}`);
        }
      }
      
      requestAnimationFrame(measure);
    };
    
    requestAnimationFrame(measure);
  }

  static getFPS(): number {
    return this.fps;
  }

  static isPerformant(): boolean {
    return this.fps >= 50;
  }
}

// CSS class helpers for transitions
export const transitionClasses = {
  // Opacity transitions
  fade: 'transition-opacity',
  fadeFast: 'transition-opacity duration-150',
  fadeSlow: 'transition-opacity duration-500',
  
  // Transform transitions
  transform: 'transition-transform',
  transformFast: 'transition-transform duration-150',
  transformSlow: 'transition-transform duration-500',
  
  // All properties
  all: 'transition-all',
  allFast: 'transition-all duration-150',
  allSlow: 'transition-all duration-500',
  
  // Hover effects
  hoverLift: 'hover:translate-y-[-2px] hover:shadow-lg',
  hoverScale: 'hover:scale-105',
  hoverGlow: 'hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]',
  
  // Active states
  activeScale: 'active:scale-95',
  activeOpacity: 'active:opacity-75',
  
  // Focus states
  focusRing: 'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
  
  // Combined
  interactive: 'transition-all duration-200 hover:translate-y-[-2px] hover:shadow-lg active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
};

// Easing functions reference
export const easings = {
  linear: 'linear',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',
  
  // GSAP easings (for JS animations)
  power1: 'power1.inOut',
  power2: 'power2.inOut',
  power3: 'power3.inOut',
  power4: 'power4.inOut',
  back: 'back.inOut',
  elastic: 'elastic.out(1, 0.5)',
  bounce: 'bounce.out',
  circ: 'circ.inOut',
  expo: 'expo.inOut',
  sine: 'sine.inOut'
};
