"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  apiFetch,
  ApiError,
  type CreateWorkspaceInput,
  type UpdateWorkspaceInput,
  type Workspace,
} from "@/lib/api";

export const workspaceKeys = {
  all: ["workspaces"] as const,
  lists: () => [...workspaceKeys.all, "list"] as const,
  details: () => [...workspaceKeys.all, "detail"] as const,
  detail: (workspaceId: string) =>
    [...workspaceKeys.details(), workspaceId] as const,
};

function shouldRetry(failureCount: number, error: Error) {
  // Don't retry when the session is missing/expired — the auth
  // guard will handle the redirect instead.
  if (error instanceof ApiError && error.status === 401) return false;
  return failureCount < 2;
}

export function useWorkspaces() {
  return useQuery({
    queryKey: workspaceKeys.lists(),
    queryFn: () => apiFetch<Workspace[]>("/api/workspaces"),
    retry: shouldRetry,
  });
}

export function useWorkspace(workspaceId: string) {
  return useQuery({
    queryKey: workspaceKeys.detail(workspaceId),
    queryFn: () => apiFetch<Workspace>(`/api/workspaces/${workspaceId}`),
    retry: shouldRetry,
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateWorkspaceInput) =>
      apiFetch<Workspace>("/api/workspaces", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.lists() });
    },
  });
}

export function useUpdateWorkspace(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateWorkspaceInput) =>
      apiFetch<Workspace>(`/api/workspaces/${workspaceId}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: (workspace) => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.lists() });
      queryClient.setQueryData(workspaceKeys.detail(workspaceId), workspace);
    },
  });
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (workspaceId: string) =>
      apiFetch<undefined>(`/api/workspaces/${workspaceId}`, {
        method: "DELETE",
      }),
    onSuccess: (_data, workspaceId) => {
      queryClient.removeQueries({
        queryKey: workspaceKeys.detail(workspaceId),
      });
      queryClient.invalidateQueries({ queryKey: workspaceKeys.lists() });
    },
  });
}
