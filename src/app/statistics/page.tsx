import Link from "next/link";
import { ArrowLeft, BarChart3, Database, ReceiptText, Tags, Users } from "lucide-react";

// This page uses ISR with revalidate = 60.
export const revalidate = 60;

type StatisticsPayload = {
  totalUsers: number;
  totalTransactions: number;
  processedSepayTransactions: number;
  totalCategories: number;
  totalBudgets: number;
  generatedAt: string;
};

type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  message?: string;
};

function getApiBaseUrl() {
  return (
    process.env.API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:5000"
  ).replace(/\/+$/, "");
}

async function getStatistics() {
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/public/statistics`, {
      next: { revalidate },
    });
    const json = (await response.json()) as ApiEnvelope<StatisticsPayload>;

    if (!response.ok || json.success === false || !json.data) {
      return { data: null, error: json.message || "Không thể tải thống kê" };
    }

    return { data: json.data, error: null };
  } catch {
    return { data: null, error: "Không thể kết nối backend thống kê" };
  }
}

function formatNumber(value: number | undefined) {
  return new Intl.NumberFormat("vi-VN").format(value || 0);
}

function formatDateTime(value?: string) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

export default async function StatisticsPage() {
  const { data, error } = await getStatistics();
  const statCards = [
    {
      label: "Tổng người dùng",
      value: data?.totalUsers,
      icon: Users,
    },
    {
      label: "Tổng giao dịch",
      value: data?.totalTransactions,
      icon: ReceiptText,
    },
    {
      label: "SePay đã xử lý",
      value: data?.processedSepayTransactions,
      icon: Database,
    },
    {
      label: "Danh mục",
      value: data?.totalCategories,
      icon: Tags,
    },
    {
      label: "Budget",
      value: data?.totalBudgets,
      icon: BarChart3,
    },
  ];

  return (
    <main className="min-h-screen bg-[#F4F6FA] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                <BarChart3 className="h-6 w-6" />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold uppercase text-emerald-600">
                    FinTrack Public
                  </p>
                  <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600">
                    ISR • cập nhật mỗi 60 giây
                  </span>
                </div>
                <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
                  Thống kê nền tảng
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Dữ liệu tổng hợp public của FinTrack, chỉ hiển thị số liệu
                  an toàn và không chứa thông tin cá nhân.
                </p>
              </div>
            </div>

            <Link
              href="/"
              className="inline-flex h-10 w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Về trang chủ
            </Link>
          </div>
        </section>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {statCards.map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.label}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                  <Icon className="h-5 w-5" />
                </span>
                <p className="mt-4 text-xs font-bold uppercase text-slate-400">
                  {item.label}
                </p>
                <p className="mt-1 text-3xl font-extrabold tabular-nums text-slate-900">
                  {formatNumber(item.value)}
                </p>
              </article>
            );
          })}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold leading-6 text-slate-600">
            Trang này sử dụng Incremental Static Regeneration để cache thống kê
            public và tự làm mới sau 60 giây.
          </p>
          <p className="mt-3 text-xs font-semibold text-slate-400">
            Cập nhật gần nhất:{" "}
            <span className="text-slate-700">
              {formatDateTime(data?.generatedAt)}
            </span>
          </p>
        </section>
      </div>
    </main>
  );
}
