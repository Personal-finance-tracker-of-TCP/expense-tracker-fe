"use client";

import { Trash2 } from "lucide-react";
import type { Category } from "./CategoryCard";

interface DeleteCategoryDialogProps {
  isOpen: boolean;
  category: Category | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  submitting?: boolean;
}

export function DeleteCategoryDialog({
  isOpen,
  category,
  onClose,
  onConfirm,
  submitting = false,
}: DeleteCategoryDialogProps) {
  if (!isOpen || !category) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl border border-slate-200 p-6 flex flex-col gap-4">
        {/* Icon */}
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-500">
          <Trash2 className="h-6 w-6" />
        </div>

        {/* Text */}
        <div>
          <h2 className="text-base font-bold text-slate-800 mb-1">
            Xóa danh mục?
          </h2>
          <p className="text-sm text-slate-600 mb-1">
            Bạn muốn xóa danh mục{" "}
            <strong className="text-slate-800">&ldquo;{category.name}&rdquo;</strong>?
          </p>
          <p className="text-xs text-slate-400">
            Các giao dịch liên quan có thể được chuyển về{" "}
            <span className="font-medium text-slate-500">Chưa phân loại</span>.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            className="rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-600 active:scale-95 disabled:opacity-60 transition-all"
          >
            {submitting ? "Đang xóa..." : "Xóa danh mục"}
          </button>
        </div>
      </div>
    </div>
  );
}
