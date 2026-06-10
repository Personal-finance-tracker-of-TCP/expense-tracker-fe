"use client";

import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu } from "lucide-react";

import { useAuthStore } from "@/store/authStore";
import { useSidebarStore } from "@/store/sidebarStore";
import { NotificationBell } from "@/components/layout/NotificationBell";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/transactions": "Transactions",
  "/categories": "Categories",
  "/budget": "Budget",
  "/budgets": "Budgets",
  "/reports": "Reports",
  "/ai-advisor": "AI Advisor",
  "/feedback": "Feedback",
  "/admin/bankhub-sandbox": "BankHub Sandbox",
  "/admin/sepay-simulator": "SePay VA Simulator",
  "/admin/sepay-logs": "SePay Logs",
  "/admin/linked-users": "Người dùng liên kết",
  "/profile": "Profile",
};

export function Topbar() {
  const router = useRouter();
  const pathname = usePathname();
  const title = pageTitles[pathname] ?? "FinTrack";
  const toggle = useSidebarStore((state) => state.toggle);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 md:hidden"
          aria-label="Toggle sidebar"
          onClick={toggle}
        >
          <Menu className="h-5 w-5" />
        </button>

        <h1 className="truncate text-lg font-semibold text-slate-900">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <NotificationBell />

        <button
          type="button"
          className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
          aria-label="Logout"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
