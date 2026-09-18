"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  RiAddLine,
  RiArrowLeftLine,
  RiBrainLine,
  RiDeleteBinLine,
  RiErrorWarningLine,
  RiPencilLine,
} from "@remixicon/react";

import type { AppMemory } from "@/lib/api";
import {
  useCreateMemory,
  useDeleteMemory,
  useMemories,
  useUpdateMemory,
} from "@/hooks/use-memories";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

function MemoryFormDialog({
  memory,
  open,
  onOpenChange,
}: {
  memory?: AppMemory;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isEditing = Boolean(memory);
  const createMemory = useCreateMemory();
  const updateMemory = useUpdateMemory();
  const [text, setText] = useState(memory?.memory ?? "");
  const [error, setError] = useState<string | null>(null);

  const isPending = createMemory.isPending || updateMemory.isPending;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const value = text.trim();
    if (!value) return;
    setError(null);
    try {
      if (memory) {
        await updateMemory.mutateAsync({
          memoryId: memory.id,
          input: { memory: value },
        });
      } else {
        await createMemory.mutateAsync({ memory: value });
      }
      setText("");
      onOpenChange(false);
    } catch (mutationError) {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : "Something went wrong",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit memory" : "Add memory"}</DialogTitle>
          <DialogDescription>
            Memories personalize the AI&apos;s answers across all your
            workspaces.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error ? (
            <Alert variant="destructive">
              <RiErrorWarningLine />
              <AlertTitle>
                {isEditing ? "Update failed" : "Create failed"}
              </AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <div className="flex flex-col gap-2">
            <Label htmlFor="memory-text">Memory</Label>
            <Textarea
              id="memory-text"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="e.g. I'm preparing for a biology exam focused on cell structure."
              rows={4}
              maxLength={2000}
              className="max-h-40 overflow-y-auto"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !text.trim()}>
              {isPending ? <Spinner /> : null}
              {isEditing ? "Save changes" : "Add memory"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteMemoryDialog({
  memory,
  onClose,
}: {
  memory: AppMemory | null;
  onClose: () => void;
}) {
  const deleteMemory = useDeleteMemory();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!memory) return;
    setError(null);
    try {
      await deleteMemory.mutateAsync(memory.id);
      onClose();
    } catch (mutationError) {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : "Something went wrong",
      );
    }
  };

  return (
    <AlertDialog
      open={Boolean(memory)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete memory?</AlertDialogTitle>
          <AlertDialogDescription>
            The AI will no longer use this memory to personalize answers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteMemory.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMemory.isPending}
          >
            {deleteMemory.isPending ? <Spinner /> : null}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function MemoriesPage() {
  const memoriesQuery = useMemories();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<AppMemory | null>(null);
  const [toDelete, setToDelete] = useState<AppMemory | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <Link
          href="/dashboard"
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <RiArrowLeftLine className="size-4" />
          All workspaces
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-semibold tracking-tight">Memories</h1>
            <p className="text-sm text-muted-foreground">
              Things the AI has learned about you, plus anything you add
              yourself.
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <RiAddLine />
            Add memory
          </Button>
        </div>
      </div>

      {memoriesQuery.isPending ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-3 rounded-xl border p-3"
            >
              <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : memoriesQuery.isError ? (
        <Alert variant="destructive">
          <RiErrorWarningLine />
          <AlertTitle>Couldn&apos;t load memories</AlertTitle>
          <AlertDescription>{memoriesQuery.error.message}</AlertDescription>
        </Alert>
      ) : memoriesQuery.data.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <RiBrainLine className="size-6 text-muted-foreground" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="font-medium">No memories yet</p>
            <p className="text-sm text-muted-foreground">
              The AI learns from your chats automatically, or you can add one
              manually.
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="mt-2">
            <RiAddLine />
            Add memory
          </Button>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {memoriesQuery.data.map((memory) => (
            <li
              key={memory.id}
              className="flex items-start gap-3 rounded-xl border bg-card p-3"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="text-sm whitespace-pre-wrap">{memory.memory}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge
                    variant={
                      memory.source === "manual" ? "default" : "secondary"
                    }
                  >
                    {memory.source === "manual" ? "Added by you" : "Learned"}
                  </Badge>
                  <span>
                    {format(new Date(memory.createdAt), "MMM d, yyyy")}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Edit memory"
                  onClick={() => setEditing(memory)}
                >
                  <RiPencilLine className="text-muted-foreground" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Delete memory"
                  onClick={() => setToDelete(memory)}
                >
                  <RiDeleteBinLine className="text-muted-foreground" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <MemoryFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      {editing ? (
        <MemoryFormDialog
          memory={editing}
          open={Boolean(editing)}
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
        />
      ) : null}
      <DeleteMemoryDialog
        memory={toDelete}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
}
