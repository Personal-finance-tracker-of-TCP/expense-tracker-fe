"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCcw, ScrollText } from "lucide-react";

import { formatCurrencyVND, formatDate } from "@/lib/finance";
import { authFetch } from "@/lib/moneytrack-api";

type SepayLog = {
  id: string;
  sepayId: string;
  gateway: string;
  transferAmount: number | string;
  transferType: "IN" | "OUT";
  content?: string | null;
  transactionDate?: string;
  processed: boolean;
  status?: string | null;
  errorReason?: string | null;
  matchedCode?: string | null;
  rawPayload?: unknown;
  transactionId?: string | null;
  createdAt?: string;
  transaction?: {
    id?: string;
    sepayId?: string | null;
  } | null;
};

type SepayLogResult = {
  logs: SepayLog[];
  pagination?: {
    total?: number;
  };
};

async function fetchSepayLogsPage() {
  const result = await authFetch<SepayLogResult>(
    "/api/admin/sepay-logs?limit=100",
    { admin: true }
  );

  return result;
}

function getStatusTone(status?: string | null) {
  if (status === "PROCESSED") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "FAILED") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (status === "UNMATCHED") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
}

function stringifyPayload(payload: unknown) {
  if (!payload) return "-";

  try {
    return JSON.stringify(payload, null, 2);
  } catch {
    return String(payload);
  }
}

export default function SepayLogsPage() {
  const [logs, setLogs] = useState<SepayLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const processedCount = useMemo(
    () => logs.filter((log) => log.processed).length,
    [logs]
  );
  const unmatchedCount = useMemo(
    () => logs.filter((log) => log.status === "UNMATCHED").length,
    [logs]
  );

  async function loadLogs() {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchSepayLogsPage();
      setLogs(result.logs || []);
      setTotal(result.pagination?.total ?? result.logs?.length ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải SePay logs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(loadLogs, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <section className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-xl shadow-teal-950/[0.05] backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <span className="rounded-2xl bg-teal-50 p-3 text-teal-700 ring-1 ring-teal-100 dark:bg-teal-950/60 dark:text-teal-200 dark:ring-teal-900">
              <ScrollText className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-teal-700 dark:text-teal-300">
                Admin audit
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
                SePay Logs
              </h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Kiểm tra webhook SePay, trạng thái xử lý và payload gốc từ
                backend.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadLogs}
            disabled={loading}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl border border-teal-100 bg-white px-4 text-sm font-bold text-teal-800 shadow-sm transition hover:bg-teal-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-teal-200"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4" />
            )}
            Làm mới
          </button>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            ["Tổng logs", total],
            ["Đã xử lý", processedCount],
            ["Chưa khớp", unmatchedCount],
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
        <div className="overflow-x-auto">
          <table className="min-w-[1260px] divide-y divide-slate-100 text-sm dark:divide-slate-800">
            <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-400 dark:bg-slate-950">
              <tr>
                <th className="px-4 py-3 text-left">SePay ID</th>
                <th className="px-4 py-3 text-left">Gateway</th>
                <th className="px-4 py-3 text-right">Số tiền</th>
                <th className="px-4 py-3 text-left">Loại</th>
                <th className="px-4 py-3 text-left">Mã khớp</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Processed</th>
                <th className="px-4 py-3 text-left">Transaction</th>
                <th className="px-4 py-3 text-left">CreatedAt</th>
                <th className="px-4 py-3 text-left">Raw payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-slate-500">
                    <div className="flex items-center gap-2 font-semibold">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang tải logs...
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-slate-500">
                    Chưa có SePay logs.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="align-top transition hover:bg-slate-50/70 dark:hover:bg-slate-950/70"
                  >
                    <td className="max-w-[180px] break-all px-4 py-3 font-bold text-slate-900 dark:text-white">
                      {log.sepayId}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {log.gateway}
                    </td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums text-slate-900 dark:text-white">
                      {formatCurrencyVND(log.transferAmount)}
                    </td>
                    <td className="px-4 py-3">{log.transferType}</td>
                    <td className="max-w-[160px] break-all px-4 py-3 font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                      {log.matchedCode || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-bold ${getStatusTone(
                          log.status
                        )}`}
                      >
                        {log.status || "-"}
                      </span>
                      {log.errorReason ? (
                        <p className="mt-2 max-w-[220px] text-xs text-red-500">
                          {log.errorReason}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          log.processed
                            ? "rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700"
                            : "rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700"
                        }
                      >
                        {log.processed ? "Đã xử lý" : "Chưa xử lý"}
                      </span>
                    </td>
                    <td className="max-w-[160px] break-all px-4 py-3 text-slate-600 dark:text-slate-300">
                      {log.transactionId || log.transaction?.id || "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <details className="max-w-[280px]">
                        <summary className="cursor-pointer text-xs font-bold text-teal-700 dark:text-teal-300">
                          Xem payload
                        </summary>
                        <pre className="mt-2 max-h-56 overflow-auto rounded-2xl bg-slate-950 p-3 text-xs leading-5 text-white">
                          {stringifyPayload(log.rawPayload)}
                        </pre>
                      </details>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
