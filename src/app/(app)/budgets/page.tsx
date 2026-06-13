"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Plus,
  WalletCards,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Pencil,
  Trash2,
  X,
  Info,
  Calendar,
} from "lucide-react";

import {
  formatCurrencyVND,
  getPercentWidth,
} from "@/lib/finance";
import { authFetch, getCurrentDemoPeriod } from "@/lib/moneytrack-api";

type Category = {
  id: string;
  name: string;
  icon?: string | null;
  color?: string | null;
  type?: "INCOME" | "EXPENSE" | "BOTH";
};

type Budget = {
  id: string;
  categoryId: string;
  category?: Category | null;
  limitAmount: number | string;
  spentAmount: number | string;
  remainingAmount: number | string;
  percentUsed: number | string;
  status: "SAFE" | "WARNING" | "EXCEEDED";
  period: "MONTHLY" | "TOTAL";
  month?: number | null;
  year: number;
};

// Transactions are NOT fetched on this page.
// Budget.spentAmount is computed server-side by attachBudgetComputedFields.
// We use that value directly for the preview card.

const { month: DEFAULT_MONTH, year: DEFAULT_YEAR } = getCurrentDemoPeriod();

type PeriodTab = "THIS" | "OTHER" | "TOTAL";

const FALLBACK_ICON: Record<string, string> = {
  EXPENSE: "🧾",
  BOTH: "📦",
};

const FALLBACK_COLOR: Record<string, string> = {
  EXPENSE: "#EF4444",
  BOTH: "#8B5CF6",
};

