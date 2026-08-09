"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  RiAddLine,
  RiArrowLeftLine,
  RiDeleteBinLine,
  RiErrorWarningLine,
  RiFilePdfLine,
  RiFileTextLine,
  RiFolderLine,
  RiGlobalLine,
  RiMarkdownLine,
  RiMore2Line,
  RiPencilLine,
  RiSearchLine,
  RiYoutubeLine,
} from "@remixicon/react";

import type { Source, SourceStatus, SourceType } from "@/lib/api";
import { useDeleteSource, useSources } from "@/hooks/use-sources";
import { useWorkspace } from "@/hooks/use-workspaces";
import { AddSourceDialog } from "@/components/sources/add-source-dialog";
import { DeleteWorkspaceDialog } from "@/components/workspaces/delete-workspace-dialog";
import { WorkspaceFormDialog } from "@/components/workspaces/workspace-form-dialog";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";

const SOURCE_TYPE_META: Record<
  SourceType,
  { label: string; Icon: typeof RiFilePdfLine }
> = {
  PDF: { label: "PDF", Icon: RiFilePdfLine },
  WEBSITE: { label: "Website", Icon: RiGlobalLine },
  YOUTUBE: { label: "YouTube", Icon: RiYoutubeLine },
  TEXT: { label: "Text", Icon: RiFileTextLine },
  MARKDOWN: { label: "Markdown", Icon: RiMarkdownLine },
};

const STATUS_META: Record<
  SourceStatus,
  { label: string; variant: "default" | "secondary" | "outline" | "destructive" }
> = {
  PENDING: { label: "Pending", variant: "outline" },
  PROCESSING: { label: "Processing", variant: "secondary" },
  READY: { label: "Ready", variant: "default" },
  FAILED: { label: "Failed", variant: "destructive" },
};

function sourceSubtitle(source: Source) {
  const parts = [
    SOURCE_TYPE_META[source.type].label,
    format(new Date(source.createdAt), "MMM d, yyyy"),
  ];
  if (source.url) {
    try {
      parts.push(new URL(source.url).host);
    } catch {
      parts.push(source.url);
    }
  }
  return parts.join(" · ");
}

function SourceRow({
  source,
  onDeleteClick,
}: {
  source: Source;
  onDeleteClick: (source: Source) => void;
}) {
  const { Icon } = SOURCE_TYPE_META[source.type];
  const status = STATUS_META[source.status];

  return (
    <li className="flex items-center gap-3 rounded-xl border bg-card p-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium">{source.title}</span>
        <span className="truncate text-xs text-muted-foreground">
          {sourceSubtitle(source)}
        </span>
      </div>
      <Badge variant={status.variant}>
        {source.status === "PROCESSING" ? <Spinner /> : null}
        {status.label}
      </Badge>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Delete ${source.title}`}
        onClick={() => onDeleteClick(source)}
      >
        <RiDeleteBinLine className="text-muted-foreground" />
      </Button>
    </li>
  );
}

function SourcesSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 rounded-xl border p-3"
        >
          <Skeleton className="size-9 rounded-lg" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function SourcesEmptyState({
  onAddClick,
  isFiltered,
}: {
  onAddClick: () => void;
  isFiltered: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <RiFileTextLine className="size-6 text-muted-foreground" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="font-medium">
          {isFiltered ? "No sources match your search" : "No sources yet"}
        </p>
        <p className="text-sm text-muted-foreground">
          {isFiltered
            ? "Try a different search term."
            : "Add a PDF, link, or text so the AI can answer from it."}
        </p>
      </div>
      {!isFiltered ? (
        <Button onClick={onAddClick} className="mt-2">
          <RiAddLine />
          Add source
        </Button>
      ) : null}
    </div>
  );
}

function DeleteSourceDialog({
  workspaceId,
  source,
  onClose,
}: {
  workspaceId: string;
  source: Source | null;
  onClose: () => void;
}) {
  const deleteSource = useDeleteSource(workspaceId);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!source) return;
    setError(null);
    try {
      await deleteSource.mutateAsync(source.id);
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
      open={Boolean(source)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete source?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently removes &ldquo;{source?.title}&rdquo; from the
            workspace. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteSource.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteSource.isPending}
          >
            {deleteSource.isPending ? <Spinner /> : null}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function WorkspaceDetailPage() {
  const params = useParams<{ workspaceId: string }>();
  const workspaceId = params.workspaceId;
  const router = useRouter();

  const workspaceQuery = useWorkspace(workspaceId);
  const [search, setSearch] = useState("");
  const sourcesQuery = useSources(workspaceId, {
    q: search.trim() || undefined,
  });

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteWorkspaceOpen, setDeleteWorkspaceOpen] = useState(false);
  const [sourceToDelete, setSourceToDelete] = useState<Source | null>(null);

  const workspace = workspaceQuery.data;

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
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {workspace?.icon ? (
                <span className="text-xl leading-none">{workspace.icon}</span>
              ) : (
                <RiFolderLine className="size-5" />
              )}
            </span>
            <div className="flex flex-col gap-1">
              {workspaceQuery.isPending ? (
                <>
                  <Skeleton className="h-7 w-48" />
                  <Skeleton className="h-4 w-72" />
                </>
              ) : (
                <>
                  <h1 className="text-2xl font-semibold tracking-tight">
                    {workspace?.title ?? "Workspace"}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {workspace?.description ?? "No description"}
                  </p>
                </>
              )}
            </div>
          </div>

          {workspace ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="Workspace actions"
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                <RiMore2Line className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditOpen(true)}>
                  <RiPencilLine />
                  Edit workspace
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setDeleteWorkspaceOpen(true)}
                >
                  <RiDeleteBinLine />
                  Delete workspace
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold tracking-tight">Sources</h2>
          <Button onClick={() => setAddOpen(true)}>
            <RiAddLine />
            Add source
          </Button>
        </div>

        <div className="relative">
          <RiSearchLine className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search sources…"
            aria-label="Search sources"
            className="pl-8"
          />
        </div>

        {sourcesQuery.isPending ? (
          <SourcesSkeleton />
        ) : sourcesQuery.isError ? (
          <Alert variant="destructive">
            <RiErrorWarningLine />
            <AlertTitle>Couldn&apos;t load sources</AlertTitle>
            <AlertDescription>
              {sourcesQuery.error.message}
            </AlertDescription>
          </Alert>
        ) : sourcesQuery.data.length === 0 ? (
          <SourcesEmptyState
            onAddClick={() => setAddOpen(true)}
            isFiltered={Boolean(search.trim())}
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {sourcesQuery.data.map((source) => (
              <SourceRow
                key={source.id}
                source={source}
                onDeleteClick={setSourceToDelete}
              />
            ))}
          </ul>
        )}
      </div>

      <AddSourceDialog
        workspaceId={workspaceId}
        open={addOpen}
        onOpenChange={setAddOpen}
      />
      {workspace ? (
        <>
          <WorkspaceFormDialog
            open={editOpen}
            onOpenChange={setEditOpen}
            workspace={workspace}
          />
          <DeleteWorkspaceDialog
            workspace={workspace}
            open={deleteWorkspaceOpen}
            onOpenChange={setDeleteWorkspaceOpen}
            onDeleted={() => router.replace("/dashboard")}
          />
        </>
      ) : null}
      <DeleteSourceDialog
        workspaceId={workspaceId}
        source={sourceToDelete}
        onClose={() => setSourceToDelete(null)}
      />
    </div>
  );
}
