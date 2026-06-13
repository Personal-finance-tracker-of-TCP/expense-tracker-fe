"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CircleDollarSign,
  CreditCard,
  Landmark,
  Loader2,
  Pencil,
  PiggyBank,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { buttonVariants } from "@/components/ui/button";
import { formatCurrencyVND } from "@/lib/finance";
import {
  authFetch,
  getCurrentDemoPeriod,
  normalizeBalance,
  updateUserBalance,
} from "@/lib/moneytrack-api";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

type User = {
  id: string;
  name: string;
  email: string;
  balance?: number | string | null;
};

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

type Category = {
  id: string;
  name: string;
  type?: "INCOME" | "EXPENSE" | "BOTH";
};

type Transaction = {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: number | string;
  note?: string | null;
  description?: string | null;
  transactionDate?: string | null;
  date?: string | null;
  source?: string | null;
  categoryId?: string | null;
  classificationStatus?: string | null;
  category?: Category | null;
};

type TransactionListResponse =
  | Transaction[]
  | {
      transactions?: Transaction[];
    };

type Budget = {
  id: string;
  limitAmount: number | string;
  spentAmount: number | string;
  remainingAmount: number | string;
  percentUsed: number | string;
  category?: Category | null;
};

const { month: DEFAULT_MONTH, year: DEFAULT_YEAR } = getCurrentDemoPeriod();

function getTransactions(data: TransactionListResponse) {
  return Array.isArray(data) ? data : data.transactions ?? [];
}

