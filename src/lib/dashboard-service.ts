import { authFetch } from "./moneytrack-api";

export type DashboardUser = {
  id?: string;
  name?: string;
  email?: string;
  role?: "USER" | "ADMIN";
  balance?: number | string;
  sepayCode?: string | null;
  bankAccountNumber?: string | null;
  sepayLinkedAt?: string | null;
  avatarUrl?: string | null;
};

export type DashboardCategory = {
  id: string;
  name: string;
  icon?: string | null;
  color?: string | null;
};

export type DashboardTransaction = {
  id: string;
  type: "INCOME" | "EXPENSE";
  amount: number | string;
  note?: string | null;
  source: "MANUAL" | "SEPAY";
  categoryId?: string | null;
  category?: DashboardCategory | null;
  transactionDate: string;
};

export type DashboardBudgetProgress = {
  id: string;
  categoryId: string;
  category?: DashboardCategory | null;
  limitAmount: number | string;
  spentAmount: number | string;
  percentUsed: number | string;
};

export type DashboardSepayLog = {
  id: string;
  sepayId: string;
  gateway: string;
  transferAmount: number | string;
  transferType: "IN" | "OUT";
  content?: string | null;
  transactionDate?: string;
  status: "PENDING" | "PROCESSED" | "DUPLICATE" | "UNMATCHED" | "FAILED";
};

export async function fetchCurrentUser() {
  return authFetch<DashboardUser>("/auth/me");
}

export async function updateCurrentUserBalance(balance: number) {
  const result = await authFetch<{
    user: DashboardUser;
    balance: number | string;
  }>("/api/users/me/balance", {
    method: "PATCH",
    body: JSON.stringify({ balance }),
  });

  return result.user;
}

export async function fetchDashboardSummary(month: number, year: number) {
  return authFetch<{
    totalIncome: number;
    totalExpense: number;
    savings: number;
    savingsRate: number;
  }>(`/api/reports/summary?month=${month}&year=${year}`);
}

export async function fetchRecentTransactions(month: number, year: number) {
  const data = await authFetch<{
    transactions: DashboardTransaction[];
  }>(`/api/transactions?month=${month}&year=${year}&limit=100`);

  return data.transactions || [];
}

export async function fetchBudgetProgress(month: number, year: number) {
  return authFetch<DashboardBudgetProgress[]>(`/api/budgets?month=${month}&year=${year}`);
}

export async function fetchSepayLogs(isAdmin: boolean = false) {
  if (!isAdmin) {
    return [];
  }

  const result = await authFetch<{ logs: DashboardSepayLog[] }>(
    "/api/admin/sepay-logs?limit=10",
    { admin: true }
  );

  return result.logs || [];
}
