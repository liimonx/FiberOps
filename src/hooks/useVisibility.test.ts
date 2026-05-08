import { renderHook, act } from '@testing-library/react';
import { useVisibility } from './useVisibility';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('useVisibility', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('should initialize with default visible state (false)', () => {
    const { result } = renderHook(() => useVisibility());
    expect(result.current.visible).toBe(false);
  });

  it('should initialize with custom visible state', () => {
    const { result } = renderHook(() => useVisibility({ initialVisible: true }));
    expect(result.current.visible).toBe(true);
  });

  it('should show immediately when no delay is specified', () => {
    const { result } = renderHook(() => useVisibility());
    
    act(() => {
      result.current.show();
    });

    expect(result.current.visible).toBe(true);
  });

  it('should hide immediately when no delay is specified', () => {
    const { result } = renderHook(() => useVisibility({ initialVisible: true }));
    
    act(() => {
      result.current.hide();
    });

    expect(result.current.visible).toBe(false);
  });

  it('should show with delay when showDelay is specified', () => {
    const { result } = renderHook(() => useVisibility({ showDelay: 200 }));
    
    act(() => {
      result.current.show();
    });

    // Should not be visible immediately
    expect(result.current.visible).toBe(false);

    // Advance timer
    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Should be visible after delay
    expect(result.current.visible).toBe(true);
  });

  it('should hide with delay when hideDelay is specified', () => {
    const { result } = renderHook(() => useVisibility({ 
      initialVisible: true, 
      hideDelay: 300 
    }));
    
    act(() => {
      result.current.hide();
    });

    // Should still be visible immediately
    expect(result.current.visible).toBe(true);

    // Advance timer
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Should be hidden after delay
    expect(result.current.visible).toBe(false);
  });

  it('should toggle visibility', () => {
    const { result } = renderHook(() => useVisibility());
    
    act(() => {
      result.current.toggle();
    });
    expect(result.current.visible).toBe(true);

    act(() => {
      result.current.toggle();
    });
    expect(result.current.visible).toBe(false);
  });

  it('should set visibility directly', () => {
    const { result } = renderHook(() => useVisibility());
    
    act(() => {
      result.current.setVisible(true);
    });
    expect(result.current.visible).toBe(true);

    act(() => {
      result.current.setVisible(false);
    });
    expect(result.current.visible).toBe(false);
  });

  it('should call onVisibilityChange callback when visibility changes', () => {
    const onVisibilityChange = vi.fn();
    const { result } = renderHook(() => 
      useVisibility({ onVisibilityChange })
    );
    
    act(() => {
      result.current.show();
    });
    expect(onVisibilityChange).toHaveBeenCalledWith(true);

    act(() => {
      result.current.hide();
    });
    expect(onVisibilityChange).toHaveBeenCalledWith(false);
  });

  it('should clear pending timeouts when show/hide is called multiple times', () => {
    const { result } = renderHook(() => useVisibility({ showDelay: 200, hideDelay: 200 }));
    
    // Call show multiple times
    act(() => {
      result.current.show();
      result.current.show(); // Should clear previous timeout
    });

    // Advance timer
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current.visible).toBe(true);

    // Call hide multiple times
    act(() => {
      result.current.hide();
      result.current.hide(); // Should clear previous timeout
    });

    // Advance timer
    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(result.current.visible).toBe(false);
  });

  it('should clean up timeouts on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
    
    const { result, unmount } = renderHook(() => useVisibility({ showDelay: 1000 }));
    
    // Start a timeout
    act(() => {
      result.current.show();
    });

    // Unmount while timeout is pending
    act(() => {
      unmount();
    });

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });
});