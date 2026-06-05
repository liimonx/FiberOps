import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ErrorLogger, ErrorType, AppError } from './errorHandler';

describe('ErrorLogger', () => {
  const mockError: AppError = {
    type: ErrorType.UNKNOWN,
    message: 'Test error',
    userMessage: 'Test user message',
    retryable: true,
    timestamp: new Date(),
  };

  beforeEach(() => {
    ErrorLogger.clear();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe('log and maxLogs clamping', () => {
    it('should clamp logs to 100 items', () => {
      // Add 105 errors
      for (let i = 0; i < 105; i++) {
        ErrorLogger.log({
          ...mockError,
          message: `Test error ${i}`,
        });
      }

      const recentErrors = ErrorLogger.getRecentErrors(150);
      expect(recentErrors.length).toBe(100);
      // Since logs are unshifted, the first item should be the last added (index 104)
      expect(recentErrors[0].message).toBe('Test error 104');
      // The last item should be index 5 (because 0-4 were truncated)
      expect(recentErrors[99].message).toBe('Test error 5');
    });
  });

  describe('environment-specific logging', () => {
    it('should log to console in development environment', () => {
      vi.stubEnv('NODE_ENV', 'development');

      ErrorLogger.log(mockError);

      expect(console.error).toHaveBeenCalledWith('[ErrorLogger]', mockError);
      expect(console.log).not.toHaveBeenCalled();
    });

    it('should fall back to console.error in production when no tracking endpoint is configured', () => {
      vi.stubEnv('NODE_ENV', 'production');

      ErrorLogger.log(mockError);

      // Without NEXT_PUBLIC_ERROR_ENDPOINT, the error is surfaced via console.error
      // rather than silently swallowed, and the development "[ErrorLogger]" debug
      // log is not used.
      expect(console.log).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith('[ErrorLogger]', mockError);
    });
  });
});
