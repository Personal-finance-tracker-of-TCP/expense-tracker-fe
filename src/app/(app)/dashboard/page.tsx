import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CircleDollarSign,
  CreditCard,
  Landmark,
  PiggyBank,
  UserRound,
  WalletCards,
} from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const stats = [
  {
    label: "Số dư khả dụng",
    value: "24.8M đ",
    change: "+12.4%",
    icon: WalletCards,
    tone: "from-teal-500 to-cyan-500",
  },
  {
    label: "Chi tháng này",
    value: "6.2M đ",
    change: "-8.1%",
    icon: CreditCard,
    tone: "from-amber-400 to-orange-500",
  },
  {
    label: "Ngân sách còn lại",
    value: "71%",
    change: "+4 mục",
    icon: PiggyBank,
    tone: "from-emerald-500 to-lime-500",
  },
  {
    label: "Giao dịch tự động",
    value: "18",
    change: "SePay",
    icon: Landmark,
    tone: "from-indigo-500 to-sky-500",
  },
];

const chartBars = [42, 68, 53, 76, 61, 88, 72, 94, 66, 81, 58, 90];

const recentTransactions = [
  {
    title: "Lương tháng 6",
    category: "Thu nhập",
    amount: "+18.000.000 đ",
    tone: "bg-emerald-50 text-emerald-700",
  },
  {
    title: "Thanh toán thẻ",
    category: "Chi tiêu",
    amount: "-1.240.000 đ",
    tone: "bg-rose-50 text-rose-700",
  },
  {
    title: "Quỹ tiết kiệm",
    category: "Mục tiêu",
    amount: "+2.500.000 đ",
    tone: "bg-amber-50 text-amber-700",
  },
];

export default function DashboardPage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <section className="animate-rise overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,#0f766e_0%,#12312b_48%,#2563eb_100%)] p-6 text-white shadow-2xl shadow-teal-900/18">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex flex-col justify-between gap-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-teal-50 backdrop-blur">
                <CircleDollarSign className="h-3.5 w-3.5" />
                Trung tâm tài chính
              </div>
              <h1 className="mt-5 max-w-2xl text-3xl font-black leading-tight sm:text-4xl">
                Kiểm soát chi tiêu, ngân sách và hồ sơ tài chính trong một màn hình.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-teal-50/75">
                Theo dõi số dư, dòng tiền và ngân sách cá nhân bằng một giao diện
                rõ ràng, mượt và dễ đọc.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/profile"
                className={cn(
                  buttonVariants(),
                  "h-11 bg-white px-5 text-sm font-bold text-teal-900 shadow-lg shadow-teal-950/20 hover:bg-teal-50"
                )}
              >
                <UserRound className="size-4" aria-hidden="true" />
                Profile
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                href="/transactions"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-11 border-white/20 bg-white/10 px-5 text-sm font-bold text-white backdrop-blur hover:bg-white/15"
                )}
              >
                Transactions
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/15 bg-white/10 p-4 shadow-inner shadow-white/5 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-100/70">
                  Cashflow
                </p>
                <p className="mt-1 text-2xl font-black">+18.6M đ</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-teal-700">
                <ArrowUpRight className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-8 flex h-36 items-end gap-2">
              {chartBars.map((height, index) => (
                <div
                  key={index}
                  className="relative flex flex-1 items-end overflow-hidden rounded-t-xl bg-white/10"
                >
                  <div
                    className="animate-sheen relative w-full overflow-hidden rounded-t-xl bg-[linear-gradient(180deg,#fef3c7,#2dd4bf)] after:absolute after:inset-y-0 after:w-1/2 after:bg-white/25"
                    style={{ height: `${height}%` }}
                  />
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-teal-50/70">
              <span>Jan</span>
              <span>Jun</span>
              <span>Dec</span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="animate-rise rounded-[1.75rem] border border-white/80 bg-white/86 p-5 shadow-lg shadow-teal-950/[0.06] backdrop-blur transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-500">
                    {item.label}
                  </p>
                  <p className="mt-2 text-2xl font-black text-slate-950">
                    {item.value}
                  </p>
                </div>
                <div
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg",
                    item.tone
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-5 flex items-center gap-2 text-xs font-bold text-teal-700">
                <ArrowUpRight className="h-3.5 w-3.5" />
                {item.change}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-[1.75rem] border border-white/80 bg-white/88 p-6 shadow-lg shadow-teal-950/[0.05] backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-950">
                Ngân sách theo danh mục
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Theo dõi mức sử dụng ngân sách theo từng nhóm chi tiêu.
              </p>
            </div>
            <Link
              href="/budget"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-teal-100 bg-teal-50 px-4 text-sm font-bold text-teal-800 transition-colors hover:bg-teal-100"
            >
              Budget
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              ["Ăn uống", "62%", "bg-teal-500"],
              ["Di chuyển", "48%", "bg-sky-500"],
              ["Tiết kiệm", "84%", "bg-amber-400"],
            ].map(([label, value, color]) => (
              <div
                key={label}
                className="rounded-3xl border border-slate-100 bg-slate-50/80 p-4"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-slate-800">{label}</span>
                  <span className="font-black text-slate-950">{value}</span>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
                  <div
                    className={cn("h-full rounded-full", color)}
                    style={{ width: value }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-white/80 bg-white/88 p-6 shadow-lg shadow-teal-950/[0.05] backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-950">
                Hoạt động gần đây
              </h2>
              <p className="mt-1 text-sm text-slate-500">Dòng tiền mới nhất</p>
            </div>
            <Link
              href="/transactions"
              className="text-sm font-bold text-teal-700 hover:text-teal-900"
            >
              Xem tất cả
            </Link>
          </div>
          <div className="mt-5 space-y-4">
            {recentTransactions.map((transaction) => (
              <div key={transaction.title} className="flex items-center gap-3">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-black ${transaction.tone}`}
                >
                  {transaction.title.slice(0, 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-950">
                    {transaction.title}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {transaction.category}
                  </p>
                </div>
                <p className="text-sm font-black text-slate-950">
                  {transaction.amount}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-[1.75rem] border border-white/80 bg-white/80 p-6 shadow-lg shadow-teal-950/[0.05] backdrop-blur">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["Bảo mật", "Phiên đăng nhập được bảo vệ và tự làm mới."],
            ["Đồng bộ", "Thông tin hồ sơ cập nhật xuyên suốt giao diện."],
            ["Sẵn sàng mở rộng", "Có khung cho giao dịch, ngân sách và báo cáo."],
          ].map(([title, description]) => (
            <div key={title} className="rounded-3xl bg-slate-50/90 p-5">
              <p className="text-sm font-black text-slate-950">{title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
