import { render, screen, fireEvent } from '@testing-library/react';
import { Tooltip } from './Tooltip';
import { describe, it, expect } from 'vitest';

describe('Tooltip Component', () => {
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

  it('should show tooltip immediately on hover', () => {
    render(
      <Tooltip content="Tooltip Content">
        <button>Hover Me</button>
      </Tooltip>
    );

    const button = screen.getByText('Hover Me');
    fireEvent.mouseEnter(button);

    // Should be visible immediately
    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveTextContent('Tooltip Content');
  });

  it('should hide tooltip immediately on mouse leave', () => {
    render(
      <Tooltip content="Tooltip Content">
        <button>Hover Me</button>
      </Tooltip>
    );

    const button = screen.getByText('Hover Me');
    fireEvent.mouseEnter(button);

    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    fireEvent.mouseLeave(button);

    // Should be hidden immediately
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('should show tooltip on focus and hide on blur', () => {
    render(
      <Tooltip content="Focus Content">
        <button>Focus Me</button>
      </Tooltip>
    );

    const button = screen.getByText('Focus Me');
    
    fireEvent.focus(button);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    expect(screen.getByRole('tooltip')).toHaveTextContent('Focus Content');

    fireEvent.blur(button);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('should hide when mouse leaves the trigger element', () => {
    render(
      <Tooltip content="Interactive Content">
        <button>Hover Me</button>
      </Tooltip>
    );

    const button = screen.getByText('Hover Me');
    fireEvent.mouseEnter(button);

    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    
    // Leave button - tooltip should hide immediately
    fireEvent.mouseLeave(button);

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('should add aria-describedby to the wrapper element when visible', () => {
    render(
      <Tooltip content="Aria Content">
        <button>Hover Me</button>
      </Tooltip>
    );

    const button = screen.getByText('Hover Me');
    
    // Initially should not have aria-describedby
    expect(button.closest('div')).not.toHaveAttribute('aria-describedby');

    fireEvent.mouseEnter(button);
    
    // Wrapper should have aria-describedby when tooltip is visible
    const wrapper = button.closest('div');
    expect(wrapper).toHaveAttribute('aria-describedby');
    
    const tooltipId = wrapper?.getAttribute('aria-describedby');
    expect(screen.getByRole('tooltip')).toHaveAttribute('id', tooltipId);
  });
});
