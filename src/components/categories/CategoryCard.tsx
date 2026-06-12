"use client";

import { Pencil, Trash2 } from "lucide-react";

export type Category = {
  id: string;
  name: string;
  icon?: string | null;
  color?: string | null;
  type?: "INCOME" | "EXPENSE" | "BOTH";
  isDefault?: boolean;
  userId?: string | null;
};

const TYPE_CONFIG = {
  INCOME: { label: "Thu nhập", bg: "bg-emerald-100", text: "text-emerald-700" },
  EXPENSE: { label: "Chi tiêu", bg: "bg-rose-100", text: "text-rose-700" },
  BOTH: { label: "Cả hai", bg: "bg-violet-100", text: "text-violet-700" },
};

const FALLBACK_ICON: Record<string, string> = {
  INCOME: "💰",
  EXPENSE: "🧾",
  BOTH: "📦",
};

const FALLBACK_COLOR: Record<string, string> = {
  INCOME: "#10B981",
  EXPENSE: "#EF4444",
  BOTH: "#8B5CF6",
};

interface CategoryCardProps {
  category: Category;
  onEdit?: (cat: Category) => void;
  onDelete?: (cat: Category) => void;
}

export function isPersonalCategory(cat: Category) {
  return !!cat.userId && !cat.isDefault;
}

export function CategoryCard({ category, onEdit, onDelete }: CategoryCardProps) {
  const personal = isPersonalCategory(category);
  const typeKey = (category.type || "BOTH") as "INCOME" | "EXPENSE" | "BOTH";
  const typeConf = TYPE_CONFIG[typeKey];
  const icon = category.icon || FALLBACK_ICON[typeKey];
  const color = category.color || FALLBACK_COLOR[typeKey];

  return (
    <div className="group relative flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
      {/* Badges — top right */}
      <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold leading-tight ${typeConf.bg} ${typeConf.text}`}
        >
          {typeConf.label}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold leading-tight ${
            personal
              ? "bg-blue-100 text-blue-700"
              : "bg-slate-100 text-slate-600"
          }`}
        >
          {personal ? "Của tôi" : "Mặc định"}
        </span>
      </div>

      {/* Icon circle */}
      <div
        className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl shadow-sm"
        style={{
          backgroundColor: color + "22",
          border: `2px solid ${color}44`,
        }}
      >
        {icon}
      </div>

      {/* Name + subtitle */}
      <div className="flex-1">
        <p className="text-sm font-bold text-slate-800 leading-tight pr-14">
          {category.name}
        </p>
        <p className="mt-0.5 text-xs text-slate-400">
          {personal ? "Danh mục cá nhân" : "Danh mục hệ thống"}
        </p>
      </div>

      {/* Actions — personal only */}
      {personal && (
        <div className="flex gap-2 pt-1 border-t border-slate-100">
          <button
            onClick={() => onEdit?.(category)}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 active:scale-95 transition-all"
          >
            <Pencil className="h-3 w-3" />
            Sửa
          </button>
          <button
            onClick={() => onDelete?.(category)}
            className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 active:scale-95 transition-all"
          >
            <Trash2 className="h-3 w-3" />
            Xóa
          </button>
        </div>
      )}
    </div>
  );
}
