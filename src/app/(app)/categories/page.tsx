"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BadgeDollarSign,
  CircleDot,
  Palette,
  Pencil,
  Tag,
  Tags,
  Trash2,
  Utensils,
} from "lucide-react";

import {
  isPersonalCategory,
  type Category,
} from "@/components/categories/CategoryCard";
import {
  CategoryFormModal,
  type CategoryFormData,
} from "@/components/categories/CategoryFormModal";
import { WorkspaceMockup } from "@/components/layout/WorkspaceMockup";
import { authFetch, getCurrentDemoPeriod } from "@/lib/moneytrack-api";

type Transaction = {
  id: string;
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

function typeLabel(type?: string) {
  if (type === "INCOME") return "Thu nhập";
  if (type === "EXPENSE") return "Chi tiêu";
  return "Cả hai";
}

function colorLabel(color?: string | null) {
  return color || "Mặc định";
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [categoryData, transactionData] = await Promise.all([
        authFetch<Category[]>("/api/categories"),
        authFetch<TransactionListResponse>(
          `/api/transactions?month=${DEFAULT_MONTH}&year=${DEFAULT_YEAR}&limit=100`
        ).catch(() => ({ transactions: [] })),
      ]);

      setCategories(categoryData || []);
      setTransactions(getTransactions(transactionData));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải danh mục");
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

  const usageByCategory = useMemo(() => {
    return transactions.reduce<Record<string, number>>((acc, transaction) => {
      const categoryId = transaction.categoryId || transaction.category?.id;
      if (categoryId) acc[categoryId] = (acc[categoryId] || 0) + 1;
      return acc;
    }, {});
  }, [transactions]);

  const filteredCategories = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const nextCategories = keyword
      ? categories.filter((category) =>
          [category.name, category.type, category.color]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(keyword)
        )
      : categories;

    return [...nextCategories].sort((a, b) => {
      const personalSort =
        Number(isPersonalCategory(b)) - Number(isPersonalCategory(a));

      if (personalSort !== 0) return personalSort;
      return a.name.localeCompare(b.name, "vi");
    });
  }, [categories, search]);

  const stats = useMemo(() => {
    const incomeCount = categories.filter(
      (category) => category.type === "INCOME"
    ).length;
    const expenseCount = categories.filter(
      (category) => category.type === "EXPENSE"
    ).length;
    const usedCount = categories.filter(
      (category) => usageByCategory[category.id] > 0
    ).length;
    const configuredCount = categories.filter(
      (category) => category.color || category.icon
    ).length;
    const personalCount = categories.filter(
      (category) => !!category.userId && !category.isDefault
    ).length;

    return {
      incomeCount,
      expenseCount,
      usedCount,
      configuredCount,
      personalCount,
    };
  }, [categories, usageByCategory]);

  function openCreateModal() {
    setEditCategory(null);
    setIsModalOpen(true);
  }

  function openEditModal(category: Category) {
    if (!isPersonalCategory(category)) {
      setError("Chỉ có thể sửa danh mục cá nhân.");
      return;
    }

    setEditCategory(category);
    setIsModalOpen(true);
  }

  async function handleSubmit(data: CategoryFormData) {
    setSubmitting(true);
    setError(null);
    try {
      if (editCategory) {
        if (!isPersonalCategory(editCategory)) {
          setError("Chỉ có thể sửa danh mục cá nhân.");
          return;
        }

        await authFetch(`/api/categories/${editCategory.id}`, {
          method: "PUT",
          body: JSON.stringify(data),
        });
        setNotice("Đã cập nhật danh mục");
      } else {
        await authFetch("/api/categories", {
          method: "POST",
          body: JSON.stringify(data),
        });
        setNotice("Đã tạo danh mục");
      }

      setIsModalOpen(false);
      setEditCategory(null);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể lưu danh mục");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(category: Category) {
    if (!isPersonalCategory(category)) {
      setError("Chỉ có thể xóa danh mục cá nhân.");
      return;
    }

    if (!window.confirm(`Xóa danh mục "${category.name}"?`)) {
      return;
    }

    setError(null);
    try {
      await authFetch(`/api/categories/${category.id}`, { method: "DELETE" });
      setNotice("Đã xóa danh mục");
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể xóa danh mục");
    }
  }

  const tableRows = filteredCategories.map((category) => {
    const usageCount = usageByCategory[category.id] || 0;
    const personal = isPersonalCategory(category);

    return {
      cells: [
        `${category.icon || ""} ${category.name}`.trim(),
        typeLabel(category.type),
        colorLabel(category.color),
        `${usageCount} giao dịch`,
      ],
      status: personal ? "Cá nhân" : "Mặc định",
      tone: personal ? "bg-blue-50 text-blue-700" : "bg-teal-50 text-teal-700",
      actions: personal ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openEditModal(category)}
            className="inline-flex h-8 items-center gap-1 rounded-full bg-slate-100 px-3 text-xs font-black text-slate-700 hover:bg-slate-200"
          >
            <Pencil className="size-3" aria-hidden="true" />
            Sửa
          </button>
          <button
            type="button"
            onClick={() => void handleDelete(category)}
            className="inline-flex h-8 items-center gap-1 rounded-full bg-rose-50 px-3 text-xs font-black text-rose-700 hover:bg-rose-100"
          >
            <Trash2 className="size-3" aria-hidden="true" />
            Xóa
          </button>
        </div>
      ) : null,
    };
  });

  const mostUsed = [...categories]
    .sort((a, b) => (usageByCategory[b.id] || 0) - (usageByCategory[a.id] || 0))
    .slice(0, 3);

  return (
    <>
      <WorkspaceMockup
        actionLabel={loading ? "Đang tải" : "Tạo danh mục"}
        accent="from-amber-400 to-orange-500"
        filters={["Tất cả", "Chi tiêu", "Thu nhập"]}
        metrics={[
          {
            label: "Danh mục",
            value: String(categories.length),
            helper: `${stats.expenseCount} chi tiêu, ${stats.incomeCount} thu nhập`,
            icon: Tags,
            tone: "from-amber-400 to-orange-500",
          },
          {
            label: "Đang dùng",
            value: String(stats.usedCount),
            helper: "Có giao dịch trong tháng",
            icon: CircleDot,
            tone: "from-teal-500 to-cyan-500",
          },
          {
            label: "Thu nhập",
            value: String(stats.incomeCount),
            helper: "Nhóm danh mục ghi nhận tiền vào",
            icon: BadgeDollarSign,
            tone: "from-emerald-500 to-teal-500",
          },
          {
            label: "Màu & icon",
            value: `${stats.configuredCount}/${categories.length}`,
            helper: "Sẵn sàng cho báo cáo",
            icon: Palette,
            tone: "from-fuchsia-500 to-rose-500",
          },
        ]}
        tableTitle="Bộ danh mục"
        tableColumns={["Tên danh mục", "Loại", "Màu", "Giao dịch"]}
        tableRows={tableRows}
        sideTitle="Phân bổ sử dụng"
        sideDescription="Đếm giao dịch thật theo danh mục trong kỳ hiện tại."
        sideItems={
          mostUsed.length > 0
            ? mostUsed.map((category) => {
                const count = usageByCategory[category.id] || 0;
                const percent =
                  transactions.length > 0
                    ? Math.round((count / transactions.length) * 100)
                    : 0;
                return {
                  label: category.name,
                  value: `${percent}%`,
                  helper: `${count} giao dịch`,
                  progress: percent,
                  tone: "bg-teal-500",
                };
              })
            : [
                {
                  label: "Chưa có sử dụng",
                  value: "0%",
                  helper: "Chưa có giao dịch gắn danh mục",
                  progress: 0,
                  tone: "bg-teal-500",
                },
              ]
        }
        bottomCards={[
          {
            title: "Danh mục mặc định",
            description: "Danh mục hệ thống trả về từ backend.",
            value: String(categories.length - stats.personalCount),
            icon: Tag,
          },
          {
            title: "Danh mục cá nhân",
            description: "Danh mục người dùng tự tạo.",
            value: String(stats.personalCount),
            icon: Utensils,
          },
          {
            title: "Bảng màu",
            description: "Màu sắc đọc từ cấu hình danh mục.",
            value: `${
              new Set(categories.map((category) => category.color).filter(Boolean))
                .size
            } màu`,
            icon: Palette,
          },
        ]}
        searchValue={search}
        searchPlaceholder="Tìm danh mục..."
        onSearchChange={(event) => setSearch(event.target.value)}
        onAction={openCreateModal}
        actionDisabled={loading}
        emptyMessage={loading ? "Đang tải danh mục..." : "Chưa có danh mục."}
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

      <CategoryFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditCategory(null);
        }}
        onSubmit={handleSubmit}
        editCategory={editCategory}
        submitting={submitting}
      />
    </>
  );
}
