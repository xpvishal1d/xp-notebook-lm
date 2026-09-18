"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type WorkspaceTab = "chat" | "sources" | "artifacts";

/**
 * Global, cross-page UI state. Server data stays in TanStack Query.
 * Persisted so the active workspace tab survives reloads.
 */
interface UIState {
  /** Active tab on the workspace detail page. */
  workspaceTab: WorkspaceTab;
  setWorkspaceTab: (tab: WorkspaceTab) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      workspaceTab: "chat",
      setWorkspaceTab: (workspaceTab) => set({ workspaceTab }),
    }),
    { name: "xp-notebook-ui" },
  ),
);
