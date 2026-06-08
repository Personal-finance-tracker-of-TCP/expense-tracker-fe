// src/types/category.ts
export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: "INCOME" | "EXPENSE" | "BOTH";
  userId: string | null; // null = danh mục hệ thống
}