function formatMonthPickerValue(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

async function fetchBudgetPageData() {
  const [budgetData, categoryData] = await Promise.all([
    authFetch<Budget[]>("/api/budgets"),
    authFetch<Category[]>("/api/categories"),
  ]);

  return {
    budgetData: budgetData || [],
    categoryData: categoryData || [],
  };
}

function getFirstExpenseCategoryId(categories: Category[]) {
  return categories.find(
    (category) => category.type === "EXPENSE" || category.type === "BOTH"
  )?.id;
}

export default function BudgetsPage() {
  const [month, setMonth] = useState(DEFAULT_MONTH);
  const [year, setYear] = useState(DEFAULT_YEAR);
  
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  // Note: transactions are NOT stored here; we derive preview spent from existing budgets.
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Filter tab state: "ALL" | "SAFE" | "WARNING" | "EXCEEDED"
  const [activeFilter, setActiveFilter] = useState<"ALL" | "SAFE" | "WARNING" | "EXCEEDED">("ALL");

  // Modal form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editBudget, setEditBudget] = useState<Budget | null>(null);
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formLimitAmount, setFormLimitAmount] = useState("1000000");
  const [formPeriod, setFormPeriod] = useState<"MONTHLY" | "TOTAL">("MONTHLY");
  const [formMonth, setFormMonth] = useState(DEFAULT_MONTH);
  const [formYear, setFormYear] = useState(DEFAULT_YEAR);
  const [formMonthPicker, setFormMonthPicker] = useState(
    formatMonthPickerValue(DEFAULT_YEAR, DEFAULT_MONTH)
  );
  const [submitting, setSubmitting] = useState(false);

  // Month selector inside Month period
  const [periodTab, setPeriodTab] = useState<PeriodTab>("THIS");

  // Delete modal state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Budget | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Restrict categories to EXPENSE or BOTH
  const expenseCategories = useMemo(
    () =>
      categories.filter(
        (category) => category.type === "EXPENSE" || category.type === "BOTH"
      ),
    [categories]
  );

  // Load budgets & categories independently.
  // IMPORTANT: Do NOT bundle transactions in the same Promise.all.
  // Reason: /api/transactions enforces limit <= 100; limit=1000 triggers a 400
  // which throws in authFetch and makes the whole Promise.all reject,
  // leaving setBudgets never called and the page appearing empty.
  // Budget.spentAmount is already computed server-side by attachBudgetComputedFields.
  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const { budgetData, categoryData } = await fetchBudgetPageData();

      setBudgets(budgetData);
      setCategories(categoryData);

      const firstExpenseCategoryId = getFirstExpenseCategoryId(categoryData);
      if (firstExpenseCategoryId) {
        setFormCategoryId((curr) => curr || firstExpenseCategoryId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải dữ liệu ngân sách");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let ignore = false;

    async function loadSelectedPeriod() {
      try {
        const { budgetData, categoryData } = await fetchBudgetPageData();
        if (ignore) return;

        setBudgets(budgetData);
        setCategories(categoryData);

        const firstExpenseCategoryId = getFirstExpenseCategoryId(categoryData);
        if (firstExpenseCategoryId) {
          setFormCategoryId((curr) => curr || firstExpenseCategoryId);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Không thể tải dữ liệu ngân sách");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    void loadSelectedPeriod();

    return () => {
      ignore = true;
    };
  }, [month, year]);

  // Notice auto-dismiss
  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => setNotice(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notice]);

  // Handle month navigator clicks
  const handlePrevMonth = () => {
    setLoading(true);
    setError(null);
    setMonth((m) => {
      if (m === 1) {
        setYear((y) => y - 1);
        return 12;
      }
      return m - 1;
    });
  };

  const handleNextMonth = () => {
    setLoading(true);
    setError(null);
    setMonth((m) => {
      if (m === 12) {
        setYear((y) => y + 1);
        return 1;
      }
      return m + 1;
    });
  };

  // Filtered visible budgets for the current selected page month & year
  const visibleBudgets = useMemo(() => {
    return budgets.filter((budget) => {
      // 1. Period matching:
      // Show budgets of this selected month, OR show TOTAL budgets active in this year
      if (budget.period === "MONTHLY") {
        if (Number(budget.month) !== Number(month) || Number(budget.year) !== Number(year)) {
          return false;
        }
      } else {
        if (Number(budget.year) !== Number(year)) return false;
      }

      // 2. Status filtering:
      if (activeFilter !== "ALL" && budget.status !== activeFilter) {
        return false;
      }

      return true;
    });
  }, [budgets, month, year, activeFilter]);

  // Page level statistics cards computed from visible budgets
  const stats = useMemo(() => {
    const totalLimit = visibleBudgets.reduce((sum, b) => sum + Number(b.limitAmount || 0), 0);
    const totalSpent = visibleBudgets.reduce((sum, b) => sum + Number(b.spentAmount || 0), 0);
    const warningCount = visibleBudgets.filter(b => b.status !== "SAFE").length;
    return { totalLimit, totalSpent, warningCount };
  }, [visibleBudgets]);

  const applyPeriodTab = (tab: PeriodTab, pickerValue = formMonthPicker) => {
    setPeriodTab(tab);

    if (tab === "THIS") {
      setFormPeriod("MONTHLY");
      setFormMonth(month);
      setFormYear(year);
      setFormMonthPicker(formatMonthPickerValue(year, month));
      return;
    }

    if (tab === "TOTAL") {
      setFormPeriod("TOTAL");
      setFormMonth(month);
      setFormYear(year);
      return;
    }

    setFormPeriod("MONTHLY");
    const [yStr, mStr] = pickerValue.split("-");
    if (yStr && mStr) {
      setFormMonth(Number(mStr));
      setFormYear(Number(yStr));
    }
  };

  // Sync date picker back
  const handleMonthPickerChange = (val: string) => {
    setFormMonthPicker(val);
    const [yStr, mStr] = val.split("-");
    if (yStr && mStr) {
      setFormMonth(Number(mStr));
      setFormYear(Number(yStr));
    }
  };

  // Dynamic duplicate warning check
  const isDuplicate = useMemo(() => {
    if (!formCategoryId) return false;
    return budgets.some((b) => {
      if (editBudget && b.id === editBudget.id) return false;
      const sameCat = b.categoryId === formCategoryId;
      const samePeriod = b.period === formPeriod;
      const sameYear = Number(b.year) === Number(formYear);

      if (formPeriod === "MONTHLY") {
        const sameMonth = Number(b.month) === Number(formMonth);
        return sameCat && samePeriod && sameMonth && sameYear;
      } else {
        return sameCat && samePeriod && sameYear;
      }
    });
  }, [budgets, editBudget, formCategoryId, formPeriod, formMonth, formYear]);

  // Derive preview spent from the server-computed spentAmount on the existing budget
  // for the selected category + period + month + year combination.
  // If no matching budget exists yet (new budget creation), default to 0.
  const computedPreviewSpent = useMemo(() => {
    if (!formCategoryId) return 0;
    const matchingBudget = budgets.find((b) => {
      if (b.categoryId !== formCategoryId) return false;
      if (b.period !== formPeriod) return false;
      if (Number(b.year) !== Number(formYear)) return false;
      if (formPeriod === "MONTHLY" && Number(b.month) !== Number(formMonth)) return false;
      return true;
    });
    return matchingBudget ? Number(matchingBudget.spentAmount || 0) : 0;
  }, [budgets, formCategoryId, formPeriod, formMonth, formYear]);

  const previewLimit = Number(formLimitAmount) || 0;
  const previewRemaining = previewLimit - computedPreviewSpent;
  const previewPercent = previewLimit > 0 ? (computedPreviewSpent / previewLimit) * 100 : 0;
  
  const previewStatus = useMemo(() => {
    if (previewPercent >= 100) return "EXCEEDED";
    if (previewPercent >= 80) return "WARNING";
    return "SAFE";
  }, [previewPercent]);

  // Open Add Budget Form Modal
  const handleOpenAdd = () => {
    setEditBudget(null);
    applyPeriodTab("THIS");
    setFormLimitAmount("1000000");
    const expenseCats = categories.filter(c => c.type === "EXPENSE" || c.type === "BOTH");
    if (expenseCats.length > 0) {
      setFormCategoryId(expenseCats[0].id);
    }
    setIsFormOpen(true);
  };

  // Open Edit Budget Form Modal
  const handleOpenEdit = (budget: Budget) => {
    setEditBudget(budget);
    setFormCategoryId(budget.categoryId);
    setFormLimitAmount(String(budget.limitAmount));
    
    if (budget.period === "TOTAL") {
      setPeriodTab("TOTAL");
      setFormPeriod("TOTAL");
      setFormMonth(month);
    } else {
      if (Number(budget.month) === Number(month) && Number(budget.year) === Number(year)) {
        setPeriodTab("THIS");
      } else {
        setPeriodTab("OTHER");
        setFormMonthPicker(formatMonthPickerValue(budget.year, budget.month || month));
      }
      setFormPeriod("MONTHLY");
      setFormMonth(budget.month || month);
    }
    setFormYear(budget.year);
    setIsFormOpen(true);
  };

  // Open Delete Dialog Confirm
  const handleOpenDelete = (budget: Budget) => {
    setDeleteTarget(budget);
    setIsDeleteOpen(true);
  };

  // Submit Form (Create / Edit)
  const handleSubmitForm = async (e: FormEvent) => {
    e.preventDefault();
    if (previewLimit <= 0 || !formCategoryId || isDuplicate) return;
    setSubmitting(true);
    setError(null);

    const payload = {
      categoryId: formCategoryId,
      limitAmount: previewLimit,
      period: formPeriod,
      month: formPeriod === "MONTHLY" ? formMonth : null,
      year: formYear,
    };

    try {
      if (editBudget) {
        await authFetch(`/api/budgets/${editBudget.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setNotice("Cập nhật hạn mức ngân sách thành công.");
      } else {
        await authFetch("/api/budgets", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setNotice("Tạo hạn mức ngân sách mới thành công.");
      }
      setIsFormOpen(false);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi khi lưu thông tin ngân sách");
    } finally {
      setSubmitting(false);
    }
  };

  // Confirm delete action
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setError(null);
    try {
      await authFetch(`/api/budgets/${deleteTarget.id}`, {
        method: "DELETE",
      });
      setNotice("Xóa hạn mức ngân sách thành công.");
      setIsDeleteOpen(false);
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi khi xóa ngân sách");
    } finally {
      setDeleting(false);
    }
  };

  // Format helper for text inside inputs
  const handleLimitAmountInput = (valStr: string) => {
    const cleaned = valStr.replace(/\D/g, "");
    setFormLimitAmount(cleaned);
  };

  return (
    <main className="mx-auto max-w-7xl flex flex-col gap-6 px-1 py-3 sm:px-2">
      {/* Top Page Header */}
      <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-transparent px-2">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
            Kế hoạch chi tiêu
          </span>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight mt-1">
            Ngân sách
          </h1>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            Theo dõi hạn mức chi tiêu theo danh mục
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {/* Month Navigator */}
          <div className="flex items-center gap-1.5 rounded-2xl bg-white border border-slate-200/80 px-2 py-1 shadow-sm">
            <button
              onClick={handlePrevMonth}
              type="button"
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
              aria-label="Tháng trước"
            >
              <ChevronLeft className="h-4.5 w-4.5" />
            </button>
            <span className="text-xs font-bold text-slate-700 min-w-[95px] text-center select-none">
              Tháng {month}, {year}
            </span>
            <button
              onClick={handleNextMonth}
              type="button"
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
              aria-label="Tháng sau"
            >
              <ChevronRight className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Add Button */}
          <button
            onClick={handleOpenAdd}
            type="button"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-600 px-5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all duration-150 active:scale-95 shrink-0"
          >
            <Plus className="h-4.5 w-4.5 stroke-[3]" />
            <span>Thêm ngân sách</span>
          </button>
        </div>
      </section>

      {/* Notifications */}
      {error && (
        <div className="mx-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 shadow-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-4.5 w-4.5 text-red-500 shrink-0" />
            {error}
          </span>
          <button onClick={() => setError(null)} className="text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {notice && (
        <div className="mx-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-700 shadow-sm flex items-center justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4 px-2">
        {/* Total limit */}
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 shadow-inner">
            <WalletCards className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Tổng ngân sách
            </p>
            <p className="text-2xl font-extrabold text-slate-800 mt-0.5">
              {loading ? "..." : formatCurrencyVND(stats.totalLimit)}
            </p>
          </div>
        </div>

        {/* Total spent */}
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 shadow-inner">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Tổng đã chi
            </p>
            <p className="text-2xl font-extrabold text-slate-800 mt-0.5">
              {loading ? "..." : formatCurrencyVND(stats.totalSpent)}
            </p>
          </div>
        </div>

        {/* Warning budgets count */}
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 shadow-inner">
            <AlertTriangle className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Cảnh báo
            </p>
            <p className="text-2xl font-extrabold text-slate-800 mt-0.5">
              {loading ? "..." : `${stats.warningCount} ngân sách`}
            </p>
          </div>
        </div>
      </section>

      {/* Filter Tabs */}
      <section className="mx-2">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
          {[
            { id: "ALL", label: "Tất cả" },
            { id: "SAFE", label: "Ổn định" },
            { id: "WARNING", label: "Sắp vượt" },
            { id: "EXCEEDED", label: "Đã vượt" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as typeof activeFilter)}
              type="button"
              className={`px-4 py-2 text-xs font-bold rounded-2xl border transition-all ${
                activeFilter === tab.id
                  ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                  : "bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* Main Budget Grid */}
      <section className="px-2 min-h-[300px]">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-56 rounded-3xl bg-slate-200/60 border border-slate-100" />
            ))}
          </div>
        ) : visibleBudgets.length === 0 ? (
          <div className="flex flex-col items-center text-center p-12 rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 max-w-md mx-auto my-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm border border-slate-100 mb-4">
              <WalletCards className="h-6 w-6 text-emerald-500" />
            </div>
            <h3 className="font-extrabold text-slate-800 text-base">Chưa có ngân sách nào</h3>
            <p className="mt-1.5 text-xs text-slate-400 max-w-[280px] leading-relaxed">
              Thiết lập hạn mức chi tiêu để quản lý tài chính và tránh vung tay quá trán.
            </p>
            <button
              onClick={handleOpenAdd}
              className="mt-5 px-5 py-2.5 rounded-2xl bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-500/10 hover:bg-emerald-600 transition active:scale-95"
            >
              Tạo ngân sách đầu tiên
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {visibleBudgets.map((budget) => {
              const cat = budget.category;
              const typeKey = (cat?.type || "BOTH") as "EXPENSE" | "BOTH";
              const icon = cat?.icon || FALLBACK_ICON[typeKey];
              const color = cat?.color || FALLBACK_COLOR[typeKey];
              
              const statusText =
                budget.status === "EXCEEDED"
                  ? "Đã vượt"
                  : budget.status === "WARNING"
                  ? "Sắp vượt"
                  : "Ổn định";

              const badgeColor =
                budget.status === "EXCEEDED"
                  ? "bg-rose-50 text-rose-700 border-rose-100"
                  : budget.status === "WARNING"
                  ? "bg-amber-50 text-amber-700 border-amber-100"
                  : "bg-emerald-50 text-emerald-700 border-emerald-100";

              const progressColor =
                budget.status === "EXCEEDED"
                  ? "bg-red-500"
                  : budget.status === "WARNING"
                  ? "bg-amber-500"
                  : "bg-emerald-500";

              return (
                <article
                  key={budget.id}
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-150"
                >
                  {/* Top line info */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl shadow-sm"
                        style={{
                          backgroundColor: color + "22",
                          border: `2px solid ${color}44`,
                        }}
                      >
                        {icon}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-extrabold text-slate-800 leading-tight">
                          {cat?.name || "Ngân sách"}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {budget.period === "MONTHLY"
                            ? `Tháng ${budget.month}/${budget.year}`
                            : `Tổng năm ${budget.year}`}
                        </p>
                      </div>
                    </div>

                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${badgeColor}`}>
                      {statusText}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-5 space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 font-medium">Đã dùng</span>
                      <span className="font-bold text-slate-600">
                        {Number(budget.percentUsed).toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100 border border-slate-100">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${progressColor}`}
                        style={{ width: getPercentWidth(budget.percentUsed) }}
                      />
                    </div>
                  </div>

                  {/* Limit counters */}
                  <dl className="mt-5 grid grid-cols-3 gap-1.5 text-center border-t border-slate-50 pt-4">
                    <div>
                      <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Hạn mức
                      </dt>
                      <dd className="mt-1 text-xs font-bold text-slate-700 truncate">
                        {formatCurrencyVND(budget.limitAmount)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Đã chi
                      </dt>
                      <dd className="mt-1 text-xs font-bold text-rose-600 truncate">
                        {formatCurrencyVND(budget.spentAmount)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Còn lại
                      </dt>
                      <dd className="mt-1 text-xs font-bold text-emerald-600 truncate">
                        {formatCurrencyVND(budget.remainingAmount)}
                      </dd>
                    </div>
                  </dl>

                  {/* Actions buttons */}
                  <div className="flex gap-2 pt-3 mt-4 border-t border-slate-100 shrink-0">
                    <button
                      onClick={() => handleOpenEdit(budget)}
                      className="flex-1 flex items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 transition"
                    >
                      <Pencil className="h-3 w-3" />
                      Sửa
                    </button>
                    <button
                      onClick={() => handleOpenDelete(budget)}
                      className="flex-1 flex items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-xs font-bold text-rose-600 bg-rose-50/50 hover:bg-rose-50 transition"
                    >
                      <Trash2 className="h-3 w-3" />
                      Xóa
                    </button>
                  </div>
                </article>
              );
            })}

            {/* Dashed Add Card */}
            <button
              onClick={handleOpenAdd}
              type="button"
              className="flex flex-col items-center justify-center p-6 min-h-[200px] rounded-3xl border-2 border-dashed border-slate-200 bg-white/50 hover:bg-white hover:border-emerald-300 hover:text-emerald-600 text-slate-400 transition-all duration-150 group"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 border border-slate-100 text-slate-400 group-hover:bg-emerald-50 group-hover:border-emerald-100 group-hover:text-emerald-500 transition-all">
                <Plus className="h-5 w-5 stroke-[2.5]" />
              </span>
              <span className="mt-3 text-xs font-extrabold text-slate-500 group-hover:text-emerald-600">
                Thêm ngân sách
              </span>
            </button>
          </div>
        )}
      </section>

      {/* Add / Edit Budget Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 md:p-6">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
            onClick={() => setIsFormOpen(false)}
          />

          {/* Dialog Container */}
          <div className="relative w-full h-full sm:h-auto sm:max-w-xl rounded-none sm:rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[100vh] sm:max-h-[90vh]">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4 flex items-start justify-between shrink-0">
              <div>
                <h2 className="text-base font-bold text-white">
                  {editBudget ? "Sửa ngân sách" : "Thêm ngân sách"}
                </h2>
                <p className="text-xs text-emerald-100 mt-0.5">
                  Đặt hạn mức chi tiêu theo danh mục
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="rounded-lg p-1.5 text-white/80 hover:text-white hover:bg-white/20 transition"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Scrollable body */}
            <form onSubmit={handleSubmitForm} className="flex flex-col min-h-0">
              <div className="overflow-y-auto p-5 flex flex-col gap-5">
                
                {/* Field 1: Category Chips Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Danh mục áp dụng
                  </label>
                  {expenseCategories.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">Chưa có danh mục chi tiêu nào khả dụng.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto pr-1">
                      {expenseCategories.map((cat) => {
                        const typeKey = (cat.type || "BOTH") as "EXPENSE" | "BOTH";
                        const icon = cat.icon || FALLBACK_ICON[typeKey];
                        const color = cat.color || FALLBACK_COLOR[typeKey];
                        const selected = formCategoryId === cat.id;

                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setFormCategoryId(cat.id)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-extrabold transition-all active:scale-95 ${
                              selected
                                ? "ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50 text-emerald-700"
                                : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            <span
                              className="w-5 h-5 flex items-center justify-center rounded-md"
                              style={{ backgroundColor: color + "22" }}
                            >
                              {icon}
                            </span>
                            {cat.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Field 2: Limit Amount input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Số tiền giới hạn
                  </label>
                  <div className="flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <span className="text-xs font-extrabold text-slate-400">VND</span>
                    <input
                      type="text"
                      value={formLimitAmount ? Number(formLimitAmount).toLocaleString("vi-VN") : ""}
                      onChange={(e) => handleLimitAmountInput(e.target.value)}
                      className="flex-1 bg-transparent text-lg font-extrabold text-emerald-600 focus:outline-none placeholder:text-slate-300"
                      placeholder="0"
                      required
                    />
                  </div>

                  {/* Quick Chips */}
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {[500000, 1000000, 2000000, 5000000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setFormLimitAmount(String(amt))}
                        className="py-1.5 rounded-xl border border-slate-100 bg-slate-50 text-[10px] font-extrabold text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
                      >
                        {formatCurrencyVND(amt).replace("₫", "").trim()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Field 3: Period selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Kỳ hạn
                  </label>
                  <div className="grid grid-cols-3 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1">
                    {[
                      { id: "THIS" as const, label: "Tháng này" },
                      { id: "OTHER" as const, label: "Tháng khác" },
                      { id: "TOTAL" as const, label: "Tổng" },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => applyPeriodTab(tab.id)}
                        className={`rounded-xl py-2 text-xs font-bold transition-all border ${
                          periodTab === tab.id
                            ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                            : "bg-transparent text-slate-500 border-transparent hover:bg-white hover:text-slate-700"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Period active label */}
                  <div className="mt-2.5 px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      {periodTab === "THIS" && (
                        <span>Tháng {formMonth}/{formYear} (01/{String(formMonth).padStart(2, "0")} - {new Date(formYear, formMonth, 0).getDate()}/{String(formMonth).padStart(2, "0")})</span>
                      )}
                      {periodTab === "TOTAL" && (
                        <span>Hạn mức tổng năm {formYear} (Không giới hạn theo tháng)</span>
                      )}
                      {periodTab === "OTHER" && (
                        <span>Chọn tháng hiệu lực:</span>
                      )}
                    </span>

                    {/* Month Picker for OTHER */}
                    {periodTab === "OTHER" && (
                      <input
                        type="month"
                        value={formMonthPicker}
                        onChange={(e) => handleMonthPickerChange(e.target.value)}
                        className="border border-slate-200 bg-white rounded-lg px-2 py-1 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                      />
                    )}
                  </div>
                </div>

                {/* Field 4: Scope text */}
                <div className="rounded-xl border border-blue-100 bg-blue-50/50 px-3.5 py-2.5 flex items-start gap-2.5">
                  <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] font-bold text-blue-700 leading-relaxed">
                    Áp dụng cho tất cả giao dịch của tài khoản này
                  </p>
                </div>

                {/* Field 5: Preview Card */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Xem trước
                  </label>
                  {(() => {
                    const cat = categories.find((c) => c.id === formCategoryId);
                    const typeKey = (cat?.type || "BOTH") as "EXPENSE" | "BOTH";
                    const icon = cat?.icon || FALLBACK_ICON[typeKey];
                    const color = cat?.color || FALLBACK_COLOR[typeKey];

                    const displayStatus =
                      previewLimit <= 0
                        ? "Ổn định"
                        : previewStatus === "EXCEEDED"
                        ? "Đã vượt"
                        : previewStatus === "WARNING"
                        ? "Sắp vượt"
                        : "Ổn định";

                    const badgeColor =
                      previewLimit <= 0
                        ? "bg-slate-50 text-slate-400 border-slate-100"
                        : previewStatus === "EXCEEDED"
                        ? "bg-rose-50 text-rose-700 border-rose-100"
                        : previewStatus === "WARNING"
                        ? "bg-amber-50 text-amber-700 border-amber-100"
                        : "bg-emerald-50 text-emerald-700 border-emerald-100";

                    const progressColor =
                      previewLimit <= 0
                        ? "bg-slate-200"
                        : previewStatus === "EXCEEDED"
                        ? "bg-red-500"
                        : previewStatus === "WARNING"
                        ? "bg-amber-500"
                        : "bg-emerald-500";

                    return (
                      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col justify-between">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="flex h-11 w-11 items-center justify-center rounded-xl text-xl shadow-sm"
                              style={{
                                backgroundColor: color + "22",
                                border: `2px solid ${color}44`,
                              }}
                            >
                              {icon}
                            </div>
                            <div>
                              <p className="text-xs font-extrabold text-slate-700">
                                {cat?.name || "Chọn danh mục"}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {formPeriod === "MONTHLY"
                                  ? `Tháng ${formMonth}/${formYear}`
                                  : `Tổng năm ${formYear}`}
                              </p>
                            </div>
                          </div>

                          <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold ${badgeColor}`}>
                            {displayStatus}
                          </span>
                        </div>

                        <div className="mt-4 space-y-1.5">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-400 font-medium">Đã chi</span>
                            <span className="font-bold text-slate-600">
                              {previewLimit <= 0 ? "0%" : `${previewPercent.toFixed(1)}%`}
                            </span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 border border-slate-100">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${progressColor}`}
                              style={{ width: previewLimit <= 0 ? "0%" : getPercentWidth(previewPercent) }}
                            />
                          </div>
                        </div>

                        <dl className="mt-4 grid grid-cols-3 gap-1 text-center border-t border-slate-50 pt-3">
                          <div>
                            <dt className="text-[9px] font-bold text-slate-400 uppercase">
                              Hạn mức
                            </dt>
                            <dd className="mt-0.5 text-[11px] font-bold text-slate-700 truncate">
                              {previewLimit <= 0 ? "Chưa nhập" : formatCurrencyVND(previewLimit)}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-[9px] font-bold text-slate-400 uppercase">
                              Đã chi
                            </dt>
                            <dd className="mt-0.5 text-[11px] font-bold text-rose-500 truncate">
                              {formatCurrencyVND(computedPreviewSpent)}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-[9px] font-bold text-slate-400 uppercase">
                              Còn lại
                            </dt>
                            <dd className="mt-0.5 text-[11px] font-bold text-emerald-600 truncate">
                              {previewLimit <= 0 ? "—" : formatCurrencyVND(previewRemaining)}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    );
                  })()}
                </div>

                {/* Duplicate warning notification */}
                {isDuplicate && (
                  <div className="rounded-xl border border-rose-100 bg-rose-50 px-3.5 py-2.5 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] font-bold text-rose-700">
                      Danh mục này đã có ngân sách trong kỳ đã chọn
                    </p>
                  </div>
                )}
              </div>

              {/* Footer buttons sticky */}
              <div className="shrink-0 flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3.5">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  disabled={submitting}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting || previewLimit <= 0 || !formCategoryId || isDuplicate}
                  className="rounded-xl bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {submitting ? "Đang lưu..." : editBudget ? "Lưu thay đổi" : "Tạo ngân sách"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteOpen && deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
            onClick={() => setIsDeleteOpen(false)}
          />
          <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl border border-slate-200 p-6 flex flex-col gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-500">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-800 mb-1">
                Xóa ngân sách?
              </h2>
              <p className="text-sm text-slate-600">
                Bạn có chắc chắn muốn xóa ngân sách của danh mục{" "}
                <strong className="text-slate-800">
                  &ldquo;{deleteTarget.category?.name || "Ngân sách"}&rdquo;
                </strong>?
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Hành động này không thể hoàn tác. Các giao dịch liên quan sẽ không bị xóa.
              </p>
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <button
                type="button"
                onClick={() => setIsDeleteOpen(false)}
                disabled={deleting}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600 active:scale-95 disabled:opacity-60 transition-all"
              >
                {deleting ? "Đang xóa..." : "Xóa ngân sách"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
