"use client";

import { useEffect, useState, useMemo } from "react";
import { Plus, Search, Tag, X, AlertCircle, RefreshCcw, Layers, ArrowUpRight, ArrowDownRight, User } from "lucide-react";
import { authFetch } from "@/lib/moneytrack-api";
import { CategoryCard, isPersonalCategory } from "@/components/categories/CategoryCard";
import type { Category } from "@/components/categories/CategoryCard";
import { CategoryFormModal } from "@/components/categories/CategoryFormModal";
import type { CategoryFormData } from "@/components/categories/CategoryFormModal";
import { DeleteCategoryDialog } from "@/components/categories/DeleteCategoryDialog";

type FilterTab = "ALL" | "EXPENSE" | "INCOME" | "BOTH" | "DEFAULT" | "MY";

type UserInfo = {
  name?: string;
  email?: string;
  role?: string;
  avatarUrl?: string | null;
};

export default function CategoriesPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");

  // Add/Edit Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Delete Confirm State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Load user info from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const rawUser = localStorage.getItem("user");
        if (rawUser) {
          setUser(JSON.parse(rawUser));
        }
      } catch (e) {}
    }
  }, []);

  // Fetch categories from backend API
  const loadCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await authFetch<Category[]>("/api/categories");
      setCategories(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải danh sách danh mục");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Notice auto-dismiss
  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => setNotice(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notice]);

  // Statistics summaries
  const stats = useMemo(() => {
    const total = categories.length;
    const expense = categories.filter((c) => c.type === "EXPENSE").length;
    const income = categories.filter((c) => c.type === "INCOME").length;
    const personal = categories.filter((c) => isPersonalCategory(c)).length;

    return { total, expense, income, personal };
  }, [categories]);

  // Filter and Search logic
  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        if (!cat.name.toLowerCase().includes(q)) {
          return false;
        }
      }

      // 2. Tab filter
      switch (activeTab) {
        case "EXPENSE":
          return cat.type === "EXPENSE";
        case "INCOME":
          return cat.type === "INCOME";
        case "BOTH":
          return cat.type === "BOTH";
        case "DEFAULT":
          return cat.userId === null || cat.isDefault === true;
        case "MY":
          return isPersonalCategory(cat);
        case "ALL":
        default:
          return true;
      }
    });
  }, [categories, searchQuery, activeTab]);

  // Group filtered results into Default and Personal
  const groupedCategories = useMemo(() => {
    const defaults = filteredCategories.filter((c) => c.userId === null || c.isDefault === true);
    const mine = filteredCategories.filter((c) => isPersonalCategory(c));
    return { defaults, mine };
  }, [filteredCategories]);

  // Open Form for Add
  const handleOpenAdd = () => {
    setEditCategory(null);
    setIsFormOpen(true);
  };

  // Open Form for Edit
  const handleOpenEdit = (category: Category) => {
    setEditCategory(category);
    setIsFormOpen(true);
  };

  // Open Delete Confirm
  const handleOpenDelete = (category: Category) => {
    setDeleteTarget(category);
    setIsDeleteOpen(true);
  };

  // Handle Form Submission (Create or Update)
  const handleFormSubmit = async (formData: CategoryFormData) => {
    setSubmitting(true);
    setError(null);
    try {
      if (editCategory) {
        // Edit mode
        await authFetch(`/api/categories/${editCategory.id}`, {
          method: "PUT",
          body: JSON.stringify(formData),
        });
        setNotice(`Cập nhật danh mục "${formData.name}" thành công.`);
      } else {
        // Add mode
        await authFetch("/api/categories", {
          method: "POST",
          body: JSON.stringify(formData),
        });
        setNotice(`Tạo danh mục cá nhân "${formData.name}" thành công.`);
      }
      setIsFormOpen(false);
      await loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi khi lưu danh mục");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Confirmation
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setError(null);
    try {
      await authFetch(`/api/categories/${deleteTarget.id}`, {
        method: "DELETE",
      });
      setNotice(`Xóa danh mục "${deleteTarget.name}" thành công.`);
      setIsDeleteOpen(false);
      setDeleteTarget(null);
      await loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể xóa danh mục");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <main className="mx-auto max-w-7xl flex flex-col gap-6 px-1 py-3 sm:px-2">
      {/* Top Page Header */}
      <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-transparent px-2">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
            Phân loại
          </span>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight mt-1">
            Danh mục
          </h1>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            Quản lý danh mục dùng cho giao dịch, ngân sách và báo cáo
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {/* Refresh Button */}
          <button
            onClick={loadCategories}
            type="button"
            className="h-10 w-10 shrink-0 flex items-center justify-center rounded-full border border-slate-200/80 bg-white hover:bg-slate-50 text-slate-500 transition-colors"
            aria-label="Tải lại danh mục"
          >
            <RefreshCcw className="h-4.5 w-4.5" />
          </button>

          {/* Add Category Button */}
          <button
            onClick={handleOpenAdd}
            type="button"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-600 px-5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all duration-150 active:scale-95"
          >
            <Plus className="h-4.5 w-4.5 stroke-[3]" />
            <span>Thêm danh mục</span>
          </button>
        </div>
      </section>

      {/* Notifications */}
      {error && (
        <div className="mx-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 shadow-sm flex items-center justify-between">
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
        <div className="mx-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-700 shadow-sm flex items-center justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Statistics Cards */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 px-2">
        {/* Total Categories */}
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 shadow-inner">
            <Tag className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Tổng danh mục
            </p>
            <p className="text-2xl font-extrabold text-slate-800 mt-0.5">
              {loading ? "..." : stats.total}
            </p>
          </div>
        </div>

        {/* Expenses Categories */}
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 shadow-inner">
            <ArrowDownRight className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Chi tiêu
            </p>
            <p className="text-2xl font-extrabold text-slate-800 mt-0.5">
              {loading ? "..." : stats.expense}
            </p>
          </div>
        </div>

        {/* Income Categories */}
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 shadow-inner">
            <ArrowUpRight className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Thu nhập
            </p>
            <p className="text-2xl font-extrabold text-slate-800 mt-0.5">
              {loading ? "..." : stats.income}
            </p>
          </div>
        </div>

        {/* Personal Categories */}
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-inner">
            <User className="h-6 w-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Của tôi
            </p>
            <p className="text-2xl font-extrabold text-slate-800 mt-0.5">
              {loading ? "..." : stats.personal}
            </p>
          </div>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <section className="bg-white rounded-3xl border border-slate-100 p-4 shadow-sm mx-2 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Tìm danh mục..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-2xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="w-full md:w-auto overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1.5 min-w-max">
            {[
              { id: "ALL", label: "Tất cả" },
              { id: "EXPENSE", label: "Chi tiêu" },
              { id: "INCOME", label: "Thu nhập" },
              { id: "BOTH", label: "Cả hai" },
              { id: "DEFAULT", label: "Mặc định" },
              { id: "MY", label: "Của tôi" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as FilterTab)}
                type="button"
                className={`px-4 py-2 text-xs font-bold rounded-2xl border transition-all ${
                  activeTab === tab.id
                    ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                    : "bg-slate-50 text-slate-500 border-slate-100 hover:bg-slate-100 hover:text-slate-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content Grid / Lists */}
      <section className="px-2 space-y-8 min-h-[300px]">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-32 rounded-3xl bg-slate-200/60 border border-slate-100" />
            ))}
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="py-12">
            {activeTab === "MY" && stats.personal === 0 ? (
              <div className="flex flex-col items-center text-center p-8 rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 max-w-md mx-auto">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm border border-slate-100 mb-4">
                  <Tag className="h-6 w-6 text-emerald-500" />
                </div>
                <h3 className="font-extrabold text-slate-800 text-base">Bạn chưa có danh mục cá nhân nào</h3>
                <p className="mt-1.5 text-xs text-slate-400 max-w-[280px] leading-relaxed">
                  Tạo danh mục cá nhân để phân loại các chi tiêu hoặc thu nhập đặc thù của bạn.
                </p>
                <button
                  onClick={handleOpenAdd}
                  className="mt-5 px-5 py-2.5 rounded-2xl bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-500/10 hover:bg-emerald-600 transition active:scale-95"
                >
                  Tạo danh mục đầu tiên
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center p-8 rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 max-w-md mx-auto">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm border border-slate-100 mb-4">
                  <Layers className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">Không tìm thấy danh mục phù hợp</h3>
                <p className="mt-1 text-xs text-slate-400">
                  Vui lòng thử tìm với từ khóa khác hoặc thay đổi bộ lọc.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Default System Categories Section */}
            {groupedCategories.defaults.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-slate-700">
                    Danh mục mặc định
                  </h2>
                  <span className="rounded-full bg-slate-100 text-slate-500 px-2 py-0.5 text-xs font-bold">
                    {groupedCategories.defaults.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {groupedCategories.defaults.map((category) => (
                    <CategoryCard
                      key={category.id}
                      category={category}
                      onEdit={handleOpenEdit}
                      onDelete={handleOpenDelete}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* My Categories Section */}
            {(groupedCategories.mine.length > 0 || activeTab === "ALL" || activeTab === "MY") && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-slate-700">
                    Danh mục của tôi
                  </h2>
                  <span className="rounded-full bg-emerald-50 text-emerald-600 px-2 py-0.5 text-xs font-bold">
                    {groupedCategories.mine.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {groupedCategories.mine.map((category) => (
                    <CategoryCard
                      key={category.id}
                      category={category}
                      onEdit={handleOpenEdit}
                      onDelete={handleOpenDelete}
                    />
                  ))}

                  {/* Dashed Add Card */}
                  <button
                    onClick={handleOpenAdd}
                    type="button"
                    className="flex flex-col items-center justify-center p-6 min-h-[140px] rounded-2xl border-2 border-dashed border-slate-200/80 bg-white/50 hover:bg-white hover:border-emerald-300 hover:text-emerald-600 text-slate-400 transition-all duration-150 group"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 border border-slate-100 text-slate-400 group-hover:bg-emerald-50 group-hover:border-emerald-100 group-hover:text-emerald-500 transition-all">
                      <Plus className="h-5 w-5 stroke-[2.5]" />
                    </span>
                    <span className="mt-3 text-xs font-extrabold text-slate-500 group-hover:text-emerald-600">
                      Thêm danh mục
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Create / Edit Form Modal */}
      <CategoryFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        editCategory={editCategory}
        submitting={submitting}
      />

      {/* Delete Confirmation Modal */}
      <DeleteCategoryDialog
        isOpen={isDeleteOpen}
        category={deleteTarget}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        submitting={deleting}
      />
    </main>
  );
}
