"use client";

import { useState } from "react";

import type { Workspace } from "@/lib/api";
import { useDeleteWorkspace } from "@/hooks/use-workspaces";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";

interface DeleteWorkspaceDialogProps {
  workspace: Workspace;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after the workspace was deleted (e.g. to navigate away). */
  onDeleted?: () => void;
}

export function DeleteWorkspaceDialog({
  workspace,
  open,
  onOpenChange,
  onDeleted,
}: DeleteWorkspaceDialogProps) {
  const deleteWorkspace = useDeleteWorkspace();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setError(null);
    try {
      await deleteWorkspace.mutateAsync(workspace.id);
      onOpenChange(false);
      onDeleted?.();
    } catch (mutationError) {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : "Something went wrong",
      );
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete workspace?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes &ldquo;{workspace.title}&rdquo; and all
            of its sources. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteWorkspace.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteWorkspace.isPending}
          >
            {deleteWorkspace.isPending ? <Spinner /> : null}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
