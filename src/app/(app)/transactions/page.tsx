"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  CalendarRange,
  CreditCard,
  Loader2,
  WalletCards,
  X,
} from "lucide-react";

import { WorkspaceMockup } from "@/components/layout/WorkspaceMockup";
import { formatCurrencyVND } from "@/lib/finance";
import { authFetch, getCurrentDemoPeriod } from "@/lib/moneytrack-api";

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
  classificationStatus?: string | null;
  categoryId?: string | null;
  category?: Category | null;
};

type TransactionListResponse =
  | Transaction[]
  | {
      transactions?: Transaction[];
    };

const { month: DEFAULT_MONTH, year: DEFAULT_YEAR } = getCurrentDemoPeriod();

function getTransactions(data: TransactionListResponse) {
  return Array.isArray(data) ? data : data.transactions ?? [];
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("vi-VN").format(new Date(value));
}

function signedAmount(transaction: Transaction) {
  const amount = Number(transaction.amount || 0);
  const prefix = transaction.type === "INCOME" ? "+" : "-";
  return `${prefix}${formatCurrencyVND(amount)}`;
}

function statusFor(transaction: Transaction) {
  if (transaction.classificationStatus === "EXCLUDED") {
    return {
      label: "Đã bỏ qua",
      tone: "border-slate-200 bg-slate-100 text-slate-600",
    };
  }

  if (
    !transaction.categoryId ||
    transaction.classificationStatus === "UNCLASSIFIED"
  ) {
    return {
      label: "Cần xử lý",
      tone: "border-amber-200 bg-amber-50 text-amber-700",
    };
  }

  return {
    label: "Đã phân loại",
    tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
  };
}

function formatAmountInput(value: string) {
  const numericValue = value.replace(/\D/g, "");

  if (!numericValue) return "";

  return new Intl.NumberFormat("vi-VN").format(Number(numericValue));
}

