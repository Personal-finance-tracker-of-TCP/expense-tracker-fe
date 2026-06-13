"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, Check, Loader2, MailOpen } from "lucide-react";

import { ApiRequestError, authFetch } from "@/lib/moneytrack-api";

type Notification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
};

function formatTime(dateStr: string) {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;

    return date.toLocaleDateString("vi-VN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notificationError, setNotificationError] = useState<string | null>(
    null
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async (showLoader = false) => {
    if (showLoader) setLoading(true);

    try {
      const data = await authFetch<Notification[]>("/api/notifications");
      setNotifications(data || []);
      setNotificationError(null);
    } catch (error) {
      setNotifications([]);
      setNotificationError(
        error instanceof ApiRequestError && error.status === 404
          ? "Chưa có API thông báo"
          : "Không thể tải thông báo"
      );
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    const initialTimer = window.setTimeout(() => {
      void fetchNotifications(true);
    }, 0);

    const interval = window.setInterval(() => {
      void fetchNotifications(false);
    }, 30000);

    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await authFetch("/api/notifications/read-all", { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, isRead: true }))
      );
    } catch {
      setNotificationError("Không thể đánh dấu tất cả thông báo");
    }
  };

  const handleMarkRead = async (id: string, isRead: boolean) => {
    if (isRead) return;

    try {
      await authFetch(`/api/notifications/${id}/read`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === id
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch {
      setNotificationError("Không thể đánh dấu thông báo đã đọc");
    }
  };

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead
  ).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen((current) => !current)}
        type="button"
        className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-teal-100 bg-white text-slate-700 shadow-sm transition-colors hover:bg-teal-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        aria-label="Thông báo"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-950">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl ring-1 ring-black/5 dark:border-slate-700 dark:bg-slate-900 sm:w-96">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Thông báo
              </h3>
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
              ) : null}
            </div>

            {unreadCount > 0 ? (
              <button
                onClick={handleMarkAllRead}
                type="button"
                className="flex items-center gap-1 text-xs font-semibold text-emerald-600 transition-colors hover:text-emerald-700"
              >
                <Check className="h-3.5 w-3.5" />
                Đọc tất cả
              </button>
            ) : null}
          </div>

          <div className="max-h-80 divide-y divide-slate-50 overflow-y-auto dark:divide-slate-800">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm font-medium text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang tải thông báo...
              </div>
            ) : notificationError ? (
              <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
                <MailOpen className="h-8 w-8 text-slate-300" />
                <p className="mt-2 text-sm font-medium text-slate-400">
                  {notificationError}
                </p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
                <MailOpen className="h-8 w-8 text-slate-300" />
                <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-300">
                  Chưa có thông báo
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Chúng tôi sẽ báo cho bạn khi có cập nhật giao dịch.
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() =>
                    void handleMarkRead(notification.id, notification.isRead)
                  }
                  type="button"
                  className={`flex w-full cursor-pointer flex-col gap-1 p-4 text-left transition-colors ${
                    notification.isRead
                      ? "bg-white hover:bg-slate-50/70 dark:bg-slate-900 dark:hover:bg-slate-800"
                      : "bg-emerald-50/30 hover:bg-emerald-50/60 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-sm ${
                        notification.isRead
                          ? "font-semibold text-slate-700 dark:text-slate-200"
                          : "font-bold text-slate-900 dark:text-white"
                      }`}
                    >
                      {notification.title}
                    </span>
                    {!notification.isRead ? (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                    ) : null}
                  </div>

                  <p className="text-xs leading-normal text-slate-500 dark:text-slate-400">
                    {notification.message}
                  </p>
                  <span className="text-[10px] font-medium text-slate-400">
                    {formatTime(notification.createdAt)}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
