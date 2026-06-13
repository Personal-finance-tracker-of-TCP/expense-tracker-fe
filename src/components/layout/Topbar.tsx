"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  ChevronDown,
  KeyRound,
  LogOut,
  Menu,
  MessageSquareText,
  Search,
  UserRound,
} from "lucide-react";
import { signOut } from "next-auth/react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import api from "@/lib/api";
import { getInitials } from "@/lib/auth";
import { useAuthStore } from "@/store/authStore";
import { useSidebarStore } from "@/store/sidebarStore";

const pageTitles: Record<string, string> = {
  "/dashboard": "Tổng quan",
  "/transactions": "Giao dịch",
  "/categories": "Danh mục",
  "/budget": "Ngân sách",
  "/budgets": "Ngân sách",
  "/reports": "Báo cáo",
  "/ai-advisor": "Tư vấn AI",
  "/profile": "Hồ sơ",
  "/feedback": "Phản hồi",
  "/change-password": "Đổi mật khẩu",
};

export function Topbar() {
  const router = useRouter();
  const pathname = usePathname();
  const title = pageTitles[pathname] ?? "FinTrack";
  const toggle = useSidebarStore((state) => state.toggle);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const user = useAuthStore((state) => state.user);
  const [isMounted, setIsMounted] = useState(false);
  const displayUser = isMounted ? user : null;

  useEffect(() => {
    let active = true;

    queueMicrotask(() => {
      if (active) {
        setIsMounted(true);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const handleLogout = async () => {
    await api.post("/auth/logout").catch(() => null);
    clearAuth();
    await signOut({ redirect: false }).catch(() => null);
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-30 flex h-[5.5rem] w-full items-center justify-between border-b border-white/70 bg-white/75 px-4 shadow-sm shadow-teal-950/[0.03] backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/80 sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-teal-100 bg-white text-teal-800 shadow-sm transition-colors hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-900 dark:text-teal-300 md:hidden"
          aria-label="Mở menu"
          onClick={toggle}
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.24em] text-teal-700/75 dark:text-teal-300/80">
            Không gian làm việc
          </p>
          <h1 className="truncate text-2xl font-black leading-tight text-slate-950 dark:text-white sm:text-3xl">
            {title}
          </h1>
        </div>
      </div>

      <div className="hidden min-w-0 flex-1 justify-center px-8 lg:flex">
        <div className="flex h-11 w-full max-w-md items-center gap-2 rounded-full border border-teal-100 bg-white/82 px-4 text-sm text-slate-500 shadow-sm shadow-teal-950/[0.03] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          <Search className="h-4 w-4 text-teal-600" aria-hidden="true" />
          <span className="truncate">Tìm giao dịch, danh mục, báo cáo...</span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <ThemeToggle />
        <button
          type="button"
          className="hidden h-10 w-10 items-center justify-center rounded-2xl border border-teal-100 bg-white text-slate-700 shadow-sm transition-colors hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 sm:inline-flex"
          aria-label="Thông báo"
        >
          <Bell className="h-4 w-4" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger
            className="group inline-flex h-11 items-center gap-2 rounded-full border border-teal-100 bg-white p-1 pr-2 text-sm font-bold text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            aria-label="Mở menu tài khoản"
          >
            <span
              className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#0f766e,#2563eb)] text-xs font-bold text-white shadow-lg shadow-teal-700/20"
              suppressHydrationWarning
            >
              {displayUser?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={displayUser.avatarUrl}
                  alt={displayUser.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                getInitials(displayUser?.name, displayUser?.email)
              )}
            </span>
            <ChevronDown
              className="hidden h-4 w-4 text-slate-400 transition-transform group-aria-expanded:rotate-180 sm:block"
              aria-hidden="true"
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={10}
            className="w-64 rounded-[1.5rem] border border-teal-100 bg-white/95 p-2 shadow-2xl shadow-teal-950/10 backdrop-blur dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="px-3 py-3">
              <p className="truncate text-sm font-black text-slate-950 dark:text-white">
                {displayUser?.name || "Người dùng"}
              </p>
              <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                {displayUser?.email || "user@example.com"}
              </p>
            </div>
            <DropdownMenuSeparator className="mx-2 bg-teal-100 dark:bg-slate-700" />
            <DropdownMenuItem
              className="cursor-pointer gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold text-slate-700 focus:bg-teal-50 focus:text-teal-800 dark:text-slate-200"
              onClick={() => router.push("/profile")}
            >
              <UserRound className="h-4 w-4 text-teal-700" aria-hidden="true" />
              Hồ sơ
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold text-slate-700 focus:bg-teal-50 focus:text-teal-800 dark:text-slate-200"
              onClick={() => router.push("/feedback")}
            >
              <MessageSquareText className="h-4 w-4 text-teal-700" aria-hidden="true" />
              Gửi phản hồi
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold text-slate-700 focus:bg-teal-50 focus:text-teal-800 dark:text-slate-200"
              onClick={() => router.push("/change-password")}
            >
              <KeyRound className="h-4 w-4 text-teal-700" aria-hidden="true" />
              Đổi mật khẩu
            </DropdownMenuItem>
            <DropdownMenuSeparator className="mx-2 bg-teal-100 dark:bg-slate-700" />
            <DropdownMenuItem
              className="cursor-pointer gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold text-red-600 focus:bg-red-50 focus:text-red-700"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
