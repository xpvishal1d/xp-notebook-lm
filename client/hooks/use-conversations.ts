"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  apiFetch,
  ApiError,
  type ChatMessage,
  type Conversation,
  type CreateConversationInput,
} from "@/lib/api";

export const conversationKeys = {
  all: ["conversations"] as const,
  lists: (workspaceId: string) =>
    [...conversationKeys.all, "list", workspaceId] as const,
  messages: (workspaceId: string, conversationId: string) =>
    [...conversationKeys.all, "messages", workspaceId, conversationId] as const,
};

function shouldRetry(failureCount: number, error: Error) {
  if (error instanceof ApiError && error.status === 401) return false;
  return failureCount < 2;
}

export function useConversations(workspaceId: string) {
  return useQuery({
    queryKey: conversationKeys.lists(workspaceId),
    queryFn: () =>
      apiFetch<Conversation[]>(
        `/api/workspaces/${workspaceId}/conversations`,
      ),
    retry: shouldRetry,
  });
}

export function useConversationMessages(
  workspaceId: string,
  conversationId: string | null,
) {
  return useQuery({
    queryKey: conversationKeys.messages(workspaceId, conversationId ?? "none"),
    queryFn: () =>
      apiFetch<ChatMessage[]>(
        `/api/workspaces/${workspaceId}/conversations/${conversationId}/messages`,
      ),
    enabled: Boolean(conversationId),
    retry: shouldRetry,
  });
}

export function useCreateConversation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateConversationInput) =>
      apiFetch<Conversation>(`/api/workspaces/${workspaceId}/conversations`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: conversationKeys.lists(workspaceId),
      });
    },
  });
}

export function useDeleteConversation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) =>
      apiFetch<undefined>(
        `/api/workspaces/${workspaceId}/conversations/${conversationId}`,
        { method: "DELETE" },
      ),
    onSuccess: (_data, conversationId) => {
      queryClient.removeQueries({
        queryKey: conversationKeys.messages(workspaceId, conversationId),
      });
      queryClient.invalidateQueries({
        queryKey: conversationKeys.lists(workspaceId),
      });
    },
  });
}
