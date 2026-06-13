import Link from "next/link";
import {
  ArrowRight,
  type LucideIcon,
  Sparkles,
} from "lucide-react";

import { cn } from "@/lib/utils";

type FeaturePreviewProps = {
  title: string;
  eyebrow: string;
  description: string;
  icon: LucideIcon;
  accent: string;
  items: string[];
};

export function FeaturePreview({
  title,
  eyebrow,
  description,
  icon: Icon,
  accent,
  items,
}: FeaturePreviewProps) {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <section className="animate-rise overflow-hidden rounded-[2rem] border border-white/80 bg-white/88 shadow-xl shadow-teal-950/[0.06] backdrop-blur">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="p-6 sm:p-8">
            <div
              className={cn(
                "inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg",
                accent
              )}
            >
              <Icon className="h-6 w-6" />
            </div>
            <p className="mt-5 text-xs font-black uppercase tracking-[0.24em] text-teal-700">
              {eyebrow}
            </p>
            <h1 className="mt-2 text-3xl font-black text-slate-950">{title}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-500">
              {description}
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/dashboard"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-slate-950 px-4 text-sm font-bold text-white shadow-lg shadow-slate-950/15 transition-transform hover:-translate-y-0.5"
              >
                Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/profile"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-teal-100 bg-teal-50 px-4 text-sm font-bold text-teal-800 transition-colors hover:bg-teal-100"
              >
                Profile
              </Link>
            </div>
          </div>

          <div className="border-t border-teal-100 bg-[linear-gradient(135deg,#ecfeff,#f0fdf4,#fff7ed)] p-6 lg:border-l lg:border-t-0">
            <div className="rounded-[1.75rem] border border-white/80 bg-white/70 p-4 shadow-inner shadow-white/70">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <p className="text-sm font-black text-slate-900">Ready lane</p>
              </div>
              <div className="mt-5 space-y-3">
                {items.map((item, index) => (
                  <div key={item} className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex h-7 w-7 items-center justify-center rounded-full text-xs font-black text-white",
                        accent
                      )}
                    >
                      {index + 1}
                    </span>
                    <span className="text-sm font-semibold text-slate-700">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
