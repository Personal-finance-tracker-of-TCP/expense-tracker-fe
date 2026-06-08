// src/types/transaction.ts
export type TransactionType = "INCOME" | "EXPENSE";
export type TransactionSource = "MANUAL" | "SEPAY";

export interface Transaction {
  id: string;
  userId: string;
  categoryId: string;
  type: TransactionType;
  amount: number;
  note: string | null;
  transactionDate: string;
  source: TransactionSource;
  sepayId: string | null;
  createdAt: string;
  category: {
    id: string;
    name: string;
    icon: string;
    color?: string;
  };
}

export interface TransactionListResponse {
  transactions: Transaction[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Dùng cho form tạo / sửa
export interface TransactionFormValues {
  type: TransactionType;
  amount: number;
  categoryId: string;
  transactionDate: string;
  note?: string;
}

// Dùng cho filter params
export interface TransactionFilters {
  month: number;
  year: number;
  type?: TransactionType | "ALL";
  page?: number;
}