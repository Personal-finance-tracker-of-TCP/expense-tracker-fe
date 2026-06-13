"use client";

import { useEffect, useMemo, useState } from "react";
import { MessageSquareText, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { authFetch } from "@/lib/moneytrack-api";

type FeedbackStatus = "NEW" | "IN_PROGRESS" | "RESOLVED" | "DISMISSED";

type FeedbackItem = {
  id: string;
  title: string;
  message: string;
  type: "BUG" | "FEATURE" | "OTHER" | string;
  status: FeedbackStatus;
  rating?: number | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
};

const statusLabels: Record<FeedbackStatus, string> = {
  NEW: "Mới",
  IN_PROGRESS: "Đang xử lý",
  RESOLVED: "Đã xử lý",
  DISMISSED: "Bỏ qua",
};

const typeLabels: Record<string, string> = {
  BUG: "Báo lỗi",
  FEATURE: "Tính năng",
  OTHER: "Khác",
};

function formatDate(value: string) {
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

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function fetchFeedback() {
    setLoading(true);
    setError(null);
    try {
      const data = await authFetch<FeedbackItem[]>("/api/admin/feedback", {
        admin: true,
      });
      setFeedback(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải phản hồi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchFeedback();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const counts = useMemo(
    () => ({
      total: feedback.length,
      new: feedback.filter((item) => item.status === "NEW").length,
      resolved: feedback.filter((item) => item.status === "RESOLVED").length,
    }),
    [feedback]
  );

  async function updateStatus(id: string, status: FeedbackStatus) {
    setUpdatingId(id);
    try {
      const updated = await authFetch<FeedbackItem>(
        `/api/admin/feedback/${id}/status`,
        {
          method: "PATCH",
          admin: true,
          body: JSON.stringify({ status }),
        }
      );
      setFeedback((current) =>
        current.map((item) => (item.id === id ? updated : item))
      );
      toast.success("Đã cập nhật trạng thái phản hồi.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể cập nhật trạng thái");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <span className="rounded-2xl bg-emerald-50 p-3 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/20">
                <MessageSquareText className="h-6 w-6" />
              </span>
              <div>
                <p className="text-sm font-semibold uppercase text-emerald-600 dark:text-emerald-300">
                  Quản trị
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight">
                  Phản hồi người dùng
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-300">
                  Theo dõi lỗi, góp ý tính năng và phản hồi khác từ người dùng.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void fetchFeedback()}
              disabled={loading}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Làm mới
            </button>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              ["Tổng phản hồi", counts.total],
              ["Mới", counts.new],
              ["Đã xử lý", counts.resolved],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-950"
              >
                <p className="text-xs font-semibold uppercase text-slate-400">
                  {label}
                </p>
                <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
                  {value}
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

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-16 text-sm font-semibold text-slate-500 dark:text-slate-300">
              <RefreshCw className="h-5 w-5 animate-spin" />
              Đang tải phản hồi...
            </div>
          ) : feedback.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
              <MessageSquareText className="h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-500 dark:text-slate-300">
                Chưa có phản hồi nào.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-950 dark:text-slate-300">
                  <tr>
                    <th className="px-4 py-3">Phản hồi</th>
                    <th className="px-4 py-3">Loại</th>
                    <th className="px-4 py-3">Người gửi</th>
                    <th className="px-4 py-3">Đánh giá</th>
                    <th className="px-4 py-3">Ngày gửi</th>
                    <th className="px-4 py-3">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {feedback.map((item) => (
                    <tr key={item.id} className="align-top">
                      <td className="px-4 py-4">
                        <p className="font-bold text-slate-900 dark:text-white">
                          {item.title}
                        </p>
                        <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-300">
                          {item.message}
                        </p>
                      </td>
                      <td className="px-4 py-4 font-semibold text-slate-700 dark:text-slate-200">
                        {typeLabels[item.type] || item.type}
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {item.user?.name || "Người dùng"}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {item.user?.email || "-"}
                        </p>
                      </td>
                      <td className="px-4 py-4 font-semibold text-slate-700 dark:text-slate-200">
                        {item.rating ? `${item.rating}/5` : "-"}
                      </td>
                      <td className="px-4 py-4 text-slate-500 dark:text-slate-300">
                        {formatDate(item.createdAt)}
                      </td>
                      <td className="px-4 py-4">
                        <select
                          value={item.status}
                          disabled={updatingId === item.id}
                          onChange={(event) =>
                            void updateStatus(
                              item.id,
                              event.target.value as FeedbackStatus
                            )
                          }
                          className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-emerald-400 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                        >
                          {Object.entries(statusLabels).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
