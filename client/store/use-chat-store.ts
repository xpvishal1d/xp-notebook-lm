"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Client-side chat UI state. Server data (conversations, messages) stays in
 * TanStack Query — this store only holds ephemeral/per-user UI selections.
 *
 * Persistence: only `webSearch` and the per-workspace `modelOverride` are
 * persisted to localStorage. `conversationId` and the `input` draft are kept
 * in-memory only.
 */
interface ChatState {
  /** Currently selected conversation for the active chat panel. */
  conversationId: string | null;
  /** Whether to ground answers with live web search. */
  webSearch: boolean;
  /** The (unsent) composer draft. */
  input: string;
  /**
   * Per-workspace model override. Keyed by workspaceId so switching
   * workspaces falls back to that workspace's default until the user picks
   * a model for it.
   */
  modelOverride: Record<string, string>;

  setConversationId: (conversationId: string | null) => void;
  setWebSearch: (webSearch: boolean) => void;
  setInput: (input: string) => void;
  setModel: (workspaceId: string, model: string) => void;
  /** Clear the active conversation + composer (e.g. "New chat"). */
  resetConversation: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      conversationId: null,
      webSearch: false,
      input: "",
      modelOverride: {},

      setConversationId: (conversationId) => set({ conversationId }),
      setWebSearch: (webSearch) => set({ webSearch }),
      setInput: (input) => set({ input }),
      setModel: (workspaceId, model) =>
        set((state) => ({
          modelOverride: { ...state.modelOverride, [workspaceId]: model },
        })),
      resetConversation: () => set({ conversationId: null, input: "" }),
    }),
    {
      name: "xp-notebook-chat",
      // Only persist durable user preferences — not the ephemeral selection
      // or the in-progress draft.
      partialize: (state) => ({
        webSearch: state.webSearch,
        modelOverride: state.modelOverride,
      }),
    },
  ),
);

/** Resolve the effective model for a workspace (override → default). */
export function selectModel(
  state: Pick<ChatState, "modelOverride">,
  workspaceId: string,
  defaultModel?: string,
): string {
  return state.modelOverride[workspaceId] ?? defaultModel ?? "gpt-4o-mini";
}
