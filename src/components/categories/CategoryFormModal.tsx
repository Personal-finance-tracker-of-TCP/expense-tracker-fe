"use client";

import { FormEvent, useEffect, useState } from "react";
import { X } from "lucide-react";
import type { Category } from "./CategoryCard";

const ICONS = [
  "🍔", "☕", "🚌", "🚕", "🛒", "🎮",
  "💼", "💰", "🎁", "📚", "🏥", "🧾",
  "✈️", "🏠", "⚡", "📱", "🐶", "🎬",
  "🏋️", "🛍️", "🍜", "🧋", "🛵", "💻",
];

const COLORS = [
  "#10B981", // emerald
  "#3B82F6", // blue
  "#EF4444", // red
  "#F97316", // orange
  "#F59E0B", // amber
  "#8B5CF6", // purple
  "#06B6D4", // cyan
  "#64748B", // slate
];

const DEFAULT_ICON = "🍔";
const DEFAULT_COLOR = "#10B981";

const TYPE_OPTIONS = [
  { key: "EXPENSE" as const, label: "Chi tiêu", active: "bg-rose-500 text-white border-rose-500 shadow-sm" },
  { key: "INCOME" as const, label: "Thu nhập", active: "bg-emerald-500 text-white border-emerald-500 shadow-sm" },
  { key: "BOTH" as const, label: "Cả hai", active: "bg-violet-500 text-white border-violet-500 shadow-sm" },
];

const TYPE_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  EXPENSE: { bg: "bg-rose-100", text: "text-rose-700", label: "Chi tiêu" },
  INCOME: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Thu nhập" },
  BOTH: { bg: "bg-violet-100", text: "text-violet-700", label: "Cả hai" },
};

export type CategoryFormData = {
  name: string;
  type: "INCOME" | "EXPENSE" | "BOTH";
  icon: string;
  color: string;
};

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CategoryFormData) => Promise<void>;
  editCategory?: Category | null;
  submitting?: boolean;
}

export function CategoryFormModal({
  isOpen,
  onClose,
  onSubmit,
  editCategory,
  submitting = false,
}: CategoryFormModalProps) {
  const isEditing = !!editCategory;

  const [name, setName] = useState("");
  const [type, setType] = useState<"INCOME" | "EXPENSE" | "BOTH">("EXPENSE");
  const [icon, setIcon] = useState(DEFAULT_ICON);
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [nameError, setNameError] = useState("");

  // Reset form whenever modal opens
  useEffect(() => {
    if (!isOpen) return;
    if (editCategory) {
      setName(editCategory.name);
      setType((editCategory.type || "EXPENSE") as "INCOME" | "EXPENSE" | "BOTH");
      setIcon(editCategory.icon || DEFAULT_ICON);
      setColor(editCategory.color || DEFAULT_COLOR);
    } else {
      setName("");
      setType("EXPENSE");
      setIcon(DEFAULT_ICON);
      setColor(DEFAULT_COLOR);
    }
    setNameError("");
  }, [isOpen, editCategory]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setNameError("Tên danh mục không được để trống");
      return;
    }
    setNameError("");
    await onSubmit({ name: name.trim(), type, icon, color });
  }

  if (!isOpen) return null;

  const badge = TYPE_BADGE[type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header stripe */}
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4 flex items-start justify-between shrink-0">
          <div>
            <h2 className="text-base font-bold text-white">
              {isEditing ? "Sửa danh mục" : "Thêm danh mục mới"}
            </h2>
            <p className="text-xs text-emerald-100 mt-0.5">
              {isEditing
                ? "Chỉnh sửa thông tin danh mục cá nhân"
                : "Tạo danh mục cá nhân của bạn"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ml-4 mt-0.5 rounded-lg p-1 text-white/70 hover:text-white hover:bg-white/20 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} className="flex flex-col min-h-0">
          <div className="overflow-y-auto p-5 flex flex-col gap-5">
            {/* Live Preview */}
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl"
                style={{
                  backgroundColor: color + "33",
                  border: `2px solid ${color}66`,
                }}
              >
                {icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">
                  {name.trim() || "Tên danh mục..."}
                </p>
                <div className="flex gap-1 mt-1 flex-wrap">
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-tight ${badge.bg} ${badge.text}`}
                  >
                    {badge.label}
                  </span>
                  <span className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-tight bg-blue-100 text-blue-700">
                    Của tôi
                  </span>
                </div>
              </div>
            </div>

            {/* Name field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tên danh mục <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setNameError(""); }}
                placeholder="Ví dụ: Cà phê, Freelance, Mua sách..."
                maxLength={50}
                className={`w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition ${
                  nameError ? "border-rose-400" : "border-slate-200"
                }`}
              />
              {nameError && (
                <p className="mt-1 text-xs text-rose-500">{nameError}</p>
              )}
            </div>

            {/* Type segmented control */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Loại danh mục <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1">
                {TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setType(opt.key)}
                    className={`rounded-lg py-2 text-xs font-semibold transition-all border ${
                      type === opt.key
                        ? opt.active
                        : "bg-transparent text-slate-500 border-transparent hover:bg-white hover:text-slate-700"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Icon picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Chọn icon
              </label>
              <div className="grid grid-cols-8 gap-1 rounded-xl border border-slate-200 bg-slate-50 p-2">
                {ICONS.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setIcon(ic)}
                    title={ic}
                    className={`flex items-center justify-center rounded-lg text-xl py-1.5 transition-all ${
                      icon === ic
                        ? "bg-white ring-2 ring-emerald-400 shadow-sm scale-105"
                        : "hover:bg-white hover:shadow-sm"
                    }`}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>

            {/* Color picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Chọn màu sắc
              </label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`h-9 w-9 rounded-full transition-all hover:scale-110 flex items-center justify-center shadow-sm ${
                      color === c ? "ring-2 ring-offset-2 ring-slate-400 scale-110" : ""
                    }`}
                    style={{ backgroundColor: c }}
                    title={c}
                  >
                    {color === c && (
                      <span className="text-white text-xs font-bold drop-shadow">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0 flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-emerald-500 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 active:scale-95 disabled:opacity-60 transition-all"
            >
              {submitting
                ? "Đang lưu..."
                : isEditing
                ? "Lưu thay đổi"
                : "Tạo danh mục"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
