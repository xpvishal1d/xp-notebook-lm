import Link from "next/link";
import { RiBookOpenLine } from "@remixicon/react";

import { AuthGuard } from "@/components/auth/auth-guard";
import { UserMenu } from "@/components/auth/user-menu";
import { ModeToggle } from "@/components/ui/mode-toggle";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
          <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-sm font-semibold"
            >
              <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <RiBookOpenLine className="size-4" />
              </span>
              XP Notebook
            </Link>
            <div className="flex items-center gap-2">
              <ModeToggle />
              <UserMenu />
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
