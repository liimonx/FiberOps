const TOKEN_COOKIE = "fiberops-auth";

/** In-memory bearer token — never persisted to localStorage. */
let memoryToken: string | null = null;

export function getAuthToken(): string | null {
  return memoryToken;
}

async function syncHttpOnlySession(token: string): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
      credentials: "same-origin",
    });
  } catch {
    // Middleware cookie is best-effort; API still uses in-memory bearer.
  }
}

async function clearHttpOnlySession(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    await fetch("/api/session", {
      method: "DELETE",
      credentials: "same-origin",
    });
  } catch {
    // ignore
  }
}

export async function setAuthToken(token: string): Promise<void> {
  memoryToken = token;
  await syncHttpOnlySession(token);
}

export async function clearAuthToken(): Promise<void> {
  memoryToken = null;
  await clearHttpOnlySession();
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
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      ...(token && !skipAuth ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (response.status === 401 && !skipAuth) {
    // Await cookie clear before redirect so middleware cannot treat the session as still valid.
    await clearAuthToken();
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new ApiClientError("Session expired. Please sign in again.", 401);
  }

  if (response.status === 403 && !skipAuth) {
    let message = "You do not have permission to perform this action.";
    try {
      const body = (await response.json()) as ApiErrorBody;
      if (body.error) message = body.error;
      else if (body.message) message = body.message;
    } catch {
      // ignore
    }
    throw new ApiClientError(message, 403);
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

export { TOKEN_COOKIE };
