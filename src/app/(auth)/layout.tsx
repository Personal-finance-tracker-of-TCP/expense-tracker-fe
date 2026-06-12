import type { ReactNode } from "react";
import { Wallet } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="animated-surface flex min-h-dvh items-center justify-center bg-[linear-gradient(135deg,#ecfdf5_0%,#eff6ff_45%,#fff7ed_100%)] px-3 py-3 [font-family:var(--font-geist-sans),ui-sans-serif,system-ui,sans-serif] sm:px-4">
      <section className="w-full max-w-md overflow-hidden rounded-[1.5rem] border border-white/80 bg-white/86 shadow-2xl shadow-teal-950/10 backdrop-blur">
        <div className="flex max-h-[calc(100dvh-1.5rem)] flex-col overflow-y-auto px-5 py-5 sm:px-8 sm:py-6">
          <div className="mb-5 flex items-center justify-start gap-3 text-slate-950">
            <span className="flex size-10 items-center justify-center rounded-2xl bg-teal-700 text-white shadow-lg shadow-teal-700/20">
              <Wallet className="size-5" aria-hidden="true" />
            </span>
            <span className="text-xl font-black tracking-tight">FinTrack</span>
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}
