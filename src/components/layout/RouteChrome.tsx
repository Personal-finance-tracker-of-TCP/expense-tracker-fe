"use client";

import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Plus,
  PiggyBank,
  User,
} from "lucide-react";

import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { FloatingChatbot } from "@/components/layout/FloatingChatbot";

const plainRoutes = new Set(["/", "/login", "/register"]);

export function RouteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  if (plainRoutes.has(pathname)) {
    return <>{children}</>;
  }

  const isDashboard = pathname === "/dashboard";

  return (
    <div className="flex min-h-screen w-full bg-[#F4F6FA] text-slate-950 font-sans">
      {/* Sidebar - Hidden on mobile, collapsible on tablet, fixed on desktop */}
      <Sidebar className="hidden md:flex shrink-0" />

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col pb-16 md:pb-0">
        {/* Hide Topbar on Dashboard page to use the customized mock Top Balance Hero header */}
        {!isDashboard && <Topbar />}

        <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar - Visible only on mobile (< 768px) */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex h-16 items-center justify-around border-t border-slate-200/80 bg-white/90 px-2 backdrop-blur-md md:hidden shadow-lg shadow-slate-100">
        <Link
          href="/dashboard"
          className={`flex flex-col items-center justify-center gap-1.5 flex-1 h-full text-xs font-semibold transition-colors ${
            pathname === "/dashboard" ? "text-emerald-500" : "text-slate-400"
          }`}
        >
          <LayoutDashboard className="h-5 w-5" />
          <span>Tổng quan</span>
        </Link>

        <Link
          href="/transactions"
          className={`flex flex-col items-center justify-center gap-1.5 flex-1 h-full text-xs font-semibold transition-colors ${
            pathname === "/transactions" ? "text-emerald-500" : "text-slate-400"
          }`}
        >
          <ArrowLeftRight className="h-5 w-5" />
          <span>Giao dịch</span>
        </Link>

        {/* Floating Quick Action Button */}
        <div className="flex items-center justify-center -mt-6 flex-1">
          <button
            onClick={() => router.push("/transactions?create=true")}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/35 hover:bg-emerald-600 transition-transform active:scale-95 duration-200"
            aria-label="Add transaction"
          >
            <Plus className="h-6 w-6 stroke-[3]" />
          </button>
        </div>

        <Link
          href="/budgets"
          className={`flex flex-col items-center justify-center gap-1.5 flex-1 h-full text-xs font-semibold transition-colors ${
            pathname === "/budgets" ? "text-emerald-500" : "text-slate-400"
          }`}
        >
          <PiggyBank className="h-5 w-5" />
          <span>Ngân sách</span>
        </Link>

        <Link
          href="/profile"
          className={`flex flex-col items-center justify-center gap-1.5 flex-1 h-full text-xs font-semibold transition-colors ${
            pathname.startsWith("/profile") ? "text-emerald-500" : "text-slate-400"
          }`}
        >
          <User className="h-5 w-5" />
          <span>Tài khoản</span>
        </Link>
      </nav>

      <FloatingChatbot />
    </div>
  );
}
