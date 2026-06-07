"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { RefreshCcw, Plus, X, AlertCircle } from "lucide-react";
import { authFetch, getCurrentDemoPeriod, toNumber } from "@/lib/moneytrack-api";
import { formatCurrency } from "@/components/dashboard/MoneyAmount";

// Separated Sub-components
import { TransactionsSummaryCard } from "@/components/transactions/TransactionsSummaryCard";
import { TransactionsFilterBar } from "@/components/transactions/TransactionsFilterBar";
import { TransactionDayGroup } from "@/components/transactions/TransactionDayGroup";
import { TransactionSkeleton } from "@/components/transactions/TransactionSkeleton";
import { EmptyState } from "@/components/dashboard/EmptyState";

type Category = {
  id: string;
  name: string;
  icon?: string | null;
  type?: "INCOME" | "EXPENSE" | "BOTH";
};

type Transaction = {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: number | string;
  note?: string | null;
  source: "MANUAL" | "SEPAY";
  categoryId?: string | null;
  category?: Category | null;
  sepayId?: string | null;
  transactionDate: string;
};

type TransactionResult = {
  transactions: Transaction[];
};

type UserInfo = {
  name?: string;
  email?: string;
  role?: string;
  balance?: number | string;
  sepayCode?: string | null;
  bankAccountNumber?: string | null;
  avatarUrl?: string | null;
};

const { month: DEFAULT_MONTH, year: DEFAULT_YEAR } = getCurrentDemoPeriod();

const getTodayDate = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate() - 1).padStart(2, '0')

  return `${year}-${month}-${day}`
}


