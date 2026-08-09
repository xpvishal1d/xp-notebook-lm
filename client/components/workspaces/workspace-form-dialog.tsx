"use client";

import { useState } from "react";
import { RiErrorWarningLine } from "@remixicon/react";

import type { Workspace } from "@/lib/api";
import {
  useCreateWorkspace,
  useUpdateWorkspace,
} from "@/hooks/use-workspaces";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

const CHAT_MODELS = [
  { value: "gpt-4o-mini", label: "GPT-4o mini" },
  { value: "gpt-4o", label: "GPT-4o" },
] as const;

interface WorkspaceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When provided the dialog edits this workspace, otherwise it creates one. */
  workspace?: Workspace;
}

export function WorkspaceFormDialog({
  open,
  onOpenChange,
  workspace,
}: WorkspaceFormDialogProps) {
  const isEditing = Boolean(workspace);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit workspace" : "New workspace"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the details of your workspace."
              : "Workspaces keep your sources and chats for a topic in one place."}
          </DialogDescription>
        </DialogHeader>

        {/* DialogContent only mounts while open, so the form remounts with
            fresh initial values every time the dialog opens. */}
        <WorkspaceForm
          workspace={workspace}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function WorkspaceForm({
  workspace,
  onClose,
}: {
  workspace?: Workspace;
  onClose: () => void;
}) {
  const isEditing = Boolean(workspace);

  const [title, setTitle] = useState(workspace?.title ?? "");
  const [description, setDescription] = useState(
    workspace?.description ?? "",
  );
  const [icon, setIcon] = useState(workspace?.icon ?? "");
  const [defaultModel, setDefaultModel] = useState<
    (typeof CHAT_MODELS)[number]["value"]
  >(workspace?.defaultModel === "gpt-4o" ? "gpt-4o" : "gpt-4o-mini");
  const [error, setError] = useState<string | null>(null);

  const createWorkspace = useCreateWorkspace();
  const updateWorkspace = useUpdateWorkspace(workspace?.id ?? "");
  const isPending = createWorkspace.isPending || updateWorkspace.isPending;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const input = {
      title: title.trim(),
      ...(description.trim() ? { description: description.trim() } : {}),
      ...(icon.trim() ? { icon: icon.trim() } : {}),
      defaultModel,
    };

    try {
      if (isEditing) {
        await updateWorkspace.mutateAsync(input);
      } else {
        await createWorkspace.mutateAsync(input);
      }
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error ? (
            <Alert variant="destructive">
              <RiErrorWarningLine />
              <AlertTitle>
                {isEditing
                  ? "Couldn't update workspace"
                  : "Couldn't create workspace"}
              </AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-col gap-2">
            <Label htmlFor="workspace-title">Title</Label>
            <Input
              id="workspace-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Research notes"
              maxLength={120}
              required
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="workspace-description">
              Description{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Textarea
              id="workspace-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What is this workspace about?"
              maxLength={500}
              rows={3}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="workspace-icon">
                Icon{" "}
                <span className="font-normal text-muted-foreground">
                  (emoji)
                </span>
              </Label>
              <Input
                id="workspace-icon"
                value={icon}
                onChange={(event) => setIcon(event.target.value)}
                placeholder="📚"
                maxLength={8}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="workspace-model">Default model</Label>
              <Select
                value={defaultModel}
                onValueChange={(value) =>
                  setDefaultModel(
                    value as (typeof CHAT_MODELS)[number]["value"],
                  )
                }
              >
                <SelectTrigger id="workspace-model" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHAT_MODELS.map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !title.trim()}>
              {isPending ? <Spinner /> : null}
              {isEditing ? "Save changes" : "Create workspace"}
            </Button>
          </DialogFooter>
    </form>
  );
}
