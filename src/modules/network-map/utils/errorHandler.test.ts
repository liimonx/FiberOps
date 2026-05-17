import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { classifyError, ErrorType } from './errorHandler';

describe('classifyError', () => {
  const mockDate = new Date('2023-01-01T00:00:00.000Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(mockDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should classify TypeError with "fetch" message as NETWORK error', () => {
    const error = new TypeError('Failed to fetch');
    const result = classifyError(error);

    expect(result).toEqual({
      type: ErrorType.NETWORK,
      message: 'Failed to fetch',
      userMessage: 'Unable to connect to the network. Please check your internet connection.',
      retryable: true,
      timestamp: mockDate,
    });
  });

  it('should classify AbortError as TIMEOUT error', () => {
    const error = new Error('The user aborted a request.');
    error.name = 'AbortError';
    const result = classifyError(error);

    expect(result).toEqual({
      type: ErrorType.TIMEOUT,
      message: 'The user aborted a request.',
      userMessage: 'The request timed out. Please try again.',
      retryable: true,
      timestamp: mockDate,
    });
  });

  it('should classify error with "timeout" in message as TIMEOUT error', () => {
    const error = new Error('request timeout occurred');
    const result = classifyError(error);

    expect(result).toEqual({
      type: ErrorType.TIMEOUT,
      message: 'request timeout occurred',
      userMessage: 'The request timed out. Please try again.',
      retryable: true,
      timestamp: mockDate,
    });
  });

  it('should classify HTTP 401 response as AUTHENTICATION error', () => {
    const error = {
      message: 'Request failed with status code 401',
      response: { status: 401 },
    };
    const result = classifyError(error);

    expect(result).toEqual({
      type: ErrorType.AUTHENTICATION,
      message: 'Request failed with status code 401',
      userMessage: 'Your session has expired. Please log in again.',
      code: 401,
      retryable: false,
      timestamp: mockDate,
    });
  });

  it('should classify HTTP 403 response as AUTHORIZATION error', () => {
    const error = {
      message: 'Request failed with status code 403',
      response: { status: 403 },
    };
    const result = classifyError(error);

    expect(result).toEqual({
      type: ErrorType.AUTHORIZATION,
      message: 'Request failed with status code 403',
      userMessage: 'You do not have permission to perform this action.',
      code: 403,
      retryable: false,
      timestamp: mockDate,
    });
  });

  it('should classify HTTP 404 response as NOT_FOUND error', () => {
    const error = {
      message: 'Request failed with status code 404',
      response: { status: 404 },
    };
    const result = classifyError(error);

    expect(result).toEqual({
      type: ErrorType.NOT_FOUND,
      message: 'Request failed with status code 404',
      userMessage: 'The requested resource was not found.',
      code: 404,
      retryable: false,
      timestamp: mockDate,
    });
  });

  it('should classify HTTP 422 response as VALIDATION error', () => {
    const errorDetails = [{ field: 'email', message: 'Invalid email format' }];
    const error = {
      message: 'Request failed with status code 422',
      response: {
        status: 422,
        data: { errors: errorDetails },
      },
    };
    const result = classifyError(error);

    expect(result).toEqual({
      type: ErrorType.VALIDATION,
      message: 'Request failed with status code 422',
      userMessage: 'Please check your input and try again.',
      code: 422,
      details: errorDetails,
      retryable: false,
      timestamp: mockDate,
    });
  });

  it('should classify HTTP 500 response as SERVER error', () => {
    const error = {
      message: 'Request failed with status code 500',
      response: { status: 500 },
    };
    const result = classifyError(error);

    expect(result).toEqual({
      type: ErrorType.SERVER,
      message: 'Request failed with status code 500',
      userMessage: "We're experiencing technical difficulties. Please try again in a few moments.",
      code: 500,
      retryable: true,
      timestamp: mockDate,
    });
  });

  it('should classify HTTP 502 response as SERVER error', () => {
    const error = {
      message: 'Request failed with status code 502',
      response: { status: 502 },
    };
    const result = classifyError(error);

    expect(result).toEqual({
      type: ErrorType.SERVER,
      message: 'Request failed with status code 502',
      userMessage: "We're experiencing technical difficulties. Please try again in a few moments.",
      code: 502,
      retryable: true,
      timestamp: mockDate,
    });
  });

  it('should classify HTTP 503 response as SERVER error', () => {
    const error = {
      message: 'Request failed with status code 503',
      response: { status: 503 },
    };
    const result = classifyError(error);

    expect(result).toEqual({
      type: ErrorType.SERVER,
      message: 'Request failed with status code 503',
      userMessage: "We're experiencing technical difficulties. Please try again in a few moments.",
      code: 503,
      retryable: true,
      timestamp: mockDate,
    });
  });

  it('should classify other HTTP errors (< 500) as UNKNOWN and non-retryable', () => {
    const error = {
      message: 'Request failed with status code 418',
      response: { status: 418 },
    };
    const result = classifyError(error);

    expect(result).toEqual({
      type: ErrorType.UNKNOWN,
      message: 'Request failed with status code 418',
      userMessage: 'An error occurred (Code: 418). Please try again.',
      code: 418,
      retryable: false,
      timestamp: mockDate,
    });
  });

  it('should classify other HTTP errors (>= 500) as UNKNOWN and retryable', () => {
    const error = {
      message: 'Request failed with status code 504',
      response: { status: 504 },
    };
    const result = classifyError(error);

    expect(result).toEqual({
      type: ErrorType.UNKNOWN,
      message: 'Request failed with status code 504',
      userMessage: 'An error occurred (Code: 504). Please try again.',
      code: 504,
      retryable: true,
      timestamp: mockDate,
    });
  });

  it('should classify random Error object as UNKNOWN error', () => {
    const error = new Error('Something went wrong');
    const result = classifyError(error);

    expect(result).toEqual({
      type: ErrorType.UNKNOWN,
      message: 'Something went wrong',
      userMessage: 'Something went wrong. Please try again.',
      retryable: true,
      timestamp: mockDate,
    });
  });

  it('should classify generic unknown object as UNKNOWN error with default message', () => {
    const error = { someField: 'value' };
    const result = classifyError(error);

    expect(result).toEqual({
      type: ErrorType.UNKNOWN,
      message: 'An unexpected error occurred',
      userMessage: 'Something went wrong. Please try again.',
      retryable: true,
      timestamp: mockDate,
    });
  });
});
