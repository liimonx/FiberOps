import { renderHook, act } from '@testing-library/react';
import { useTooltipHover } from './useTooltipHover';
import { TooltipContent } from '../components/InteractiveTooltip';
import { NetworkStatus } from '../types';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('useTooltipHover', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  const mockContent: TooltipContent = {
    title: 'Test Tooltip',
    status: NetworkStatus.ACTIVE,
    details: []
  };

  it('should initialize with null tooltip content and invisible', () => {
    const { result } = renderHook(() => useTooltipHover());
    expect(result.current.tooltip).toEqual({
      content: null,
      x: 0,
      y: 0,
      visible: false
    });
  });

  it('should show tooltip immediately', () => {
    const { result } = renderHook(() => useTooltipHover());
    
    act(() => {
      result.current.showTooltip(mockContent, 100, 200);
    });

    expect(result.current.tooltip).toEqual({
      content: mockContent,
      x: 100,
      y: 200,
      visible: true
    });
  });

  it('should hide tooltip immediately when immediate is true', () => {
    const { result } = renderHook(() => useTooltipHover());
    
    act(() => {
      result.current.showTooltip(mockContent, 100, 200);
    });
    expect(result.current.tooltip.visible).toBe(true);

    act(() => {
      result.current.hideTooltip(true);
    });
    expect(result.current.tooltip.visible).toBe(false);
  });

  it('should hide tooltip after delay when mouse leaves', () => {
    const { result } = renderHook(() => useTooltipHover());
    
    act(() => {
      result.current.showTooltip(mockContent, 100, 200);
    });
    
    act(() => {
      result.current.handleMouseEnter();
    });
    
    act(() => {
      result.current.handleMouseLeave();
    });

    // Should still be visible immediately after leaving (due to delay)
    expect(result.current.tooltip.visible).toBe(true);

    act(() => {
      vi.advanceTimersByTime(300);
    });
    
    expect(result.current.tooltip.visible).toBe(false);
  });

  it('should hide tooltip after delay when hideTooltip is called without immediate flag if not hovered', () => {
    const { result } = renderHook(() => useTooltipHover());
    
    act(() => {
      result.current.showTooltip(mockContent, 100, 200);
    });
    
    act(() => {
      result.current.hideTooltip();
    });

    expect(result.current.tooltip.visible).toBe(true);

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.tooltip.visible).toBe(false);
  });

  it('should NOT hide tooltip when hideTooltip is called if hovered', () => {
    const { result } = renderHook(() => useTooltipHover());
    
    act(() => {
      result.current.showTooltip(mockContent, 100, 200);
    });
    
    act(() => {
      result.current.handleMouseEnter();
    });
    
    act(() => {
      result.current.hideTooltip();
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.tooltip.visible).toBe(true);
  });

  it('should NOT reset hover state when showTooltip is called', () => {
    const { result } = renderHook(() => useTooltipHover());
    
    act(() => {
      result.current.showTooltip(mockContent, 100, 200);
    });
    
    act(() => {
      result.current.handleMouseEnter();
    });
    
    expect(result.current.tooltip.visible).toBe(true);
    
    act(() => {
      result.current.showTooltip(mockContent, 110, 210);
    });

    act(() => {
      result.current.hideTooltip();
    });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Should still be visible because we are still "hovered" and showTooltip didn't reset it
    expect(result.current.tooltip.visible).toBe(true);
  });

  it('should use custom delay when provided', () => {
    const { result } = renderHook(() => useTooltipHover({ delay: 500 }));
    
    act(() => {
      result.current.showTooltip(mockContent, 100, 200);
    });
    
    act(() => {
      result.current.hideTooltip();
    });

    // At 300ms it should still be visible (unlike default)
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current.tooltip.visible).toBe(true);

    // At 500ms it should hide
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current.tooltip.visible).toBe(false);
  });

  it('should NOT hide automatically when autoHide is false', () => {
    const { result } = renderHook(() => useTooltipHover({ autoHide: false }));
    
    act(() => {
      result.current.showTooltip(mockContent, 100, 200);
    });
    
    act(() => {
      result.current.hideTooltip();
    });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Should still be visible even after long delay
    expect(result.current.tooltip.visible).toBe(true);

    // Should still hide if immediate is forced
    act(() => {
      result.current.hideTooltip(true);
    });
    expect(result.current.tooltip.visible).toBe(false);
  });
});

