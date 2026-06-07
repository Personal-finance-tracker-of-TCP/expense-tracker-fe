import { authFetch } from "./moneytrack-api";

// High fidelity mock data matching the mockup exactly, active ONLY in development mode.
const DEV_MOCK_USER = {
  name: "Quốc Thái",
  email: "quocthai@moneytrack.local",
  role: "USER",
  balance: 2000000,
  sepayCode: "MTU001",
  bankAccountNumber: "VCB 970400000001",
  avatarUrl: null,
};

const DEV_MOCK_SUMMARY = {
  totalIncome: 7000000,
  totalExpense: 5000000,
  savings: 2000000,
  savingsRate: 28,
};

const DEV_MOCK_BUDGETS = [
  {
    id: "b1",
    categoryId: "c1",
    category: { id: "c1", name: "Ăn uống", icon: "🍴", color: "#F59E0B" },
    limitAmount: 2000000,
    spentAmount: 1600000,
    percentUsed: 80,
  },
  {
    id: "b2",
    categoryId: "c2",
    category: { id: "c2", name: "Di chuyển", icon: "🚗", color: "#3B82F6" },
    limitAmount: 1500000,
    spentAmount: 700000,
    percentUsed: 46.6,
  },
  {
    id: "b3",
    categoryId: "c3",
    category: { id: "c3", name: "Mua sắm", icon: "🛍️", color: "#F43F5E" },
    limitAmount: 2000000,
    spentAmount: 2300000,
    percentUsed: 115,
  },
];

const DEV_MOCK_TRANSACTIONS = [
  {
    id: "t1",
    type: "INCOME" as const,
    amount: 7000000,
    note: "Lương tháng 6",
    source: "SEPAY" as const,
    categoryId: "c0",
    category: { id: "c0", name: "Lương", icon: "💼" },
    transactionDate: "2026-06-07T08:00:00.000Z",
  },
  {
    id: "t2",
    type: "EXPENSE" as const,
    amount: 120000,
    note: "Bữa trưa văn phòng",
    source: "MANUAL" as const,
    categoryId: "c1",
    category: { id: "c1", name: "Ăn uống", icon: "🍴" },
    transactionDate: "2026-06-07T12:30:00.000Z",
  },
  {
    id: "t3",
    type: "EXPENSE" as const,
    amount: 300000,
    note: "Không có ghi chú",
    source: "SEPAY" as const,
    categoryId: null,
    category: null,
    transactionDate: "2026-06-06T14:20:00.000Z",
  },
  {
    id: "t4",
    type: "EXPENSE" as const,
    amount: 50000,
    note: "Grab về nhà",
    source: "MANUAL" as const,
    categoryId: "c2",
    category: { id: "c2", name: "Di chuyển", icon: "🚗" },
    transactionDate: "2026-06-05T20:15:00.000Z",
  },
  {
    id: "t5",
    type: "INCOME" as const,
    amount: 200000,
    note: "Shopee hoàn tiền đơn 231",
    source: "SEPAY" as const,
    categoryId: "c4",
    category: { id: "c4", name: "Hoàn tiền", icon: "🔄" },
    transactionDate: "2026-06-04T10:00:00.000Z",
  },
];

const DEV_MOCK_SEPAY_LOGS = [
  {
    id: "l1",
    sepayId: "SPY0001",
    gateway: "Vietcombank",
    transferAmount: 7000000,
    transferType: "IN" as const,
    content: "MTU001 luong T6",
    transactionDate: "2026-06-07T08:00:00.000Z",
    status: "PROCESSED" as const,
  },
  {
    id: "l2",
    sepayId: "SPY0002",
    gateway: "Vietcombank",
    transferAmount: 300000,
    transferType: "OUT" as const,
    content: "CK nhanh 300k",
    transactionDate: "2026-06-07T09:30:00.000Z",
    status: "DUPLICATE" as const,
  },
];

const isDev = process.env.NODE_ENV === "development";

export async function fetchDashboardSummary(month: number, year: number) {
  try {
    const data = await authFetch<{
      totalIncome: number;
      totalExpense: number;
      savings: number;
      savingsRate: number;
    }>(`/api/reports/summary?month=${month}&year=${year}`);
    return data;
  } catch (err) {
    if (isDev) {
      console.warn("Using dev-only summary mock data due to API error:", err);
      return DEV_MOCK_SUMMARY;
    }
    throw err;
  }
}

export async function fetchRecentTransactions(month: number, year: number) {
  try {
    const data = await authFetch<{
      transactions: any[];
    }>(`/api/transactions?month=${month}&year=${year}&limit=100`);
    return data.transactions || [];
  } catch (err) {
    if (isDev) {
      console.warn("Using dev-only transactions mock data due to API error:", err);
      return DEV_MOCK_TRANSACTIONS;
    }
    throw err;
  }
}

export async function fetchBudgetProgress(month: number, year: number) {
  try {
    const data = await authFetch<any[]>(`/api/budgets?month=${month}&year=${year}`);
    return data || [];
  } catch (err) {
    if (isDev) {
      console.warn("Using dev-only budgets mock data due to API error:", err);
      return DEV_MOCK_BUDGETS;
    }
    throw err;
  }
}

export async function fetchSepayLogs(isAdmin: boolean = false) {
  // If user is not admin, do not hit the admin-only logs endpoint.
  if (!isAdmin) {
    if (isDev) {
      console.warn("Non-admin user in dev mode: serving high-fidelity mockup logs.");
      return DEV_MOCK_SEPAY_LOGS;
    }
    return [];
  }

  try {
    const result = await authFetch<{ logs: any[] }>("/api/admin/sepay-logs?limit=10", {
      admin: true,
    });
    return result.logs || [];
  } catch (err) {
    if (isDev) {
      console.warn("Using dev-only SePay logs mock data due to API/Permission error:", err);
      return DEV_MOCK_SEPAY_LOGS;
    }
    return [];
  }
}

export function getDevMockUser() {
  return isDev ? DEV_MOCK_USER : null;
}