function parseAmountInput(value: string) {
  return Number(value.replace(/\D/g, ""));
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formType, setFormType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [formAmount, setFormAmount] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formNote, setFormNote] = useState("");
  const [formDate, setFormDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [classifyTarget, setClassifyTarget] = useState<Transaction | null>(null);
  const [classifyCategoryId, setClassifyCategoryId] = useState("");
  const [classifying, setClassifying] = useState(false);
  const [excludingId, setExcludingId] = useState<string | null>(null);


  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [transactionData, categoryData] = await Promise.all([
        authFetch<TransactionListResponse>(
          `/api/transactions?month=${DEFAULT_MONTH}&year=${DEFAULT_YEAR}&limit=100`
        ),
        authFetch<Category[]>("/api/categories"),
      ]);
      const nextCategories = categoryData || [];

      setTransactions(getTransactions(transactionData));
      setCategories(nextCategories);
      setFormCategoryId((current) => current || nextCategories[0]?.id || "");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không thể tải giao dịch"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const filteredTransactions = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return transactions;

    return transactions.filter((transaction) => {
      const text = [
        transaction.note,
        transaction.description,
        transaction.category?.name,
        transaction.source,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(keyword);
    });
  }, [transactions, search]);

  const totals = useMemo(() => {
    return transactions.reduce(
      (acc, transaction) => {
        const amount = Number(transaction.amount || 0);
        const isExcluded = transaction.classificationStatus === "EXCLUDED";
        if (transaction.type === "INCOME" && !isExcluded) acc.income += amount;
        if (transaction.type === "EXPENSE" && !isExcluded) acc.expense += amount;
        if (isExcluded) {
          acc.excluded += 1;
          return acc;
        }
        if (
          !transaction.categoryId ||
          transaction.classificationStatus === "UNCLASSIFIED"
        ) {
          acc.unclassified += 1;
        }
        if (transaction.source && transaction.source !== "MANUAL") {
          acc.automatic += 1;
        }
        return acc;
      },
      { income: 0, expense: 0, unclassified: 0, automatic: 0, excluded: 0 }
    );
  }, [transactions]);

  const visibleCategories = useMemo(
    () =>
      categories.filter(
        (category) => category.type === formType || category.type === "BOTH"
      ),
    [categories, formType]
  );

  const selectedFormCategoryId = visibleCategories.some(
    (category) => category.id === formCategoryId
  )
    ? formCategoryId
    : visibleCategories[0]?.id || "";

  const classifyCategories = useMemo(() => {
    if (!classifyTarget) return [];
    return categories.filter(
      (category) =>
        category.type === classifyTarget.type || category.type === "BOTH"
    );
  }, [categories, classifyTarget]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await authFetch("/api/transactions", {
        method: "POST",
        body: JSON.stringify({
          type: formType,
          amount: parseAmountInput(formAmount),
          categoryId: selectedFormCategoryId,
          note: formNote.trim() || undefined,
          transactionDate: new Date(formDate).toISOString(),
        }),
      });

      setNotice("Da tao giao dich");
      setIsFormOpen(false);
      setFormAmount("");
      setFormNote("");
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Khong the tao giao dich"
      );
    } finally {
      setSubmitting(false);
    }
  }

  function openClassifyModal(transaction: Transaction) {
    const availableCategories = categories.filter(
      (category) => category.type === transaction.type || category.type === "BOTH"
    );
    setClassifyTarget(transaction);
    setClassifyCategoryId(transaction.categoryId || availableCategories[0]?.id || "");
    setError(null);
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
      setNotice("Đã phân loại giao dịch");
      setClassifyTarget(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể phân loại giao dịch");
    } finally {
      setClassifying(false);
    }
  }

  async function handleExcludeTransaction(transaction: Transaction) {
    const confirmed = window.confirm(
      "Bỏ qua giao dịch này khỏi báo cáo? Giao dịch vẫn được giữ trong lịch sử."
    );
    if (!confirmed) return;

    setExcludingId(transaction.id);
    setError(null);
    try {
      await authFetch(`/api/transactions/${transaction.id}/exclude`, {
        method: "PATCH",
      });
      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể bỏ qua giao dịch khỏi báo cáo"
      );
    } finally {
      setExcludingId(null);
    }
  }

  const tableRows = filteredTransactions.map((transaction) => {
    const status = statusFor(transaction);
    const isUnclassified =
      !transaction.categoryId ||
      transaction.classificationStatus === "UNCLASSIFIED";
    const isExcluded = transaction.classificationStatus === "EXCLUDED";
    const canExclude =
      transaction.source === "SEPAY" && isUnclassified && !isExcluded;

    return {
      href: `/transactions/${transaction.id}`,
      ariaLabel: `Xem chi tiết giao dịch ${
        transaction.note || transaction.description || transaction.id
      }`,
      cells: [
        transaction.note || transaction.description || "Giao dịch",
        transaction.category?.name || "Chưa phân loại",
        formatDate(transaction.transactionDate ?? transaction.date),
        signedAmount(transaction),
      ],
      status: status.label,
      tone: status.tone,
      actions: isUnclassified || canExclude ? (
        <div className="flex flex-wrap gap-2">
          {isUnclassified ? (
            <button
              type="button"
              onClick={() => openClassifyModal(transaction)}
              className="inline-flex h-8 items-center rounded-full bg-amber-50 px-3 text-xs font-black text-amber-700 hover:bg-amber-100"
            >
              Phân loại
            </button>
          ) : null}
          {canExclude ? (
            <button
            type="button"
            onClick={() => void handleExcludeTransaction(transaction)}
            disabled={excludingId === transaction.id}
            className="inline-flex h-8 items-center rounded-full bg-slate-100 px-3 text-xs font-black text-slate-700 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
            title="Bỏ qua, không tính giao dịch này vào báo cáo"
          >
            {excludingId === transaction.id ? "Đang bỏ qua..." : "Bỏ qua"}
            </button>
          ) : null}
        </div>
      ) : null,
    };
  });
  return (
    <>
      <WorkspaceMockup
        actionLabel={loading ? "Đang tải" : "Thêm giao dịch"}
        accent="from-sky-500 to-cyan-500"
        filters={[
          `Tháng ${DEFAULT_MONTH}/${DEFAULT_YEAR}`,
          `${categories.length} danh mục`,
          `${totals.excluded} bỏ qua `,
        ]}
        metrics={[
          {
            label: "Tổng thu",
            value: formatCurrencyVND(totals.income),
            helper: "Từ giao dịch đã ghi nhận",
            icon: ArrowDownLeft,
            tone: "from-emerald-500 to-teal-500",
          },
          {
            label: "Tổng chi",
            value: formatCurrencyVND(totals.expense),
            helper: "Kỳ hiện tại",
            icon: ArrowUpRight,
            tone: "from-rose-500 to-orange-500",
          },
          {
            label: "Giao dịch",
            value: String(transactions.length),
            helper: `${filteredTransactions.length} đang hiển thị`,
            icon: ArrowLeftRight,
            tone: "from-sky-500 to-cyan-500",
          },
          {
            label: "Chờ phân loại",
            value: String(totals.unclassified),
            helper: "Cần gắn danh mục",
            icon: CreditCard,
            tone: "from-amber-400 to-orange-500",
          },
        ]}
        tableTitle="Danh sách giao dịch"
        tableColumns={["Nội dung", "Danh mục", "Ngày", "Số tiền"]}
        tableRows={tableRows}
        sideTitle="Luồng tiền"
        sideDescription="Theo dõi tỷ trọng thu, chi và giao dịch cần xử lý trong kỳ."
        sideItems={[
          {
            label: "Thu nhập",
            value: formatCurrencyVND(totals.income),
            helper: "Tổng giao dịch thu",
            progress:
              totals.income + totals.expense > 0
                ? Math.round((totals.income / (totals.income + totals.expense)) * 100)
                : 0,
            tone: "bg-emerald-500",
          },
          {
            label: "Chi tiêu",
            value: formatCurrencyVND(totals.expense),
            helper: "Tổng giao dịch chi",
            progress:
              totals.income + totals.expense > 0
                ? Math.round((totals.expense / (totals.income + totals.expense)) * 100)
                : 0,
            tone: "bg-sky-500",
          },
          {
            label: "Tự động",
            value: `${totals.automatic} muc`,
            helper: "Nguồn đồng bộ ngân hàng",
            progress:
              transactions.length > 0
                ? Math.round((totals.automatic / transactions.length) * 100)
                : 0,
            tone: "bg-amber-400",
          },
        ]}
        bottomCards={[
          {
            title: "Lịch sử nhập liệu",
            description: "Gồm giao dịch thủ công và giao dịch đồng bộ.",
            value: `${transactions.length} mục`,
            icon: CalendarRange,
          },
          {
            title: "Nguồn giao dịch",
            description: "Theo dõi giao dịch thủ công và tự động.",
            value: `${totals.automatic + (transactions.length - totals.automatic > 0 ? 1 : 0)} nguồn`,
            icon: WalletCards,
          },
          {
            title: "Phân loại",
            description: "Giao dịch chưa có danh mục cần được xử lý.",
            value: `${totals.unclassified} cần xử lý`,
            icon: CreditCard,
          },
        ]}
        searchValue={search}
        searchPlaceholder="Tìm giao dịch..."
        onSearchChange={(event) => setSearch(event.target.value)}
        onAction={() => setIsFormOpen(true)}
        actionDisabled={loading || categories.length === 0}
        emptyMessage={loading ? "Đang tải giao dịch..." : "Chưa có giao dịch."}
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

      {isFormOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-lg rounded-[2rem] border border-white/80 bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between gap-4 border-b border-teal-100 pb-4">
              <div>
                <h2 className="text-xl font-black text-slate-950">
                  Thêm giao dịch
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  Lưu giao dịch vào hệ thống.
                </p>
              </div>
              <button
                type="button"
                className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
                onClick={() => setIsFormOpen(false)}
                aria-label="Đóng"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-5 grid gap-4">
              <div className="grid grid-cols-2 gap-2 rounded-full border border-teal-100 bg-slate-50 p-1">
                {(["EXPENSE", "INCOME"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormType(type)}
                    className={`h-10 rounded-full text-sm font-black transition ${
                      formType === type
                        ? "bg-white text-teal-800 shadow-sm"
                        : "text-slate-500"
                    }`}
                  >
                    {type === "EXPENSE" ? "Chi tiêu" : "Thu nhập"}
                  </button>
                ))}
              </div>

              <input
                type="text"
                inputMode="numeric"
                value={formAmount}
                onChange={(event) => {
                  setFormAmount(formatAmountInput(event.target.value));
                }}
                placeholder="Số tiền"
                required
                className="h-12 rounded-full border border-teal-100 px-5 text-sm font-bold outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/20"
              />

              <select
                value={selectedFormCategoryId}
                onChange={(event) => setFormCategoryId(event.target.value)}
                required
                className="h-12 rounded-full border border-teal-100 px-5 text-sm font-bold outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/20"
              >
                {visibleCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={formDate}
                onChange={(event) => setFormDate(event.target.value)}
                required
                className="h-12 rounded-full border border-teal-100 px-5 text-sm font-bold outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/20"
              />

              <textarea
                value={formNote}
                onChange={(event) => setFormNote(event.target.value)}
                placeholder="Ghi chú"
                className="min-h-24 rounded-[1.5rem] border border-teal-100 px-5 py-4 text-sm font-bold outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/20"
              />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="h-11 rounded-full border border-teal-100 px-5 text-sm font-black text-slate-600 hover:bg-teal-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-br from-sky-500 to-cyan-500 px-5 text-sm font-black text-white shadow-lg disabled:opacity-60"
              >
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : null}
                Lưu giao dịch
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
                  Chọn danh mục phù hợp để báo cáo và ngân sách chính xác hơn.
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
                <span className="font-semibold text-slate-500 dark:text-slate-400">
                  Nội dung
                </span>
                <span className="font-bold text-slate-950 dark:text-white">
                  {classifyTarget.note || classifyTarget.description || "Giao dịch"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="font-semibold text-slate-500 dark:text-slate-400">
                  Số tiền
                </span>
                <span className="font-bold text-slate-950 dark:text-white">
                  {signedAmount(classifyTarget)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="font-semibold text-slate-500 dark:text-slate-400">
                  Ngày
                </span>
                <span className="font-bold text-slate-950 dark:text-white">
                  {formatDate(classifyTarget.transactionDate ?? classifyTarget.date)}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="font-semibold text-slate-500 dark:text-slate-400">
                  Loại
                </span>
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
    </>
  );
}
