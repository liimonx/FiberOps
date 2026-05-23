// Network Map Hooks - Barrel Export

export { useResponsive, useBreakpoint, useResponsiveValue } from './useResponsive';
export type { Breakpoint } from './useResponsive';

export { useTouchGestures, useMapTouchGestures } from './useTouchGestures';

// Search hook
export { useAssetSearch } from './useAssetSearch';

// Data fetching hooks
export {
  useAssets,
  useCustomers,
  useIncidents,
  useActiveIncidents,
  useUpdateAssetStatus,
  useResolveIncident,
  useNetworkData,
  useNodeDetails,
  networkQueryKeys,
} from './useNetworkData';

// Real-time updates hook
export { useRealTimeUpdates, useOptimisticUpdate } from './useRealTimeUpdates';

export { useMapInstance } from './useMapInstance';

export { useLayerStats } from './useLayerStats';
export type { LayerStats } from './useLayerStats';

export { useMapKeyboardShortcuts, isTypingInField } from './useMapKeyboardShortcuts';

export { useMapHoverTooltip } from './useMapHoverTooltip';
export type { HoverTarget, UseMapHoverTooltipOptions } from './useMapHoverTooltip';

export { useTooltipHover } from './useTooltipHover';
export type { TooltipState, UseTooltipHoverOptions } from './useTooltipHover';

// Tool interaction hooks
export { 
  useMapTools, 
  useMeasurementTool, 
  useTraceTool, 
  useHeatmapTool 
} from './useMapTools';
