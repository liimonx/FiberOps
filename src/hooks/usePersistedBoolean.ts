import { useCallback, useEffect, useState } from "react";

export interface UsePersistedBooleanReturn {
  value: boolean;
  setValue: (value: boolean) => void;
  toggle: () => void;
  hydrated: boolean;
}

function readStoredBoolean(key: string, defaultValue: boolean): boolean {
  if (typeof window === "undefined") {
    return defaultValue;
  }

  try {
    const stored = window.localStorage.getItem(key);
    if (stored === null) {
      return defaultValue;
    }
    return stored === "true";
  } catch {
    return defaultValue;
  }
}

function writeStoredBoolean(key: string, value: boolean): void {
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    // Ignore quota or privacy-mode errors.
  }
}

/**
 * Boolean state synced to localStorage after hydration.
 * SSR and the first client render use defaultValue to avoid mismatch.
 */
export function usePersistedBoolean(
  key: string,
  defaultValue = false
): UsePersistedBooleanReturn {
  const [value, setValueState] = useState(defaultValue);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setValueState(readStoredBoolean(key, defaultValue));
    setHydrated(true);
  }, [key, defaultValue]);

  const setValue = useCallback(
    (next: boolean) => {
      setValueState(next);
      writeStoredBoolean(key, next);
    },
    [key]
  );

  const toggle = useCallback(() => {
    setValueState((current) => {
      const next = !current;
      writeStoredBoolean(key, next);
      return next;
    });
  }, [key]);

  return {
    value,
    setValue,
    toggle,
    hydrated,
  };
}

export default usePersistedBoolean;
