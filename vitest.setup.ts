import '@testing-library/jest-dom';
import { vi } from 'vitest';

const localStorageValues = new Map<string, string>();

Object.defineProperty(window, 'localStorage', {
  configurable: true,
  value: {
    get length() {
      return localStorageValues.size;
    },
    clear: () => localStorageValues.clear(),
    getItem: (key: string) => localStorageValues.get(String(key)) ?? null,
    key: (index: number) => Array.from(localStorageValues.keys())[index] ?? null,
    removeItem: (key: string) => {
      localStorageValues.delete(String(key));
    },
    setItem: (key: string, value: string) => {
      localStorageValues.set(String(key), String(value));
    },
  },
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  })),
});
