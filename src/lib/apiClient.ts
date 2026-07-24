const TOKEN_KEY = "fiberops:auth-token";
const TOKEN_COOKIE = "fiberops-auth";

function setTokenCookie(token: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${TOKEN_COOKIE}=${token}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
}

function clearTokenCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0`;
}

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  setTokenCookie(token);
}

export function clearAuthToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  clearTokenCookie();
}

export type ApiErrorBody = {
  error?: string;
  message?: string;
  issues?: {
    fieldErrors?: Record<string, string[]>;
    formErrors?: string[];
  };
};

export class ApiClientError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
  }
}

type RequestOptions = RequestInit & {
  skipAuth?: boolean;
  /** When true, a 401 clears the token but does not navigate to /login. */
  skipAuthRedirect?: boolean;
};

export async function apiClient<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { skipAuth = false, skipAuthRedirect = false, headers, ...rest } =
    options;
  const token = getAuthToken();

  const response = await fetch(path, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token && !skipAuth ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (response.status === 401 && !skipAuth) {
    clearAuthToken();
    if (!skipAuthRedirect && typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new ApiClientError("Session expired. Please sign in again.", 401);
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = (await response.json()) as ApiErrorBody;
      if (body.error) message = body.error;
      else if (body.message) message = body.message;
      if (body.issues?.fieldErrors) {
        const fieldMessages = Object.values(body.issues.fieldErrors).flat();
        if (fieldMessages.length > 0) message = fieldMessages.join(". ");
      }
    } catch {
      // ignore parse errors
    }
    throw new ApiClientError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
