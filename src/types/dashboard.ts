// GET /api/reports/summary
export interface SummaryData {
  totalIncome: number;
  totalExpense: number;
  savings: number;
  savingsRate: number;
}

// GET /api/reports/chart
export interface ChartMonth {
  month: number;   // số nguyên, không phải "2025-01"
  year: number;
  income: number;
  expense: number;
}

export interface CategoryBreakdown {
  categoryId: string;
  name: string;
  icon: string;
  total: number;
}

export interface ChartData {
  chartData: ChartMonth[];
  categoryBreakdown: CategoryBreakdown[];
}

// GET /api/transactions
export interface Transaction {
  id: string;
  userId: string;
  categoryId: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  note: string | null;
  transactionDate: string;
  source: "MANUAL" | "SEPAY";
  sepayId: string | null;
  createdAt: string;
  category: {
    id: string;
    name: string;
    icon: string;
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

// Budget — chưa có BE, dùng tạm
export interface Budget {
  id: string;
  limitAmount: number;
  spent: number;
  percentage: number;
  category: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
}