"use client";

import { createAuthClient } from "better-auth/react";

// Same-origin client: /api/auth/* is proxied to the Express server
// via the rewrites in next.config.ts, so no baseURL is needed.
export const authClient = createAuthClient();

export const { useSession, signIn, signOut } = authClient;
