import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  BarChart3,
  Bell,
  Database,
  Link2,
  ReceiptText,
  ShieldAlert,
  Users,
  XCircle,
} from "lucide-react";

// This page uses ISR with revalidate = 60.
export const revalidate = 60;

type PlatformStatisticsPayload = {
  totalUsers: number;
  totalTransactions: number;
  sepayProcessedCount: number;
  sepayUnmatchedCount: number;
  sepayFailedCount: number;
  linkedBankUsers: number;
  totalNotifications: number;
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

async function getPlatformStatistics(token: string) {
  const response = await fetch(
    `${getApiBaseUrl()}/api/admin/platform-statistics`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      next: { revalidate },
    }
  );

  if (response.status === 401) {
    redirect("/login?from=/admin/platform-statistics");
  }

  if (response.status === 403) {
    redirect("/dashboard");
  }

  const json = (await response.json()) as ApiEnvelope<PlatformStatisticsPayload>;

  if (!response.ok || json.success === false || !json.data) {
    return {
      data: null,
      error: json.message || "Không thể tải thống kê nền tảng",
    };
  }

  return { data: json.data, error: null };
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

export default async function AdminPlatformStatisticsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    redirect("/login?from=/admin/platform-statistics");
  }

  const { data, error } = await getPlatformStatistics(token);
  const metricCards = [
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
      label: "User liên kết BankHub",
      value: data?.linkedBankUsers,
      icon: Link2,
    },
    {
      label: "Thông báo",
      value: data?.totalNotifications,
      icon: Bell,
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
                    MoneyTrack Admin
                  </p>
                </div>
                <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
                  Thống kê nền tảng
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Dữ liệu tổng hợp dành cho quản trị viên, được cache và cập
                  nhật định kỳ.
                </p>
              </div>
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metricCards.map((item) => {
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
            Trang này dùng Incremental Static Regeneration với thời gian
            revalidate 60 giây cho dữ liệu aggregate của admin.
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
