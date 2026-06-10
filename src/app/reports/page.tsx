"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  FileSpreadsheet,
  FileText,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Percent,
  BarChart2,
  AlertTriangle,
  X,
  Download,
} from "lucide-react";

import { formatCurrencyVND, getPercentWidth } from "@/lib/finance";
import {
  authDownload,
  authFetch,
  getCurrentDemoPeriod,
} from "@/lib/moneytrack-api";

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── Constants ───────────────────────────────────────────────────────────────

const { month: DEFAULT_MONTH, year: DEFAULT_YEAR } = getCurrentDemoPeriod();

const MONTH_NAMES = [
  "", "Th1", "Th2", "Th3", "Th4", "Th5", "Th6",
  "Th7", "Th8", "Th9", "Th10", "Th11", "Th12",
];

const CATEGORY_COLORS = [
  "#10B981", "#3B82F6", "#EF4444", "#F97316",
  "#F59E0B", "#8B5CF6", "#06B6D4", "#64748B",
];

function reportFilename(format: "excel" | "pdf", month: number, year: number) {
  return `moneytrack-report-${year}-${String(month).padStart(2, "0")}.${
    format === "excel" ? "xlsx" : "pdf"
  }`;
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CustomBarTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-xl text-xs">
      <p className="font-bold text-slate-700 mb-2">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 mb-1">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-slate-500 font-medium">{entry.name}:</span>
          <span className="font-bold text-slate-800">{formatCurrencyVND(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [month, setMonth] = useState(DEFAULT_MONTH);
  const [year, setYear] = useState(DEFAULT_YEAR);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<"excel" | "pdf" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // ─── Data loading ─────────────────────────────────────────────────────────

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
      setError(err instanceof Error ? err.message : "Không thể tải dữ liệu báo cáo");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReportData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month, year]);

  // ─── Month navigator ──────────────────────────────────────────────────────

  const handlePrevMonth = () => {
    setMonth((m) => {
      if (m === 1) { setYear((y) => y - 1); return 12; }
      return m - 1;
    });
  };

  const handleNextMonth = () => {
    setMonth((m) => {
      if (m === 12) { setYear((y) => y + 1); return 1; }
      return m + 1;
    });
  };

  // ─── Export ───────────────────────────────────────────────────────────────

  async function handleExport(format: "excel" | "pdf") {
    setDownloading(format);
    setError(null);
    try {
      await authDownload(
        `/api/reports/export?format=${format}&month=${month}&year=${year}`,
        reportFilename(format, month, year)
      );
      setExportNotice(`Xuất báo cáo ${format === "excel" ? "Excel" : "PDF"} thành công.`);
      setTimeout(() => setExportNotice(null), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể xuất báo cáo");
    } finally {
      setDownloading(null);
    }
  }

  // ─── Derived data ─────────────────────────────────────────────────────────

  const barChartPoints = useMemo(() => {
    return (chartData?.chartData || []).map((p) => ({
      label: `${MONTH_NAMES[p.month]}/${p.year}`,
      "Thu nhập": p.income,
      "Chi tiêu": p.expense,
    }));
  }, [chartData]);

  const categoryBreakdown = chartData?.categoryBreakdown || [];
  const totalExpenseBreakdown = categoryBreakdown.reduce((s, c) => s + c.total, 0);

  const pieData = categoryBreakdown.map((c, i) => ({
    name: c.name,
    value: c.total,
    fill: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }));

  const isPositive = (summary?.savings ?? 0) >= 0;

  // ─── Skeleton ─────────────────────────────────────────────────────────────

  const SkeletonCard = () => (
    <div className="h-32 animate-pulse rounded-3xl bg-slate-200/60 border border-slate-100" />
  );

  const SkeletonChart = () => (
    <div className="h-64 animate-pulse rounded-3xl bg-slate-200/60 border border-slate-100" />
  );

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <main className="mx-auto max-w-7xl flex flex-col gap-6 px-1 py-3 sm:px-2">
      
      {/* ── Header ── */}
      <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-transparent px-2">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
            Phân tích tài chính
          </span>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight mt-1">
            Báo cáo
          </h1>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            Phân tích thu nhập, chi tiêu và xuất báo cáo tài chính
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {/* Month Navigator */}
          <div className="flex items-center gap-1.5 rounded-2xl bg-white border border-slate-200/80 px-2 py-1 shadow-sm">
            <button
              onClick={handlePrevMonth}
              type="button"
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
            >
              <ChevronLeft className="h-4.5 w-4.5" />
            </button>
            <span className="text-xs font-bold text-slate-700 min-w-[105px] text-center select-none">
              Tháng {month}, {year}
            </span>
            <button
              onClick={handleNextMonth}
              type="button"
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
            >
              <ChevronRight className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Refresh */}
          <button
            onClick={loadReportData}
            type="button"
            className="h-10 w-10 shrink-0 flex items-center justify-center rounded-full border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-500 transition-colors"
            aria-label="Làm mới báo cáo"
          >
            <RefreshCcw className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* ── Notifications ── */}
      {error && (
        <div className="mx-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 shadow-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
            {error}
          </span>
          <button onClick={() => setError(null)} className="text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {exportNotice && (
        <div className="mx-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-700 shadow-sm flex items-center justify-between">
          <span>{exportNotice}</span>
          <button onClick={() => setExportNotice(null)} className="text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Summary Cards ── */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 px-2">
        {/* Total Income */}
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 shadow-inner">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tổng thu</p>
            {loading ? (
              <div className="mt-1.5 h-6 w-24 rounded-lg bg-slate-200 animate-pulse" />
            ) : (
              <p className="text-lg font-extrabold text-emerald-600 truncate mt-0.5">
                {formatCurrencyVND(summary?.totalIncome ?? 0)}
              </p>
            )}
          </div>
        </div>

        {/* Total Expense */}
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 shadow-inner">
            <TrendingDown className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tổng chi</p>
            {loading ? (
              <div className="mt-1.5 h-6 w-24 rounded-lg bg-slate-200 animate-pulse" />
            ) : (
              <p className="text-lg font-extrabold text-rose-600 truncate mt-0.5">
                {formatCurrencyVND(summary?.totalExpense ?? 0)}
              </p>
            )}
          </div>
        </div>

        {/* Savings */}
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm flex items-center gap-4">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-inner ${isPositive ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"}`}>
            <PiggyBank className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tiết kiệm</p>
            {loading ? (
              <div className="mt-1.5 h-6 w-24 rounded-lg bg-slate-200 animate-pulse" />
            ) : (
              <p className={`text-lg font-extrabold truncate mt-0.5 ${isPositive ? "text-blue-600" : "text-amber-600"}`}>
                {formatCurrencyVND(summary?.savings ?? 0)}
              </p>
            )}
          </div>
        </div>

        {/* Savings Rate */}
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 shadow-inner">
            <Percent className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tỷ lệ TK</p>
            {loading ? (
              <div className="mt-1.5 h-6 w-16 rounded-lg bg-slate-200 animate-pulse" />
            ) : (
              <p className={`text-lg font-extrabold truncate mt-0.5 ${(summary?.savingsRate ?? 0) >= 0 ? "text-violet-600" : "text-rose-600"}`}>
                {(summary?.savingsRate ?? 0).toFixed(1)}%
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── Main Grid: Chart + Right Column ── */}
      <section className="px-2 grid gap-6 xl:grid-cols-[1fr_340px]">
        
        {/* Left: Bar + Area Chart */}
        <div className="flex flex-col gap-6">
          
          {/* Income vs Expense Bar Chart */}
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-extrabold text-slate-800">Thu nhập vs Chi tiêu</h2>
                <p className="text-xs text-slate-400 mt-0.5">6 tháng gần nhất</p>
              </div>
              <BarChart2 className="h-4.5 w-4.5 text-slate-400" />
            </div>

            {loading ? (
              <SkeletonChart />
            ) : barChartPoints.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BarChart2 className="h-8 w-8 text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-500">Chưa có dữ liệu giao dịch</p>
                <p className="text-xs text-slate-400 mt-1">Dữ liệu sẽ xuất hiện khi có giao dịch trong kỳ</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={barChartPoints} barGap={4} barCategoryGap="28%">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fontWeight: 600, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`}
                    tick={{ fontSize: 10, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                  />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: "11px", fontWeight: 600 }}
                  />
                  <Bar dataKey="Thu nhập" fill="#10B981" radius={[6, 6, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="Chi tiêu" fill="#F43F5E" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Expense Category Donut Chart */}
          {!loading && categoryBreakdown.length > 0 && (
            <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="mb-5">
                <h2 className="text-sm font-extrabold text-slate-800">Phân bổ chi tiêu</h2>
                <p className="text-xs text-slate-400 mt-0.5">Theo danh mục trong tháng {month}/{year}</p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatCurrencyVND(Number(value ?? 0))}
                      contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "11px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="flex-1 space-y-2.5 w-full">
                  {categoryBreakdown.map((cat, i) => {
                    const pct = totalExpenseBreakdown > 0
                      ? Math.round((cat.total / totalExpenseBreakdown) * 100)
                      : 0;
                    const clr = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
                    return (
                      <div key={cat.categoryId || cat.name} className="flex items-center gap-3">
                        <span className="text-base w-6 shrink-0 text-center">
                          {cat.icon || "📦"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1 gap-2">
                            <span className="text-xs font-bold text-slate-700 truncate">{cat.name}</span>
                            <span className="text-xs font-extrabold text-slate-500 shrink-0">{pct}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: getPercentWidth(pct), backgroundColor: clr }}
                            />
                          </div>
                        </div>
                        <span className="text-xs font-bold text-rose-600 shrink-0 min-w-[70px] text-right">
                          {formatCurrencyVND(cat.total)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">

          {/* Top Expense Categories */}
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <h2 className="text-sm font-extrabold text-slate-800">Danh mục chi nhiều nhất</h2>
              <p className="text-xs text-slate-400 mt-0.5">Theo kỳ đang chọn</p>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-10 animate-pulse rounded-xl bg-slate-200/60" />
                ))}
              </div>
            ) : categoryBreakdown.length === 0 ? (
              <div className="flex flex-col items-center text-center py-8">
                <span className="text-3xl mb-2">🗂️</span>
                <p className="text-xs font-semibold text-slate-600">Chưa có dữ liệu chi tiêu</p>
                <p className="text-xs text-slate-400 mt-0.5">trong kỳ tháng {month}/{year}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {categoryBreakdown.map((cat, i) => {
                  const topTotal = categoryBreakdown[0]?.total || 1;
                  const pct = Math.round((cat.total / topTotal) * 100);
                  const clr = CATEGORY_COLORS[i % CATEGORY_COLORS.length];

                  return (
                    <div key={cat.categoryId || cat.name} className="group">
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <span className="text-base w-6 shrink-0 text-center">
                          {cat.icon || "📦"}
                        </span>
                        <span className="flex-1 text-xs font-bold text-slate-700 truncate">
                          {cat.name}
                        </span>
                        <span className="text-xs font-extrabold text-rose-600 shrink-0">
                          {formatCurrencyVND(cat.total)}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden ml-8">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: getPercentWidth(pct), backgroundColor: clr }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Export Report */}
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <h2 className="text-sm font-extrabold text-slate-800">Xuất báo cáo</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Tải báo cáo tài chính tháng {month}/{year}
              </p>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => handleExport("excel")}
                disabled={downloading !== null}
                className="w-full inline-flex items-center justify-center gap-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-sm shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <FileSpreadsheet className="h-4 w-4" />
                {downloading === "excel" ? "Đang xuất..." : "Xuất Excel (.xlsx)"}
              </button>

              <button
                type="button"
                onClick={() => handleExport("pdf")}
                disabled={downloading !== null}
                className="w-full inline-flex items-center justify-center gap-2.5 rounded-2xl bg-slate-800 hover:bg-slate-900 px-4 py-3 text-sm font-bold text-white shadow-sm transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <FileText className="h-4 w-4" />
                {downloading === "pdf" ? "Đang xuất..." : "Xuất PDF"}
              </button>
            </div>

            <p className="mt-3 text-[10px] text-slate-400 text-center leading-relaxed">
              File sẽ được tải xuống tự động sau khi chuẩn bị xong.
              <br />
              Chỉ xuất được khi tháng có giao dịch.
            </p>
          </div>

          {/* Period Summary Card */}
          {!loading && summary && (
            <div className="rounded-3xl border border-slate-100 bg-gradient-to-br from-slate-800 to-slate-900 p-5 shadow-sm text-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Kỳ báo cáo
                  </p>
                  <p className="text-sm font-extrabold mt-0.5">Tháng {month}/{year}</p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${isPositive ? "bg-emerald-500/20" : "bg-rose-500/20"}`}>
                  {isPositive
                    ? <TrendingUp className="h-5 w-5 text-emerald-400" />
                    : <TrendingDown className="h-5 w-5 text-rose-400" />
                  }
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white/5 p-3">
                  <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Thu</p>
                  <p className="text-xs font-extrabold text-emerald-400 mt-1 truncate">
                    {formatCurrencyVND(summary.totalIncome)}
                  </p>
                </div>
                <div className="rounded-xl bg-white/5 p-3">
                  <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Chi</p>
                  <p className="text-xs font-extrabold text-rose-400 mt-1 truncate">
                    {formatCurrencyVND(summary.totalExpense)}
                  </p>
                </div>
                <div className="rounded-xl bg-white/5 p-3 col-span-2">
                  <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Tiết kiệm</p>
                  <p className={`text-sm font-extrabold mt-1 ${isPositive ? "text-emerald-300" : "text-amber-300"}`}>
                    {formatCurrencyVND(summary.savings)}{" "}
                    <span className="text-[10px] font-bold opacity-70">
                      ({summary.savingsRate.toFixed(1)}%)
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
