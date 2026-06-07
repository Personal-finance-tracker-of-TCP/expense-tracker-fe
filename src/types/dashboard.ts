// types/dashboard.ts
export interface SummaryData {
  balance: number;
  income: number;
  expense: number;
  month: number;
  year: number;
}

export interface ChartMonth {
  month: string;   // "2025-01", "2025-02", ...
  income: number;
  expense: number;
}

export interface Transaction {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  note: string | null;
  transactionDate: string;
  source: "MANUAL" | "SEPAY";
  category: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
}

export interface Budget {
  id: string;
  limitAmount: number;
  spent: number;        // BE trả về từ GET /api/budgets
  percentage: number;   // spent / limitAmount * 100
  category: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
}