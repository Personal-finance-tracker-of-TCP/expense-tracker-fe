"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BarChart2,
  Download,
  FileSpreadsheet,
  Loader2,
  PieChart,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";

import { formatCurrencyVND } from "@/lib/finance";
import {
  authDownload,
  authFetch,
  getCurrentDemoPeriod,
  toNumber,
} from "@/lib/moneytrack-api";

type ReportSummary = {
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

type ChartResponse = {
  chartData: ChartPoint[];
  categoryBreakdown: CategoryBreakdown[];
};

const { month: DEMO_MONTH, year: DEMO_YEAR } = getCurrentDemoPeriod();
const DEFAULT_MONTH = `${DEMO_YEAR}-${String(DEMO_MONTH).padStart(2, "0")}`;

function monthParts(monthValue: string) {
  const [year, month] = monthValue.split("-").map(Number);
  return { year, month };
}

function buildAvailableMonths() {
  return Array.from({ length: 6 }, (_, index) => {
    const date = new Date(DEMO_YEAR, DEMO_MONTH - 1 - index, 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  });
}

function formatMonthLabel(monthValue: string) {
  const { month, year } = monthParts(monthValue);
  return `Tháng ${month}/${year}`;
}

function compactCurrency(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return String(value);
}

function getErrorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  tone: string;
}) {
  return (
    <section className="rounded-[1.75rem] border border-white/80 bg-white/88 p-5 shadow-lg shadow-teal-950/[0.05] backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
        </div>
        <div className={`flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg ${tone}`}>
          <Icon className="size-5" aria-hidden="true" />
        </div>
      </div>
      <p className="mt-4 text-xs font-black text-teal-700">{helper}</p>
    </section>
  );
}

