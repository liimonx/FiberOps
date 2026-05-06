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

  it('should show tooltip immediately when delayEnter is 0', () => {
    const { result } = renderHook(() => useTooltipHover({ delayEnter: 0 }));
    
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

  it('should show tooltip after delayEnter when delayEnter > 0', () => {
    const { result } = renderHook(() => useTooltipHover({ delayEnter: 100 }));
    
    act(() => {
      result.current.showTooltip(mockContent, 100, 200);
    });

    expect(result.current.tooltip.visible).toBe(false);

    act(() => {
      vi.advanceTimersByTime(100);
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

  it('should hide tooltip after delayLeave when immediate is false', () => {
    const { result } = renderHook(() => useTooltipHover({ delayLeave: 150 }));
    
    act(() => {
      result.current.showTooltip(mockContent, 100, 200);
    });
    
    act(() => {
      result.current.hideTooltip(false);
    });
    expect(result.current.tooltip.visible).toBe(true);

    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(result.current.tooltip.visible).toBe(false);
  });

  it('should prevent hiding tooltip when mouse enters', () => {
    const { result } = renderHook(() => useTooltipHover({ delayLeave: 150 }));
    
    act(() => {
      result.current.showTooltip(mockContent, 100, 200);
    });
    
    act(() => {
      result.current.handleMouseEnter();
    });

    act(() => {
      result.current.hideTooltip(false);
    });

    act(() => {
      vi.advanceTimersByTime(150);
    });
    
    // Should still be visible because mouse is hovering over the tooltip
    expect(result.current.tooltip.visible).toBe(true);
  });

  it('should hide tooltip when mouse leaves', () => {
    const { result } = renderHook(() => useTooltipHover({ delayLeave: 150 }));
    
    act(() => {
      result.current.showTooltip(mockContent, 100, 200);
    });
    
    act(() => {
      result.current.handleMouseEnter();
    });
    
    act(() => {
      result.current.handleMouseLeave();
    });

    expect(result.current.tooltip.visible).toBe(true);

    act(() => {
      vi.advanceTimersByTime(150);
    });
    
    expect(result.current.tooltip.visible).toBe(false);
  });

  it('should clear pending timeouts on unmount', () => {
    const { result, unmount } = renderHook(() => useTooltipHover({ delayLeave: 150 }));
    
    act(() => {
      result.current.showTooltip(mockContent, 100, 200);
    });
    
    act(() => {
      result.current.hideTooltip(false);
    });

    unmount();

    act(() => {
      vi.advanceTimersByTime(150);
    });
  });

  describe('Race Condition Fix', () => {
    it('should handle rapid consecutive showTooltip calls with delay', () => {
      const { result } = renderHook(() => useTooltipHover({ delayEnter: 50 }));

      act(() => {
        result.current.showTooltip(mockContent, 100, 200);
      });

      act(() => {
        result.current.showTooltip({ ...mockContent, title: 'Second' }, 150, 250);
      });

      act(() => {
        vi.advanceTimersByTime(50);
      });

      expect(result.current.tooltip.content?.title).toBe('Second');
    });

    it('should prevent tooltip from showing when hover leaves during delay', () => {
      const { result } = renderHook(() => useTooltipHover({ delayEnter: 100, delayLeave: 50 }));

      act(() => {
        result.current.showTooltip(mockContent, 100, 200);
      });

      act(() => {
        result.current.handleMouseLeave();
      });

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current.tooltip.visible).toBe(false);
    });

    it('should clear pending timeout when showTooltip is called during delay', () => {
      const { result } = renderHook(() => useTooltipHover({ delayEnter: 100 }));

      act(() => {
        result.current.showTooltip(mockContent, 100, 200);
      });

      act(() => {
        vi.advanceTimersByTime(50);
      });

      act(() => {
        result.current.showTooltip({ ...mockContent, title: 'Updated' }, 300, 400);
      });

      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current.tooltip.content?.title).toBe('Updated');
    });

    it('should show tooltip immediately when delayEnter is 0 regardless of hover state', () => {
      const { result } = renderHook(() => useTooltipHover({ delayEnter: 0 }));

      act(() => {
        result.current.handleMouseEnter();
      });

      act(() => {
        result.current.showTooltip(mockContent, 100, 200);
      });

      expect(result.current.tooltip.visible).toBe(true);
      expect(result.current.tooltip.content).toEqual(mockContent);
    });
  });
});
