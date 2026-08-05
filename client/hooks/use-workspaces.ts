"use client";

import { useQuery } from "@tanstack/react-query";

import { apiFetch, ApiError, type Workspace } from "@/lib/api";

export const workspaceKeys = {
  all: ["workspaces"] as const,
  lists: () => [...workspaceKeys.all, "list"] as const,
};

export function useWorkspaces() {
  return useQuery({
    queryKey: workspaceKeys.lists(),
    queryFn: () => apiFetch<Workspace[]>("/api/workspaces"),
    retry: (failureCount, error) => {
      // Don't retry when the session is missing/expired — the auth
      // guard will handle the redirect instead.
      if (error instanceof ApiError && error.status === 401) return false;
      return failureCount < 2;
    },
  });
}