export default function ReportsPage() {
  const [summary, setSummary] = useState<ReportSummary>({
    totalIncome: 0,
    totalExpense: 0,
    savings: 0,
    savingsRate: 0,
  });
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<CategoryBreakdown[]>([]);
  const [monthFilter, setMonthFilter] = useState(DEFAULT_MONTH);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<"pdf" | "excel" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const availableMonths = useMemo(() => buildAvailableMonths(), []);

  const loadReports = useCallback(async () => {
    const { month, year } = monthParts(monthFilter);
    setLoading(true);
    setError(null);

    try {
      const [summaryData, chartResponse] = await Promise.all([
        authFetch<ReportSummary>(`/api/reports/summary?month=${month}&year=${year}`),
        authFetch<ChartResponse>(`/api/reports/chart?month=${month}&year=${year}`),
      ]);

      setSummary(summaryData);
      setChartData(chartResponse.chartData || []);
      setCategoryBreakdown(chartResponse.categoryBreakdown || []);
    } catch (err) {
      setError(getErrorMessage(err, "Không thể tải báo cáo từ backend"));
    } finally {
      setLoading(false);
    }
  }, [monthFilter]);

  useEffect(() => {
    let active = true;

    queueMicrotask(() => {
      if (active) {
        void loadReports();
      }
    });

    return () => {
      active = false;
    };
  }, [loadReports]);

  const maxChartValue = useMemo(() => {
    return Math.max(
      1,
      ...chartData.flatMap((point) => [toNumber(point.income), toNumber(point.expense)])
    );
  }, [chartData]);

  const totalBreakdown = useMemo(() => {
    return categoryBreakdown.reduce((sum, item) => sum + toNumber(item.total), 0);
  }, [categoryBreakdown]);

  async function handleExport(format: "pdf" | "excel") {
    const { month, year } = monthParts(monthFilter);
    const extension = format === "excel" ? "xlsx" : "pdf";
    setExporting(format);

    try {
      await authDownload(
        `/api/reports/export?month=${month}&year=${year}&format=${format}`,
        `fintrack-report-${year}-${String(month).padStart(2, "0")}.${extension}`
      );
      toast.success(`Đã xuất báo cáo ${format === "excel" ? "Excel" : "PDF"}.`);
    } catch (err) {
      toast.error(getErrorMessage(err, "Không thể xuất báo cáo"));
    } finally {
      setExporting(null);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto flex min-h-[420px] max-w-7xl items-center justify-center">
        <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white px-6 py-5 text-sm font-bold text-slate-500 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
          Đang tải báo cáo từ backend...
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto max-w-3xl">
        <div className="rounded-3xl border border-red-100 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-1 h-5 w-5 shrink-0 text-red-600" />
            <div>
              <h1 className="text-lg font-black text-slate-950">Không tải được báo cáo</h1>
              <p className="mt-1 text-sm font-medium text-slate-500">{error}</p>
              <button
                type="button"
                onClick={() => loadReports()}
                className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white transition hover:bg-emerald-700"
              >
                <RefreshCw className="h-4 w-4" />
                Tải lại
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5">
      <div className="flex flex-col gap-4 rounded-[2rem] border border-white/80 bg-white/88 p-5 shadow-xl shadow-teal-950/[0.06] backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h1 className="text-2xl font-black text-slate-950">Báo cáo tài chính</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Tổng hợp, biểu đồ và xuất file từ API reports thật.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            value={monthFilter}
            onChange={(event) => setMonthFilter(event.target.value)}
            className="h-11 rounded-full border border-teal-100 bg-teal-50 px-4 text-sm font-black text-teal-800 outline-none transition focus:border-teal-400 focus:ring-4 focus:ring-teal-500/10"
          >
            {availableMonths.map((month) => (
              <option key={month} value={month}>
                {formatMonthLabel(month)}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => handleExport("pdf")}
            disabled={Boolean(exporting)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-4 text-sm font-black text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-60"
          >
            {exporting === "pdf" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            PDF
          </button>
          <button
            type="button"
            onClick={() => handleExport("excel")}
            disabled={Boolean(exporting)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 px-4 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5 disabled:opacity-60"
          >
            {exporting === "excel" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
            Excel
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Thu nhập"
          value={formatCurrencyVND(summary.totalIncome)}
          helper={formatMonthLabel(monthFilter)}
          icon={TrendingUp}
          tone="from-emerald-500 to-teal-500"
        />
        <MetricCard
          label="Chi tiêu"
          value={formatCurrencyVND(summary.totalExpense)}
          helper="Chỉ tính giao dịch đã phân loại"
          icon={TrendingDown}
          tone="from-rose-500 to-orange-500"
        />
        <MetricCard
          label="Tỷ lệ tiết kiệm"
          value={`${summary.savingsRate}%`}
          helper={`Tiết kiệm ${formatCurrencyVND(summary.savings)}`}
          icon={PieChart}
          tone="from-indigo-500 to-sky-500"
        />
        <MetricCard
          label="Nhóm chi tiêu"
          value={String(categoryBreakdown.length)}
          helper="Top danh mục trong kỳ"
          icon={BarChart2}
          tone="from-amber-400 to-orange-500"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-[2rem] border border-white/80 bg-white/88 p-5 shadow-xl shadow-teal-950/[0.06] backdrop-blur sm:p-6">
          <div className="flex items-center justify-between gap-4 border-b border-teal-100 pb-5">
            <div>
              <h2 className="text-2xl font-black text-slate-950">Thu chi 6 tháng</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Dữ liệu từ `/api/reports/chart`.
              </p>
            </div>
          </div>

          <div className="mt-6 flex h-72 items-end gap-4 overflow-x-auto rounded-3xl border border-teal-100 bg-white p-5">
            {chartData.length === 0 ? (
              <div className="flex h-full w-full items-center justify-center text-sm font-bold text-slate-400">
                Chưa có dữ liệu biểu đồ.
              </div>
            ) : (
              chartData.map((point) => {
                const incomeHeight = Math.max(4, (toNumber(point.income) / maxChartValue) * 100);
                const expenseHeight = Math.max(4, (toNumber(point.expense) / maxChartValue) * 100);

                return (
                  <div key={`${point.year}-${point.month}`} className="flex h-full min-w-[88px] flex-1 flex-col justify-end gap-3">
                    <div className="flex flex-1 items-end justify-center gap-2">
                      <div className="flex h-full w-7 items-end rounded-full bg-emerald-50">
                        <div
                          className="w-full rounded-full bg-emerald-500"
                          style={{ height: `${incomeHeight}%` }}
                          title={`Thu: ${formatCurrencyVND(point.income)}`}
                        />
                      </div>
                      <div className="flex h-full w-7 items-end rounded-full bg-rose-50">
                        <div
                          className="w-full rounded-full bg-rose-500"
                          style={{ height: `${expenseHeight}%` }}
                          title={`Chi: ${formatCurrencyVND(point.expense)}`}
                        />
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-black text-slate-700">
                        T{point.month}/{String(point.year).slice(-2)}
                      </p>
                      <p className="mt-1 text-[10px] font-bold text-emerald-600">
                        {compactCurrency(toNumber(point.income))}
                      </p>
                      <p className="text-[10px] font-bold text-rose-600">
                        {compactCurrency(toNumber(point.expense))}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-4 flex items-center gap-4 text-xs font-bold text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-4 rounded-full bg-emerald-500" />
              Thu nhập
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-4 rounded-full bg-rose-500" />
              Chi tiêu
            </span>
          </div>
        </section>

        <aside className="rounded-[2rem] border border-white/80 bg-white/88 p-6 shadow-xl shadow-teal-950/[0.06] backdrop-blur">
          <h2 className="text-2xl font-black text-slate-950">Cơ cấu chi tiêu</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Nhóm danh mục chi nhiều nhất trong {formatMonthLabel(monthFilter)}.
          </p>

          <div className="mt-6 space-y-4">
            {categoryBreakdown.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm font-semibold text-slate-500">
                Chưa có giao dịch chi tiêu đã phân loại trong kỳ này.
              </div>
            ) : (
              categoryBreakdown.map((item) => {
                const total = toNumber(item.total);
                const percent = totalBreakdown > 0 ? Math.round((total / totalBreakdown) * 100) : 0;

                return (
                  <div
                    key={item.categoryId || item.name}
                    className="rounded-[1.5rem] border border-teal-100 bg-slate-50/80 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-slate-950">
                          {item.icon ? `${item.icon} ` : ""}
                          {item.name}
                        </p>
                        <p className="mt-1 text-xs font-medium text-slate-500">
                          {formatCurrencyVND(total)}
                        </p>
                      </div>
                      <p className="text-sm font-black text-teal-700">{percent}%</p>
                    </div>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
                      <div
                        className="h-full rounded-full bg-teal-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
