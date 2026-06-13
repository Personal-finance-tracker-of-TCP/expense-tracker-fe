"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  Bell,
  Link2,
  Loader2,
  ReceiptText,
  RefreshCw,
  ScrollText,
  Users,
} from "lucide-react";

import { authFetch } from "@/lib/moneytrack-api";

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

type SepayLog = {
  id: string;
  status?: string | null;
  processed?: boolean;
  createdAt?: string;
};

type SepayLogResult = {
  logs: SepayLog[];
  pagination?: {
    total?: number;
  };
};

type AdminNotification = {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
};

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

export default function AdminPlatformStatisticsPage() {
  const [statistics, setStatistics] = useState<PlatformStatisticsPayload | null>(
    null
  );
  const [logs, setLogs] = useState<SepayLogResult | null>(null);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);

    try {
      const [statisticsData, logData, notificationData] = await Promise.all([
        authFetch<PlatformStatisticsPayload>("/api/admin/platform-statistics", {
          admin: true,
        }),
        authFetch<SepayLogResult>("/api/admin/sepay-logs?limit=100", {
          admin: true,
        }),
        authFetch<AdminNotification[]>("/api/admin/notifications", {
          admin: true,
        }),
      ]);

      setStatistics(statisticsData);
      setLogs(logData);
      setNotifications(notificationData || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không thể tải tổng quan hệ thống"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(loadDashboard, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const webhookCount =
    logs?.pagination?.total ??
    logs?.logs?.length ??
    (statistics
      ? statistics.sepayProcessedCount +
        statistics.sepayUnmatchedCount +
        statistics.sepayFailedCount
      : 0);

  const metricCards = useMemo(
    () => [
      {
        label: "Tổng người dùng",
        value: statistics?.totalUsers,
        icon: Users,
      },
      {
        label: "Người dùng liên kết BankHub",
        value: statistics?.linkedBankUsers,
        icon: Link2,
      },
      {
        label: "Tổng giao dịch",
        value: statistics?.totalTransactions,
        icon: ReceiptText,
      },
      {
        label: "Giao dịch SePay đã xử lý",
        value: statistics?.sepayProcessedCount,
        icon: Activity,
      },
      {
        label: "Tổng webhook/logs",
        value: webhookCount,
        icon: ScrollText,
      },
      {
        label: "Thông báo hệ thống",
        value: statistics?.totalNotifications,
        icon: Bell,
      },
    ],
    [statistics, webhookCount]
  );

  const recentNotifications = notifications.slice(0, 5);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-xl shadow-teal-950/[0.05] backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 ring-1 ring-teal-100 dark:bg-teal-950/60 dark:text-teal-200 dark:ring-teal-900">
              <BarChart3 className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm font-semibold uppercase text-teal-700 dark:text-teal-300">
                FinTrack Admin
              </p>
              <h1 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
                Tổng quan hệ thống
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                Theo dõi người dùng, liên kết BankHub, giao dịch SePay và thông
                báo từ dữ liệu backend thật.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadDashboard}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-teal-100 bg-white px-4 text-sm font-bold text-teal-800 shadow-sm transition hover:bg-teal-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-teal-200"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Làm mới
          </button>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metricCards.map((item) => {
          const Icon = item.icon;

          return (
            <article
              key={item.label}
              className="h-full min-w-0 rounded-[1.75rem] border border-white/80 bg-white/90 p-5 shadow-xl shadow-teal-950/[0.04] backdrop-blur dark:border-slate-800 dark:bg-slate-900/90"
            >
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 ring-1 ring-teal-100 dark:bg-teal-950/60 dark:text-teal-200 dark:ring-teal-900">
                <Icon className="h-5 w-5" />
              </span>
              <p className="mt-4 line-clamp-2 min-h-8 text-xs font-bold uppercase text-slate-400">
                {item.label}
              </p>
              <p className="mt-1 truncate text-3xl font-black tabular-nums text-slate-950 dark:text-white">
                {loading ? "..." : formatNumber(item.value)}
              </p>
            </article>
          );
        })}
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-xl shadow-teal-950/[0.05] backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-slate-950 dark:text-white">
                Trạng thái SePay
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Tổng hợp từ backend platform statistics.
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              ["Đã xử lý", statistics?.sepayProcessedCount, "text-emerald-700"],
              ["Chưa khớp", statistics?.sepayUnmatchedCount, "text-amber-700"],
              ["Thất bại", statistics?.sepayFailedCount, "text-red-700"],
            ].map(([label, value, tone]) => (
              <div
                key={label}
                className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950"
              >
                <p className="text-xs font-bold uppercase text-slate-400">
                  {label}
                </p>
                <p className={`mt-1 text-2xl font-black ${tone}`}>
                  {loading ? "..." : formatNumber(Number(value))}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-xs font-semibold text-slate-400">
            Cập nhật gần nhất:{" "}
            <span className="text-slate-700 dark:text-slate-300">
              {formatDateTime(statistics?.generatedAt)}
            </span>
          </p>
        </section>

        <section className="rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-xl shadow-teal-950/[0.05] backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
          <h2 className="text-xl font-black text-slate-950 dark:text-white">
            Thông báo gần đây
          </h2>
          <div className="mt-4 max-h-[380px] space-y-3 overflow-y-auto pr-1">
            {loading ? (
              <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-950">
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang tải thông báo...
              </div>
            ) : recentNotifications.length === 0 ? (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-950">
                Chưa có dữ liệu thông báo.
              </div>
            ) : (
              recentNotifications.map((item) => (
                <article
                  key={item.id}
                  className="min-w-0 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950"
                >
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-teal-50 px-2 py-1 text-[11px] font-bold text-teal-700 dark:bg-teal-950 dark:text-teal-200">
                      {item.type}
                    </span>
                    {!item.isRead ? (
                      <span className="rounded-full bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-700">
                        Chưa đọc
                      </span>
                    ) : null}
                  </div>
                  <h3 className="mt-2 line-clamp-1 font-bold text-slate-900 dark:text-white">
                    {item.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    {item.message}
                  </p>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
