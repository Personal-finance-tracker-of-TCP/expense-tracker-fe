"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, Check, CheckCheck, MailOpen, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { authFetch } from "@/lib/moneytrack-api";

type AdminNotification = {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
};

function formatDate(value: string) {
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

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.isRead).length,
    [notifications]
  );

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await authFetch<AdminNotification[]>("/api/admin/notifications", {
        admin: true,
      });
      setNotifications(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải thông báo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(fetchNotifications, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const markRead = async (id: string) => {
    try {
      await authFetch(`/api/admin/notifications/${id}/read`, {
        method: "PATCH",
        admin: true,
      });
      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isRead: true } : item))
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể đánh dấu đã đọc");
    }
  };

  const markAllRead = async () => {
    try {
      await authFetch("/api/admin/notifications/read-all", {
        method: "PATCH",
        admin: true,
      });
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
      toast.success("Đã đánh dấu tất cả thông báo là đã đọc.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể đánh dấu tất cả");
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <span className="rounded-2xl bg-emerald-50 p-3 text-emerald-700 ring-1 ring-emerald-100">
                <Bell className="h-6 w-6" />
              </span>
              <div>
                <p className="text-sm font-semibold uppercase text-emerald-600">
                  FinTrack Admin
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight">Thông báo</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Theo dõi các thông báo mới nhất được tạo cho người dùng trong hệ thống.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={fetchNotifications}
                disabled={loading}
                className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Làm mới
              </button>
              <button
                type="button"
                onClick={markAllRead}
                disabled={unreadCount === 0}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
              >
                <CheckCheck className="h-4 w-4" />
                Đọc tất cả
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              ["Tổng thông báo", notifications.length],
              ["Chưa đọc", unreadCount],
              ["Đã đọc", notifications.length - unreadCount],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase text-slate-400">{label}</p>
                <p className="mt-1 text-2xl font-extrabold text-slate-900">{value}</p>
              </div>
            ))}
          </div>
        </section>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-16 text-sm font-semibold text-slate-500">
              <RefreshCw className="h-5 w-5 animate-spin" />
              Đang tải thông báo...
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
              <MailOpen className="h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-500">
                Chưa có thông báo nào.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {notifications.map((item) => (
                <article
                  key={item.id}
                  className={`p-5 transition-colors ${
                    item.isRead ? "bg-white" : "bg-emerald-50/40"
                  }`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-bold text-slate-900">{item.title}</h2>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                          {item.type}
                        </span>
                        {!item.isRead ? (
                          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700">
                            Chưa đọc
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{item.message}</p>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-slate-400">
                        <span>{formatDate(item.createdAt)}</span>
                        <span>
                          User: {item.user?.email || "-"} {item.user?.name ? `(${item.user.name})` : ""}
                        </span>
                      </div>
                    </div>

                    {!item.isRead ? (
                      <button
                        type="button"
                        onClick={() => markRead(item.id)}
                        className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-white px-4 text-sm font-bold text-emerald-700 transition-colors hover:bg-emerald-50"
                      >
                        <Check className="h-4 w-4" />
                        Đánh dấu đã đọc
                      </button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
