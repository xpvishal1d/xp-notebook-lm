import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// better-auth session cookie names (the __Secure- prefix is used in production).
const SESSION_COOKIES = [
  "better-auth.session_token",
  "__Secure-better-auth.session_token",
] as const;

const PROTECTED_PREFIXES = ["/dashboard"];
const AUTH_ROUTES = ["/login"];

function hasSessionCookie(request: NextRequest): boolean {
  return SESSION_COOKIES.some(
    (name) => Boolean(request.cookies.get(name)?.value),
  );
}

// Optimistic route protection: this only checks for the *presence* of the
// session cookie. The real verification happens in the AuthGuard (client)
// and in the requireAuth middleware on the API server.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthenticated = hasSessionCookie(request);

  const isProtectedRoute = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix),
  );
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(isAuthenticated ? "/dashboard" : "/login", request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Run on all pages except proxied API routes, static assets and files.
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
