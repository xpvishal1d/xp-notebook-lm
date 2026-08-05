"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useSession } from "@/lib/auth-client";
import { Spinner } from "@/components/ui/spinner";

/**
 * Client-side session guard for protected route groups. The proxy in
 * proxy.ts only checks for the session cookie's presence — this verifies
 * the session is actually valid and redirects to /login otherwise.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!isPending && !session) {
      router.replace("/login");
    }
  }, [isPending, session, router]);

  if (isPending || !session) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}