export default function TransactionsPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Privacy Eye Toggle
  const [isMasked, setIsMasked] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "INCOME" | "EXPENSE">("ALL");
  const [sourceFilter, setSourceFilter] = useState<"ALL" | "MANUAL" | "SEPAY">("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  // Selected Period: "prev" (May 2026), "current" (June 2026), "next" (July 2026)
  const [selectedPeriod, setSelectedPeriod] = useState<"prev" | "current" | "next">("current");

  // Month Picker State (synced with selectedPeriod)
  const [monthFilter, setMonthFilter] = useState("2026-06");

  // Dialog Modals State
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Create Form State
  const [createType, setCreateType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [createAmount, setCreateAmount] = useState("");
  const [createNote, setCreateNote] = useState("");
  const [createCategoryId, setCreateCategoryId] = useState("");
  const [createDate, setCreateDate] = useState(getTodayDate());
  const [creating, setCreating] = useState(false);

  // Available Periods Mapper
  const periodToMonthStr = {
    prev: "2026-05",
    current: "2026-06",
    next: "2026-07",
  };

  const monthStrToPeriod = {
    "2026-05": "prev" as const,
    "2026-06": "current" as const,
    "2026-07": "next" as const,
  };

  // Sync Month Picker and Period Tabs
  const handlePeriodChange = (period: "prev" | "current" | "next") => {
    setSelectedPeriod(period);
    const targetMonth = periodToMonthStr[period];
    setMonthFilter(targetMonth);
  };

  const handleMonthFilterChange = (monthStr: string) => {
    setMonthFilter(monthStr);
    const period = monthStrToPeriod[monthStr as keyof typeof monthStrToPeriod];
    if (period) {
      setSelectedPeriod(period);
    } else {
      setSelectedPeriod("current");
    }
  };

  // Extract month and year numbers from "YYYY-MM"
  const filterPeriod = useMemo(() => {
    const [year, month] = monthFilter.split("-");
    return {
      month: parseInt(month, 10),
      year: parseInt(year, 10),
    };
  }, [monthFilter]);

  // Load User, Mask pref, and transactions
  useEffect(() => {
    if (typeof window !== "undefined") {
      const maskedPref = localStorage.getItem("balance_masked");
      if (maskedPref === "true") {
        setIsMasked(true);
      }
      try {
        const rawUser = localStorage.getItem("user");
        if (rawUser) {
          setUser(JSON.parse(rawUser));
        }
      } catch (e) { }

      // Read filter from URL query params
      const params = new URLSearchParams(window.location.search);
      const catParam = params.get("category");
      const filterParam = params.get("filter");
      if (catParam === "UNCLASSIFIED" || filterParam === "uncategorized") {
        setCategoryFilter("UNCLASSIFIED");
      }
    }
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [transactionResult, categoryData] = await Promise.all([
        authFetch<TransactionResult>(
          `/api/transactions?month=${filterPeriod.month}&year=${filterPeriod.year}&limit=100`
        ),
        authFetch<Category[]>("/api/categories"),
      ]);

      setTransactions(transactionResult.transactions || []);
      setCategories(categoryData || []);

      // If user profile is saved in backend, sync balance from backend user
      if (typeof window !== "undefined") {
        try {
          const rawUser = localStorage.getItem("user");
          if (rawUser) {
            const parsed = JSON.parse(rawUser);
            // Re-fetch current user's balance or summary to keep synced if needed.
          }
        } catch (e) { }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải danh sách giao dịch");
    } finally {
      setLoading(false);
    }
  }

  // Refetch when month filters change
  useEffect(() => {
    loadData();
  }, [monthFilter]);

  // Sync budgets after classification
  async function loadBudgetsForSync() {
    await authFetch(`/api/budgets?month=${filterPeriod.month}&year=${filterPeriod.year}`);
  }

  // Open classification dialog
  function openClassifyModal(transaction: Transaction) {
    setSelectedTransaction(transaction);
    const expenseCats = categories.filter((c) => c.type === "EXPENSE" || c.type === "BOTH");
    setSelectedCategoryId(expenseCats[0]?.id || "");
    setNotice(null);
    setError(null);
  }

  // Save SePay classification
  async function handleClassify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedTransaction || !selectedCategoryId) return;

    setSyncing(true);
    setError(null);
    try {
      await authFetch<Transaction>(`/api/transactions/${selectedTransaction.id}`, {
        method: "PUT",
        body: JSON.stringify({
          categoryId: selectedCategoryId,
          type: "EXPENSE",
          amount: toNumber(selectedTransaction.amount),
          note: selectedTransaction.note || "",
          transactionDate: selectedTransaction.transactionDate,
        }),
      });

      await Promise.all([loadData(), loadBudgetsForSync()]);
      setSelectedTransaction(null);
      setNotice("Phân loại giao dịch thành công. Kế hoạch ngân sách đã được cập nhật.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi khi phân loại giao dịch");
    } finally {
      setSyncing(false);
    }
  }

  // Submit manual transaction creation
  async function handleCreateTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!createAmount) return;

    setCreating(true);
    setError(null);
    try {
      await authFetch<Transaction>("/api/transactions", {
        method: "POST",
        body: JSON.stringify({
          type: createType,
          amount: Number(createAmount),
          categoryId: createCategoryId || null,
          note: createNote || null,
          transactionDate: createDate ? new Date(createDate).toISOString() : new Date().toISOString(),
        }),
      });

      // Update user locally if balance changes
      if (user) {
        const val = Number(createAmount);
        const change = createType === "INCOME" ? val : -val;
        const newBalance = (Number(user.balance) || 0) + change;
        const updatedUser = { ...user, balance: newBalance };
        setUser(updatedUser);
        if (typeof window !== "undefined") {
          localStorage.setItem("user", JSON.stringify(updatedUser));
        }
      }

      await Promise.all([loadData(), loadBudgetsForSync()]);
      setIsCreateOpen(false);
      setNotice("Tạo giao dịch mới thành công.");

      // Reset Form
      setCreateAmount("");
      setCreateNote("");
      setCreateCategoryId("");
      setCreateDate("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tạo giao dịch");
    } finally {
      setCreating(false);
    }
  }

  // Handle balance visibility toggle
  const handleToggleMask = () => {
    setIsMasked((prev) => {
      const newVal = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("balance_masked", String(newVal));
      }
      return newVal;
    });
  };

  // Filtered transactions computation
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // 1. Search Query note / category / sepayId
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const noteMatch = (tx.note || "").toLowerCase().includes(q);
        const catMatch = tx.category?.name ? tx.category.name.toLowerCase().includes(q) : false;
        const sepayMatch = tx.sepayId ? tx.sepayId.toLowerCase().includes(q) : false;
        if (!noteMatch && !catMatch && !sepayMatch) return false;
      }

      // 2. Type Filter
      if (typeFilter !== "ALL" && tx.type !== typeFilter) return false;

      // 3. Source Filter
      if (sourceFilter !== "ALL" && tx.source !== sourceFilter) return false;

      // 4. Category Filter
      if (categoryFilter === "UNCLASSIFIED" && tx.categoryId) return false;
      if (categoryFilter !== "ALL" && categoryFilter !== "UNCLASSIFIED" && tx.categoryId !== categoryFilter) return false;

      return true;
    });
  }, [transactions, searchQuery, typeFilter, sourceFilter, categoryFilter]);

  // Aggregate sums for current period
  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    filteredTransactions.forEach((tx) => {
      const val = Number(tx.amount) || 0;
      if (tx.type === "INCOME") {
        income += val;
      } else {
        expense += val;
      }
    });
    return { income, expense };
  }, [filteredTransactions]);

  // Unclassified transactions count in currently loaded list
  const unclassifiedCount = useMemo(() => {
    return transactions.filter((tx) => !tx.categoryId).length;
  }, [transactions]);

  // Grouped transactions by day: returns object { "YYYY-MM-DD": Transaction[] }
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    filteredTransactions.forEach((tx) => {
      const dateStr = tx.transactionDate.split("T")[0];
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(tx);
    });

    // Sort days in descending order
    return Object.keys(groups)
      .sort((a, b) => b.localeCompare(a))
      .map((dateKey) => ({
        dateStr: dateKey,
        items: groups[dateKey],
      }));
  }, [filteredTransactions]);

  // Category list for dropdown filters
  const filterCategories = useMemo(() => {
    return categories.map((c) => ({ id: c.id, name: c.name, icon: c.icon }));
  }, [categories]);

  // Form creation categories based on selected transaction type
  const formCategories = useMemo(() => {
    return categories.filter(
      (c) => c.type === createType || c.type === "BOTH"
    );
  }, [categories, createType]);

  const currentBalance = user?.balance !== undefined ? Number(user.balance) : (totals.income - totals.expense);

  return (
    <main className="mx-auto max-w-7xl flex flex-col gap-6 px-1 py-3 sm:px-2">
      {/* Top Page Header */}
      <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-transparent px-2">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
            Số giao dịch
          </span>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight mt-1">
            Giao dịch
          </h1>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            Theo dõi, tìm kiếm và phân loại giao dịch thu chi
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Refresh Button */}
          <button
            onClick={loadData}
            type="button"
            className="h-10 w-10 flex items-center justify-center rounded-full border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-500 transition-colors"
            aria-label="Refresh transactions"
          >
            <RefreshCcw className="h-4.5 w-4.5" />
          </button>

          {/* Add Transaction Button */}
          <button
            onClick={() => {
              setIsCreateOpen(true);
              setCreateCategoryId(categories[0]?.id || "");
            }}
            type="button"
            className="inline-flex h-10 items-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-600 px-5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all duration-150 active:scale-95"
          >
            <Plus className="h-4.5 w-4.5 stroke-[3]" />
            <span>Thêm giao dịch</span>
          </button>

          {/* Avatar User */}
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt="Avatar"
              className="h-10 w-10 rounded-full border border-slate-200 object-cover"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/25 font-bold flex items-center justify-center text-xs">
              {(user?.name || "ND").slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
      </section>

      {/* Notifications */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 shadow-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertCircle className="h-4.5 w-4.5 text-red-500 shrink-0" />
            {error}
          </span>
          <button onClick={() => setError(null)} className="text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {notice && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-700 shadow-sm flex items-center justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Summary Card */}
      <TransactionsSummaryCard
        balance={currentBalance}
        totalIncome={totals.income}
        totalExpense={totals.expense}
        selectedPeriod={selectedPeriod}
        onPeriodChange={handlePeriodChange}
        isMasked={isMasked}
        onToggleMask={handleToggleMask}
      />

      {/* Filter Bar */}
      <TransactionsFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        sourceFilter={sourceFilter}
        onSourceFilterChange={setSourceFilter}
        categoryFilter={categoryFilter}
        onCategoryFilterChange={setCategoryFilter}
        monthFilter={monthFilter}
        onMonthFilterChange={handleMonthFilterChange}
        unclassifiedCount={unclassifiedCount}
        categories={filterCategories}
        availableMonths={["2026-05", "2026-06", "2026-07"]}
      />

      {/* List Container */}
      <div className="space-y-6 mt-2">
        {loading ? (
          <TransactionSkeleton />
        ) : groupedTransactions.length === 0 ? (
          <EmptyState
            title="Chưa có giao dịch nào"
            description="Không có giao dịch nào khớp với điều kiện tìm kiếm hoặc kỳ báo cáo này."
            icon={<AlertCircle className="h-6 w-6 text-slate-300" />}
          >
            <button
              onClick={() => setIsCreateOpen(true)}
              className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Thêm giao dịch đầu tiên
            </button>
          </EmptyState>
        ) : (
          groupedTransactions.map((group) => (
            <TransactionDayGroup
              key={group.dateStr}
              dateStr={group.dateStr}
              transactions={group.items}
              onClassify={openClassifyModal}
            />
          ))
        )}
      </div>

      {/* Classification Modal (PUT Update) */}
      {selectedTransaction ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <form
            onSubmit={handleClassify}
            className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in-50 zoom-in-95 duration-150"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-800">Phân loại giao dịch</h2>
                <p className="mt-1 text-xs text-slate-400 font-semibold">
                  Gán danh mục chi tiêu cho giao dịch SePay chuyển khoản.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTransaction(null)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-50 transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 rounded-2xl bg-slate-50 border border-slate-100 p-4 space-y-1.5">
              <p className="font-bold text-xs text-slate-700">
                {selectedTransaction.note || "Giao dịch SePay"}
              </p>
              <p className="text-xs text-slate-400 font-semibold">
                {formatCurrency(Number(selectedTransaction.amount))} · {new Date(selectedTransaction.transactionDate).toLocaleDateString("vi-VN")}
              </p>
              {selectedTransaction.sepayId && (
                <p className="text-[10px] text-slate-300 font-mono">ID: {selectedTransaction.sepayId}</p>
              )}
            </div>

            <div className="mt-4">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Danh mục chi tiêu
              </label>
              <div className="relative">
                <select
                  value={selectedCategoryId}
                  onChange={(event) => setSelectedCategoryId(event.target.value)}
                  className="h-10.5 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 text-xs font-semibold outline-none ring-slate-100/50 focus:bg-white focus:border-slate-300 focus:ring-4 cursor-pointer transition-all duration-200"
                  required
                >
                  {categories
                    .filter((c) => c.type === "EXPENSE" || c.type === "BOTH")
                    .map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.icon ? `${category.icon} ` : ""}
                        {category.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={syncing || !selectedCategoryId}
              className="mt-6 inline-flex h-10.5 w-full items-center justify-center rounded-2xl bg-slate-900 px-4 text-xs font-bold text-white shadow-lg shadow-slate-900/10 hover:bg-slate-800 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            >
              {syncing ? "Đang phân loại..." : "Lưu phân loại"}
            </button>
          </form>
        </div>
      ) : null}

      {/* Manual Creation Modal (POST Create) */}
      {isCreateOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <form
            onSubmit={handleCreateTransaction}
            className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in-50 zoom-in-95 duration-150 space-y-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-800">Thêm giao dịch</h2>
                <p className="mt-1 text-xs text-slate-400 font-semibold">
                  Tạo một giao dịch thu chi thủ công vào tài khoản.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-50 transition-colors"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Type Selector Capsule */}
            <div className="bg-slate-50 p-1 rounded-2xl flex items-center h-10 border border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setCreateType("EXPENSE");
                  setCreateCategoryId(categories.filter((c) => c.type === "EXPENSE" || c.type === "BOTH")[0]?.id || "");
                }}
                className={`flex-1 text-center py-1.5 rounded-xl text-xs font-bold transition-all duration-150 ${createType === "EXPENSE"
                  ? "bg-rose-500 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
                  }`}
              >
                Chi tiêu
              </button>
              <button
                type="button"
                onClick={() => {
                  setCreateType("INCOME");
                  setCreateCategoryId(categories.filter((c) => c.type === "INCOME" || c.type === "BOTH")[0]?.id || "");
                }}
                className={`flex-1 text-center py-1.5 rounded-xl text-xs font-bold transition-all duration-150 ${createType === "INCOME"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
                  }`}
              >
                Thu nhập
              </button>
            </div>

            {/* Amount */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Số tiền (VND)
              </label>
              <input
                type="number"
                value={createAmount}
                onChange={(e) => setCreateAmount(e.target.value)}
                placeholder="Ví dụ: 50000"
                className="h-10.5 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 text-xs font-semibold outline-none ring-slate-100/50 focus:bg-white focus:border-slate-300 focus:ring-4 transition-all duration-200"
                min="1"
                required
              />
            </div>

            {/* Note */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Ghi chú
              </label>
              <input
                type="text"
                value={createNote}
                onChange={(e) => setCreateNote(e.target.value)}
                placeholder="Bữa trưa văn phòng, mua quần áo..."
                className="h-10.5 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 text-xs font-semibold outline-none ring-slate-100/50 focus:bg-white focus:border-slate-300 focus:ring-4 transition-all duration-200"
              />
            </div>

            {/* Category Dropdown */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Danh mục
              </label>
              <select
                value={createCategoryId}
                onChange={(e) => setCreateCategoryId(e.target.value)}
                className="h-10.5 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 text-xs font-semibold outline-none ring-slate-100/50 focus:bg-white focus:border-slate-300 focus:ring-4 cursor-pointer transition-all duration-200"
              >
                <option value="">Chưa phân loại</option>
                {formCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon ? `${cat.icon} ` : ""}
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                Ngày giao dịch
              </label>
              <input
                type="date"
                value={createDate}
                onChange={(e) => setCreateDate(e.target.value)}
                className="h-10.5 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 text-xs font-semibold outline-none ring-slate-100/50 focus:bg-white focus:border-slate-300 focus:ring-4 transition-all duration-200"
              />
            </div>

            <button
              type="submit"
              disabled={creating}
              className="inline-flex h-10.5 w-full items-center justify-center rounded-2xl bg-emerald-500 hover:bg-emerald-600 px-4 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creating ? "Đang xử lý..." : "Thêm giao dịch"}
            </button>
          </form>
        </div>
      ) : null}
    </main>
  );
}
