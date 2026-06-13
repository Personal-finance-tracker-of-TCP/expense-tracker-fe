"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BadgeDollarSign,
  CircleDot,
  Loader2,
  Palette,
  Plus,
  RefreshCw,
  Tags,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";

import {
  CategoryCard,
  isPersonalCategory,
  type Category,
} from "@/components/categories/CategoryCard";
import {
  CategoryFormModal,
  type CategoryFormData,
} from "@/components/categories/CategoryFormModal";
import { DeleteCategoryDialog } from "@/components/categories/DeleteCategoryDialog";
import { authFetch, getCurrentDemoPeriod } from "@/lib/moneytrack-api";

type CategoryFilter = "ALL" | "EXPENSE" | "INCOME" | "BOTH";

type Transaction = {
  id: string;
  categoryId?: string | null;
  classificationStatus?: "UNCLASSIFIED" | "CLASSIFIED" | "EXCLUDED";
};

type TransactionResponse = {
  transactions: Transaction[];
};

const { month: DEMO_MONTH, year: DEMO_YEAR } = getCurrentDemoPeriod();

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

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [usageMap, setUsageMap] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState<CategoryFilter>("ALL");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [categoryData, transactionData] = await Promise.all([
        authFetch<Category[]>("/api/categories"),
        authFetch<TransactionResponse>(
          `/api/transactions?month=${DEMO_MONTH}&year=${DEMO_YEAR}&limit=100`
        ),
      ]);

      const nextUsage = (transactionData.transactions || []).reduce<Record<string, number>>(
        (acc, transaction) => {
          if (
            transaction.categoryId &&
            transaction.classificationStatus !== "EXCLUDED"
          ) {
            acc[transaction.categoryId] = (acc[transaction.categoryId] || 0) + 1;
          }
          return acc;
        },
        {}
      );

      setCategories(categoryData);
      setUsageMap(nextUsage);
    } catch (err) {
      setError(getErrorMessage(err, "Không thể tải danh mục từ backend"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    queueMicrotask(() => {
      if (active) {
        void loadData();
      }
    });

    return () => {
      active = false;
    };
  }, [loadData]);

  const stats = useMemo(() => {
    const personalCount = categories.filter(isPersonalCategory).length;
    const incomeCount = categories.filter(
      (category) => category.type === "INCOME" || category.type === "BOTH"
    ).length;
    const expenseCount = categories.filter(
      (category) => category.type === "EXPENSE" || category.type === "BOTH"
    ).length;
    const activeCount = Object.keys(usageMap).length;

    return { personalCount, incomeCount, expenseCount, activeCount };
  }, [categories, usageMap]);

  const visibleCategories = useMemo(() => {
    if (filter === "ALL") return categories;
    return categories.filter((category) => category.type === filter);
  }, [categories, filter]);

  const topUsage = useMemo(() => {
    return categories
      .map((category) => ({
        category,
        count: usageMap[category.id] || 0,
      }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [categories, usageMap]);

  async function handleSubmit(data: CategoryFormData) {
    setSubmitting(true);
    try {
      if (editCategory) {
        await authFetch(`/api/categories/${editCategory.id}`, {
          method: "PUT",
          body: JSON.stringify(data),
        });
        toast.success("Đã cập nhật danh mục.");
      } else {
        await authFetch("/api/categories", {
          method: "POST",
          body: JSON.stringify(data),
        });
        toast.success("Đã tạo danh mục.");
      }

      setFormOpen(false);
      setEditCategory(null);
      await loadData();
    } catch (err) {
      toast.error(getErrorMessage(err, "Không thể lưu danh mục"));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteCategory) return;

    setSubmitting(true);
    try {
      await authFetch(`/api/categories/${deleteCategory.id}`, {
        method: "DELETE",
      });
      toast.success("Đã xóa danh mục.");
      setDeleteCategory(null);
      await loadData();
    } catch (err) {
      toast.error(getErrorMessage(err, "Không thể xóa danh mục"));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto flex min-h-[420px] max-w-7xl items-center justify-center">
        <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white px-6 py-5 text-sm font-bold text-slate-500 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
          Đang tải danh mục từ backend...
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
              <h1 className="text-lg font-black text-slate-950">Không tải được danh mục</h1>
              <p className="mt-1 text-sm font-medium text-slate-500">{error}</p>
              <button
                type="button"
                onClick={() => loadData()}
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
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Danh mục"
          value={String(categories.length)}
          helper={`${stats.personalCount} danh mục cá nhân`}
          icon={Tags}
          tone="from-amber-400 to-orange-500"
        />
        <MetricCard
          label="Đang dùng"
          value={String(stats.activeCount)}
          helper={`Tính theo tháng ${DEMO_MONTH}/${DEMO_YEAR}`}
          icon={CircleDot}
          tone="from-teal-500 to-cyan-500"
        />
        <MetricCard
          label="Thu nhập"
          value={String(stats.incomeCount)}
          helper="Bao gồm danh mục dùng chung cả hai loại"
          icon={BadgeDollarSign}
          tone="from-emerald-500 to-teal-500"
        />
        <MetricCard
          label="Chi tiêu"
          value={String(stats.expenseCount)}
          helper="Sẵn sàng dùng cho budgets và reports"
          icon={Palette}
          tone="from-fuchsia-500 to-rose-500"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-[2rem] border border-white/80 bg-white/88 p-5 shadow-xl shadow-teal-950/[0.06] backdrop-blur sm:p-6">
          <div className="flex flex-col gap-4 border-b border-teal-100 pb-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-black text-slate-950">Bộ danh mục</h1>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Danh mục hệ thống và danh mục cá nhân được lấy từ `/api/categories`.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  ["ALL", "Tất cả"],
                  ["EXPENSE", "Chi tiêu"],
                  ["INCOME", "Thu nhập"],
                  ["BOTH", "Cả hai"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFilter(value as CategoryFilter)}
                    className={`rounded-full border px-3 py-1 text-xs font-black transition ${
                      filter === value
                        ? "border-teal-600 bg-teal-600 text-white"
                        : "border-teal-100 bg-teal-50 text-teal-800 hover:bg-teal-100"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setEditCategory(null);
                setFormOpen(true);
              }}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 px-5 text-sm font-black text-white shadow-lg transition hover:-translate-y-0.5"
            >
              <Plus className="h-4 w-4" />
              Tạo danh mục
            </button>
          </div>

          {visibleCategories.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-dashed border-slate-200 bg-slate-50/80 p-8 text-center">
              <p className="text-sm font-black text-slate-700">Không có danh mục phù hợp.</p>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visibleCategories.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  onEdit={(nextCategory) => {
                    setEditCategory(nextCategory);
                    setFormOpen(true);
                  }}
                  onDelete={(nextCategory) => setDeleteCategory(nextCategory)}
                />
              ))}
            </div>
          )}
        </section>

        <aside className="rounded-[2rem] border border-white/80 bg-white/88 p-6 shadow-xl shadow-teal-950/[0.06] backdrop-blur">
          <h2 className="text-2xl font-black text-slate-950">Sử dụng tháng này</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Dựa trên các giao dịch đã gắn category trong tháng {DEMO_MONTH}/{DEMO_YEAR}.
          </p>

          <div className="mt-6 space-y-4">
            {topUsage.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm font-semibold text-slate-500">
                Chưa có giao dịch nào dùng danh mục trong kỳ này.
              </div>
            ) : (
              topUsage.map(({ category, count }) => {
                const maxCount = Math.max(...topUsage.map((item) => item.count));
                const percent = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;

                return (
                  <div
                    key={category.id}
                    className="rounded-[1.5rem] border border-teal-100 bg-slate-50/80 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-slate-950">
                          {category.icon ? `${category.icon} ` : ""}
                          {category.name}
                        </p>
                        <p className="mt-1 text-xs font-medium text-slate-500">
                          {isPersonalCategory(category) ? "Danh mục cá nhân" : "Danh mục hệ thống"}
                        </p>
                      </div>
                      <p className="text-sm font-black text-teal-700">{count} giao dịch</p>
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

      <CategoryFormModal
        isOpen={formOpen}
        editCategory={editCategory}
        submitting={submitting}
        onClose={() => {
          setFormOpen(false);
          setEditCategory(null);
        }}
        onSubmit={handleSubmit}
      />
      <DeleteCategoryDialog
        isOpen={Boolean(deleteCategory)}
        category={deleteCategory}
        submitting={submitting}
        onClose={() => setDeleteCategory(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
