"use client";

import { useEffect, useState } from "react";
import { RefreshCcw, ScrollText } from "lucide-react";

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
  transactionId?: string | null;
  createdAt?: string;
  transaction?: {
    id?: string;
    sepayId?: string | null;
  } | null;
};

type SepayLogResult = {
  logs: SepayLog[];
};

async function fetchSepayLogsPage() {
  const result = await authFetch<SepayLogResult>(
    "/api/admin/sepay-logs?limit=100",
    { admin: true }
  );

  return result.logs || [];
}

function getMatchedCode(content: string | null | undefined) {
  return content?.match(/\bMTU\d+\b/i)?.[0]?.toUpperCase() || "-";
}

export default function SepayLogsPage() {
  const [logs, setLogs] = useState<SepayLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadLogs() {
    setLoading(true);
    setError(null);

    try {
      const nextLogs = await fetchSepayLogsPage();
      setLogs(nextLogs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot load SePay logs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let ignore = false;

    async function loadInitialLogs() {
      try {
        const nextLogs = await fetchSepayLogsPage();
        if (!ignore) {
          setLogs(nextLogs);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Cannot load SePay logs");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void loadInitialLogs();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <span className="rounded-2xl bg-blue-50 p-3 text-blue-700 ring-1 ring-blue-100">
                <ScrollText className="h-6 w-6" />
              </span>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">
                  Admin audit
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight">
                  SePay logs
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  Inspect processed, duplicate, and unmatched bank payloads.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={loadLogs}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </section>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-slate-400">
                <tr>
                  <th className="px-4 py-3 text-left">SePay ID</th>
                  <th className="px-4 py-3 text-left">Gateway</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">SePay Code</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Processed</th>
                  <th className="px-4 py-3 text-left">Transaction</th>
                  <th className="px-4 py-3 text-left">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-5 text-slate-500">
                      Loading logs...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-5 text-slate-500">
                      No SePay logs yet.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="align-top">
                      <td className="px-4 py-3 font-medium">{log.sepayId}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {log.gateway}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">
                        {formatCurrencyVND(log.transferAmount)}
                      </td>
                      <td className="px-4 py-3">{log.transferType}</td>
                      <td className="px-4 py-3">{getMatchedCode(log.content)}</td>
                      <td className="px-4 py-3">
                        {log.transactionId || log.transaction?.id
                          ? "CREATED"
                          : "LOGGED"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            log.processed
                              ? "rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700"
                              : "rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700"
                          }
                        >
                          {log.processed ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {log.transactionId || log.transaction?.id || "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatDate(log.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
