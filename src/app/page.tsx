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
    description: "Ghi nhận thu chi hằng ngày, phân loại nhanh theo danh mục.",
  },
  {
    icon: PiggyBank,
    title: "Quản lý ngân sách",
    description: "Đặt giới hạn chi tiêu và theo dõi phần còn lại trong tháng.",
  },
  {
    icon: FileText,
    title: "Báo cáo chi tiết",
    description: "Xem biểu đồ trực quan và xuất báo cáo PDF/Excel khi cần.",
  },
  {
    icon: Sparkles,
    title: "AI Advisor",
    description: "Nhận gợi ý tiết kiệm dựa trên thói quen chi tiêu thực tế.",
  },
];

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-[#f5faf8] text-slate-950 [font-family:var(--font-geist-sans),ui-sans-serif,system-ui,sans-serif]">
      <section className="relative overflow-hidden bg-[#0d231f] px-5 py-12 text-white sm:py-14 lg:px-8">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:32px_32px]"
        />

        <div className="relative z-10 mx-auto grid min-h-[74dvh] max-w-6xl items-center gap-10 lg:grid-cols-[0.88fr_1.12fr]">
          <div className="max-w-xl">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-200">
              Personal finance tracker
            </p>
            <h1 className="mt-4 text-5xl font-black tracking-tight text-white sm:text-6xl">
              FinTrack
            </h1>
            <p className="mt-5 text-base leading-7 text-teal-50/80 sm:text-lg">
              Quản lý thu chi, ngân sách, báo cáo và gợi ý tiết kiệm trong một
              trải nghiệm fintech gọn gàng.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "h-11 bg-white px-5 text-base font-black text-teal-900 shadow-lg shadow-black/15 hover:bg-teal-50"
                )}
              >
                Bắt đầu miễn phí
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-11 border-white/20 bg-white/10 px-5 text-base font-black text-white backdrop-blur hover:bg-white/15"
                )}
              >
                Đăng nhập
              </Link>
            </div>
          </div>

          <div className="relative h-[330px] overflow-hidden rounded-lg border border-white/12 bg-white/10 p-3 shadow-2xl shadow-black/25 backdrop-blur sm:h-[380px] lg:h-[430px]">
            <div className="grid h-full gap-3 sm:grid-cols-[170px_minmax(0,1fr)]">
              <aside className="hidden rounded-lg bg-[#10251f] p-4 sm:block">
                <div className="size-10 rounded-lg bg-teal-300" />
                <div className="mt-8 space-y-3">
                  {["Dashboard", "Budget", "Reports", "Profile"].map(
                    (item) => (
                      <div
                        key={item}
                        className="rounded-lg bg-white/10 px-3 py-3 text-xs font-bold text-teal-50"
                      >
                        {item}
                      </div>
                    )
                  )}
                </div>
              </aside>

              <div className="rounded-lg bg-white p-4 text-slate-950 sm:p-5">
                <div className="flex items-center justify-between gap-4">
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

                <div className="mt-5 flex h-32 items-end gap-2 sm:mt-8 sm:h-44">
                  {[48, 76, 55, 88, 64, 94, 72, 86].map((height, index) => (
                    <div
                      key={index}
                      className="flex h-full flex-1 items-end overflow-hidden rounded-t-md bg-slate-100"
                    >
                      <div
                        className="w-full rounded-t-md bg-[linear-gradient(180deg,#2dd4bf,#2563eb)]"
                        style={{ height: `${height}%` }}
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 sm:mt-6 sm:gap-3">
                  {["Thu chi", "Ngân sách", "Báo cáo"].map((item) => (
                    <div key={item} className="rounded-lg bg-slate-50 p-2.5 sm:p-3">
                      <p className="text-xs font-black text-slate-500">
                        {item}
                      </p>
                      <p className="mt-1 text-sm font-black text-slate-950">
                        Ready
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-teal-100/80 bg-white px-5 py-12 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-teal-700">
              Feature map
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
              Tính năng nổi bật
            </h2>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <Card
                  key={feature.title}
                  className="rounded-lg border border-teal-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-teal-950/10"
                >
                  <CardHeader className="space-y-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
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

      <footer className="px-5 py-7 text-center text-sm text-slate-500">
        © 2026 FinTrack. Nhóm sinh viên PTIT.
      </footer>
    </main>
  );
}
