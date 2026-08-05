export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Small fetch wrapper for the Express API. Requests are same-origin
 * (/api/* is proxied to the server), so the session cookie is sent
 * automatically; `credentials: "include"` is set for safety.
 */
export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(path, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const data: unknown = await response.json();
      if (
        data &&
        typeof data === "object" &&
        "error" in data &&
        typeof data.error === "string"
      ) {
        message = data.error;
      }
    } catch {
      // Response had no JSON body — keep the default message.
    }
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export interface Workspace {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  icon: string | null;
  defaultModel: string;
  createdAt: string;
  updatedAt: string;
}
