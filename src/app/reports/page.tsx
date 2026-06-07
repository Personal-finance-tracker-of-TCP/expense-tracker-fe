"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, FileSpreadsheet, FileText, RefreshCcw } from "lucide-react";

import { formatCurrencyVND, getPercentWidth } from "@/lib/finance";
import {
  authDownload,
  authFetch,
  getCurrentDemoPeriod,
} from "@/lib/moneytrack-api";

type Summary = {
  totalIncome: number;
  totalExpense: number;
  savings: number;
  savingsRate: number;
};

type ChartPoint = {
  month: number;
  year: number;
  income: number;
  expense: number;
};

type CategoryBreakdown = {
  categoryId?: string | null;
  name: string;
  icon?: string | null;
  total: number;
};

type ChartData = {
  chartData?: ChartPoint[];
  categoryBreakdown?: CategoryBreakdown[];
};

const { month: DEFAULT_MONTH, year: DEFAULT_YEAR } = getCurrentDemoPeriod();

function reportFilename(format: "excel" | "pdf", month: number, year: number) {
  return `moneytrack-report-${year}-${String(month).padStart(2, "0")}.${
    format === "excel" ? "xlsx" : "pdf"
  }`;
}

export default function ReportsPage() {
  const [month, setMonth] = useState(DEFAULT_MONTH);
  const [year, setYear] = useState(DEFAULT_YEAR);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<"excel" | "pdf" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const topCategoryTotal = useMemo(
    () =>
      Math.max(
        ...(chartData?.categoryBreakdown || []).map((item) => Number(item.total)),
        0
      ),
    [chartData]
  );

  async function loadReportData() {
    setLoading(true);
    setError(null);

    try {
      const [summaryData, chart] = await Promise.all([
        authFetch<Summary>(`/api/reports/summary?month=${month}&year=${year}`),
        authFetch<ChartData>(`/api/reports/chart?month=${month}&year=${year}`),
      ]);

      setSummary(summaryData);
      setChartData(chart);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot load report");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReportData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year]);

  async function handleExport(format: "excel" | "pdf") {
    setDownloading(format);
    setError(null);

    try {
      await authDownload(
        `/api/reports/export?format=${format}&month=${month}&year=${year}`,
        reportFilename(format, month, year)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot export report");
    } finally {
      setDownloading(null);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">
                Financial reporting
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">
                Reports
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Review income, spending, and export a month-end report.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <input
                type="number"
                min={1}
                max={12}
                value={month}
                onChange={(event) => setMonth(Number(event.target.value))}
                className="h-10 w-24 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none ring-blue-100 focus:border-blue-400 focus:ring-4"
                aria-label="Month"
              />
              <input
                type="number"
                min={2000}
                value={year}
                onChange={(event) => setYear(Number(event.target.value))}
                className="h-10 w-28 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none ring-blue-100 focus:border-blue-400 focus:ring-4"
                aria-label="Year"
              />
              <button
                type="button"
                onClick={loadReportData}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <RefreshCcw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-4">
          {[
            ["Income", summary?.totalIncome, "text-emerald-700"],
            ["Expense", summary?.totalExpense, "text-red-700"],
            ["Savings", summary?.savings, "text-blue-700"],
            ["Savings rate", `${summary?.savingsRate ?? 0}%`, "text-slate-950"],
          ].map(([label, value, className]) => (
            <div
              key={String(label)}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm font-medium text-slate-500">{label}</p>
              <p className={`mt-4 text-2xl font-bold tabular-nums ${className}`}>
                {typeof value === "number" ? formatCurrencyVND(value) : value}
              </p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Income vs expense</h2>
                <p className="text-sm text-slate-500">
                  Last six monthly points from backend chart data.
                </p>
              </div>
              <Download className="h-5 w-5 text-slate-400" />
            </div>

            <div className="mt-6 space-y-4">
              {loading ? (
                <p className="text-sm text-slate-500">Loading chart...</p>
              ) : (chartData?.chartData || []).length === 0 ? (
                <p className="text-sm text-slate-500">
                  Chart endpoint returned no rows.
                </p>
              ) : (
                chartData?.chartData?.map((point) => {
                  const maxValue = Math.max(point.income, point.expense, 1);

                  return (
                    <div key={`${point.year}-${point.month}`} className="space-y-2">
                      <div className="flex justify-between text-sm font-medium">
                        <span>
                          {point.month}/{point.year}
                        </span>
                        <span className="text-slate-500">
                          {formatCurrencyVND(point.income - point.expense)}
                        </span>
                      </div>
                      <div className="grid gap-2">
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-emerald-500"
                            style={{
                              width: getPercentWidth(
                                (point.income / maxValue) * 100
                              ),
                            }}
                          />
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-red-500"
                            style={{
                              width: getPercentWidth(
                                (point.expense / maxValue) * 100
                              ),
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-semibold">Export report</h2>
              <p className="mt-1 text-sm text-slate-500">
                Download files directly from backend export endpoints.
              </p>

              <div className="mt-5 grid gap-3">
                <button
                  type="button"
                  onClick={() => handleExport("excel")}
                  disabled={downloading !== null}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  {downloading === "excel" ? "Exporting..." : "Export Excel"}
                </button>
                <button
                  type="button"
                  onClick={() => handleExport("pdf")}
                  disabled={downloading !== null}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <FileText className="h-4 w-4" />
                  {downloading === "pdf" ? "Exporting..." : "Export PDF"}
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-semibold">Top expense categories</h2>
              <div className="mt-5 space-y-4">
                {(chartData?.categoryBreakdown || []).length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No category spending yet.
                  </p>
                ) : (
                  chartData?.categoryBreakdown?.map((category) => (
                    <div key={category.categoryId || category.name}>
                      <div className="flex justify-between gap-3 text-sm">
                        <span className="truncate font-medium">
                          {category.icon || "•"} {category.name}
                        </span>
                        <span className="font-semibold tabular-nums">
                          {formatCurrencyVND(category.total)}
                        </span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-blue-600"
                          style={{
                            width: getPercentWidth(
                              topCategoryTotal
                                ? (Number(category.total) / topCategoryTotal) *
                                    100
                                : 0
                            ),
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
