"use client";

// Performance monitoring and optimization utilities
export class PerformanceOptimizer {
  private static frameCount = 0;
  private static fps = 60;
  private static lastTime = performance.now();
  private static isMonitoring = false;
  private static callbacks: Array<(fps: number) => void> = [];

  // Start FPS monitoring
  static startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.lastTime = performance.now();
    
    const measure = () => {
      this.frameCount++;
      const currentTime = performance.now();
      
      if (currentTime >= this.lastTime + 1000) {
        this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
        this.frameCount = 0;
        this.lastTime = currentTime;
        
        // Notify callbacks
        this.callbacks.forEach(cb => cb(this.fps));
        
        // Warn if FPS drops below threshold
        if (this.fps < 30 && process.env.NODE_ENV === 'development') {
          console.warn(`[Performance] Low FPS detected: ${this.fps}`);
        }
      }
      
      if (this.isMonitoring) {
        requestAnimationFrame(measure);
      }
    };
    
    requestAnimationFrame(measure);
  }

  // Stop FPS monitoring
  static stopMonitoring(): void {
    this.isMonitoring = false;
  }

  // Get current FPS
  static getFPS(): number {
    return this.fps;
  }

  // Check if performance is acceptable
  static isPerformant(threshold: number = 50): boolean {
    return this.fps >= threshold;
  }

  // Register FPS callback
  static onFPSUpdate(callback: (fps: number) => void): () => void {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter(cb => cb !== callback);
    };
  }

  // Measure execution time
  static measure<T>(label: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    const duration = end - start;
    
    if (duration > 16 && process.env.NODE_ENV === 'development') {
      console.warn(`[Performance] ${label} took ${duration.toFixed(2)}ms (>16ms threshold)`);
    }
    
    return result;
  }

  // Debounce function for performance
  static debounce<TArgs extends unknown[]>(
    fn: (...args: TArgs) => void,
    wait: number
  ): (...args: TArgs) => void {
    let timeout: NodeJS.Timeout | null = null;
    
    return (...args: TArgs) => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), wait);
    };
  }

  // Throttle function for performance
  static throttle<TArgs extends unknown[]>(
    fn: (...args: TArgs) => void,
    limit: number
  ): (...args: TArgs) => void {
    let inThrottle = false;
    
    return (...args: TArgs) => {
      if (!inThrottle) {
        fn(...args);
        inThrottle = true;
        setTimeout(() => { inThrottle = false; }, limit);
      }
    };
  }
}

// RAF (Request Animation Frame) scheduler for smooth animations
export class RAFScheduler {
  private tasks: Map<string, FrameRequestCallback> = new Map();
  private taskIds: Map<string, number> = new Map();

  // Schedule a task to run on next frame
  schedule(id: string, task: FrameRequestCallback): void {
    // Cancel existing task with same ID
    this.cancel(id);
    
    this.tasks.set(id, task);
    const rafId = requestAnimationFrame((time) => {
      task(time);
      this.tasks.delete(id);
      this.taskIds.delete(id);
    });
    
    this.taskIds.set(id, rafId);
  }

  // Cancel a scheduled task
  cancel(id: string): void {
    const rafId = this.taskIds.get(id);
    if (rafId !== undefined) {
      cancelAnimationFrame(rafId);
      this.taskIds.delete(id);
      this.tasks.delete(id);
    }
  }

  // Cancel all tasks
  cancelAll(): void {
    this.taskIds.forEach(rafId => cancelAnimationFrame(rafId));
    this.taskIds.clear();
    this.tasks.clear();
  }
}

// Virtual scrolling helper for large lists
export class VirtualScroller {
  private itemHeight: number;
  private containerHeight: number;
  private totalItems: number;
  private overscan: number;

  constructor(
    itemHeight: number,
    containerHeight: number,
    totalItems: number,
    overscan: number = 5
  ) {
    this.itemHeight = itemHeight;
    this.containerHeight = containerHeight;
    this.totalItems = totalItems;
    this.overscan = overscan;
  }

