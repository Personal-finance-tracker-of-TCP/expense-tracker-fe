"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, Check, CheckCheck, Loader2, MailOpen, RefreshCw } from "lucide-react";
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
      toast.error(
        err instanceof Error ? err.message : "Không thể đánh dấu đã đọc"
      );
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
      toast.error(
        err instanceof Error ? err.message : "Không thể đánh dấu tất cả"
      );
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <section className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-xl shadow-teal-950/[0.05] backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className="rounded-2xl bg-teal-50 p-3 text-teal-700 ring-1 ring-teal-100 dark:bg-teal-950/60 dark:text-teal-200 dark:ring-teal-900">
              <Bell className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm font-semibold uppercase text-teal-700 dark:text-teal-300">
                FinTrack Admin
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
                Các thông báo
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                Theo dõi thông báo hệ thống được tạo cho người dùng từ backend.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={fetchNotifications}
              disabled={loading}
              className="inline-flex h-10 items-center gap-2 rounded-2xl border border-teal-100 bg-white px-4 text-sm font-bold text-teal-800 shadow-sm transition hover:bg-teal-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-teal-200"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Làm mới
            </button>
            <button
              type="button"
              onClick={markAllRead}
              disabled={unreadCount === 0}
              className="inline-flex h-10 items-center gap-2 rounded-2xl bg-teal-700 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800 disabled:opacity-50"
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
            <div
              key={label}
              className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950"
            >
              <p className="text-xs font-bold uppercase text-slate-400">
                {label}
              </p>
              <p className="mt-1 text-2xl font-black text-slate-950 dark:text-white">
                {loading ? "..." : value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/90 shadow-xl shadow-teal-950/[0.05] backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-16 text-sm font-semibold text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Đang tải thông báo...
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
            <MailOpen className="h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-slate-500">
              Chưa có thông báo quản trị.
            </p>
          </div>
        ) : (
          <div className="max-h-[640px] divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
            {notifications.map((item) => (
              <article
                key={item.id}
                className={`min-w-0 p-5 transition-colors ${
                  item.isRead
                    ? "bg-white/80 dark:bg-slate-900/70"
                    : "bg-teal-50/50 dark:bg-teal-950/20"
                }`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="min-w-0 truncate font-bold text-slate-900 dark:text-white">
                        {item.title}
                      </h2>
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {item.type}
                      </span>
                      {!item.isRead ? (
                        <span className="rounded-full bg-teal-100 px-2.5 py-1 text-xs font-bold text-teal-700">
                          Chưa đọc
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {item.message}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-slate-400">
                      <span>{formatDate(item.createdAt)}</span>
                      <span>
                        User: {item.user?.email || "-"}{" "}
                        {item.user?.name ? `(${item.user.name})` : ""}
                      </span>
                    </div>
                  </div>

                  {!item.isRead ? (
                    <button
                      type="button"
                      onClick={() => markRead(item.id)}
                      className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-2xl border border-teal-100 bg-white px-4 text-sm font-bold text-teal-700 transition-colors hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-950 dark:text-teal-200"
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
  );
}
