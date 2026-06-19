import { renderHook, act, waitFor } from "@testing-library/react";
import { usePersistedBoolean } from "./usePersistedBoolean";
import { describe, it, expect, beforeEach, afterEach } from "vitest";

const STORAGE_KEY = "test:sidebar-collapsed";

describe("usePersistedBoolean", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("initializes with default value when localStorage is empty", () => {
    const { result } = renderHook(() => usePersistedBoolean(STORAGE_KEY, false));

    expect(result.current.value).toBe(false);
  });

  it("hydrates from localStorage on mount", async () => {
    window.localStorage.setItem(STORAGE_KEY, "true");

    const { result } = renderHook(() => usePersistedBoolean(STORAGE_KEY, false));

    await waitFor(() => {
      expect(result.current.hydrated).toBe(true);
    });

    expect(result.current.value).toBe(true);
  });

  it("persists value when setValue is called", async () => {
    const { result } = renderHook(() => usePersistedBoolean(STORAGE_KEY, false));

    await waitFor(() => {
      expect(result.current.hydrated).toBe(true);
    });

    act(() => {
      result.current.setValue(true);
    });

    expect(result.current.value).toBe(true);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("true");
  });

  it("toggles value and persists to localStorage", async () => {
    const { result } = renderHook(() => usePersistedBoolean(STORAGE_KEY, false));

    await waitFor(() => {
      expect(result.current.hydrated).toBe(true);
    });

    act(() => {
      result.current.toggle();
    });
    expect(result.current.value).toBe(true);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("true");

    act(() => {
      result.current.toggle();
    });
    expect(result.current.value).toBe(false);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("false");
  });

  it("falls back to default when localStorage value is invalid", async () => {
    window.localStorage.setItem(STORAGE_KEY, "not-a-boolean");

    const { result } = renderHook(() => usePersistedBoolean(STORAGE_KEY, false));

    await waitFor(() => {
      expect(result.current.hydrated).toBe(true);
    });

    expect(result.current.value).toBe(false);
  });
});
