"use client";

import { NetworkNode, NetworkConnection } from '../types';

export type WebSocketMessage = 
  | { type: 'node_update'; data: Partial<NetworkNode> & { id: string } }
  | { type: 'connection_update'; data: Partial<NetworkConnection> & { id: string } }
  | { type: 'incident_alert'; data: any }
  | { type: 'status_broadcast'; data: { nodeId: string; status: string; timestamp: string } }
  | { type: 'heartbeat'; data: { serverTime: string; connectedClients: number } };

export type WebSocketEventHandler = (message: WebSocketMessage) => void;

export interface WebSocketServiceConfig {
  url?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

export class WebSocketService {
  private ws: WebSocket | null = null;
  private config: Required<WebSocketServiceConfig>;
  private eventHandlers: Map<string, Set<WebSocketEventHandler>> = new Map();
  private reconnectAttempts: number = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private isManualClose: boolean = false;
  private messageBuffer: WebSocketMessage[] = [];
  
  constructor(config: WebSocketServiceConfig = {}) {
    this.config = {
      url: config.url || process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws',
      reconnectInterval: config.reconnectInterval || 3000,
      maxReconnectAttempts: config.maxReconnectAttempts || 10,
      heartbeatInterval: config.heartbeatInterval || 30000,
    };
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      this.isManualClose = false;

      // Set connection timeout
      const connectionTimeout = setTimeout(() => {
        if (this.ws?.readyState !== WebSocket.OPEN) {
          console.error('[WebSocket] Connection timeout');
          this.ws?.close();
          reject(new Error('WebSocket connection timed out'));
        }
      }, 5000); // 5 second timeout

      try {
        this.ws = new WebSocket(this.config.url);

        this.ws.onopen = () => {
          clearTimeout(connectionTimeout);
          console.log('[WebSocket] Connected successfully');
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.flushMessageBuffer();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('[WebSocket] Failed to parse message:', error);
          }
        };

        this.ws.onerror = (error) => {
          const errorMessage = this.ws?.url 
            ? `Failed to connect to WebSocket at ${this.ws.url}. Ensure the server is running and accessible.`
            : 'WebSocket connection failed';
          console.error('[WebSocket] Connection error:', errorMessage);
          // Don't reject here - let onclose handle reconnection logic
          // This prevents unhandled promise rejections for transient errors
        };

        this.ws.onclose = (event) => {
          clearTimeout(connectionTimeout);
          const closeMessage = event.code === 1006 
            ? 'Connection failed - server may be unreachable' 
            : `Connection closed (code: ${event.code})`;
          
          if (event.reason) {
            console.warn(`[WebSocket] ${closeMessage}: ${event.reason}`);
          } else {
            console.log(`[WebSocket] ${closeMessage}`);
          }
          
          this.stopHeartbeat();
          
          if (!this.isManualClose && event.code !== 1000) {
            this.attemptReconnect();
          }
        };
      } catch (error) {
        console.error('[WebSocket] Failed to connect:', error);
        reject(error);
      }
    });
  }

  disconnect(): void {
    this.isManualClose = true;
    this.stopHeartbeat();
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnecting');
      this.ws = null;
    }
  }

  send(message: WebSocketMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      // Buffer message for when connection is established
      this.messageBuffer.push(message);
      console.warn('[WebSocket] Message buffered - connection not ready');
    }
  }

  subscribe(eventType: string, handler: WebSocketEventHandler): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    
    this.eventHandlers.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.eventHandlers.get(eventType)?.delete(handler);
    };
  }

  getConnectionState(): 'connecting' | 'open' | 'closing' | 'closed' {
    if (!this.ws) return 'closed';
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'open';
      case WebSocket.CLOSING:
        return 'closing';
      case WebSocket.CLOSED:
        return 'closed';
      default:
        return 'closed';
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private handleMessage(message: WebSocketMessage): void {
    // Call all handlers for this message type
    const handlers = this.eventHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error(`[WebSocket] Error in ${message.type} handler:`, error);
        }
      });
    }

    // Call generic 'message' handlers
    const genericHandlers = this.eventHandlers.get('message');
    if (genericHandlers) {
      genericHandlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error('[WebSocket] Error in generic message handler:', error);
        }
      });
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('[WebSocket] Max reconnection attempts reached');
      this.notifyConnectionFailure();
      return;
    }

    this.reconnectAttempts++;
    const delay = this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(err => {
        console.error('[WebSocket] Reconnection failed:', err);
      });
    }, delay);
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        this.send({
          type: 'heartbeat',
          data: {
            serverTime: new Date().toISOString(),
            connectedClients: 0 // This would come from server
          }
        });
      }
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private flushMessageBuffer(): void {
    while (this.messageBuffer.length > 0 && this.isConnected()) {
      const message = this.messageBuffer.shift();
      if (message) {
        this.send(message);
      }
    }
  }

  private notifyConnectionFailure(): void {
    const handlers = this.eventHandlers.get('connection_error');
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler({
            type: 'status_broadcast',
            data: {
              nodeId: 'system',
              status: 'disconnected',
              timestamp: new Date().toISOString()
            }
          });
        } catch (error) {
          console.error('[WebSocket] Error in connection_error handler:', error);
        }
      });
    }
  }
}

// Singleton instance
let webSocketServiceInstance: WebSocketService | null = null;

export function getWebSocketService(config?: WebSocketServiceConfig): WebSocketService {
  if (!webSocketServiceInstance) {
    webSocketServiceInstance = new WebSocketService(config);
  }
  return webSocketServiceInstance;
}

export function resetWebSocketService(): void {
  if (webSocketServiceInstance) {
    webSocketServiceInstance.disconnect();
    webSocketServiceInstance = null;
  }
}