function toNumber(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function signedAmount(transaction: Transaction) {
  const amount = Number(transaction.amount || 0);
  const prefix = transaction.type === "INCOME" ? "+" : "-";
  return `${prefix}${formatCurrencyVND(amount)}`;
}

export default function DashboardPage() {
  const updateStoredUser = useAuthStore((state) => state.updateUser);
  const [user, setUser] = useState<User | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [chart, setChart] = useState<ChartResponse | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [balanceInput, setBalanceInput] = useState("");
  const [balanceUpdating, setBalanceUpdating] = useState(false);
  const [balanceMessage, setBalanceMessage] = useState<string | null>(null);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [classifyTarget, setClassifyTarget] = useState<Transaction | null>(null);
  const [classifyCategoryId, setClassifyCategoryId] = useState("");
  const [classifying, setClassifying] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadDashboard() {
      setLoading(true);
      setError(null);
      try {
        const [userData, summaryData, chartData, transactionData, budgetData, categoryData] =
          await Promise.all([
            authFetch<User>("/auth/me"),
            authFetch<Summary>(
              `/api/reports/summary?month=${DEFAULT_MONTH}&year=${DEFAULT_YEAR}`
            ),
            authFetch<ChartResponse>(
              `/api/reports/chart?month=${DEFAULT_MONTH}&year=${DEFAULT_YEAR}`
            ).catch(() => ({ chartData: [] })),
            authFetch<TransactionListResponse>(
              `/api/transactions?month=${DEFAULT_MONTH}&year=${DEFAULT_YEAR}&limit=100`
            ),
            authFetch<Budget[]>("/api/budgets"),
            authFetch<Category[]>("/api/categories"),
          ]);

        if (ignore) return;

        setUser({
          ...userData,
          balance: normalizeBalance(userData.balance),
        });
        setSummary(summaryData);
        setChart(chartData);
        setTransactions(getTransactions(transactionData));
        setBudgets(budgetData || []);
        setCategories(categoryData || []);
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Không thể tải tổng quan");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    void loadDashboard();

    return () => {
      ignore = true;
    };
  }, []);

  const computed = useMemo(() => {
    const totalIncome = toNumber(summary?.totalIncome);
    const totalExpense = toNumber(summary?.totalExpense);
    const remainingBudget = budgets.reduce(
      (sum, budget) => sum + toNumber(budget.remainingAmount),
      0
    );
    const automaticTransactions = transactions.filter(
      (transaction) => transaction.source && transaction.source !== "MANUAL"
    ).length;

    return {
      totalIncome,
      totalExpense,
      cashflow: totalIncome - totalExpense,
      balance: normalizeBalance(user?.balance),
      remainingBudget,
      automaticTransactions,
    };
  }, [summary, budgets, transactions, user]);

  function openBalanceModal() {
    setBalanceInput(String(computed.balance || ""));
    setBalanceError(null);
    setBalanceMessage(null);
    setBalanceModalOpen(true);
  }

  async function handleBalanceSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedValue = balanceInput.replace(/[^\d.]/g, "");
    const nextBalance = Number(normalizedValue);

    if (!Number.isFinite(nextBalance) || nextBalance < 0) {
      setBalanceError("So du phai la so lon hon hoac bang 0.");
      return;
    }

    setBalanceUpdating(true);
    setBalanceError(null);
    try {
      const result = await updateUserBalance(nextBalance);
      const updatedUser = result.user;

      setUser((current) => {
        if (updatedUser) {
          return {
            ...(current ?? updatedUser),
            ...updatedUser,
            balance: result.balance,
          };
        }

        return current ? { ...current, balance: result.balance } : current;
      });
      updateStoredUser({ balance: result.balance });
      setBalanceMessage("Da cap nhat so du kha dung.");
      setBalanceModalOpen(false);
    } catch (err) {
      setBalanceError(
        err instanceof Error ? err.message : "Khong the cap nhat so du"
      );
    } finally {
      setBalanceUpdating(false);
    }
  }

  const stats = [
    {
      label: "Số dư khả dụng",
      value: formatCurrencyVND(computed.balance),
      change: user ? user.email : loading ? "Đang tải" : "Chưa có người dùng",
      icon: WalletCards,
      tone: "from-teal-500 to-cyan-500",
      action: openBalanceModal,
    },
    {
      label: "Chi tháng này",
      value: formatCurrencyVND(computed.totalExpense),
      change: `${DEFAULT_MONTH}/${DEFAULT_YEAR}`,
      icon: CreditCard,
      tone: "from-amber-400 to-orange-500",
    },
    {
      label: "Ngân sách còn lại",
      value: formatCurrencyVND(computed.remainingBudget),
      change: `${budgets.length} ngân sách`,
      icon: PiggyBank,
      tone: "from-emerald-500 to-lime-500",
    },
    {
      label: "Giao dịch tự động",
      value: String(computed.automaticTransactions),
      change: "Từ nguồn đồng bộ",
      icon: Landmark,
      tone: "from-indigo-500 to-sky-500",
    },
  ];

  const cashflowChartData = useMemo(() => {
    const fromBackend = chart?.chartData || [];
    if (fromBackend.length > 0) {
      return fromBackend.map((item) => ({
        label: `T${item.month || item.label || ""}`.trim(),
        income: toNumber(item.income),
        expense: toNumber(item.expense),
      }));
    }

    const byDate = transactions.reduce<Record<string, { income: number; expense: number }>>(
      (acc, transaction) => {
        const date = new Date(transaction.transactionDate || transaction.date || "1970-01-01");
        const label = `${date.getDate()}/${date.getMonth() + 1}`;
        acc[label] ||= { income: 0, expense: 0 };
        if (transaction.type === "INCOME") acc[label].income += toNumber(transaction.amount);
        if (transaction.type === "EXPENSE") acc[label].expense += toNumber(transaction.amount);
        return acc;
      },
      {}
    );

    return Object.entries(byDate).map(([label, value]) => ({ label, ...value }));
  }, [chart, transactions]);

  const categoryChartData = useMemo(() => {
    const fromBackend = chart?.categoryBreakdown || [];
    if (fromBackend.length > 0) {
      return fromBackend.map((item) => ({
        name: String(item.name || item.categoryName || "Danh mục"),
        total: toNumber(item.total ?? item.amount ?? item.value),
      }));
    }

    const byCategory = transactions.reduce<Record<string, number>>((acc, transaction) => {
      if (transaction.type !== "EXPENSE") return acc;
      const name = transaction.category?.name || "Chưa phân loại";
      acc[name] = (acc[name] || 0) + toNumber(transaction.amount);
      return acc;
    }, {});

    return Object.entries(byCategory).map(([name, total]) => ({ name, total }));
  }, [chart, transactions]);

  const budgetCards = budgets.map((budget) => ({
    label: budget.category?.name || "Ngân sách",
    value: `${Math.round(toNumber(budget.percentUsed))}%`,
    color:
      toNumber(budget.percentUsed) >= 100
        ? "bg-rose-500"
        : toNumber(budget.percentUsed) >= 80
          ? "bg-amber-400"
          : "bg-teal-500",
  }));

  const recentTransactions = transactions.slice(0, 5);

  const classifyCategories = useMemo(() => {
    if (!classifyTarget) return [];
    return categories.filter(
      (category) =>
        category.type === classifyTarget.type || category.type === "BOTH"
    );
  }, [categories, classifyTarget]);

  function openClassifyModal(transaction: Transaction) {
    const availableCategories = categories.filter(
      (category) => category.type === transaction.type || category.type === "BOTH"
    );
    setClassifyTarget(transaction);
    setClassifyCategoryId(transaction.categoryId || availableCategories[0]?.id || "");
  }

  async function handleClassifySubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!classifyTarget || !classifyCategoryId) return;

    setClassifying(true);
    setError(null);
    try {
      await authFetch(`/api/transactions/${classifyTarget.id}/classify`, {
        method: "PATCH",
        body: JSON.stringify({ categoryId: classifyCategoryId }),
      });

      setClassifyTarget(null);
      const [transactionData, chartData] = await Promise.all([
        authFetch<TransactionListResponse>(
          `/api/transactions?month=${DEFAULT_MONTH}&year=${DEFAULT_YEAR}&limit=100`
        ),
        authFetch<ChartResponse>(
          `/api/reports/chart?month=${DEFAULT_MONTH}&year=${DEFAULT_YEAR}`
        ).catch(() => ({ chartData: [] })),
      ]);
      setTransactions(getTransactions(transactionData));
      setChart(chartData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể phân loại giao dịch");
    } finally {
      setClassifying(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <section className="animate-rise overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,#0f766e_0%,#12312b_48%,#2563eb_100%)] p-6 text-white shadow-2xl shadow-teal-900/18">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex flex-col justify-between gap-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-teal-50 backdrop-blur">
                <CircleDollarSign className="h-3.5 w-3.5" />
                Trung tâm tài chính
              </div>
              <h1 className="mt-5 max-w-2xl text-3xl font-black leading-tight sm:text-4xl">
                {user
                  ? `Xin chào, ${user.name}`
                  : loading
                    ? "Đang tải dữ liệu tài chính"
                    : "Tổng quan tài chính"}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-teal-50/75">
                Dữ liệu được tổng hợp từ báo cáo, giao dịch, ngân sách và hồ sơ của bạn.
              </p>
              {error ? (
                <p className="mt-4 rounded-2xl border border-red-200 bg-red-50/15 px-4 py-3 text-sm font-bold text-red-50">
                  {error}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/profile"
                className={cn(
                  buttonVariants(),
                  "h-11 bg-white px-5 text-sm font-bold text-teal-900 shadow-lg shadow-teal-950/20 hover:bg-teal-50"
                )}
              >
                <UserRound className="size-4" aria-hidden="true" />
                Hồ sơ
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                href="/transactions"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-11 border-white/20 bg-white/10 px-5 text-sm font-bold text-white backdrop-blur hover:bg-white/15"
                )}
              >
                Giao dịch
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/15 bg-white/10 p-4 shadow-inner shadow-white/5 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-100/70">
                  Dòng tiền
                </p>
                <p className="mt-1 text-2xl font-black">
                  {formatCurrencyVND(computed.cashflow)}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-teal-700">
                <ArrowUpRight className="h-5 w-5" />
              </div>
            </div>

            {cashflowChartData.length > 0 ? (
              <div className="mt-8 h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cashflowChartData}>
                    <defs>
                      <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.65} />
                        <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0.05} />
                      </linearGradient>
                      <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="#fbbf24" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <Tooltip
                      formatter={(value) => formatCurrencyVND(toNumber(value))}
                      labelFormatter={(label) => `Kỳ ${label}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="income"
                      name="Thu"
                      stroke="#2dd4bf"
                      fill="url(#incomeFill)"
                      strokeWidth={2}
                    />
                    <Area
                      type="monotone"
                      dataKey="expense"
                      name="Chi"
                      stroke="#fbbf24"
                      fill="url(#expenseFill)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="mt-8 flex h-36 items-center justify-center rounded-3xl border border-white/15 bg-white/5 text-sm font-bold text-teal-50/75">
                Chưa có dữ liệu biểu đồ
              </div>
            )}

            <div className="mt-4 flex items-center justify-between text-xs text-teal-50/70">
              <span>Thu</span>
              <span>Chi</span>
              <span>Tiết kiệm</span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="animate-rise rounded-[1.75rem] border border-white/80 bg-white/90 p-5 shadow-lg shadow-teal-950/[0.06] backdrop-blur transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-500">
                    {item.label}
                  </p>
                  <p className="mt-2 text-2xl font-black text-slate-950">
                    {item.value}
                  </p>
                </div>
                <div
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg",
                    item.tone
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2 text-xs font-bold text-teal-700">
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{item.change}</span>
                </div>
                {item.action ? (
                  <button
                    type="button"
                    onClick={item.action}
                    className="inline-flex h-8 items-center gap-1 rounded-full border border-teal-100 bg-teal-50 px-3 text-xs font-black text-teal-800 transition hover:bg-teal-100"
                  >
                    <Pencil className="size-3" aria-hidden="true" />
                    Cập nhật
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {balanceMessage ? (
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          {balanceMessage}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="rounded-[1.75rem] border border-white/80 bg-white/90 p-6 shadow-lg shadow-teal-950/[0.05] backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
          <div>
            <h2 className="text-lg font-black text-slate-950 dark:text-white">
              Thu và chi theo thời gian
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
              Ưu tiên dữ liệu từ báo cáo, tự tổng hợp từ giao dịch khi cần.
            </p>
          </div>
          {cashflowChartData.length > 0 ? (
            <div className="mt-6 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cashflowChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#dbeafe" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) =>
                      Intl.NumberFormat("vi-VN", { notation: "compact" }).format(Number(value))
                    }
                  />
                  <Tooltip formatter={(value) => formatCurrencyVND(toNumber(value))} />
                  <Area
                    type="monotone"
                    dataKey="income"
                    name="Thu nhập"
                    stroke="#059669"
                    fill="#d1fae5"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="expense"
                    name="Chi tiêu"
                    stroke="#e11d48"
                    fill="#ffe4e6"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="mt-6 flex h-72 items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-sm font-bold text-slate-400 dark:border-slate-700 dark:bg-slate-950">
              Chưa có dữ liệu thu/chi để vẽ biểu đồ.
            </div>
          )}
        </section>

        <section className="rounded-[1.75rem] border border-white/80 bg-white/90 p-6 shadow-lg shadow-teal-950/[0.05] backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
          <div>
            <h2 className="text-lg font-black text-slate-950 dark:text-white">
              Cơ cấu chi tiêu
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
              Nhóm danh mục chi tiêu trong kỳ hiện tại.
            </p>
          </div>
          {categoryChartData.length > 0 ? (
            <div className="mt-6 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData} layout="vertical" margin={{ left: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#dbeafe" />
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={110}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip formatter={(value) => formatCurrencyVND(toNumber(value))} />
                  <Bar dataKey="total" name="Chi tiêu" radius={[0, 10, 10, 0]}>
                    {categoryChartData.map((entry, index) => (
                      <Cell
                        key={`${entry.name}-${index}`}
                        fill={["#0d9488", "#0284c7", "#f59e0b", "#e11d48", "#7c3aed"][index % 5]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="mt-6 flex h-72 items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 text-sm font-bold text-slate-400 dark:border-slate-700 dark:bg-slate-950">
              Chưa có chi tiêu theo danh mục.
            </div>
          )}
        </section>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="h-fit rounded-[1.75rem] border border-white/80 bg-white/90 p-6 shadow-lg shadow-teal-950/[0.05] backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-950">
                Ngân sách theo danh mục
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Theo dõi mức sử dụng ngân sách theo từng danh mục.
              </p>
            </div>
            <Link
              href="/budgets"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-teal-100 bg-teal-50 px-4 text-sm font-bold text-teal-800 transition-colors hover:bg-teal-100"
            >
              Ngân sách
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-6 grid max-h-[320px] auto-rows-auto grid-cols-1 content-start gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
            {budgetCards.length > 0 ? (
              budgetCards.map((budget) => (
                <div
                  key={budget.label}
                  className="rounded-3xl border border-slate-100 bg-slate-50/80 p-4"
                >
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-slate-800">
                      {budget.label}
                    </span>
                    <span className="font-black text-slate-950">
                      {budget.value}
                    </span>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
                    <div
                      className={cn("h-full rounded-full", budget.color)}
                      style={{ width: budget.value }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/80 p-6 text-sm font-bold text-slate-400 sm:col-span-2">
                Chưa có ngân sách.
              </div>
            )}
          </div>
        </section>

        <section className="h-fit rounded-[1.75rem] border border-white/80 bg-white/90 p-6 shadow-lg shadow-teal-950/[0.05] backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-black text-slate-950">
                Hoạt động gần đây
              </h2>
              <p className="mt-1 text-sm text-slate-500">Dòng tiền mới nhất</p>
            </div>
            <Link
              href="/transactions"
              className="text-sm font-bold text-teal-700 hover:text-teal-900"
            >
              Xem tất cả
            </Link>
          </div>
          <div className="mt-5 space-y-4">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((transaction) => {
                const isUnclassified =
                  !transaction.categoryId ||
                  transaction.classificationStatus === "UNCLASSIFIED";

                return (
                <div key={transaction.id} className="flex items-center gap-3">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-black ${
                      transaction.type === "INCOME"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {(transaction.note || transaction.description || "G").slice(0, 1)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-950">
                      {transaction.note || transaction.description || "Giao dịch"}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <p className="truncate text-xs text-slate-500">
                        {transaction.category?.name || "Chưa phân loại"}
                      </p>
                      {isUnclassified ? (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-black text-amber-700">
                          Chưa phân loại
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <p className="text-sm font-black text-slate-950">
                      {signedAmount(transaction)}
                    </p>
                    {isUnclassified ? (
                      <button
                        type="button"
                        onClick={() => openClassifyModal(transaction)}
                        className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700 hover:bg-amber-100"
                      >
                        Phân loại
                      </button>
                    ) : null}
                  </div>
                </div>
              );
              })
            ) : (
              <p className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm font-bold text-slate-400">
                Chưa có giao dịch gần đây.
              </p>
            )}
          </div>
        </section>
      </div>

      <section className="rounded-[1.75rem] border border-white/80 bg-white/80 p-6 shadow-lg shadow-teal-950/[0.05] backdrop-blur">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["Thu nhập", formatCurrencyVND(computed.totalIncome)],
            ["Tiết kiệm", formatCurrencyVND(toNumber(summary?.savings))],
            ["Tỷ lệ tiết kiệm", `${toNumber(summary?.savingsRate).toFixed(1)}%`],
          ].map(([title, description]) => (
            <div key={title} className="rounded-3xl bg-slate-50/90 p-5">
              <p className="text-sm font-black text-slate-950">{title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {balanceModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm">
          <form
            onSubmit={handleBalanceSubmit}
            className="w-full max-w-md rounded-[2rem] border border-white/80 bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between gap-4 border-b border-teal-100 pb-4">
              <div>
                <h2 className="text-xl font-black text-slate-950">
                  Cập nhật số dư
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  Giá trị mới sẽ được lưu vào hồ sơ tài khoản.
                </p>
              </div>
              <button
                type="button"
                className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
                onClick={() => setBalanceModalOpen(false)}
                aria-label="Đóng"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <label className="mt-5 block text-sm font-bold text-slate-700">
              Số dư khả dụng
            </label>
            <input
              value={balanceInput}
              onChange={(event) => setBalanceInput(event.target.value)}
              inputMode="decimal"
              placeholder="Số dư: 5000000"
              className="mt-2 h-12 w-full rounded-full border border-teal-100 px-5 text-sm font-bold outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/20"
            />
            <p className="mt-2 text-xs font-semibold text-slate-500">
              Đang hiển thị: {formatCurrencyVND(normalizeBalance(balanceInput.replace(/[^\d.]/g, "")))}
            </p>

            {balanceError ? (
              <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">
                {balanceError}
              </p>
            ) : null}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setBalanceModalOpen(false)}
                className="h-11 rounded-full border border-teal-100 px-5 text-sm font-black text-slate-600 hover:bg-teal-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={balanceUpdating}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 px-5 text-sm font-black text-white shadow-lg disabled:opacity-60"
              >
                {balanceUpdating ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : null}
                Lưu số dư
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {classifyTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm">
          <form
            onSubmit={handleClassifySubmit}
            className="w-full max-w-lg rounded-[2rem] border border-white/80 bg-white p-6 shadow-2xl dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between gap-4 border-b border-teal-100 pb-4 dark:border-slate-700">
              <div>
                <h2 className="text-xl font-black text-slate-950 dark:text-white">
                  Phân loại giao dịch
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-300">
                  Chọn danh mục để cập nhật báo cáo và ngân sách.
                </p>
              </div>
              <button
                type="button"
                className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                onClick={() => setClassifyTarget(null)}
                aria-label="Đóng"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-5 grid gap-3 rounded-3xl border border-slate-100 bg-slate-50 p-4 text-sm dark:border-slate-700 dark:bg-slate-950">
              <div className="flex justify-between gap-4">
                <span className="font-semibold text-slate-500">Nội dung</span>
                <span className="font-bold text-slate-950 dark:text-white">
                  {classifyTarget.note || classifyTarget.description || "Giao dịch"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="font-semibold text-slate-500">Số tiền</span>
                <span className="font-bold text-slate-950 dark:text-white">
                  {signedAmount(classifyTarget)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="font-semibold text-slate-500">Loại</span>
                <span className="font-bold text-slate-950 dark:text-white">
                  {classifyTarget.type === "INCOME" ? "Thu nhập" : "Chi tiêu"}
                </span>
              </div>
            </div>

            <label className="mt-5 block text-sm font-bold text-slate-700 dark:text-slate-200">
              Danh mục
              <select
                value={classifyCategoryId}
                onChange={(event) => setClassifyCategoryId(event.target.value)}
                required
                className="mt-2 h-12 w-full rounded-full border border-teal-100 px-5 text-sm font-bold outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                {classifyCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setClassifyTarget(null)}
                className="h-11 rounded-full border border-teal-100 px-5 text-sm font-black text-slate-600 hover:bg-teal-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={classifying || classifyCategories.length === 0}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 px-5 text-sm font-black text-white shadow-lg disabled:opacity-60"
              >
                {classifying ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : null}
                Lưu phân loại
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
