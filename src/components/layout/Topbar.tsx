"use client";

import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/transactions": "Transactions",
  "/categories": "Categories",
  "/budget": "Budget",
  "/reports": "Reports",
  "/ai-advisor": "AI Advisor",
  "/profile": "Profile",
};

export function Topbar() {
  const pathname = usePathname();
  const title = pageTitles[pathname] ?? "FinTrack";

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      <div className="min-w-0">
        <h1 className="truncate text-lg font-semibold text-slate-900">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
          aria-label="User menu"
        >
          NU
        </button>

        <button
          type="button"
          className="inline-flex h-10 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900"
          aria-label="Logout"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}