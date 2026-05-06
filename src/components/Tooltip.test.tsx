import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tooltip } from './Tooltip';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Tooltip Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('should render children without crashing', () => {
    render(
      <Tooltip content="Tooltip Content">
        <button>Hover Me</button>
      </Tooltip>
    );
    expect(screen.getByText('Hover Me')).toBeInTheDocument();
    // Tooltip should not be in the document initially
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('should show tooltip on hover with delay', async () => {
    render(
      <Tooltip content="Tooltip Content" delayShow={200}>
        <button>Hover Me</button>
      </Tooltip>
    );

    const button = screen.getByText('Hover Me');
    fireEvent.mouseEnter(button);

    // Should not be visible immediately
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    // Advance timer
    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Now it should be visible
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveTextContent('Tooltip Content');
  });

  it('should hide tooltip on mouse leave with delay', async () => {
    render(
      <Tooltip content="Tooltip Content" delayShow={0} delayHide={300}>
        <button>Hover Me</button>
      </Tooltip>
    );

    const button = screen.getByText('Hover Me');
    fireEvent.mouseEnter(button);

    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    fireEvent.mouseLeave(button);

    // Should still be visible immediately after leave
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    // Advance timer
    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Should be hidden (opacity 0 / visibility hidden)
    const tooltip = screen.getByRole('tooltip', { hidden: true });
    expect(tooltip).toHaveStyle({ opacity: '0', visibility: 'hidden' });
  });

  it('should show tooltip on focus and hide on blur', () => {
    render(
      <Tooltip content="Focus Content" delayShow={0} delayHide={0}>
        <button>Focus Me</button>
      </Tooltip>
    );

    const button = screen.getByText('Focus Me');
    
    fireEvent.focus(button);
    act(() => {
      vi.advanceTimersByTime(0);
    });
    
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    expect(screen.getByRole('tooltip')).toHaveTextContent('Focus Content');

    fireEvent.blur(button);
    act(() => {
      vi.advanceTimersByTime(0);
    });
    
    expect(screen.getByRole('tooltip', { hidden: true })).toHaveStyle({ opacity: '0', visibility: 'hidden' });
  });

  it('should remain visible when hovering over the tooltip itself', () => {
    render(
      <Tooltip content="Interactive Content" delayShow={0} delayHide={200}>
        <button>Hover Me</button>
      </Tooltip>
    );

    const button = screen.getByText('Hover Me');
    fireEvent.mouseEnter(button);

    act(() => {
      vi.advanceTimersByTime(0);
    });

    const tooltip = screen.getByRole('tooltip');
    
    // Leave button and enter tooltip
    fireEvent.mouseLeave(button);
    fireEvent.mouseEnter(tooltip);

    act(() => {
      vi.advanceTimersByTime(200);
    });

    // Should still be visible because we hovered the tooltip
    expect(tooltip).toHaveStyle({ opacity: '1', visibility: 'visible' });
  });

  it('should hide when Escape key is pressed', () => {
    render(
      <Tooltip content="Escape Content" delayShow={0}>
        <button>Hover Me</button>
      </Tooltip>
    );

    const button = screen.getByText('Hover Me');
    fireEvent.mouseEnter(button);

    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });

    act(() => {
      vi.advanceTimersByTime(0); // Uses default delayHide (300)
      vi.advanceTimersByTime(300);
    });

    expect(screen.getByRole('tooltip', { hidden: true })).toHaveStyle({ opacity: '0', visibility: 'hidden' });
  });

  it('should add aria-describedby to the trigger element when mounted', () => {
    render(
      <Tooltip content="Aria Content" delayShow={0}>
        <button>Hover Me</button>
      </Tooltip>
    );

    const button = screen.getByText('Hover Me');
    expect(button).not.toHaveAttribute('aria-describedby');

    fireEvent.mouseEnter(button);
    
    act(() => {
      vi.advanceTimersByTime(0);
    });

    expect(button).toHaveAttribute('aria-describedby');
    const tooltipId = button.getAttribute('aria-describedby');
    expect(screen.getByRole('tooltip')).toHaveAttribute('id', tooltipId);
  });
});
