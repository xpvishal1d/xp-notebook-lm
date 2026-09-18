"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  apiFetch,
  ApiError,
  type Artifact,
  type CreateArtifactInput,
} from "@/lib/api";

export const artifactKeys = {
  all: ["artifacts"] as const,
  lists: (workspaceId: string) =>
    [...artifactKeys.all, "list", workspaceId] as const,
};

export function useArtifacts(workspaceId: string) {
  return useQuery({
    queryKey: artifactKeys.lists(workspaceId),
    queryFn: () =>
      apiFetch<Artifact[]>(`/api/workspaces/${workspaceId}/artifacts`),
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 401) return false;
      return failureCount < 2;
    },
    // Generation runs in the background (Inngest) — poll while in flight.
    refetchInterval: (query) => {
      const artifacts = query.state.data;
      return artifacts?.some(
        (artifact) =>
          artifact.status === "PENDING" || artifact.status === "PROCESSING",
      )
        ? 3000
        : false;
    },
  });
}

export function useCreateArtifact(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateArtifactInput) =>
      apiFetch<Artifact>(`/api/workspaces/${workspaceId}/artifacts`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: artifactKeys.lists(workspaceId),
      });
    },
  });
}

export function useDeleteArtifact(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (artifactId: string) =>
      apiFetch<undefined>(
        `/api/workspaces/${workspaceId}/artifacts/${artifactId}`,
        { method: "DELETE" },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: artifactKeys.lists(workspaceId),
      });
    },
  });
}
