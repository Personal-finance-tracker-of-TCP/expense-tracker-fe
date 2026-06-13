import Link from "next/link";
import { Activity, ArrowLeft, Clock3, Database, Server, Wifi } from "lucide-react";

// This page uses SSR/dynamic rendering.
export const dynamic = "force-dynamic";

type HealthPayload = {
  status: "ok" | "degraded" | string;
  message: string;
  database: "ok" | "unavailable" | string;
  checkedAt: string;
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

async function getSystemHealth() {
  const serverTime = new Date().toISOString();

  try {
    const response = await fetch(`${getApiBaseUrl()}/api/public/health`, {
      cache: "no-store",
    });
    const json = (await response.json()) as ApiEnvelope<HealthPayload>;

    if (!response.ok || json.success === false || !json.data) {
      return {
        data: null,
        serverTime,
        error: json.message || "Không thể tải trạng thái hệ thống",
      };
    }

    return { data: json.data, serverTime, error: null };
  } catch {
    return {
      data: null,
      serverTime,
      error: "Không thể kết nối backend health",
    };
  }
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
    second: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function statusBadge(status?: string | null) {
  const isOnline = status === "ok";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${
        isOnline
          ? "border-emerald-100 bg-emerald-50 text-emerald-600"
          : "border-amber-100 bg-amber-50 text-amber-600"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isOnline ? "bg-emerald-500" : "bg-amber-500"
        }`}
      />
      {isOnline ? "Đang cập nhật" : "Cần kiểm tra"}
    </span>
  );
}

export default async function SystemStatusPage() {
  const { data, serverTime, error } = await getSystemHealth();
  const status = data?.status || "degraded";
  const isOnline = status === "ok";
  const databaseOnline = data?.database === "ok";

  const statusCards = [
    {
      label: "Backend",
      value: isOnline ? "Online" : "Degraded",
      icon: Server,
      badge: statusBadge(status),
    },
    {
      label: "API",
      value: data?.message || "Không có phản hồi",
      icon: Wifi,
      badge: statusBadge(status),
    },
    {
      label: "Database",
      value: databaseOnline ? "Online" : "Unavailable",
      icon: Database,
      badge: statusBadge(data?.database),
    },
    {
      label: "Server time",
      value: formatDateTime(serverTime),
      icon: Clock3,
      badge: (
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-500">
          Runtime
        </span>
      ),
    },
  ];

  return (
    <main className="min-h-screen bg-[#F4F6FA] px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                <Activity className="h-6 w-6" />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold uppercase text-emerald-600">
                    FinTrack Runtime
                  </p>
                  <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600">
                    SSR • render động mỗi request
                  </span>
                </div>
                <h1 className="mt-2 text-3xl font-extrabold text-slate-900">
                  Trạng thái hệ thống
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Theo dõi trạng thái runtime tổng quát của backend và database,
                  chỉ hiển thị dữ liệu public an toàn.
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
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-700">
            {error}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2">
          {statusCards.map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.label}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                    <Icon className="h-5 w-5" />
                  </span>
                  {item.badge}
                </div>
                <p className="mt-4 text-xs font-bold uppercase text-slate-400">
                  {item.label}
                </p>
                <p className="mt-1 break-words text-xl font-extrabold text-slate-900">
                  {item.value}
                </p>
              </article>
            );
          })}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold leading-6 text-slate-600">
            Trang này dùng dynamic rendering để luôn lấy trạng thái runtime mới
            nhất từ backend.
          </p>
          <p className="mt-3 text-xs font-semibold text-slate-400">
            Backend checked at:{" "}
            <span className="text-slate-700">
              {formatDateTime(data?.checkedAt)}
            </span>
          </p>
        </section>
      </div>
    </main>
  );
}
