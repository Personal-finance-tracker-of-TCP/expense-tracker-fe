"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  BarChart3,
  Bell,
  Home,
  Link2,
  LogOut,
  ReceiptText,
  ShieldCheck,
  Users,
} from "lucide-react";

import { useLogout } from "@/hooks/useLogout";
import { cn } from "@/lib/utils";

const adminNavigation = [
  { href: "/admin/platform-statistics", label: "Thống kê", icon: BarChart3 },
  { href: "/admin/bankhub-sandbox", label: "BankHub", icon: Link2 },
  { href: "/admin/sepay-logs", label: "SePay Logs", icon: ReceiptText },
  { href: "/admin/linked-users", label: "Users", icon: Users },
  { href: "/admin/notifications", label: "Thông báo", icon: Bell },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const logout = useLogout("/");

  return (
    <div className="min-h-screen bg-[#F4F6FA] text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 px-4 py-3 shadow-sm shadow-slate-950/[0.03] backdrop-blur-xl sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Link
            href="/admin/platform-statistics"
            className="flex min-w-0 items-center gap-3"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-[0.68rem] font-black uppercase tracking-[0.2em] text-emerald-700">
                FinTrack
              </span>
              <span className="block truncate text-sm font-black text-slate-900">
                Admin Console
              </span>
            </span>
          </Link>

          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <nav className="flex min-w-0 flex-1 gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1 lg:flex-none">
              {adminNavigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "inline-flex h-9 shrink-0 items-center gap-2 rounded-md px-3 text-xs font-bold transition-colors",
                      active
                        ? "bg-white text-emerald-700 shadow-sm"
                        : "text-slate-600 hover:bg-white/70 hover:text-slate-950"
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <Link
              href="/"
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
            >
              <Home className="h-4 w-4" aria-hidden="true" />
              Trang chủ
            </Link>
            <button
              type="button"
              onClick={logout}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-red-600 px-3 text-xs font-bold text-white shadow-sm transition-colors hover:bg-red-700"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}
