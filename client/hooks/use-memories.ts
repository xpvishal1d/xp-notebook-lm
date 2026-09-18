"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  apiFetch,
  ApiError,
  type AppMemory,
  type CreateMemoryInput,
  type UpdateMemoryInput,
} from "@/lib/api";

export const memoryKeys = {
  all: ["memories"] as const,
};

export function useMemories() {
  return useQuery({
    queryKey: memoryKeys.all,
    queryFn: () => apiFetch<AppMemory[]>("/api/memories"),
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status === 401) return false;
      return failureCount < 2;
    },
  });
}

export function useCreateMemory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateMemoryInput) =>
      apiFetch<AppMemory>("/api/memories", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memoryKeys.all });
    },
  });
}

export function useUpdateMemory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      memoryId,
      input,
    }: {
      memoryId: string;
      input: UpdateMemoryInput;
    }) =>
      apiFetch<AppMemory>(`/api/memories/${memoryId}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memoryKeys.all });
    },
  });
}

export function useDeleteMemory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memoryId: string) =>
      apiFetch<undefined>(`/api/memories/${memoryId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memoryKeys.all });
    },
  });
}
