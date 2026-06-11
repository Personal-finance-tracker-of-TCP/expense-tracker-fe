"use client";

import { type ComponentType, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Tag,
  PiggyBank,
  BarChart2,
  Sparkles,
  User,
  Shield,
  Users,
  MessageSquareText,
  Bell,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useSidebarStore } from "@/store/sidebarStore";

type SidebarProps = {
  className?: string;
};

type SidebarRole = "ADMIN" | "USER";
type SidebarItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  activePaths?: string[];
};

function getCookieValue(name: string) {
  if (typeof document === "undefined") {
    return null;
  }

  const match = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${name}=`));

  return match ? decodeURIComponent(match.split("=")[1] ?? "") : null;
}

function getStoredRole(): SidebarRole | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawUser = localStorage.getItem("user");
    const user = rawUser ? (JSON.parse(rawUser) as { role?: SidebarRole }) : null;
    const cookieRole = getCookieValue("user_role");
    const role = user?.role || cookieRole;

    return role === "ADMIN" || role === "USER" ? role : null;
  } catch {
    return null;
  }
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const isOpen = useSidebarStore((state) => state.isOpen);
  const close = useSidebarStore((state) => state.close);
  const authUser = useAuthStore((state) => state.user);
  const [isDesktop, setIsDesktop] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [clientRole, setClientRole] = useState<SidebarRole | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const updateBreakpoint = () => {
      setIsDesktop(mediaQuery.matches);
    };

    const mountTimer = window.setTimeout(() => {
      setHasMounted(true);
      setClientRole(authUser?.role || getStoredRole());
      updateBreakpoint();
    }, 0);

    mediaQuery.addEventListener("change", updateBreakpoint);

    return () => {
      window.clearTimeout(mountTimer);
      mediaQuery.removeEventListener("change", updateBreakpoint);
    };
  }, [authUser?.role]);

  const role = hasMounted ? clientRole : null;
  const isAdmin = role === "ADMIN";

  const userNavigationItems: SidebarItem[] = [
    { href: "/dashboard", label: "Tổng quan", icon: LayoutDashboard },
    { href: "/transactions", label: "Giao dịch", icon: ArrowLeftRight },
    { href: "/categories", label: "Danh mục", icon: Tag },
    { href: "/budgets", label: "Ngân sách", icon: PiggyBank },
    { href: "/reports", label: "Báo cáo", icon: BarChart2 },
    { href: "/ai-advisor", label: "AI Advisor", icon: Sparkles },
    { href: "/feedback", label: "Feedback", icon: MessageSquareText },
    { href: "/profile", label: "Profile", icon: User },
  ];

  const adminItems: SidebarItem[] = [
    {
      href: "/admin/statistics",
      label: "Thống kê nền tảng",
      icon: BarChart2,
      activePaths: ["/admin/platform-statistics"],
    },
    { href: "/admin/bankhub-sandbox", label: "BankHub Sandbox", icon: Shield },
    { href: "/admin/sepay-logs", label: "SePay Logs", icon: Shield },
    { href: "/admin/linked-users", label: "Người dùng liên kết", icon: Users },
    { href: "/admin/notifications", label: "Thông báo", icon: Bell },
  ];

  const shouldShowBackdrop = !isDesktop && isOpen;
  const visibleItems = role === null ? [] : isAdmin ? adminItems : userNavigationItems;
  const sectionLabel =
    role === null ? "Đang tải" : isAdmin ? "Quản trị viên" : "Menu chính";
  const activeClassName =
    "bg-emerald-500 text-white shadow-md shadow-emerald-500/20";

  function isItemActive(item: SidebarItem) {
    if (!pathname) return false;

    const paths = [item.href, ...(item.activePaths ?? [])];

    return paths.some((href) => {
      if (href === "/admin") {
        return pathname === "/admin";
      }

      if (href === "/dashboard") {
        return pathname === "/dashboard";
      }

      return pathname === href || pathname.startsWith(`${href}/`);
    });
  }

  return (
    <>
      {shouldShowBackdrop ? (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-sm md:hidden"
          onClick={close}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex h-screen w-64 flex-col bg-[#131926] text-white border-r border-slate-800/55 transition-transform duration-200 ease-out md:static md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          className
        )}
      >
        <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-800/40">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/20 text-white">
            <svg
              className="h-4.5 w-4.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.5a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75h-3.5a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z"
              />
            </svg>
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            MoneyTrack
          </span>
        </div>

        <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-7">
          <div>
            <span className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-3">
              {sectionLabel}
            </span>
            <ul className="space-y-1.5">
              {visibleItems.map((item, index) => {
                const isActive = isItemActive(item);
                const Icon = item.icon;

                return (
                  <li key={`${item.href}-${index}`}>
                    <Link
                      href={item.href}
                      onClick={() => {
                        if (!isDesktop) close();
                      }}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all duration-200",
                        isActive
                          ? activeClassName
                          : "text-slate-400 hover:bg-emerald-500 hover:text-white"
                      )}
                    >
                      <Icon className="h-4.5 w-4.5 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>
      </aside>
    </>
  );
}

export const AppSidebar = Sidebar;
