"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  RiAddLine,
  RiDeleteBinLine,
  RiErrorWarningLine,
  RiFolderLine,
  RiMore2Line,
  RiPencilLine,
} from "@remixicon/react";

import type { Workspace } from "@/lib/api";
import { useWorkspaces } from "@/hooks/use-workspaces";
import { DeleteWorkspaceDialog } from "@/components/workspaces/delete-workspace-dialog";
import { WorkspaceFormDialog } from "@/components/workspaces/workspace-form-dialog";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

function WorkspaceCard({ workspace }: { workspace: Workspace }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <Card className="relative transition-shadow hover:shadow-md">
      {/* Stretched link makes the whole card navigable; the menu sits above it. */}
      <Link
        href={`/dashboard/${workspace.id}`}
        aria-label={workspace.title}
        className="absolute inset-0 z-0 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="mb-2 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {workspace.icon ? (
              <span className="text-lg leading-none">{workspace.icon}</span>
            ) : (
              <RiFolderLine className="size-4" />
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Workspace actions"
              className="relative z-10 -mr-1 -mt-1 inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              <RiMore2Line className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
                <RiPencilLine />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setDeleteOpen(true)}
              >
                <RiDeleteBinLine />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardTitle className="text-base">{workspace.title}</CardTitle>
        <CardDescription className="line-clamp-2">
          {workspace.description ?? "No description"}
        </CardDescription>
      </CardHeader>
      <CardContent className="mt-auto">
        <p className="text-xs text-muted-foreground">
          Created {format(new Date(workspace.createdAt), "MMM d, yyyy")}
        </p>
      </CardContent>

      <WorkspaceFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        workspace={workspace}
      />
      <DeleteWorkspaceDialog
        workspace={workspace}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </Card>
  );
}

function WorkspacesSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index}>
          <CardHeader>
            <Skeleton className="mb-2 size-9 rounded-lg" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-3 w-1/3" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <RiFolderLine className="size-6 text-muted-foreground" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="font-medium">No workspaces yet</p>
        <p className="text-sm text-muted-foreground">
          Create your first workspace to start adding sources.
        </p>
      </div>
      <Button onClick={onCreateClick} className="mt-2">
        <RiAddLine />
        New workspace
      </Button>
    </div>
  );
}

export default function DashboardPage() {
  const { data: workspaces, isPending, isError, error } = useWorkspaces();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            Your workspaces
          </h1>
          <p className="text-sm text-muted-foreground">
            All of your notebooks in one place.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <RiAddLine />
          New workspace
        </Button>
      </div>

      {isPending ? (
        <WorkspacesSkeleton />
      ) : isError ? (
        <Alert variant="destructive">
          <RiErrorWarningLine />
          <AlertTitle>Couldn&apos;t load workspaces</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : workspaces.length === 0 ? (
        <EmptyState onCreateClick={() => setCreateOpen(true)} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((workspace) => (
            <WorkspaceCard key={workspace.id} workspace={workspace} />
          ))}
        </div>
      )}

      <WorkspaceFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
