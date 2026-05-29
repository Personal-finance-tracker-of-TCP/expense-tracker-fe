import type { ReactNode } from "react";
import { Wallet } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10 [font-family:var(--font-geist-sans),ui-sans-serif,system-ui,sans-serif]">
      <section className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg shadow-slate-200/80">
        <div className="mb-8 flex items-center justify-center gap-2 text-slate-950">
          <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-md shadow-blue-500/20">
            <Wallet className="size-5" aria-hidden="true" />
          </span>
          <span className="text-xl font-bold tracking-tight">FinTrack</span>
        </div>
        {children}
      </section>
    </main>
  );
}
