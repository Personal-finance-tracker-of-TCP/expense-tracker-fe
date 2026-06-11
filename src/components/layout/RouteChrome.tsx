"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Plus,
  PiggyBank,
  User,
  BarChart2,
  Shield,
  Users,
} from "lucide-react";

import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { FloatingChatbot } from "@/components/layout/FloatingChatbot";
import { useAuthStore } from "@/store/authStore";

const plainRoutes = new Set([
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/statistics",
  "/system-status",
]);

type ChromeRole = "ADMIN" | "USER";

function getCookieValue(name: string) {
  if (typeof document === "undefined") {
    return null;
  }

  const match = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${name}=`));

  return match ? decodeURIComponent(match.split("=")[1] ?? "") : null;
}

function getStoredRole(): ChromeRole | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawUser = localStorage.getItem("user");
    const user = rawUser ? (JSON.parse(rawUser) as { role?: ChromeRole }) : null;
    const cookieRole = getCookieValue("user_role");
    const role = user?.role || cookieRole;

    return role === "ADMIN" || role === "USER" ? role : null;
  } catch {
    return null;
  }
}

export function RouteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const authUser = useAuthStore((state) => state.user);
  const [hasMounted, setHasMounted] = useState(false);
  const [clientRole, setClientRole] = useState<ChromeRole | null>(null);

  useEffect(() => {
    const mountTimer = window.setTimeout(() => {
      setHasMounted(true);
      setClientRole(authUser?.role || getStoredRole());
    }, 0);

    return () => {
      window.clearTimeout(mountTimer);
    };
  }, [authUser?.role]);

  if (plainRoutes.has(pathname)) {
    return <>{children}</>;
  }

  const isDashboard = pathname === "/dashboard";
  const role = hasMounted ? clientRole : null;
  const isAdmin = role === "ADMIN";

  const mobileItems = isAdmin
    ? [
        { href: "/admin", label: "Quản trị", icon: LayoutDashboard },
        { href: "/admin/statistics", label: "Thống kê", icon: BarChart2 },
        { href: "/admin/bankhub-sandbox", label: "BankHub", icon: Shield },
        { href: "/admin/sepay-logs", label: "SePay Logs", icon: Shield },
        { href: "/admin/linked-users", label: "Users", icon: Users },
      ]
    : [
        { href: "/dashboard", label: "Tổng quan", icon: LayoutDashboard },
        { href: "/transactions", label: "Giao dịch", icon: ArrowLeftRight },
        { href: "/budgets", label: "Ngân sách", icon: PiggyBank },
        { href: "/profile", label: "Tài khoản", icon: User },
      ];

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === href;
    if (href === "/admin") return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <div className="flex min-h-screen w-full bg-[#F4F6FA] text-slate-950 font-sans">
      <Sidebar className="hidden md:flex shrink-0" />

      <div className="flex min-w-0 flex-1 flex-col pb-16 md:pb-0">
        {!isDashboard && <Topbar />}

        <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-30 flex h-16 items-center justify-around border-t border-slate-200/80 bg-white/90 px-2 backdrop-blur-md shadow-lg shadow-slate-100 md:hidden">
        {role === null
          ? null
          : mobileItems.slice(0, isAdmin ? 5 : 2).map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex h-full flex-1 flex-col items-center justify-center gap-1.5 text-xs font-semibold transition-colors ${
                    isActive(item.href) ? "text-emerald-500" : "text-slate-400"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

        {role !== null && !isAdmin ? (
          <>
            <div className="flex flex-1 items-center justify-center -mt-6">
              <button
                type="button"
                onClick={() => router.push("/transactions?create=true")}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/35 transition-transform duration-200 hover:bg-emerald-600 active:scale-95"
                aria-label="Add transaction"
              >
                <Plus className="h-6 w-6 stroke-[3]" />
              </button>
            </div>

            {mobileItems.slice(2).map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex h-full flex-1 flex-col items-center justify-center gap-1.5 text-xs font-semibold transition-colors ${
                    isActive(item.href) ? "text-emerald-500" : "text-slate-400"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </>
        ) : null}
      </nav>

      <FloatingChatbot />
    </div>
  );
}
