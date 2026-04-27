"use client";

// Error types for better categorization
export enum ErrorType {
  NETWORK = 'NETWORK',
  TIMEOUT = 'TIMEOUT',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION = 'VALIDATION',
  SERVER = 'SERVER',
  UNKNOWN = 'UNKNOWN'
}

export interface AppError {
  type: ErrorType;
  message: string;
  userMessage: string;
  code?: string | number;
  details?: any;
  retryable: boolean;
  timestamp: Date;
}

// Error classification utility
export function classifyError(error: any): AppError {
  const timestamp = new Date();
  
  // Network errors
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return {
      type: ErrorType.NETWORK,
      message: error.message,
      userMessage: 'Unable to connect to the network. Please check your internet connection.',
      retryable: true,
      timestamp
    };
  }
  
  // Timeout errors
  if (error.name === 'AbortError' || error.message.includes('timeout')) {
    return {
      type: ErrorType.TIMEOUT,
      message: error.message,
      userMessage: 'The request timed out. Please try again.',
      retryable: true,
      timestamp
    };
  }
  
  // HTTP errors
  if (error.response) {
    const status = error.response.status;
    
    switch (status) {
      case 401:
        return {
          type: ErrorType.AUTHENTICATION,
          message: error.message,
          userMessage: 'Your session has expired. Please log in again.',
          code: status,
          retryable: false,
          timestamp
        };
      
      case 403:
        return {
          type: ErrorType.AUTHORIZATION,
          message: error.message,
          userMessage: 'You do not have permission to perform this action.',
          code: status,
          retryable: false,
          timestamp
        };
      
      case 404:
        return {
          type: ErrorType.NOT_FOUND,
          message: error.message,
          userMessage: 'The requested resource was not found.',
          code: status,
          retryable: false,
          timestamp
        };
      
      case 422:
        return {
          type: ErrorType.VALIDATION,
          message: error.message,
          userMessage: 'Please check your input and try again.',
          code: status,
          details: error.response.data?.errors,
          retryable: false,
          timestamp
        };
      
      case 500:
      case 502:
      case 503:
        return {
          type: ErrorType.SERVER,
          message: error.message,
          userMessage: 'We\'re experiencing technical difficulties. Please try again in a few moments.',
          code: status,
          retryable: true,
          timestamp
        };
      
      default:
        return {
          type: ErrorType.UNKNOWN,
          message: error.message,
          userMessage: `An error occurred (Code: ${status}). Please try again.`,
          code: status,
          retryable: status >= 500,
          timestamp
        };
    }
  }
  
  // Default unknown error
  return {
    type: ErrorType.UNKNOWN,
    message: error.message || 'An unexpected error occurred',
    userMessage: 'Something went wrong. Please try again.',
    retryable: true,
    timestamp
  };
}

// User-friendly error messages
export const errorMessages: Record<ErrorType, {
  title: string;
  description: string;
  action: string;
}> = {
  [ErrorType.NETWORK]: {
    title: 'Connection Problem',
    description: 'We\'re having trouble connecting to our servers. This could be due to your internet connection or our servers being temporarily unavailable.',
    action: 'Check Connection & Retry'
  },
  [ErrorType.TIMEOUT]: {
    title: 'Request Timed Out',
    description: 'The operation took too long to complete. This might happen if the server is busy or your connection is slow.',
    action: 'Try Again'
  },
  [ErrorType.AUTHENTICATION]: {
    title: 'Session Expired',
    description: 'Your login session has expired. For your security, please log in again to continue.',
    action: 'Log In'
  },
  [ErrorType.AUTHORIZATION]: {
    title: 'Access Denied',
    description: 'You don\'t have the necessary permissions to perform this action. Please contact your administrator if you believe this is an error.',
    action: 'Contact Admin'
  },
  [ErrorType.NOT_FOUND]: {
    title: 'Not Found',
    description: 'The item you\'re looking for doesn\'t exist or may have been removed.',
    action: 'Go Back'
  },
  [ErrorType.VALIDATION]: {
    title: 'Invalid Input',
    description: 'Some of the information provided is invalid. Please review and correct the highlighted fields.',
    action: 'Review Input'
  },
  [ErrorType.SERVER]: {
    title: 'Server Error',
    description: 'Our servers are experiencing issues. Our team has been notified and is working on it. Please try again shortly.',
    action: 'Retry'
  },
  [ErrorType.UNKNOWN]: {
    title: 'Unexpected Error',
    description: 'Something unexpected happened. We\'ve logged this issue and will investigate.',
    action: 'Try Again'
  }
};

// Error logging utility
export class ErrorLogger {
  private static logs: AppError[] = [];
  private static maxLogs = 100;

  static log(error: AppError): void {
    this.logs.unshift(error);
    
    // Trim logs to prevent memory issues
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorLogger]', error);
    }
    
    // Send to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToTrackingService(error);
    }
  }

  static getRecentErrors(count: number = 10): AppError[] {
    return this.logs.slice(0, count);
  }

  static clear(): void {
    this.logs = [];
  }

  private static sendToTrackingService(error: AppError): void {
    // Integrate with Sentry, LogRocket, etc.
    // Example: Sentry.captureException(new Error(error.message), { extra: error });
    console.log('Error sent to tracking service:', error);
  }
}

// Retry utility with exponential backoff
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
    shouldRetry?: (error: any) => boolean;
    onRetry?: (attempt: number, error: any) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    shouldRetry = () => true,
    onRetry
  } = options;

  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry if we've exhausted attempts or shouldn't retry
      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error;
      }
      
      // Calculate delay with exponential backoff and jitter
      const delay = Math.min(
        initialDelay * Math.pow(backoffFactor, attempt),
        maxDelay
      );
      const jitter = Math.random() * 0.1 * delay; // 10% jitter
      
      // Notify retry callback
      onRetry?.(attempt + 1, error);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay + jitter));
    }
  }
  
  throw lastError;
}

// Offline detection utility
export class OfflineDetector {
  private static listeners: Array<(isOnline: boolean) => void> = [];
  private static isOnline: boolean = navigator.onLine;

  static init(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnlineStatus(true));
      window.addEventListener('offline', () => this.handleOnlineStatus(false));
    }
  }

  static destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', () => this.handleOnlineStatus(true));
      window.removeEventListener('offline', () => this.handleOnlineStatus(false));
    }
  }

  static isCurrentlyOnline(): boolean {
    return this.isOnline;
  }

  static onStatusChange(callback: (isOnline: boolean) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  private static handleOnlineStatus(online: boolean): void {
    this.isOnline = online;
    this.listeners.forEach(listener => listener(online));
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[OfflineDetector] Status changed: ${online ? 'Online' : 'Offline'}`);
    }
  }
}

// Queue for offline operations
export class OfflineQueue {
  private queue: Array<{
    id: string;
    operation: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (reason: any) => void;
    timestamp: Date;
  }> = [];

  add<T>(operation: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        id: `op_${Date.now()}_${Math.random()}`,
        operation: operation as any,
        resolve,
        reject,
        timestamp: new Date()
      });
    });
  }

  async processQueue(): Promise<void> {
    const failed: typeof this.queue = [];
    
    for (const item of this.queue) {
      try {
        const result = await item.operation();
        item.resolve(result);
      } catch (error) {
        failed.push(item);
        item.reject(error);
      }
    }
    
    this.queue = failed;
  }

  size(): number {
    return this.queue.length;
  }

  clear(): void {
    this.queue.forEach(item => item.reject(new Error('Queue cleared')));
    this.queue = [];
  }
}

// Initialize offline detection
if (typeof window !== 'undefined') {
  OfflineDetector.init();
}
