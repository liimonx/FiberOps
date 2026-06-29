import { apiClient, ApiClientError } from "@/lib/apiClient";
import { parseSettingsError } from "@/modules/settings/lib/parseSettingsError";

export async function fetchApi<T>(path: string, init?: RequestInit): Promise<T> {
  try {
    return await apiClient<T>(path, init);
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw new Error(error.message);
    }
    throw error;
  }
}

export async function fetchApiWithSettingsError(
  path: string,
  init: RequestInit | undefined,
  fallback: string
): Promise<Response> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    await parseSettingsError(response, fallback);
  }

  return response;
}

export async function fetchList<T>(path: string): Promise<T[]> {
  const body = await fetchApi<{ items: T[] }>(path);
  return body.items;
}
