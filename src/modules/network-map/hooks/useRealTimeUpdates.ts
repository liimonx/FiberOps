"use client";

import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNetworkMapStore } from '../stores/useNetworkMapStore';
import { getWebSocketService, WebSocketMessage, WebSocketService } from '../services/websocketService';
import { NetworkStatus } from '../types';

interface UseRealTimeUpdatesOptions {
  enabled?: boolean;
  wsUrl?: string;
  onConnectionChange?: (connected: boolean) => void;
}

export function useRealTimeUpdates(options: UseRealTimeUpdatesOptions = {}) {
  const { enabled = true, wsUrl, onConnectionChange } = options;
  
  const wsServiceRef = useRef<WebSocketService | null>(null);
  const isConnectedRef = useRef(false);
  
  // Get store actions
  const updateNode = useNetworkMapStore((state) => state.updateNode);
  const updateConnection = useNetworkMapStore((state) => state.updateConnection);
  const setWebSocketConnected = useNetworkMapStore((state) => state.setWebSocketConnected);
  const setConnectionQuality = useNetworkMapStore((state) => state.setConnectionQuality);
  const setError = useNetworkMapStore((state) => state.setError);

  // Calculate connection quality based on latency
  const calculateConnectionQuality = useCallback((latency: number): 'good' | 'fair' | 'poor' | 'disconnected' => {
    if (latency < 100) return 'good';
    if (latency < 300) return 'fair';
    if (latency < 1000) return 'poor';
    return 'disconnected';
  }, []);

  // Handle incoming messages
  const handleMessage = useCallback((message: WebSocketMessage) => {
    try {
      switch (message.type) {
        case 'node_update':
          updateNode(message.data.id, message.data);
          break;
          
        case 'connection_update':
          updateConnection(message.data.id, message.data);
          break;
          
        case 'incident_alert':
          // Could dispatch to incident store or show notification
          console.log('[RealTime] New incident alert:', message.data);
          break;
          
        case 'status_broadcast':
          if (message.data.nodeId !== 'system') {
            updateNode(message.data.nodeId, { 
              status: message.data.status as NetworkStatus
            });
          }
          break;
          
        case 'heartbeat':
          // Update connection quality based on heartbeat timing
          setConnectionQuality('good');
          break;
          
        default:
          console.warn('[RealTime] Unknown message type:', (message as any).type);
      }
    } catch (error) {
      console.error('[RealTime] Error handling message:', error);
      setError('Failed to process real-time update');
    }
  }, [updateNode, updateConnection, setConnectionQuality, setError]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!enabled) {
      return;
    }

    let mounted = true;

    const initializeWebSocket = async () => {
      try {
        // Get or create WebSocket service
        const wsService = getWebSocketService(wsUrl ? { url: wsUrl } : undefined);
        wsServiceRef.current = wsService;

        // Subscribe to messages
        const unsubscribe = wsService.subscribe('message', handleMessage);

        // Connect
        await wsService.connect();
        
        if (mounted) {
          isConnectedRef.current = true;
          setWebSocketConnected(true);
          setConnectionQuality('good');
          onConnectionChange?.(true);
        }

        // Subscribe to connection state changes
        const checkConnection = setInterval(() => {
          if (!mounted) return;
          
          const state = wsService.getConnectionState();
          const isCurrentlyConnected = state === 'open';
          
          if (isCurrentlyConnected !== isConnectedRef.current) {
            isConnectedRef.current = isCurrentlyConnected;
            setWebSocketConnected(isCurrentlyConnected);
            
            if (!isCurrentlyConnected) {
              setConnectionQuality('disconnected');
              onConnectionChange?.(false);
            }
          }
        }, 2000);

        // Cleanup
        return () => {
          clearInterval(checkConnection);
          unsubscribe();
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown connection error';
        console.error('[RealTime] Failed to initialize WebSocket:', errorMessage);
        if (mounted) {
          setWebSocketConnected(false);
          setConnectionQuality('disconnected');
          setError('Failed to establish real-time connection');
          onConnectionChange?.(false);
        }
      }
    };

    initializeWebSocket();

    return () => {
      mounted = false;
      // Don't disconnect here - let the service persist across component remounts
    };
  }, [enabled, wsUrl, handleMessage, setWebSocketConnected, setConnectionQuality, setError, onConnectionChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsServiceRef.current) {
        wsServiceRef.current.disconnect();
        wsServiceRef.current = null;
      }
    };
  }, []);

  // Expose send method for outgoing messages
  const sendMessage = useCallback((message: Omit<WebSocketMessage, 'timestamp'>) => {
    if (wsServiceRef.current?.isConnected()) {
      wsServiceRef.current.send(message as WebSocketMessage);
      return true;
    }
    console.warn('[RealTime] Cannot send message - not connected');
    return false;
  }, []);

  return {
    isConnected: useNetworkMapStore((state) => state.isWebSocketConnected),
    sendMessage,
    connectionQuality: useNetworkMapStore((state) => state.connectionQuality),
  };
}

// Hook for optimistic updates with rollback
export function useOptimisticUpdate<T extends { id: string }, TVariables>(
  queryKey: string[],
  updateMutation: { mutateAsync: (variables: TVariables) => Promise<unknown> }
) {
  const queryClient = useQueryClient();

  return useCallback(async (itemId: string, updates: Partial<T>, variables: TVariables) => {
    const previousData = queryClient.getQueryData<T[]>(queryKey);
    
    // Optimistically update
    queryClient.setQueryData<T[]>(queryKey, (old) => {
      if (!old) return old;
      return old.map(item => 
        item.id === itemId ? { ...item, ...updates } : item
      );
    });

    try {
      // Execute mutation
      await updateMutation.mutateAsync({ itemId, updates });
    } catch (error) {
      // Rollback on error
      queryClient.setQueryData(queryKey, previousData);
      throw error;
    }
  }, [queryClient, updateMutation]);
}

