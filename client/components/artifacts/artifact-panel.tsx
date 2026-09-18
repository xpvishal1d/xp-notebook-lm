"use client";

import { useState } from "react";
import { format } from "date-fns";
import {
  RiAddLine,
  RiDeleteBinLine,
  RiErrorWarningLine,
  RiFileList3Line,
  RiFlashlightLine,
  RiListCheck2,
  RiMindMap,
  RiQuestionLine,
  RiSparklingLine,
} from "@remixicon/react";

import type { Artifact, ArtifactStatus, ArtifactType } from "@/lib/api";
import {
  useArtifacts,
  useCreateArtifact,
  useDeleteArtifact,
} from "@/hooks/use-artifacts";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";

const TYPE_META: Record<
  ArtifactType,
  { label: string; Icon: typeof RiFileList3Line }
> = {
  SUMMARY: { label: "Summary", Icon: RiFileList3Line },
  TAKEAWAYS: { label: "Key Takeaways", Icon: RiListCheck2 },
  FLASHCARDS: { label: "Flashcards", Icon: RiFlashlightLine },
  QUIZ: { label: "Quiz", Icon: RiQuestionLine },
  MINDMAP: { label: "Mind Map", Icon: RiMindMap },
  REPORT: { label: "AI Report", Icon: RiSparklingLine },
};

const STATUS_META: Record<
  ArtifactStatus,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  PENDING: { label: "Pending", variant: "outline" },
  PROCESSING: { label: "Generating", variant: "secondary" },
  READY: { label: "Ready", variant: "default" },
  FAILED: { label: "Failed", variant: "destructive" },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function stringArray(value: unknown): string[] | null {
  return Array.isArray(value) && value.every((v) => typeof v === "string")
    ? (value as string[])
    : null;
}


