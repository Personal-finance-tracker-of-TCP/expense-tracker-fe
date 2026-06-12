import Link from "next/link";
import {
  ArrowRight,
  BarChart2,
  FileText,
  PiggyBank,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const features: {
  icon: LucideIcon;
  title: string;
  description: string;
}[] = [
  {
    icon: BarChart2,
    title: "Theo dõi giao dịch",
    description: "Ghi nhận thu chi hàng ngày, phân loại tự động theo danh mục",
  },
  {
    icon: PiggyBank,
    title: "Quản lý ngân sách",
    description: "Đặt giới hạn chi tiêu và nhận cảnh báo khi vượt ngân sách",
  },
  {
    icon: FileText,
    title: "Báo cáo chi tiết",
    description: "Biểu đồ trực quan theo tuần, tháng, năm với xuất PDF/Excel",
  },
  {
    icon: Sparkles,
    title: "AI Advisor",
    description:
      "Nhận gợi ý tiết kiệm thông minh từ AI dựa trên thói quen chi tiêu",
  },
];

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-[#f3fbf7] text-slate-950 [font-family:var(--font-geist-sans),ui-sans-serif,system-ui,sans-serif]">
      <section className="relative min-h-[86vh] overflow-hidden bg-[#0d231f] px-6 py-24 text-white sm:py-28 lg:px-8">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-55 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:34px_34px]"
        />
        <div className="absolute inset-x-6 bottom-[-80px] top-[220px] rounded-[2rem] border border-white/10 bg-white/10 p-4 shadow-2xl shadow-black/30 backdrop-blur-md sm:top-[260px] lg:left-auto lg:right-[-40px] lg:top-20 lg:h-[520px] lg:w-[680px]">
          <div className="grid h-full gap-4 md:grid-cols-[180px_minmax(0,1fr)]">
            <div className="hidden rounded-[1.5rem] bg-[#10251f] p-4 md:block">
              <div className="h-10 w-10 rounded-2xl bg-teal-300" />
              <div className="mt-8 space-y-3">
                {["Dashboard", "Budget", "Reports", "Profile"].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl bg-white/10 px-3 py-3 text-xs font-bold text-teal-50"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[1.5rem] bg-white p-5 text-slate-950">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-teal-700">
                    Cashflow
                  </p>
                  <p className="mt-1 text-2xl font-black">+18.6M đ</p>
                </div>
                <div className="rounded-full bg-teal-50 px-3 py-2 text-sm font-black text-teal-700">
                  +12%
                </div>
              </div>
              <div className="mt-8 flex h-44 items-end gap-2">
                {[48, 76, 55, 88, 64, 94, 72, 86].map((height, index) => (
                  <div
                    key={index}
                    className="flex flex-1 items-end overflow-hidden rounded-t-md bg-slate-100"
                  >
                    <div
                      className="w-full rounded-t-md bg-[linear-gradient(180deg,#2dd4bf,#2563eb)]"
                      style={{ height: `${height}%` }}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {["Thu chi", "Ngân sách", "Báo cáo"].map((item) => (
                  <div key={item} className="rounded-2xl bg-slate-50 p-3">
                    <p className="text-xs font-black text-slate-500">{item}</p>
                    <p className="mt-1 text-sm font-black text-slate-950">
                      Ready
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="max-w-2xl pt-10 lg:pt-20">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-200">
              Personal finance tracker
            </p>
            <h1 className="mt-5 text-6xl font-black tracking-tight text-white sm:text-7xl">
              FinTrack
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-teal-50/78">
              Quản lý chi tiêu cá nhân, ngân sách, báo cáo và gợi ý tiết kiệm
              trong một trải nghiệm fintech hiện đại.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/register"
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-12 bg-white px-6 text-base font-black text-teal-900 shadow-lg shadow-black/15 hover:bg-teal-50"
              )}
            >
              Bắt đầu miễn phí
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-12 border-white/20 bg-white/10 px-6 text-base font-black text-white backdrop-blur hover:bg-white/15"
              )}
            >
              Đăng nhập
            </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-teal-100/80 bg-white px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-teal-700">
              Feature map
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Tính năng nổi bật
            </h2>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <Card
                  key={feature.title}
                  className="rounded-[1.75rem] border border-teal-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-teal-950/10"
                >
                  <CardHeader>
                    <div className="mb-2 flex size-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                      <Icon className="size-5" aria-hidden="true" />
                    </div>
                    <CardTitle className="text-lg font-black text-slate-950">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="leading-6 text-slate-600">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="px-6 py-8 text-center text-sm text-slate-500">
        © 2026 FinTrack. Được xây dựng với ❤️ bởi nhóm sinh viên PTIT.
      </footer>
    </main>
  );
}