  // Calculate visible range based on scroll position
  getVisibleRange(scrollTop: number): { startIndex: number; endIndex: number } {
    const startIndex = Math.max(0, Math.floor(scrollTop / this.itemHeight) - this.overscan);
    const visibleCount = Math.ceil(this.containerHeight / this.itemHeight);
    const endIndex = Math.min(
      this.totalItems - 1,
      startIndex + visibleCount + this.overscan * 2
    );

    return { startIndex, endIndex };
  }

  // Calculate total height
  getTotalHeight(): number {
    return this.totalItems * this.itemHeight;
  }

  // Get offset for a specific item
  getItemOffset(index: number): number {
    return index * this.itemHeight;
  }
}

// Image lazy loading with intersection observer
export class LazyImageLoader {
  private observer: IntersectionObserver | null = null;
  private loadedImages: Set<string> = new Set();

  constructor(options?: IntersectionObserverInit) {
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target as HTMLImageElement;
              const src = img.dataset.src;
              
              if (src && !this.loadedImages.has(src)) {
                this.loadImage(img, src);
              }
              
              this.observer?.unobserve(img);
            }
          });
        },
        options || { rootMargin: '50px', threshold: 0.1 }
      );
    }
  }

  // Observe an image element
  observe(img: HTMLImageElement): void {
    if (this.observer && img.dataset.src) {
      this.observer.observe(img);
    }
  }

  // Unobserve an image element
  unobserve(img: HTMLImageElement): void {
    this.observer?.unobserve(img);
  }

  // Disconnect observer
  disconnect(): void {
    this.observer?.disconnect();
  }

  // Load image
  private loadImage(img: HTMLImageElement, src: string): void {
    const image = new Image();
    
    image.onload = () => {
      img.src = src;
      img.classList.add('loaded');
      this.loadedImages.add(src);
    };
    
    image.src = src;
  }
}

// Memory management utilities
export class MemoryManager {
  // Clear large objects from memory
  static releaseLargeObjects(objects: Array<Record<string, unknown>>): void {
    objects.forEach(obj => {
      if (obj && typeof obj === 'object') {
        // Nullify properties to help GC
        Object.keys(obj).forEach(key => {
          const val = obj[key];
          if (val instanceof ArrayBuffer || 
              val instanceof Float32Array ||
              (Array.isArray(val) && val.length > 1000)) {
            obj[key] = null;
          }
        });
      }
    });
  }

  // Monitor memory usage (Chrome only)
  static getMemoryUsage(): { usedJSHeapSize: number; totalJSHeapSize: number } | null {
    if ('memory' in performance) {
      const mem = (performance as any).memory;
      return {
        usedJSHeapSize: mem.usedJSHeapSize,
        totalJSHeapSize: mem.totalJSHeapSize
      };
    }
    return null;
  }

  // Warn if memory usage is high
  static checkMemoryUsage(thresholdMB: number = 100): void {
    const usage = this.getMemoryUsage();
    if (usage) {
      const usedMB = usage.usedJSHeapSize / 1024 / 1024;
      if (usedMB > thresholdMB && process.env.NODE_ENV === 'development') {
        console.warn(`[Memory] High memory usage: ${usedMB.toFixed(2)}MB`);
      }
    }
  }
}

// CSS will-change optimization hints
export const performanceHints = {
  // For elements that will be transformed
  transform: { willChange: 'transform' },
  
  // For elements that will change opacity
  opacity: { willChange: 'opacity' },
  
  // For elements with multiple changes
  multi: { willChange: 'transform, opacity' },
  
  // Remove will-change after animation
  auto: { willChange: 'auto' }
};

// GPU acceleration helpers
export const gpuAcceleration = {
  // Force GPU layer
  forceGPU: {
    transform: 'translateZ(0)',
    backfaceVisibility: 'hidden'
  },
  
  // Hardware acceleration class
  className: 'gpu-accelerated'
};

// Add global CSS for GPU acceleration
export const performanceCSS = `
  .gpu-accelerated {
    transform: translateZ(0);
    backface-visibility: hidden;
    perspective: 1000px;
  }
  
  .smooth-scroll {
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
  }
  
  .contain-layout {
    contain: layout style paint;
  }
  
  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
`;
