import { render, screen } from '@testing-library/react';
import { InteractiveTooltip } from './InteractiveTooltip';
import { NetworkStatus, NetworkNodeType, LatLng } from '../types';
import { vi, describe, it, expect } from 'vitest';

describe('InteractiveTooltip Null Safety', () => {
  const mockLatLngPosition: LatLng = { lat: 40.7128, lng: -74.006 };
  const mockPixelPosition = { x: 100, y: 200 };

  const mockContent = {
    title: 'Test Node',
    subtitle: 'Test Subtitle',
    status: NetworkStatus.ACTIVE,
    details: [
      { label: 'IP', value: '192.168.1.1' },
      { label: 'Port', value: 8080 }
    ]
  };

  const mockNode = {
    id: 'node-1',
    name: 'Test Node',
    type: NetworkNodeType.ACCESS_NODE,
    position: mockLatLngPosition,
    status: NetworkStatus.ACTIVE
  };

  it('should not render when visible is false and content is null', () => {
    const { container } = render(
      <InteractiveTooltip
        content={null as any}
        position={mockPixelPosition}
        visible={false}
      />
    );
    expect(container.innerHTML).toBe('');
  });

  it('should not render when visible is false and content is valid', () => {
    const { container } = render(
      <InteractiveTooltip
        content={mockContent}
        position={mockPixelPosition}
        visible={false}
      />
    );
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it('should not render when visible is true but content is null', () => {
    const { container } = render(
      <InteractiveTooltip
        content={null as any}
        position={mockPixelPosition}
        visible={true}
      />
    );
    expect(container.innerHTML).toBe('');
  });

  it('should render when visible is true and content is valid', () => {
    render(
      <InteractiveTooltip
        content={mockContent}
        node={mockNode}
        position={mockPixelPosition}
        visible={true}
      />
    );
    expect(screen.queryByRole('dialog')).toBeInTheDocument();
  });

  it('should render when content is provided with empty details array', () => {
    const contentWithEmptyDetails = {
      title: 'Test',
      status: NetworkStatus.ACTIVE,
      details: []
    };

    const { container } = render(
      <InteractiveTooltip
        content={contentWithEmptyDetails}
        position={mockPixelPosition}
        visible={true}
      />
    );
    expect(container.querySelector('[role="dialog"]')).toBeInTheDocument();
  });

  it('should handle undefined actions array safely', () => {
    const contentWithUndefinedActions = {
      title: 'Test',
      status: NetworkStatus.ACTIVE,
      details: [],
      actions: undefined as any
    };

    const { container } = render(
      <InteractiveTooltip
        content={contentWithUndefinedActions}
        position={mockPixelPosition}
        visible={true}
      />
    );
    expect(container.querySelector('[role="dialog"]')).toBeInTheDocument();
  });

  it('should not throw when accessing content properties with null content', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(
        <InteractiveTooltip
          content={null as any}
          position={mockPixelPosition}
          visible={false}
        />
      );
    }).not.toThrow();

    consoleSpy.mockRestore();
  });

  describe('Edge Cases', () => {
    it('should render with empty string title', () => {
      const contentWithEmptyTitle = {
        title: '',
        status: NetworkStatus.ACTIVE,
        details: []
      };

      const { container } = render(
        <InteractiveTooltip
          content={contentWithEmptyTitle}
          position={mockPixelPosition}
          visible={true}
        />
      );
      expect(container.querySelector('[role="dialog"]')).toBeInTheDocument();
    });

    it('should render with numeric values in details', () => {
      const contentWithNumericValues = {
        title: 'Metrics',
        status: NetworkStatus.ACTIVE,
        details: [
          { label: 'CPU', value: 85 },
          { label: 'Memory', value: '75%' }
        ]
      };

      render(
        <InteractiveTooltip
          content={contentWithNumericValues}
          position={mockPixelPosition}
          visible={true}
        />
      );
      expect(screen.queryByRole('dialog')).toBeInTheDocument();
    });

    it('should render with metadata object', () => {
      const contentWithMetadata = {
        title: 'With Metadata',
        status: NetworkStatus.ACTIVE,
        details: [],
        metadata: { createdAt: '2024-01-01', updatedAt: '2024-01-02' }
      };

      render(
        <InteractiveTooltip
          content={contentWithMetadata}
          position={mockPixelPosition}
          visible={true}
        />
      );
      expect(screen.queryByRole('dialog')).toBeInTheDocument();
    });
  });
});