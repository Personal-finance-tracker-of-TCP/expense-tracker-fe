import type { UserRole } from "@/lib/auth";

export const ADMIN_HOME = "/admin/platform-statistics";
export const USER_HOME = "/dashboard";

const authRoutePrefixes = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/oauth-callback",
];

const userOnlyRoutePrefixes = [
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

function isLocalPath(path: string) {
  return path.startsWith("/") && !path.startsWith("//");
}

function startsWithAnyRoute(path: string, routes: string[]) {
  return routes.some((route) => path === route || path.startsWith(`${route}/`));
}

export function getPostLoginRedirect(
  role: UserRole,
  requestedReturnUrl?: string | null
) {
  const fallback = role === "ADMIN" ? ADMIN_HOME : USER_HOME;
  const requested = requestedReturnUrl?.trim();

  if (!requested || !isLocalPath(requested)) {
    return fallback;
  }

  const path = requested.split(/[?#]/)[0] || "/";

  if (startsWithAnyRoute(path, authRoutePrefixes)) {
    return fallback;
  }

  if (role === "ADMIN") {
    return path === "/admin" || path.startsWith("/admin/")
      ? requested
      : fallback;
  }

  if (path === "/admin" || path.startsWith("/admin/")) {
    return fallback;
  }

  return startsWithAnyRoute(path, userOnlyRoutePrefixes) ? requested : fallback;
}
