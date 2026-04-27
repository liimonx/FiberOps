"use client";

import React, { useEffect, useRef } from 'react';
import { Icon } from '@shohojdhara/atomix';
import { NetworkNode, NetworkStatus } from '../types';
import { 
  getStatusColor, 
  statusIcons, 
  statusLabels,
  nodeTypeIcons,
  getNodeMarkerStyle,
  hoverEffects
} from '../utils/statusColors';
import { scalePulse, transitionClasses } from '../utils/animations';

interface EnhancedNetworkNodeProps {
  node: NetworkNode;
  isSelected?: boolean;
  isHovered?: boolean;
  onClick?: (node: NetworkNode) => void;
  onHover?: (node: NetworkNode | null) => void;
  size?: number;
  showLabel?: boolean;
  className?: string;
}

export function EnhancedNetworkNode({
  node,
  isSelected = false,
  isHovered = false,
  onClick,
  onHover,
  size = 12,
  showLabel = true,
  className = ''
}: EnhancedNetworkNodeProps) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const colors = getStatusColor(node.status);
  const icon = nodeTypeIcons[node.type] || 'Circle';

  useEffect(() => {
    // Animate on selection
    if (isSelected && nodeRef.current) {
      scalePulse(nodeRef.current, {
        scale: 1.3,
        duration: 0.4,
        repeat: 1
      });
    }
  }, [isSelected]);

  const handleClick = () => {
    onClick?.(node);
  };

  const handleMouseEnter = () => {
    onHover?.(node);
  };

  const handleMouseLeave = () => {
    onHover?.(null);
  };

  const markerStyle = getNodeMarkerStyle(node.status, size);

  return (
    <div
      ref={nodeRef}
      className={`network-node ${transitionClasses.interactive} ${className}`}
      style={{
        position: 'relative',
        cursor: 'pointer',
        zIndex: isSelected ? 1000 : isHovered ? 100 : 1
      }}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="button"
      tabIndex={0}
      aria-label={`${node.name} - ${statusLabels[node.status]}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
    >
      {/* Glow effect for selected/hovered */}
      {(isSelected || isHovered) && (
        <div
          className="absolute inset-0 rounded-full"
          style={{
            width: `${size * 2}px`,
            height: `${size * 2}px`,
            left: `${-size / 2}px`,
            top: `${-size / 2}px`,
            backgroundColor: colors.glow || 'transparent',
            opacity: isSelected ? 0.3 : 0.2,
            filter: 'blur(8px)',
            transition: 'all 0.2s ease-out'
          }}
        />
      )}

      {/* Main node marker */}
      <div
        className="relative flex items-center justify-center"
        style={{
          ...markerStyle,
          borderRadius: '50%',
          transition: 'all 0.2s ease-out',
          transform: isHovered ? `scale(${hoverEffects.node.scale})` : 'scale(1)'
        }}
      >
        {/* Status indicator ring */}
        {node.status !== NetworkStatus.ACTIVE && (
          <div
            className="absolute inset-0 rounded-full"
            style={{
              border: `2px solid ${colors.primary}`,
              animation: node.status === NetworkStatus.ERROR ? 'pulse-error 2s infinite' : undefined
            }}
          />
        )}

        {/* Icon inside node */}
        {size >= 16 && (
          <Icon
            name={icon as any}
            size={Math.max(size * 0.5, 8)}
            color="white"
            weight="bold"
          />
        )}
      </div>

      {/* Label */}
      {showLabel && (isHovered || isSelected) && (
        <div
          className="absolute left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 rounded bg-dark text-white text-xs whitespace-nowrap shadow-lg"
          style={{
            top: `${size + 4}px`,
            zIndex: 1001,
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div className="font-medium">{node.name}</div>
          <div className="text-2xs opacity-75">{statusLabels[node.status]}</div>
        </div>
      )}

      {/* Selection indicator */}
      {isSelected && (
        <div
          className="absolute -inset-2 rounded-full border-2 border-primary"
          style={{
            animation: 'pulse-active 2s infinite'
          }}
        />
      )}
    </div>
  );
}

// Enhanced connection line component
interface EnhancedConnectionLineProps {
  source: { x: number; y: number };
  target: { x: number; y: number };
  status: NetworkStatus;
  utilization?: number;
  isSelected?: boolean;
  isHovered?: boolean;
  onClick?: () => void;
  onHover?: (isHovered: boolean) => void;
  animated?: boolean;
}

export function EnhancedConnectionLine({
  source,
  target,
  status,
  utilization,
  isSelected = false,
  isHovered = false,
  onClick,
  onHover,
  animated = true
}: EnhancedConnectionLineProps) {
  const lineRef = useRef<SVGLineElement>(null);
  const colors = getStatusColor(status);
  
  // Calculate line properties
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;

  const lineWidth = isHovered || isSelected ? 4 : utilization ? 2 + (utilization / 100) * 2 : 2;
  const opacity = isHovered || isSelected ? 1 : status === NetworkStatus.INACTIVE ? 0.4 : 0.8;

  useEffect(() => {
    if (animated && lineRef.current && status === NetworkStatus.ACTIVE) {
      // Animate dash offset for flow effect
      const line = lineRef.current;
      let offset = 0;
      
      const animate = () => {
        offset -= 1;
        line.style.strokeDashoffset = offset.toString();
        requestAnimationFrame(animate);
      };
      
      const id = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(id);
    }
  }, [animated, status]);

  return (
    <g
      onClick={onClick}
      onMouseEnter={() => onHover?.(true)}
      onMouseLeave={() => onHover?.(false)}
      style={{ cursor: 'pointer' }}
      role="button"
      tabIndex={0}
      aria-label={`Connection - ${status}`}
    >
      {/* Background line for easier clicking */}
      <line
        x1={source.x}
        y1={source.y}
        x2={target.x}
        y2={target.y}
        stroke="transparent"
        strokeWidth={lineWidth + 10}
        fill="none"
      />

      {/* Main connection line */}
      <line
        ref={lineRef}
        x1={source.x}
        y1={source.y}
        x2={target.x}
        y2={target.y}
        stroke={colors.primary}
        strokeWidth={lineWidth}
        opacity={opacity}
        strokeLinecap="round"
        strokeDasharray={status === NetworkStatus.INACTIVE ? '5,5' : animated ? '10,5' : 'none'}
        className="transition-all duration-200"
        style={{
          filter: isHovered || isSelected ? `drop-shadow(0 0 4px ${colors.glow})` : 'none'
        }}
      />

      {/* Utilization indicator */}
      {utilization !== undefined && utilization > 70 && (
        <circle
          cx={(source.x + target.x) / 2}
          cy={(source.y + target.y) / 2}
          r={4}
          fill={utilization > 90 ? '#EF4444' : '#F59E0B'}
          className="animate-pulse"
        />
      )}

      {/* Hover tooltip */}
      {isHovered && (
        <foreignObject
          x={(source.x + target.x) / 2 - 50}
          y={(source.y + target.y) / 2 - 30}
          width={100}
          height={40}
        >
          <div className="bg-dark text-white text-xs px-2 py-1 rounded shadow-lg text-center">
            <div className="font-medium">Connection</div>
            {utilization && <div className="text-2xs">{utilization}% utilized</div>}
          </div>
        </foreignObject>
      )}
    </g>
  );
}

// Status badge component
interface AnimatedStatusBadgeProps {
  status: NetworkStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
}

export function AnimatedStatusBadge({
  status,
  size = 'md',
  showLabel = true,
  animated = true,
  className = ''
}: AnimatedStatusBadgeProps) {
  const colors = getStatusColor(status);
  const icon = statusIcons[status];

  const sizeConfig = {
    sm: { icon: 12, text: 'text-2xs', padding: 'px-2 py-0.5' },
    md: { icon: 16, text: 'text-xs', padding: 'px-2.5 py-1' },
    lg: { icon: 20, text: 'text-sm', padding: 'px-3 py-1.5' }
  };

  const config = sizeConfig[size];

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full ${config.padding} ${className}`}
      style={{
        backgroundColor: colors.background,
        border: `1px solid ${colors.border}`,
        color: colors.primary
      }}
    >
      <div className="relative">
        <Icon name={icon as any} size={config.icon as any} />
        
        {/* Animated pulse dot */}
        {animated && status !== NetworkStatus.INACTIVE && (
          <div
            className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
            style={{
              backgroundColor: colors.primary,
              animation: `pulse-${status === NetworkStatus.ERROR ? 'error' : status === NetworkStatus.WARNING ? 'warning' : 'active'} 2s infinite`
            }}
          />
        )}
      </div>
      
      {showLabel && (
        <span className={`font-medium ${config.text}`}>
          {statusLabels[status]}
        </span>
      )}
    </div>
  );
}
