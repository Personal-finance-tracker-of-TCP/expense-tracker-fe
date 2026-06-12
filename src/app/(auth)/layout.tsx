import type { ReactNode } from "react";
import { Wallet } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="animated-surface flex min-h-screen items-center justify-center bg-[linear-gradient(135deg,#ecfdf5_0%,#eff6ff_45%,#fff7ed_100%)] px-4 py-8 [font-family:var(--font-geist-sans),ui-sans-serif,system-ui,sans-serif]">
      <section className="w-full max-w-md overflow-hidden rounded-[2rem] border border-white/80 bg-white/82 shadow-2xl shadow-teal-950/10 backdrop-blur">
        <div className="flex min-h-[620px] flex-col justify-center px-5 py-8 sm:px-10">
          <div className="mb-8 flex items-center justify-center gap-3 text-slate-950">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-teal-700 text-white shadow-lg shadow-teal-700/20">
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
