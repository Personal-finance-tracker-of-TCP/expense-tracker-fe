"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  BarChart2,
  Download,
  FileSpreadsheet,
  PieChart,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";

import { WorkspaceMockup } from "@/components/layout/WorkspaceMockup";
import { formatCurrencyVND } from "@/lib/finance";
import {
  authDownload,
  authFetch,
  getCurrentDemoPeriod,
} from "@/lib/moneytrack-api";

type Summary = {
  totalIncome?: number;
  totalExpense?: number;
  savings?: number;
  savingsRate?: number;
};

type ChartResponse = {
  chartData?: Array<Record<string, unknown>>;
  categoryBreakdown?: Array<Record<string, unknown>>;
};

const { month: DEFAULT_MONTH, year: DEFAULT_YEAR } = getCurrentDemoPeriod();

function toNumber(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function pickText(item: Record<string, unknown>) {
  return String(
    item.name ??
      item.categoryName ??
      item.category ??
      item.label ??
      item.type ??
      "Danh mục"
  );
}

function pickAmount(item: Record<string, unknown>) {
  return toNumber(
    item.amount ?? item.totalAmount ?? item.totalExpense ?? item.value ?? 0
  );
}

export default function ReportsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [chart, setChart] = useState<ChartResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<"pdf" | "excel">("pdf");

  useEffect(() => {
    let ignore = false;

    async function loadReports() {
      setLoading(true);
      setError(null);
      try {
        const [summaryData, chartData] = await Promise.all([
          authFetch<Summary>(
            `/api/reports/summary?month=${DEFAULT_MONTH}&year=${DEFAULT_YEAR}`
          ),
          authFetch<ChartResponse>(
            `/api/reports/chart?month=${DEFAULT_MONTH}&year=${DEFAULT_YEAR}`
          ),
        ]);

        if (ignore) return;
        setSummary(summaryData);
        setChart(chartData);
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Không thể tải báo cáo");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void loadReports();

    return () => {
      ignore = true;
    };
  }, []);

  function yearMonthSlug() {
    return `${DEFAULT_YEAR}-${String(DEFAULT_MONTH).padStart(2, "0")}`;
  }

  async function handleExport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsExportModalOpen(false);
    setExporting(true);
    setError(null);
    try {
      const ext = exportFormat === "excel" ? "xlsx" : "pdf";
      await authDownload(
        `/api/reports/export?format=${exportFormat}&month=${DEFAULT_MONTH}&year=${DEFAULT_YEAR}`,
        `bao-cao-${yearMonthSlug()}.${ext}`
      );
      setNotice(`Đã tải file báo cáo ${exportFormat.toUpperCase()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể xuất báo cáo");
    } finally {
      setExporting(false);
    }
  }

  const categoryBreakdown = useMemo(
    () => chart?.categoryBreakdown || [],
    [chart]
  );
  const totalCategoryAmount = categoryBreakdown.reduce(
    (sum, item) => sum + pickAmount(item),
    0
  );

  return (
    <>
      <WorkspaceMockup
        actionLabel={exporting ? "Đang xuất" : "Xuất báo cáo"}
        accent="from-indigo-500 to-sky-500"
        filters={[`Tháng ${DEFAULT_MONTH}/${DEFAULT_YEAR}`, "Theo danh mục", "PDF/Excel"]}
        metrics={[
          {
            label: "Thu nhập",
            value: formatCurrencyVND(toNumber(summary?.totalIncome)),
            helper: "Tổng thu trong kỳ",
            icon: TrendingUp,
            tone: "from-emerald-500 to-teal-500",
          },
          {
            label: "Chi tiêu",
            value: formatCurrencyVND(toNumber(summary?.totalExpense)),
            helper: "Tổng chi trong kỳ",
            icon: TrendingDown,
            tone: "from-rose-500 to-orange-500",
          },
          {
            label: "Tỷ lệ tiết kiệm",
            value: `${toNumber(summary?.savingsRate).toFixed(1)}%`,
            helper: formatCurrencyVND(toNumber(summary?.savings)),
            icon: PieChart,
            tone: "from-indigo-500 to-sky-500",
          },
          {
            label: "Tệp xuất",
            value: exporting ? "..." : "PDF/XLSX",
            helper: "Tải báo cáo về máy",
            icon: Download,
            tone: "from-amber-400 to-orange-500",
          },
        ]}
        tableTitle="Lịch sử báo cáo"
        tableColumns={["Tên báo cáo", "Chu kỳ", "Định dạng", "Ngày tạo"]}
        tableRows={[]}
        sideTitle="Cơ cấu chi tiêu"
        sideDescription="Tỷ trọng danh mục trong kỳ hiện tại."
        sideItems={
          categoryBreakdown.length > 0
            ? categoryBreakdown.slice(0, 5).map((item) => {
                const amount = pickAmount(item);
                const percent =
                  totalCategoryAmount > 0
                    ? Math.round((amount / totalCategoryAmount) * 100)
                    : 0;
                return {
                  label: pickText(item),
                  value: `${percent}%`,
                  helper: formatCurrencyVND(amount),
                  progress: percent,
                  tone: "bg-teal-500",
                };
              })
            : [
                {
                  label: "Chưa có dữ liệu",
                  value: "0%",
                  helper: loading
                    ? "Đang tải biểu đồ"
                    : "Chưa có chi tiêu theo danh mục",
                  progress: 0,
                  tone: "bg-teal-500",
                },
              ]
        }
        bottomCards={[
          {
            title: "Biểu đồ cột",
            description: "So sánh thu chi theo thời gian.",
            value: `${chart?.chartData?.length || 0} mốc`,
            icon: BarChart2,
          },
          {
            title: "Biểu đồ vòng",
            description: "Cơ cấu danh mục chi tiêu.",
            value: `${categoryBreakdown.length} nhóm`,
            icon: PieChart,
          },
          {
            title: "Tệp xuất",
            description: "Tải file báo cáo PDF hoặc Excel về máy.",
            value: "PDF/XLSX",
            icon: FileSpreadsheet,
          },
        ]}
        onAction={() => setIsExportModalOpen(true)}
        actionDisabled={loading}
        actionLoading={exporting}
        searchPlaceholder="Tìm báo cáo..."
        emptyMessage="Chưa có lịch sử báo cáo. Bạn có thể xuất báo cáo PDF/Excel để tải về."
      >
        {error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error}
          </div>
        ) : null}
        {notice ? (
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
            {notice}
          </div>
        ) : null}
      </WorkspaceMockup>

      {isExportModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm">
          <form
            onSubmit={handleExport}
            className="w-full max-w-sm rounded-[2rem] border border-white/80 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between gap-4 border-b border-teal-100 pb-4 dark:border-slate-700">
              <h2 className="text-xl font-black text-slate-950 dark:text-white">
                Xuất báo cáo
              </h2>
              <button
                type="button"
                className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                onClick={() => setIsExportModalOpen(false)}
                aria-label="Đóng"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-5 grid gap-4">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-200">
                Chọn định dạng
              </label>
              <div className="grid grid-cols-2 gap-2 rounded-full border border-teal-100 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-950">
                {(["pdf", "excel"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setExportFormat(type)}
                    className={`h-10 rounded-full text-sm font-black transition ${
                      exportFormat === type
                        ? "bg-white text-teal-800 shadow-sm dark:bg-slate-800 dark:text-teal-200"
                        : "text-slate-500 dark:text-slate-300"
                    }`}
                  >
                    {type === "pdf" ? "PDF" : "Excel"}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="h-11 rounded-full border border-teal-100 px-5 text-sm font-black text-slate-600 hover:bg-teal-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 px-5 text-sm font-black text-white shadow-lg"
              >
                Tải xuống
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
