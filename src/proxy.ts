import { NextRequest, NextResponse } from "next/server";

type UserRole = "USER" | "ADMIN";

type TokenClaims = {
  role?: string;
  user?: { role?: string };
  exp?: number;
};

const protectedRoutes = [
  "/dashboard",
  "/transactions",
  "/categories",
  "/budget",
  "/budgets",
  "/reports",
  "/ai-advisor",
  "/feedback",
  "/admin",
  "/profile",
  "/change-password",
];

const userOnlyRoutes = [
  "/dashboard",
  "/transactions",
  "/categories",
  "/budget",
  "/budgets",
  "/reports",
  "/ai-advisor",
  "/feedback",
  "/profile",
  "/change-password",
];

const ADMIN_HOME = "/admin/platform-statistics";
const USER_HOME = "/dashboard";

function normalizeRole(role: string | undefined): UserRole | undefined {
  return role === "ADMIN" || role === "USER" ? role : undefined;
}

function decodeTokenClaims(token: string | undefined) {
  if (!token) {
    return undefined;
  }

  try {
    const payload = token.split(".")[1];
    if (!payload) {
      return undefined;
    }

    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = normalizedPayload.padEnd(
      Math.ceil(normalizedPayload.length / 4) * 4,
      "="
    );

    return JSON.parse(atob(paddedPayload)) as TokenClaims;
  } catch {
    return undefined;
  }
}

function getTokenState(token: string | undefined) {
  const claims = decodeTokenClaims(token);

  if (!token || !claims) {
    return {
      isPresent: Boolean(token),
      isValid: false,
      isExpired: Boolean(token),
      role: undefined,
    };
  }

  const isExpired =
    typeof claims.exp === "number" ? claims.exp * 1000 <= Date.now() : false;

  return {
    isPresent: true,
    isValid: true,
    isExpired,
    role: normalizeRole(claims.role || claims.user?.role),
  };
}

function redirectWithClearedAuthCookies(url: URL) {
  const response = NextResponse.redirect(url);
  response.cookies.delete("access_token");
  response.cookies.delete("user_role");
  return response;
}

function nextWithClearedAuthCookies() {
  const response = NextResponse.next();
  response.cookies.delete("access_token");
  response.cookies.delete("user_role");
  return response;
}

export function proxy(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value;
  const tokenState = getTokenState(token);
  const tokenCanAuthenticate =
    tokenState.isPresent && tokenState.isValid && !tokenState.isExpired;
  const role =
    tokenState.role || normalizeRole(request.cookies.get("user_role")?.value);
  const { pathname } = request.nextUrl;

  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password");

  const isAuthRecoveryPage =
    pathname.startsWith("/login") &&
    (request.nextUrl.searchParams.has("expired") ||
      request.nextUrl.searchParams.get("oauth") === "failed");

  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");

  const isUserOnlyRoute = userOnlyRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (!tokenCanAuthenticate && isProtectedRoute) {
    const loginUrl = new URL("/login", request.url);

    if (tokenState.isPresent) {
      loginUrl.searchParams.set("expired", "1");
    }

    loginUrl.searchParams.set(
      "returnUrl",
      `${pathname}${request.nextUrl.search}`
    );

    return tokenState.isPresent
      ? redirectWithClearedAuthCookies(loginUrl)
      : NextResponse.redirect(loginUrl);
  }

  if (!tokenCanAuthenticate && isAuthPage) {
    return tokenState.isPresent ? nextWithClearedAuthCookies() : NextResponse.next();
  }

  if (tokenCanAuthenticate && isAdminRoute && role !== "ADMIN") {
    return NextResponse.redirect(new URL(USER_HOME, request.url));
  }

  if (tokenCanAuthenticate && role === "ADMIN" && isUserOnlyRoute) {
    return NextResponse.redirect(new URL(ADMIN_HOME, request.url));
  }

  if (tokenCanAuthenticate && isAuthPage && !isAuthRecoveryPage) {
    return NextResponse.redirect(
      new URL(role === "ADMIN" ? ADMIN_HOME : USER_HOME, request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
