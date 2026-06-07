"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

const plainRoutes = new Set(["/", "/login", "/register"]);

export function RouteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (plainRoutes.has(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen w-full overflow-hidden bg-slate-50 text-slate-950">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
