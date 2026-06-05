"use client";

import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNetworkMapStore } from '../stores/useNetworkMapStore';
import { getWebSocketService, WebSocketMessage } from '../services/websocketService';
import { safeValidateData } from '../utils/validation';
import { webSocketMessageSchema } from '../schemas/webSocketMessage.schema';
import { createLogger } from '@/lib/logger';

const log = createLogger('RealTime');

interface UseRealTimeUpdatesOptions {
  enabled?: boolean;
  wsUrl?: string;
  onConnectionChange?: (connected: boolean) => void;
}

export function useRealTimeUpdates(options: UseRealTimeUpdatesOptions = {}) {
  const { enabled = true, wsUrl, onConnectionChange } = options;
  
  const isConnectedRef = useRef(false);
  
  // Get store actions
  const updateNode = useNetworkMapStore((state) => state.updateNode);
  const updateConnection = useNetworkMapStore((state) => state.updateConnection);
  const setWebSocketConnected = useNetworkMapStore((state) => state.setWebSocketConnected);
  const setConnectionQuality = useNetworkMapStore((state) => state.setConnectionQuality);
  const setError = useNetworkMapStore((state) => state.setError);

  // Handle incoming messages
  const handleMessage = useCallback((message: WebSocketMessage) => {
    if (useNetworkMapStore.getState().simulatedOutageActive) return;

    // Validate message again just in case (service already does it, but double check doesn't hurt for types)
    const validation = safeValidateData(webSocketMessageSchema, message);
    if (!validation.success) return;
    
    const validatedMessage = validation.data;

    try {
      switch (validatedMessage.type) {
        case 'node_update':
          updateNode(validatedMessage.data.id, validatedMessage.data);
          break;
          
        case 'connection_update':
          updateConnection(validatedMessage.data.id, validatedMessage.data);
          break;
          
        case 'incident_alert':
          log.info('New incident alert:', validatedMessage.data);
          break;
          
        case 'status_broadcast':
          if (validatedMessage.data.nodeId !== 'system') {
            updateNode(validatedMessage.data.nodeId, { 
              status: validatedMessage.data.status
            });
          }
          break;
          
        case 'heartbeat':
          setConnectionQuality('good');
          break;
      }
    } catch (error) {
      log.error('Error handling message:', error);
      setError('Failed to process real-time update');
    }
  }, [updateNode, updateConnection, setConnectionQuality, setError]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!enabled) return;

    const wsService = getWebSocketService(wsUrl ? { url: wsUrl } : undefined);
    
    // Subscribe to messages
    const unsubscribe = wsService.subscribe('message', handleMessage);

    // Initial connection
    wsService.connect().catch(err => {
      // We log as a warning because the map can still function in static mode
      log.warn('Live feed unavailable:', err.message);
      // We don't call setError here anymore to avoid blocking the UI with a fatal error
    });

    // Monitor connection state
    const monitorInterval = setInterval(() => {
      const state = wsService.getConnectionState();
      const isConnected = state === 'open';
      
      if (isConnected !== isConnectedRef.current) {
        isConnectedRef.current = isConnected;
        setWebSocketConnected(isConnected);
        onConnectionChange?.(isConnected);
        
        if (!isConnected) {
          setConnectionQuality('disconnected');
        }
      }
    }, 1000);

    return () => {
      clearInterval(monitorInterval);
      unsubscribe();
      // We don't disconnect the service here because it's a singleton 
      // shared across the application. Only disconnect on app-level cleanup.
    };
  }, [enabled, wsUrl, handleMessage, setWebSocketConnected, setConnectionQuality, setError, onConnectionChange]);

  // Expose send method
  const sendMessage = useCallback((message: WebSocketMessage) => {
    const wsService = getWebSocketService();
    if (wsService.isConnected()) {
      wsService.send(message);
      return true;
    }
    return false;
  }, []);

  return {
    isConnected: useNetworkMapStore((state) => state.isWebSocketConnected),
    sendMessage,
    connectionQuality: useNetworkMapStore((state) => state.connectionQuality),
  };
}

// Hook for optimistic updates
export function useOptimisticUpdate<T extends { id: string }, TVariables>(
  queryKey: string[],
  updateMutation: { mutateAsync: (variables: TVariables) => Promise<unknown> }
) {
  const queryClient = useQueryClient();

  return useCallback(async (itemId: string, updates: Partial<T>, variables: TVariables) => {
    const previousData = queryClient.getQueryData<T[]>(queryKey);
    
    queryClient.setQueryData<T[]>(queryKey, (old) => {
      if (!old) return old;
      return old.map(item => 
        item.id === itemId ? { ...item, ...updates } : item
      );
    });

    try {
      await updateMutation.mutateAsync(variables);
    } catch (error) {
      queryClient.setQueryData(queryKey, previousData);
      throw error;
    }
  }, [queryClient, updateMutation, queryKey]);
}

