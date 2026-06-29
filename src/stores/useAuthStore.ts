import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  apiClient,
  clearAuthToken,
  setAuthToken,
  ApiClientError,
} from "@/lib/apiClient";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: "admin" | "operator" | "viewer";
  organizationId?: number;
};

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  isHydrated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  setHydrated: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isHydrated: false,
      setHydrated: () => set({ isHydrated: true }),
      login: async (email, password) => {
        const data = await apiClient<{ user: AuthUser; token: string }>(
          "/api/auth/login",
          {
            method: "POST",
            body: JSON.stringify({ email, password }),
            skipAuth: true,
          }
        );
        setAuthToken(data.token);
        set({ user: data.user, token: data.token });
      },
      register: async (name, email, password) => {
        const data = await apiClient<{ user: AuthUser; token: string }>(
          "/api/auth/register",
          {
            method: "POST",
            body: JSON.stringify({ name, email, password }),
            skipAuth: true,
          }
        );
        setAuthToken(data.token);
        set({ user: data.user, token: data.token });
      },
      logout: async () => {
        const { token } = get();
        try {
          if (token) {
            await apiClient("/api/auth/logout", { method: "POST" });
          }
        } catch {
          // ignore logout errors
        } finally {
          clearAuthToken();
          set({ user: null, token: null });
        }
      },
      fetchMe: async () => {
        const data = await apiClient<{ user: AuthUser }>("/api/me");
        set({ user: data.user });
      },
    }),
    {
      name: "fiberops:auth",
      partialize: (state) => ({ user: state.user, token: state.token }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          setAuthToken(state.token);
        }
        state?.setHydrated();
      },
    }
  )
);

export function getAuthErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiClientError) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}
