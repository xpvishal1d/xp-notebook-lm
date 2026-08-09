"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  apiFetch,
  apiUpload,
  ApiError,
  type CreateTextSourceInput,
  type ImportSourceInput,
  type ListSourcesFilters,
  type Source,
} from "@/lib/api";

export const sourceKeys = {
  all: ["sources"] as const,
  lists: (workspaceId: string) =>
    [...sourceKeys.all, "list", workspaceId] as const,
};

function buildSourcesPath(workspaceId: string, filters?: ListSourcesFilters) {
  const params = new URLSearchParams();
  if (filters?.q) params.set("q", filters.q);
  if (filters?.type) params.set("type", filters.type);
  if (filters?.status) params.set("status", filters.status);

  const query = params.toString();
  return `/api/workspaces/${workspaceId}/sources${query ? `?${query}` : ""}`;
}

export function useSources(workspaceId: string, filters?: ListSourcesFilters) {
  return useQuery({
    queryKey: [...sourceKeys.lists(workspaceId), filters] as const,
    queryFn: () => apiFetch<Source[]>(buildSourcesPath(workspaceId, filters)),
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 401) return false;
      return failureCount < 2;
    },
    // Sources are processed asynchronously — poll while any are in flight
    // so the status badges update without a manual refresh.
    refetchInterval: (query) => {
      const sources = query.state.data;
      return sources?.some(
        (source) =>
          source.status === "PENDING" || source.status === "PROCESSING",
      )
        ? 3000
        : false;
    },
  });
}

function useInvalidateSources(workspaceId: string) {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({
      queryKey: sourceKeys.lists(workspaceId),
    });
}

export function useCreateTextSource(workspaceId: string) {
  const invalidate = useInvalidateSources(workspaceId);

  return useMutation({
    mutationFn: (input: CreateTextSourceInput) =>
      apiFetch<Source>(`/api/workspaces/${workspaceId}/sources`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: invalidate,
  });
}

export function useUploadPdfSource(workspaceId: string) {
  const invalidate = useInvalidateSources(workspaceId);

  return useMutation({
    mutationFn: ({ file, title }: { file: File; title?: string }) => {
      const formData = new FormData();
      formData.append("file", file);
      if (title?.trim()) formData.append("title", title.trim());
      return apiUpload<Source>(
        `/api/workspaces/${workspaceId}/sources/upload`,
        formData,
      );
    },
    onSuccess: invalidate,
  });
}

export function useImportWebsiteSource(workspaceId: string) {
  const invalidate = useInvalidateSources(workspaceId);

  return useMutation({
    mutationFn: (input: ImportSourceInput) =>
      apiFetch<Source>(
        `/api/workspaces/${workspaceId}/sources/import/website`,
        {
          method: "POST",
          body: JSON.stringify(input),
        },
      ),
    onSuccess: invalidate,
  });
}

export function useImportYoutubeSource(workspaceId: string) {
  const invalidate = useInvalidateSources(workspaceId);

  return useMutation({
    mutationFn: (input: ImportSourceInput) =>
      apiFetch<Source>(
        `/api/workspaces/${workspaceId}/sources/import/youtube`,
        {
          method: "POST",
          body: JSON.stringify(input),
        },
      ),
    onSuccess: invalidate,
  });
}

export function useDeleteSource(workspaceId: string) {
  const invalidate = useInvalidateSources(workspaceId);

  return useMutation({
    mutationFn: (sourceId: string) =>
      apiFetch<undefined>(
        `/api/workspaces/${workspaceId}/sources/${sourceId}`,
        { method: "DELETE" },
      ),
    onSuccess: invalidate,
  });
}
