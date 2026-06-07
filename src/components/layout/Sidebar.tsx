"use client";

import { useEffect, useState } from "react";
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
  Settings,
  Shield,
  Menu,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/store/sidebarStore";

type SidebarProps = {
  className?: string;
};

type UserInfo = {
  name?: string;
  email?: string;
  role?: "ADMIN" | "USER";
  avatarUrl?: string;
};

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const isOpen = useSidebarStore((state) => state.isOpen);
  const close = useSidebarStore((state) => state.close);
  const [isDesktop, setIsDesktop] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const updateBreakpoint = () => {
      setIsDesktop(mediaQuery.matches);
    };

    updateBreakpoint();
    mediaQuery.addEventListener("change", updateBreakpoint);

    // Read stored user from localStorage
    if (typeof window !== "undefined") {
      try {
        const rawUser = localStorage.getItem("user");
        if (rawUser) {
          setCurrentUser(JSON.parse(rawUser));
        }
      } catch (e) {
        console.error("Error reading user storage", e);
      }
    }

    return () => mediaQuery.removeEventListener("change", updateBreakpoint);
  }, []);

  const isAdmin = currentUser?.role === "ADMIN";

  const navigationItems = [
    { href: "/dashboard", label: "Tổng quan", icon: LayoutDashboard },
    { href: "/transactions", label: "Giao dịch", icon: ArrowLeftRight },
    { href: "/categories", label: "Danh mục", icon: Tag },
    { href: "/budgets", label: "Ngân sách", icon: PiggyBank },
    { href: "/reports", label: "Báo cáo", icon: BarChart2 },
    { href: "/ai-advisor", label: "AI Advisor", icon: Sparkles },
  ];

  const bottomItems = [
    { href: "/profile", label: "Tài khoản", icon: User },
    { href: "/profile#settings", label: "Cài đặt", icon: Settings },
  ];

  const adminItems = [
    { href: "/admin/sepay-simulator", label: "SePay Simulator", icon: Shield },
    { href: "/admin/sepay-logs", label: "SePay Logs", icon: Shield },
  ];

  const shouldShowBackdrop = !isDesktop && isOpen;

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
        {/* Logo MoneyTrack */}
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

        {/* Menu Navigation */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-7">
          <div>
            <span className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-3">
              Menu chính
            </span>
            <ul className="space-y-1.5">
              {navigationItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" && pathname.startsWith(item.href));
                const Icon = item.icon;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => {
                        if (!isDesktop) close();
                      }}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all duration-200",
                        isActive
                          ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/15"
                          : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
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

          {/* Admin panel in sidebar for ease of testing */}
          {isAdmin && (
            <div>
              <span className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-3">
                Quản trị viên
              </span>
              <ul className="space-y-1.5">
                {adminItems.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  const Icon = item.icon;

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => {
                          if (!isDesktop) close();
                        }}
                        className={cn(
                          "flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all duration-200",
                          isActive
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/15"
                            : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
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
          )}
        </nav>

        {/* Bottom Menu items */}
        <div className="p-4 border-t border-slate-800/40 space-y-1.5">
          {bottomItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "#");
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (!isDesktop) close();
                }}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all duration-200",
                  isActive
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                )}
              >
                <Icon className="h-4.5 w-4.5 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </aside>
    </>
  );
}
export const AppSidebar = Sidebar;
