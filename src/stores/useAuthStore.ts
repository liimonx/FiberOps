import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  apiClient,
  clearAuthToken,
  setAuthToken,
  getAuthToken,
  ApiClientError,
} from "@/lib/apiClient";
import type { AuthUser } from "@/types/auth";

export type { AuthUser };

type AuthState = {
  user: AuthUser | null;
  token: string | null;
  isHydrated: boolean;
  isSessionReady: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  bootstrapDemoSession: () => Promise<void>;
  setHydrated: () => void;
  setSessionReady: (ready: boolean) => void;
};

async function establishSession(user: AuthUser, token: string) {
  await setAuthToken(token);
  return { user, token };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isHydrated: false,
      isSessionReady: false,
      setHydrated: () => set({ isHydrated: true }),
      setSessionReady: (ready) => set({ isSessionReady: ready }),
      login: async (email, password) => {
        const data = await apiClient<{ user: AuthUser; token: string }>(
          "/api/auth/login",
          {
            method: "POST",
            body: JSON.stringify({ email, password }),
            skipAuth: true,
          }
        );
        const session = await establishSession(data.user, data.token);
        set(session);
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
        const session = await establishSession(data.user, data.token);
        set(session);
      },
      logout: async () => {
        try {
          if (getAuthToken()) {
            await apiClient("/api/auth/logout", { method: "POST" });
          }
        } catch {
          // ignore logout errors
        } finally {
          await clearAuthToken();
          set({ user: null, token: null });
        }
      },
      fetchMe: async () => {
        const data = await apiClient<{ user: AuthUser }>("/api/me", {
          skipAuthRedirect: true,
        });
        set({ user: data.user });
      },
      bootstrapDemoSession: async () => {
        if (get().user && getAuthToken()) {
          return;
        }
        const data = await apiClient<{ user: AuthUser; token: string }>(
          "/api/auth/login",
          {
            method: "POST",
            body: JSON.stringify({
              email: "alex.morgan@bcn-fiberops.com",
              password: "password",
            }),
            skipAuth: true,
          }
        );
        const session = await establishSession(data.user, data.token);
        set(session);
      },
    }),
    {
      name: "fiberops:auth",
      // Persist identity only — never persist the bearer token (XSS surface).
      partialize: (state) => ({ user: state.user }),
      onRehydrateStorage: () => (state) => {
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
