import Link from "next/link";
import {
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
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-white via-slate-50 to-white text-slate-950 [font-family:var(--font-geist-sans),ui-sans-serif,system-ui,sans-serif]">
      <section className="flex flex-1 items-center justify-center px-6 py-24 sm:py-28 lg:px-8">
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <h1 className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-6xl lg:text-7xl">
            FinTrack
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600 sm:text-xl">
            Quản lý chi tiêu thông minh — theo dõi thu chi, lập ngân sách, và
            nhận gợi ý từ AI
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/register"
              className={cn(
                buttonVariants({ size: "lg" }),
                "h-11 rounded-lg bg-blue-600 px-6 text-base font-semibold text-white shadow-sm hover:bg-blue-700"
              )}
            >
              Bắt đầu miễn phí
            </Link>
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-11 rounded-lg border-slate-300 bg-white px-6 text-base font-semibold text-slate-900 hover:bg-slate-50"
              )}
            >
              Đăng nhập
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200/80 bg-white px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Tính năng nổi bật
            </h2>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <Card
                  key={feature.title}
                  className="rounded-lg border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                >
                  <CardHeader>
                    <div className="mb-2 flex size-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <Icon className="size-5" aria-hidden="true" />
                    </div>
                    <CardTitle className="text-lg font-semibold text-slate-950">
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
