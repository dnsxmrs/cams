import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

// Public auth routes (accessible when unauthenticated)
const publicAuthRoutes = ["/login", "/signup", "/forgot-password", "/verify-email"];

// Protected portal routes (requires active session)
const protectedRoutes = ["/subjects", "/students", "/sessions", "/reports", "/home"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Determine route classifications
  const isAuthRoute = publicAuthRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Retrieve user session via better-auth
  let isAuthenticated = false;
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    isAuthenticated = Boolean(session && session.user);
  } catch (error) {
    console.error("[PROXY AUTH ERROR]", error);
  }

  // 1. Authentication Firewall: Redirect unauthenticated requests on protected routes to /login
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Redirect authenticated users away from public auth pages (login/signup) to dashboard
  if (isAuthRoute && isAuthenticated && pathname !== "/verify-email") {
    return NextResponse.redirect(new URL("/subjects", request.url));
  }

  // 3. Security Firewall Headers
  const response = NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-DNS-Prefetch-Control", "on");

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api routes (/api/*)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static assets (.svg, .png, .jpg, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
