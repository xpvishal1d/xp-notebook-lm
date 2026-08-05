"use client";

import { format } from "date-fns";
import { RiErrorWarningLine, RiFolderLine } from "@remixicon/react";

import type { Workspace } from "@/lib/api";
import { useWorkspaces } from "@/hooks/use-workspaces";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function WorkspaceCard({ workspace }: { workspace: Workspace }) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="mb-2 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {workspace.icon ? (
            <span className="text-lg leading-none">{workspace.icon}</span>
          ) : (
            <RiFolderLine className="size-4" />
          )}
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

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <RiFolderLine className="size-6 text-muted-foreground" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="font-medium">No workspaces yet</p>
        <p className="text-sm text-muted-foreground">
          Your workspaces will appear here once you create one.
        </p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: workspaces, isPending, isError, error } = useWorkspaces();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Your workspaces
        </h1>
        <p className="text-sm text-muted-foreground">
          All of your notebooks in one place.
        </p>
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
        <EmptyState />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((workspace) => (
            <WorkspaceCard key={workspace.id} workspace={workspace} />
          ))}
        </div>
      )}
    </div>
  );
}