function ArtifactContent({ artifact }: { artifact: Artifact }) {
  const content = artifact.content;

  if (typeof content === "string") {
    return <p className="text-sm whitespace-pre-wrap">{content}</p>;
  }

  if (!isRecord(content)) {
    return (
      <p className="text-sm text-muted-foreground">No content generated.</p>
    );
  }

  const markdown =
    typeof content.markdown === "string"
      ? content.markdown
      : typeof content.summary === "string"
        ? content.summary
        : typeof content.text === "string"
          ? content.text
          : null;

  if (markdown) {
    return <p className="text-sm whitespace-pre-wrap">{markdown}</p>;
  }

  const items = stringArray(content.items);
  if (items) {
    return (
      <ul className="flex list-disc flex-col gap-2 pl-5 text-sm">
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    );
  }

  if (Array.isArray(content.cards)) {
    const cards = content.cards.filter(
      (card): card is { front: string; back: string } =>
        isRecord(card) &&
        typeof card.front === "string" &&
        typeof card.back === "string",
    );
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map((card, index) => (
          <div key={index} className="rounded-lg border bg-muted/40 p-3">
            <p className="text-sm font-medium">{card.front}</p>
            <p className="mt-1 text-sm text-muted-foreground">{card.back}</p>
          </div>
        ))}
      </div>
    );
  }

  if (Array.isArray(content.questions)) {
    const questions = content.questions.filter(isRecord);
    return (
      <ol className="flex flex-col gap-6 text-sm">
        {questions.map((question, index) => {
          const options = stringArray(question.options) ?? [];
          const correctIndex =
            typeof question.correctIndex === "number"
              ? question.correctIndex
              : -1;
          return (
            <li key={index} className="flex flex-col gap-2">
              <p className="font-medium">
                {index + 1}.{" "}
                {typeof question.question === "string"
                  ? question.question
                  : "Question"}
              </p>
              <ul className="flex flex-col gap-1">
                {options.map((option, optionIndex) => (
                  <li
                    key={optionIndex}
                    className={
                      optionIndex === correctIndex
                        ? "font-medium text-primary"
                        : "text-muted-foreground"
                    }
                  >
                    {String.fromCharCode(65 + optionIndex)}. {option}
                    {optionIndex === correctIndex ? " ✓" : ""}
                  </li>
                ))}
              </ul>
              {typeof question.explanation === "string" ? (
                <p className="text-xs text-muted-foreground">
                  {question.explanation}
                </p>
              ) : null}
            </li>
          );
        })}
      </ol>
    );
  }

  if (Array.isArray(content.nodes) && Array.isArray(content.edges)) {
    const labels = new Map<string, string>();
    for (const node of content.nodes) {
      if (isRecord(node) && typeof node.id === "string") {
        labels.set(
          node.id,
          typeof node.label === "string" ? node.label : node.id,
        );
      }
    }
    return (
      <ul className="flex flex-col gap-1.5 text-sm">
        {content.edges.filter(isRecord).map((edge, index) => (
          <li key={index} className="flex items-center gap-2">
            <Badge variant="outline">
              {typeof edge.source === "string"
                ? (labels.get(edge.source) ?? edge.source)
                : "?"}
            </Badge>
            <span className="text-muted-foreground">→</span>
            <Badge variant="outline">
              {typeof edge.target === "string"
                ? (labels.get(edge.target) ?? edge.target)
                : "?"}
            </Badge>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <pre className="max-h-96 overflow-auto rounded-lg bg-muted p-3 text-xs">
      {JSON.stringify(content, null, 2)}
    </pre>
  );
}

function GenerateArtifactDialog({
  workspaceId,
  open,
  onOpenChange,
}: {
  workspaceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createArtifact = useCreateArtifact(workspaceId);
  const [type, setType] = useState<ArtifactType>("SUMMARY");
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      await createArtifact.mutateAsync({
        type,
        title: title.trim() || undefined,
      });
      setTitle("");
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
          <DialogTitle>Generate learning tool</DialogTitle>
          <DialogDescription>
            The AI builds it from this workspace&apos;s ready sources.
            Generation runs in the background.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error ? (
            <Alert variant="destructive">
              <RiErrorWarningLine />
              <AlertTitle>Generation failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <div className="flex flex-col gap-2">
            <Label htmlFor="artifact-type">Type</Label>
            <Select
              value={type}
              onValueChange={(value) => setType(value as ArtifactType)}
            >
              <SelectTrigger id="artifact-type" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TYPE_META).map(([value, meta]) => (
                  <SelectItem key={value} value={value}>
                    {meta.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="artifact-title">
              Title{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Input
              id="artifact-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Defaults to the type and date"
              maxLength={120}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createArtifact.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createArtifact.isPending}>
              {createArtifact.isPending ? <Spinner /> : null}
              Generate
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteArtifactDialog({
  workspaceId,
  artifact,
  onClose,
}: {
  workspaceId: string;
  artifact: Artifact | null;
  onClose: () => void;
}) {
  const deleteArtifact = useDeleteArtifact(workspaceId);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!artifact) return;
    setError(null);
    try {
      await deleteArtifact.mutateAsync(artifact.id);
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
      open={Boolean(artifact)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete artifact?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes &ldquo;{artifact?.title}&rdquo;. This
            action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteArtifact.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteArtifact.isPending}
          >
            {deleteArtifact.isPending ? <Spinner /> : null}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function ArtifactPanel({ workspaceId }: { workspaceId: string }) {
  const artifactsQuery = useArtifacts(workspaceId);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [selected, setSelected] = useState<Artifact | null>(null);
  const [toDelete, setToDelete] = useState<Artifact | null>(null);

  // Keep the open viewer in sync with polling updates.
  const selectedArtifact = selected
    ? (artifactsQuery.data?.find((a) => a.id === selected.id) ?? selected)
    : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold tracking-tight">
          Learning tools
        </h2>
        <Button onClick={() => setGenerateOpen(true)}>
          <RiAddLine />
          Generate
        </Button>
      </div>

      {artifactsQuery.isPending ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="rounded-xl border p-4">
              <Skeleton className="mb-3 size-9 rounded-lg" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="mt-1.5 h-3 w-1/3" />
            </div>
          ))}
        </div>
      ) : artifactsQuery.isError ? (
        <Alert variant="destructive">
          <RiErrorWarningLine />
          <AlertTitle>Couldn&apos;t load artifacts</AlertTitle>
          <AlertDescription>{artifactsQuery.error.message}</AlertDescription>
        </Alert>
      ) : artifactsQuery.data.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <RiSparklingLine className="size-6 text-muted-foreground" />
          </div>
          <div className="flex flex-col gap-1">
            <p className="font-medium">No learning tools yet</p>
            <p className="text-sm text-muted-foreground">
              Generate summaries, flashcards, quizzes and more from your
              sources.
            </p>
          </div>
          <Button onClick={() => setGenerateOpen(true)} className="mt-2">
            <RiAddLine />
            Generate
          </Button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {artifactsQuery.data.map((artifact) => {
            const { label, Icon } = TYPE_META[artifact.type];
            const status = STATUS_META[artifact.status];
            return (
              <div
                key={artifact.id}
                className="flex flex-col gap-3 rounded-xl border bg-card p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-4" />
                  </span>
                  <div className="flex items-center gap-1">
                    <Badge variant={status.variant}>
                      {artifact.status === "PROCESSING" ? <Spinner /> : null}
                      {status.label}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Delete ${artifact.title}`}
                      onClick={() => setToDelete(artifact)}
                    >
                      <RiDeleteBinLine className="text-muted-foreground" />
                    </Button>
                  </div>
                </div>
                <div className="flex min-w-0 flex-col">
                  <span className="truncate text-sm font-medium">
                    {artifact.title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {label} ·{" "}
                    {format(new Date(artifact.createdAt), "MMM d, yyyy")}
                  </span>
                </div>
                {artifact.status === "FAILED" ? (
                  <p className="text-xs text-destructive">
                    {typeof artifact.metadata?.processingError === "string"
                      ? artifact.metadata.processingError
                      : "Generation failed"}
                  </p>
                ) : null}
                {artifact.status === "READY" ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-fit"
                    onClick={() => setSelected(artifact)}
                  >
                    Open
                  </Button>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      <GenerateArtifactDialog
        workspaceId={workspaceId}
        open={generateOpen}
        onOpenChange={setGenerateOpen}
      />
      <Dialog
        open={Boolean(selectedArtifact)}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedArtifact?.title}</DialogTitle>
            <DialogDescription>
              {selectedArtifact
                ? TYPE_META[selectedArtifact.type].label
                : null}
            </DialogDescription>
          </DialogHeader>
          {selectedArtifact ? (
            <ArtifactContent artifact={selectedArtifact} />
          ) : null}
        </DialogContent>
      </Dialog>
      <DeleteArtifactDialog
        workspaceId={workspaceId}
        artifact={toDelete}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
}
