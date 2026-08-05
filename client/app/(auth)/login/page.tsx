"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  RiBookOpenLine,
  RiErrorWarningLine,
  RiGoogleFill,
} from "@remixicon/react";

import { signIn } from "@/lib/auth-client";
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
import { Spinner } from "@/components/ui/spinner";

const OAUTH_ERRORS: Record<string, string> = {
  access_denied: "Sign-in was cancelled. Please try again.",
  oauth_callback_error: "Google sign-in failed. Please try again.",
  unable_to_link_account: "This Google account can't be linked to your profile.",
  signup_disabled: "Sign-up is currently disabled.",
};

function getSafeCallbackPath(next: string | null): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }
  return "/dashboard";
}

function LoginCard() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(() => {
    const code = searchParams.get("error");
    if (!code) return null;
    return (
      OAUTH_ERRORS[code] ??
      "Something went wrong during sign-in. Please try again."
    );
  });

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    // Absolute URLs: the auth server runs on :8081, so relative paths would
    // resolve against it instead of returning here after Google sign-in.
    const origin = window.location.origin;
    const { error } = await signIn.social({
      provider: "google",
      callbackURL: `${origin}${getSafeCallbackPath(searchParams.get("next"))}`,
      errorCallbackURL: `${origin}/login`,
    });

    // On success the browser navigates to Google, so keep the loading
    // state. Only reset it when the request itself failed.
    if (error) {
      setError(error.message ?? "Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <RiBookOpenLine className="size-5" />
        </div>
        <CardTitle className="text-xl">Welcome to XP Notebook</CardTitle>
        <CardDescription>
          Sign in to continue to your workspaces
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {error ? (
          <Alert variant="destructive">
            <RiErrorWarningLine />
            <AlertTitle>Sign-in failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <Button
          size="lg"
          className="w-full"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
        >
          {isLoading ? <Spinner /> : <RiGoogleFill />}
          Continue with Google
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          By continuing, you agree to sign in with your Google account.
        </p>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginCard />
    </Suspense>
  );
}
