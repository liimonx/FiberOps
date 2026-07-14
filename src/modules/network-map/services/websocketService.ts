"use client";

import { NetworkStatus } from "../types";
import { safeValidateData } from "../utils/validation";
import {
  webSocketMessageSchema,
  WebSocketMessageSchema,
} from "../schemas/webSocketMessage.schema";
import { createLogger } from "@/lib/logger";
import { getAuthToken } from "@/lib/apiClient";

const log = createLogger("WebSocket");

export type WebSocketMessage = WebSocketMessageSchema;
export type WebSocketEventHandler = (message: WebSocketMessage) => void;

export interface WebSocketServiceConfig {
  url?: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  maxBufferSize?: number;
}

export class WebSocketService {
  private static instance: WebSocketService | null = null;
  private ws: WebSocket | null = null;
  private config: Required<WebSocketServiceConfig>;
  private eventHandlers: Map<string, Set<WebSocketEventHandler>> = new Map();
  private reconnectAttempts: number = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private isManualClose: boolean = false;
  private messageBuffer: WebSocketMessage[] = [];

  private constructor(config: WebSocketServiceConfig = {}) {
    this.config = {
      url: config.url || process.env.NEXT_PUBLIC_WS_URL || "",
      reconnectInterval: config.reconnectInterval || 3000,
      maxReconnectAttempts: config.maxReconnectAttempts || 10,
      heartbeatInterval: config.heartbeatInterval || 30000,
      maxBufferSize: config.maxBufferSize || 100,
    };
  }

  public static getInstance(config?: WebSocketServiceConfig): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService(config);
    }
    return WebSocketService.instance;
  }

  private buildAuthenticatedUrl(baseUrl: string): string {
    try {
      const url = new URL(baseUrl);
      const bearer = getAuthToken();
      if (bearer) {
        url.searchParams.set("token", bearer);
      }
      return url.toString();
    } catch {
      return baseUrl;
    }
  }

  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.config.url) {
        reject(new Error("WebSocket URL not configured"));
        return;
      }

      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      this.isManualClose = false;

      // Set connection timeout
      const connectionTimeout = setTimeout(() => {
        if (this.ws?.readyState !== WebSocket.OPEN) {
          log.error("Connection timeout");
          this.ws?.close();
          reject(new Error("WebSocket connection timed out"));
        }
      }, 5000);

      try {
        this.ws = new WebSocket(
          this.buildAuthenticatedUrl(this.config.url)
        );

        this.ws.onopen = () => {
          clearTimeout(connectionTimeout);
          log.info("Connected successfully");
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.flushMessageBuffer();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const rawData = JSON.parse(event.data);
            const validationResult = safeValidateData(webSocketMessageSchema, rawData);

            if (validationResult.success) {
              this.handleMessage(validationResult.data);
            } else {
              log.warn(
                "Received malformed message:",
                validationResult.error,
                rawData
              );
            }
          } catch (error) {
            log.error("Failed to parse message:", error);
          }
        };

        this.ws.onerror = (event) => {
          // WebSocket errors are often opaque in browsers for security reasons.
          const isConnecting = this.ws?.readyState === WebSocket.CONNECTING;
          
          if (isConnecting) {
            log.warn(
              `Connection failed for ${this.config.url}. (Check if backend is running)`
            );
          } else if (this.ws?.readyState === WebSocket.OPEN) {
            log.error("Live connection error:", event);
          }
        };

        this.ws.onclose = (event) => {
          clearTimeout(connectionTimeout);
          this.stopHeartbeat();

          // If we haven't connected yet, reject the promise early
          if (this.reconnectAttempts === 0 && !this.isConnected()) {
            reject(
              new Error(
                `WebSocket connection failed: ${this.config.url} (Code: ${event.code})`
              )
            );
          }

          if (!this.isManualClose && event.code !== 1000) {
            this.attemptReconnect();
          }
        };
      } catch (error) {
        log.error("Failed to connect:", error);
        reject(error);
      }
    });
  }

  public disconnect(): void {
    this.isManualClose = true;
    this.stopHeartbeat();

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close(1000, "Client disconnecting");
      this.ws = null;
    }
  }

  public send(message: WebSocketMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      if (this.messageBuffer.length < this.config.maxBufferSize) {
        this.messageBuffer.push(message);
        log.warn("Message buffered - connection not ready");
      } else {
        log.error("Message buffer full - dropping message");
      }
    }
  }

  public subscribe(eventType: string, handler: WebSocketEventHandler): () => void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }

    this.eventHandlers.get(eventType)!.add(handler);
    return () => this.eventHandlers.get(eventType)?.delete(handler);
  }

  public getConnectionState(): "connecting" | "open" | "closing" | "closed" {
    if (!this.ws) return "closed";
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return "connecting";
      case WebSocket.OPEN:
        return "open";
      case WebSocket.CLOSING:
        return "closing";
      case WebSocket.CLOSED:
        return "closed";
      default:
        return "closed";
    }
  }

  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private handleMessage(message: WebSocketMessage): void {
    const handlers = this.eventHandlers.get(message.type);
    handlers?.forEach((handler) => {
      try {
        handler(message);
      } catch (e) {
        log.error(`Error in ${message.type} handler:`, e);
      }
    });

    const genericHandlers = this.eventHandlers.get("message");
    genericHandlers?.forEach((handler) => {
      try {
        handler(message);
      } catch (e) {
        log.error("Error in generic message handler:", e);
      }
    });
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      log.error("Max reconnection attempts reached");
      this.notifyConnectionFailure();
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1),
      30000 // Cap delay at 30 seconds
    );

    log.info(
      `Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`
    );

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch((err) => log.error("Reconnection failed:", err));
    }, delay);
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        this.send({
          type: "heartbeat",
          data: {
            serverTime: new Date().toISOString(),
            connectedClients: 0,
          },
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
      if (message) this.send(message);
    }
  }

  private notifyConnectionFailure(): void {
    const handlers = this.eventHandlers.get("connection_error");
    handlers?.forEach((handler) => {
      try {
        handler({
          type: "status_broadcast",
          data: {
            nodeId: "system",
            status: NetworkStatus.ERROR,
            timestamp: new Date().toISOString(),
          },
        });
      } catch (e) {
        log.error("Error in connection_error handler:", e);
      }
    });
  }
}

export const getWebSocketService = (config?: WebSocketServiceConfig) =>
  WebSocketService.getInstance(config);
export const resetWebSocketService = () => WebSocketService.getInstance().disconnect();
