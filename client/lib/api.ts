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

/**
 * Multipart variant of `apiFetch` (e.g. PDF upload). The browser must set
 * the `Content-Type` header itself so the multipart boundary is included.
 */
export async function apiUpload<T>(
  path: string,
  formData: FormData,
): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    credentials: "include",
    body: formData,
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

  return (await response.json()) as T;
}

export interface Workspace {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  defaultModel: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkspaceInput {
  title: string;
  description?: string;
  icon?: string;
  defaultModel?: "gpt-4o-mini" | "gpt-4o";
}

export type UpdateWorkspaceInput = Partial<CreateWorkspaceInput>;

export type SourceType = "PDF" | "WEBSITE" | "YOUTUBE" | "TEXT" | "MARKDOWN";

export type SourceStatus = "PENDING" | "PROCESSING" | "READY" | "FAILED";

export interface Source {
  id: string;
  workspaceId: string;
  type: SourceType;
  title: string;
  content: string | null;
  url: string | null;
  status: SourceStatus;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTextSourceInput {
  type: "TEXT" | "MARKDOWN";
  title: string;
  content: string;
}

export interface ImportSourceInput {
  url: string;
  title?: string;
}

export interface ListSourcesFilters {
  q?: string;
  type?: SourceType;
  status?: SourceStatus;
}

export type ChatRole = "USER" | "ASSISTANT";

export interface Citation {
  sourceType?: string;
  sourceTitle?: string;
  url?: string;
  excerpt?: string;
  page?: number;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: ChatRole;
  content: string;
  citations: Citation[] | null;
  createdAt: string;
}

export interface Conversation {
  id: string;
  workspaceId: string;
  title: string | null;
  summary: string | null;
  summaryMessageCount: number | null;
  summarizedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateConversationInput {
  title?: string;
}

export type ArtifactType =
  | "SUMMARY"
  | "TAKEAWAYS"
  | "FLASHCARDS"
  | "QUIZ"
  | "MINDMAP"
  | "REPORT";

export type ArtifactStatus = "PENDING" | "PROCESSING" | "READY" | "FAILED";

export interface Artifact {
  id: string;
  workspaceId: string;
  type: ArtifactType;
  title: string;
  content: unknown;
  sourceIds: string[];
  status: ArtifactStatus;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateArtifactInput {
  type: ArtifactType;
  title?: string;
  sourceIds?: string[];
}

export interface AppMemory {
  id: string;
  memory: string;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown> | null;
  categories?: string[];
  source: "manual" | "learned";
}

export interface CreateMemoryInput {
  memory: string;
  infer?: boolean;
}

export interface UpdateMemoryInput {
  memory: string;
}
