import type { ReactNode } from "react";

import { AuthBootstrap } from "@/components/auth/AuthBootstrap";
import { FloatingChatbot } from "@/components/layout/FloatingChatbot";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-[linear-gradient(135deg,#f3fbf7_0%,#eef8ff_48%,#fff7ed_100%)] text-slate-950 dark:bg-[linear-gradient(135deg,#020617_0%,#0f172a_52%,#042f2e_100%)] dark:text-slate-100">
      <AuthBootstrap />
      <Sidebar />

      <div className="relative flex min-w-0 flex-1 flex-col md:ml-[18rem]">
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 opacity-45 [background-image:linear-gradient(rgba(15,118,110,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(15,118,110,0.055)_1px,transparent_1px)] [background-size:32px_32px] dark:opacity-25"
        />
        <Topbar />

        <main className="relative min-h-[calc(100vh-5.5rem)] px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
        <FloatingChatbot />
      </div>
    </div>
  );
}
