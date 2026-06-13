import { NextRequest, NextResponse } from "next/server";

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

function decodeRoleFromToken(token: string | undefined) {
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
    const decodedPayload = JSON.parse(atob(paddedPayload)) as {
      role?: string;
      user?: { role?: string };
    };

    return decodedPayload.role || decodedPayload.user?.role;
  } catch {
    return undefined;
  }
}

export function proxy(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value;
  const role = request.cookies.get("user_role")?.value || decodeRoleFromToken(token);
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

  if (!token && isProtectedRoute) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("returnUrl", `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (token && isAdminRoute && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (token && role === "ADMIN" && isUserOnlyRoute) {
    return NextResponse.redirect(new URL("/admin/platform-statistics", request.url));
  }

  if (token && isAuthPage && !isAuthRecoveryPage) {
    return NextResponse.redirect(
      new URL(
        role === "ADMIN" ? "/admin/platform-statistics" : "/dashboard",
        request.url
      )
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
