"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  BrainCircuit,
  Sparkles,
  AlertTriangle,
  X,
  MessageSquare,
  AlertCircle,
  ArrowRight,
  Bot,
  CheckCircle2,
} from "lucide-react";

import { formatCurrencyVND } from "@/lib/finance";
import { authFetch, getCurrentDemoPeriod } from "@/lib/moneytrack-api";

// ─── Types ───────────────────────────────────────────────────────────────────

type Summary = {
  totalIncome: number;
  totalExpense: number;
  savings: number;
  savingsRate: number;
  unclassifiedTransactionCount: number;
  topExpenseCategories: Array<{
    categoryId?: string | null;
    name: string;
    icon: string;
    amount: number;
  }>;
};

type AdviceResponse = {
  summary?: Summary;
  riskLevel?: "HIGH" | "MEDIUM" | "LOW";
  insights?: unknown;
  recommendations?: unknown;
  suggestions?: unknown;
  savingGoal?: {
    targetRate: number;
    note: string;
  };
  source?: "gemini" | "fallback";
  provider?: string;
};

type BudgetCategory = {
  id: string;
  name: string;
  icon?: string | null;
  type?: "INCOME" | "EXPENSE" | "BOTH";
};

type Budget = {
  id: string;
  categoryId: string;
  limitAmount: number;
  spentAmount: number;
  remainingAmount: number;
  percentUsed: number;
  period: "MONTHLY" | "TOTAL";
  month: number | null;
  year: number;
  category?: BudgetCategory | null;
  status: "SAFE" | "WARNING" | "EXCEEDED";
};

type AiAdviceLog = {
  id: string;
  period: string;
  provider: string | null;
  createdAt: string;
  result: {
    summary?: string;
    riskLevel?: "HIGH" | "MEDIUM" | "LOW";
    insights?: unknown;
    recommendations?: unknown;
    suggestions?: unknown;
    savingGoal?: {
      targetRate: number;
      note: string;
    };
  };
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const { month: DEFAULT_MONTH, year: DEFAULT_YEAR } = getCurrentDemoPeriod();

function getCategoryExpenseType(name: string): "ESSENTIAL" | "FLEXIBLE" {
  const essentialKeywords = [
    "ăn uống", "ăn", "uống", "di chuyển", "đi lại", "xăng", "xe",
    "hóa đơn", "điện", "nước", "internet", "nhà", "thuê nhà",
    "y tế", "thuốc", "học phí", "sức khỏe"
  ];
  const lowerName = name.toLowerCase();
  if (essentialKeywords.some((kw) => lowerName.includes(kw))) {
    return "ESSENTIAL";
  }
  return "FLEXIBLE";
}

type NormalizedInsight = {
  title?: string;
  message: string;
  severity?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toDisplayText(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (isRecord(value)) {
    const message =
      value.message ??
      value.text ??
      value.content ??
      value.description ??
      value.advice ??
      value.value;
    if (message !== undefined) return toDisplayText(message);
  }
  return "";
}

function normalizeInsightItem(item: unknown, fallbackTitle?: string): NormalizedInsight[] {
  if (typeof item === "string") {
    const message = item.trim();
    return message ? [{ title: fallbackTitle, message }] : [];
  }

  if (typeof item === "number" || typeof item === "boolean") {
    return [{ title: fallbackTitle, message: String(item) }];
  }

  if (!isRecord(item)) return [];

  const title = toDisplayText(item.title ?? item.heading ?? item.name) || fallbackTitle;
  const message = toDisplayText(item.message ?? item.text ?? item.content ?? item.description ?? item.advice);
  const severity = toDisplayText(item.severity ?? item.type ?? item.level);

  if (message) {
    return [{ title, message, severity: severity || undefined }];
  }

  return Object.entries(item).flatMap(([key, value]) => normalizeInsightItem(value, key));
}

function normalizeInsights(rawValue: unknown): NormalizedInsight[] {
  if (Array.isArray(rawValue)) {
    return rawValue.flatMap((item) => normalizeInsightItem(item));
  }

  return normalizeInsightItem(rawValue);
}

function normalizeAdviceTexts(rawValue: unknown): string[] {
  return normalizeInsights(rawValue)
    .map((item) => {
      const title = item.title?.trim();
      return title && title !== item.message ? `${title}: ${item.message}` : item.message;
    })
    .filter(Boolean);
}

function getAdviceCacheKey(month: number, year: number) {
  return `ai-advice:${year}:${month}`;
}

function readCachedAdvice(month: number, year: number) {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(getAdviceCacheKey(month, year));
    return raw ? (JSON.parse(raw) as AdviceResponse) : null;
  } catch {
    return null;
  }
}

function writeCachedAdvice(month: number, year: number, value: AdviceResponse) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getAdviceCacheKey(month, year), JSON.stringify(value));
}

async function fetchAdvisorBaseData() {
  const [budgetList, historyData] = await Promise.all([
    authFetch<Budget[]>("/api/budgets"),
    authFetch<AiAdviceLog[]>("/api/ai/history").catch(() => []),
  ]);

  return {
    budgetList: budgetList || [],
    historyData: historyData || [],
  };
}

async function requestAdvisorAdvice(month: number, year: number) {
  return authFetch<AdviceResponse>("/api/ai/advice", {
    method: "POST",
    body: JSON.stringify({ month, year }),
  });
}

export default function AiAdvisorPage() {
  const [month, setMonth] = useState(DEFAULT_MONTH);
  const [year, setYear] = useState(DEFAULT_YEAR);
  const [advice, setAdvice] = useState<AdviceResponse | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [historyLogs, setHistoryLogs] = useState<AiAdviceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [askInput, setAskInput] = useState("");

  // ─── Data Fetching ─────────────────────────────────────────────────────────

  async function loadAllData(isRefresh = false) {
    setUpdating(true);
    setError(null);

    try {
      const adviceResult = await requestAdvisorAdvice(month, year);

      setAdvice(adviceResult);
      writeCachedAdvice(month, year, adviceResult);

      if (isRefresh) {
        const { budgetList, historyData } = await fetchAdvisorBaseData();
        setBudgets(budgetList);
        setHistoryLogs(historyData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể kết nối dịch vụ AI");
      console.error(err);
    } finally {
      setLoading(false);
      setUpdating(false);
    }
  }

  useEffect(() => {
    let ignore = false;

    async function loadSelectedPeriod() {
      try {
        const { budgetList, historyData } = await fetchAdvisorBaseData();
        if (ignore) return;

        setAdvice(readCachedAdvice(month, year));
        setBudgets(budgetList);
        setHistoryLogs(historyData);
      } catch (err) {
        if (ignore) return;
        setError(err instanceof Error ? err.message : "Không thể kết nối dịch vụ AI");
        console.error(err);
      } finally {
        if (!ignore) {
          setLoading(false);
          setUpdating(false);
        }
      }
    }

    void loadSelectedPeriod();

    return () => {
      ignore = true;
    };
  }, [month, year]);

  // ─── Derived Data ─────────────────────────────────────────────────────────

  const unclassifiedCount = advice?.summary?.unclassifiedTransactionCount ?? 0;

  // Filter budgets that belong to the selected period and are >= 80% used
  const warningBudgets = useMemo(() => {
    return budgets.filter((b) => {
      const isCorrectPeriod =
        (b.period === "MONTHLY" && b.month === month && b.year === year) ||
        (b.period === "TOTAL" && b.year === year);
      return isCorrectPeriod && b.percentUsed >= 80;
    });
  }, [budgets, month, year]);

  // Financial Health Status
  const healthStatus = useMemo(() => {
    const risk = advice?.riskLevel || "LOW";
    if (risk === "HIGH" || (advice?.summary?.savings ?? 0) < 0) {
      return {
        label: "Rủi ro",
        colorClass: "text-rose-600 bg-rose-50 border-rose-100",
        dotColor: "bg-rose-500",
        desc: "Chi tiêu vượt quá thu nhập hoặc nhiều mục ngân sách bị vỡ kế hoạch. Nên cắt giảm các khoản chi linh hoạt ngay.",
      };
    }
    if (risk === "MEDIUM" || unclassifiedCount > 0 || warningBudgets.length > 0) {
      return {
        label: "Cần chú ý",
        colorClass: "text-amber-600 bg-amber-50 border-amber-100",
        dotColor: "bg-amber-500",
        desc: `Bạn vẫn có khả năng tiết kiệm tốt, nhưng cần chú ý vì còn ${unclassifiedCount} giao dịch chưa phân loại và ${warningBudgets.length} ngân sách sắp vượt hạn mức.`,
      };
    }
    return {
      label: "Tốt",
      colorClass: "text-emerald-600 bg-emerald-50 border-emerald-100",
      dotColor: "bg-emerald-500",
      desc: "Sức khỏe tài chính tốt. Các khoản chi tiêu đều nằm trong tầm kiểm soát và tỷ lệ tiết kiệm đạt mức kỳ vọng.",
    };
  }, [advice, unclassifiedCount, warningBudgets]);

  // Suggested saving target (20% of income rule-based fallback, or AI-suggested rate)
  const suggestedSavingGoal = useMemo(() => {
    if (!advice?.summary) return null;
    const targetRate = advice.savingGoal?.targetRate ?? 20;
    const amount = advice.summary.totalIncome * (targetRate / 100);
    return amount > 0 ? amount : null;
  }, [advice]);

  // Key findings with dynamic status color mapping (Rule-based Fallback when AI Insights are empty)
  const parsedInsights = useMemo(() => {
    const rawInsights = normalizeInsights(advice?.insights);
    if (rawInsights.length > 0) {
      return rawInsights.map((insight) => {
        let type: "positive" | "warning" | "risk" = "positive";
        const text =
          insight.title && insight.title !== insight.message
            ? `${insight.title}: ${insight.message}`
            : insight.message;
        const lower = `${insight.severity || ""} ${text}`.toLowerCase();
        if (
          lower.includes("chưa phân loại") ||
          lower.includes("vượt") ||
          lower.includes("nguy hiểm") ||
          lower.includes("rủi ro") ||
          lower.includes("thâm hụt")
        ) {
          type = "risk";
        } else if (
          lower.includes("gần") ||
          lower.includes("chú ý") ||
          lower.includes("tăng") ||
          lower.includes("biến động")
        ) {
          type = "warning";
        }
        return { text, type };
      });
    }

    // Dynamic rule-based insights if backend returned empty list
    const list: Array<{ text: string; type: "positive" | "warning" | "risk" }> = [];
    if (advice?.summary) {
      const s = advice.summary;
      if (s.totalIncome === 0 && s.totalExpense === 0) {
        list.push({ text: `Chưa ghi nhận giao dịch nào trong tháng ${month}/${year}.`, type: "warning" });
        return list;
      }
      
      if (s.totalIncome === 0) {
        list.push({ text: "Chưa ghi nhận dữ liệu thu nhập trong kỳ này.", type: "warning" });
      } else {
        list.push({
          text: `Tỷ lệ tiết kiệm hiện tại đạt ${s.savingsRate.toFixed(1)}% thu nhập.`,
          type: s.savingsRate >= 20 ? "positive" : s.savingsRate >= 10 ? "warning" : "risk",
        });
      }

      if (s.topExpenseCategories && s.topExpenseCategories.length > 0) {
        const top = s.topExpenseCategories[0];
        list.push({
          text: `${top.name} là danh mục chi tiêu lớn nhất với ${formatCurrencyVND(top.amount)}.`,
          type: "warning",
        });
      }

      if (unclassifiedCount > 0) {
        list.push({
          text: `${unclassifiedCount} giao dịch chưa phân loại khiến số liệu báo cáo chưa chính xác.`,
          type: "risk",
        });
      } else {
        list.push({ text: "Tất cả các giao dịch trong tháng đều được phân loại đầy đủ.", type: "positive" });
      }
    }
    return list;
  }, [advice, unclassifiedCount, month, year]);

  // Action items priority list (Rule-based Fallback when Suggestions are empty)
  const parsedSuggestions = useMemo(() => {
    const rawSuggestions = normalizeAdviceTexts(advice?.recommendations ?? advice?.suggestions);
    if (rawSuggestions.length > 0) {
      return rawSuggestions.slice(0, 5);
    }

    const list: string[] = [];
    if (unclassifiedCount > 0) {
      list.push(`Phân loại ${unclassifiedCount} giao dịch chưa rõ danh mục để cải thiện độ chính xác của phân tích.`);
    }
    if (warningBudgets.length > 0) {
      warningBudgets.forEach((b) => {
        const name = b.category?.name || "ngân sách";
        list.push(`Kiểm tra chi tiết và tiết giảm chi tiêu cho danh mục "${name}" vì đã dùng ${Math.round(b.percentUsed)}% hạn mức.`);
      });
    }

    // Top flexible categories
    if (advice?.summary?.topExpenseCategories) {
      const flexCats = advice.summary.topExpenseCategories.filter((cat) => {
        return getCategoryExpenseType(cat.name) === "FLEXIBLE";
      });
      if (flexCats.length > 0) {
        list.push(`Cân nhắc cắt giảm hoặc tạm dừng chi tiêu cho nhóm "${flexCats[0].name}" để gia tăng tiết kiệm.`);
      }
    }

    if (list.length < 3) {
      if ((advice?.summary?.savingsRate ?? 0) < 20 && (advice?.summary?.totalIncome ?? 0) > 0) {
        list.push("Cố gắng giảm chi tiêu không thiết yếu để đạt tỷ lệ tiết kiệm tối thiểu 20% thu nhập.");
      }
      list.push("Duy trì thói quen ghi chép giao dịch hàng ngày để theo dõi tài chính sát sao hơn.");
    }

    return list.slice(0, 5);
  }, [advice, unclassifiedCount, warningBudgets]);

  // Status Badge Label & Color (Requirement 7)
  const sourceBadge = useMemo(() => {
    if (error) {
      return {
        label: "Lỗi AI · dùng phân tích mặc định",
        colorClass: "bg-rose-50 text-rose-700 border-rose-100",
      };
    }
    const prov = advice?.provider || (advice?.source === "gemini" ? "GEMINI" : "RULE_BASED");
    if (prov === "GEMINI") {
      return {
        label: "Đã phân tích · GEMINI",
        colorClass: "bg-emerald-50 text-emerald-700 border-emerald-100",
      };
    }
    return {
      label: "Phân tích nhanh · RULE_BASED",
      colorClass: "bg-amber-50 text-amber-700 border-amber-100",
    };
  }, [advice, error]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handlePrevMonth = () => {
    setLoading(true);
    setError(null);
    setMonth((m) => {
      if (m === 1) { setYear((y) => y - 1); return 12; }
      return m - 1;
    });
  };

  const handleNextMonth = () => {
    setLoading(true);
    setError(null);
    setMonth((m) => {
      if (m === 12) { setYear((y) => y + 1); return 1; }
      return m + 1;
    });
  };

  const triggerChatbot = (queryText: string) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("open-chatbot", { detail: { query: queryText } })
      );
    }
  };

  const handleAskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!askInput.trim()) return;
    triggerChatbot(askInput);
    setAskInput("");
  };

  // ─── Render Skeletons ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl flex flex-col gap-6 px-1 py-3 sm:px-2 animate-pulse">
        <div className="h-20 bg-white rounded-3xl border border-slate-200/60" />
        <div className="h-10 bg-white rounded-2xl border border-slate-200/60" />
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <div className="h-56 bg-white rounded-3xl border border-slate-200/60" />
            <div className="h-64 bg-white rounded-3xl border border-slate-200/60" />
          </div>
          <div className="space-y-6">
            <div className="h-40 bg-white rounded-3xl border border-slate-200/60" />
            <div className="h-40 bg-white rounded-3xl border border-slate-200/60" />
          </div>
        </div>
      </main>
    );
  }

  // ─── Main Render ───────────────────────────────────────────────────────────

  return (
    <main className="mx-auto max-w-7xl flex flex-col gap-6 px-1 py-3 sm:px-2">
      
      {/* ── Header ── */}
      <section className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-transparent px-2">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
            AI Insight Center
          </span>
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight mt-1">
            AI Advisor
          </h1>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            Diễn giải dữ liệu tài chính và đề xuất việc nên làm tiếp theo
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
          {/* Status Badge */}
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[10px] font-extrabold shadow-sm tracking-wider uppercase ${sourceBadge.colorClass}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {sourceBadge.label}
          </span>

          {/* Month / Year Navigator */}
          <div className="flex items-center gap-1.5 rounded-2xl bg-white border border-slate-200/80 px-2 py-1 shadow-sm">
            <button
              onClick={handlePrevMonth}
              type="button"
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
            >
              <ChevronLeft className="h-4.5 w-4.5" />
            </button>
            <span className="text-xs font-bold text-slate-700 min-w-[105px] text-center select-none">
              Tháng {month}, {year}
            </span>
            <button
              onClick={handleNextMonth}
              type="button"
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
            >
              <ChevronRight className="h-4.5 w-4.5" />
            </button>
          </div>

          <button
            onClick={() => loadAllData(true)}
            disabled={updating}
            type="button"
            className="
              relative inline-flex h-11 items-center gap-2 rounded-xl
              border border-emerald-300/70
              bg-gradient-to-r from-emerald-500 to-teal-500
              px-4 text-sm font-semibold text-white
              shadow-md shadow-emerald-500/25
              transition-all duration-300
              hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-500/35
              active:translate-y-0 active:scale-95
              disabled:cursor-not-allowed disabled:opacity-60
            "
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/80 opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white"></span>
            </span>

            {updating ? "Đang cập nhật..." : "Phân tích với AI"}
          </button>
        </div>
      </section>

      {/* ── Unclassified Warning Strip ── */}
      {unclassifiedCount > 0 && (
        <section className="mx-2 rounded-2xl border border-amber-200 bg-amber-50/50 p-4 text-xs font-bold text-amber-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-pulse">
          <span className="flex items-center gap-2">
            <AlertCircle className="h-4.5 w-4.5 text-amber-500 shrink-0" />
            {unclassifiedCount} giao dịch chưa phân loại — báo cáo có thể chưa chính xác
          </span>
          <Link
            href="/transactions?category=UNCLASSIFIED"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-800 transition-colors uppercase tracking-wider shrink-0"
          >
            Phân loại ngay <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      )}

      {/* ── Error Notification ── */}
      {error && (
        <section className="mx-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700 shadow-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-4.5 w-4.5 text-red-500 shrink-0" />
            {error}
          </span>
          <button onClick={() => setError(null)} className="text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </section>
      )}

      {/* ── Main Dashboard Layout ── */}
      <section className="px-2 grid gap-6 lg:grid-cols-[1fr_360px] items-start">
        
        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-6">
          
          {/* 1. Key Findings: Điểm AI nhận thấy */}
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2.5 mb-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shadow-inner">
                <Sparkles className="h-4.5 w-4.5" />
              </span>
              <h2 className="text-sm font-extrabold text-slate-800">Điểm AI nhận thấy</h2>
            </div>

            {parsedInsights.length === 0 ? (
              <div className="py-6 text-center text-xs font-bold text-slate-400">
                Chưa ghi nhận điểm chú ý nào. Dữ liệu tài chính trống.
              </div>
            ) : (
              <div className="space-y-3">
                {parsedInsights.map((insight, idx) => {
                  const dotColor =
                    insight.type === "risk"
                      ? "bg-rose-500 shadow-rose-200"
                      : insight.type === "warning"
                      ? "bg-amber-500 shadow-amber-200"
                      : "bg-emerald-500 shadow-emerald-200";

                  return (
                    <div
                      key={idx}
                      className="flex items-start gap-3 rounded-2xl bg-slate-50/50 p-3.5 border border-slate-100/50"
                    >
                      <span className={`h-2.5 w-2.5 rounded-full ${dotColor} shrink-0 mt-1.5 shadow-md`} />
                      <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                        {insight.text}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Action Plan: Việc nên làm tiếp theo */}
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm relative">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-inner">
                  <BrainCircuit className="h-4.5 w-4.5" />
                </span>
                <h2 className="text-sm font-extrabold text-slate-800">Việc nên làm tiếp theo</h2>
              </div>
              <span className="rounded-full bg-emerald-100/80 px-3 py-1 text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider shadow-sm">
                Quan trọng nhất
              </span>
            </div>

            {parsedSuggestions.length === 0 ? (
              <div className="py-6 text-center text-xs font-bold text-slate-400">
                Chưa có đề xuất hành động nào cho kỳ này.
              </div>
            ) : (
              <div className="space-y-3">
                {parsedSuggestions.map((item, idx) => {
                  const styles = [
                    {
                      border: "border-rose-100 bg-rose-50/30",
                      numRing: "border-rose-300 text-rose-700 bg-rose-50",
                    },
                    {
                      border: "border-amber-100 bg-amber-50/30",
                      numRing: "border-amber-300 text-amber-700 bg-amber-50",
                    },
                    {
                      border: "border-yellow-100 bg-yellow-50/20",
                      numRing: "border-yellow-300 text-yellow-700 bg-yellow-50",
                    },
                    {
                      border: "border-blue-100 bg-blue-50/30",
                      numRing: "border-blue-300 text-blue-700 bg-blue-50",
                    },
                    {
                      border: "border-slate-100 bg-slate-50/30",
                      numRing: "border-slate-300 text-slate-700 bg-slate-50",
                    },
                  ];

                  const currentStyle = styles[idx % styles.length];

                  return (
                    <div
                      key={idx}
                      className={`flex items-center gap-4 rounded-2xl border p-4 shadow-sm transition-all duration-200 hover:shadow-md ${currentStyle.border}`}
                    >
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-black shadow-sm ${currentStyle.numRing}`}>
                        {idx + 1}
                      </span>
                      <p className="text-xs font-bold text-slate-700 leading-relaxed">
                        {item}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. Budget Warnings: Ngân sách cần chú ý */}
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 shadow-inner">
                  <AlertTriangle className="h-4.5 w-4.5" />
                </span>
                <h2 className="text-sm font-extrabold text-slate-800">Ngân sách cần chú ý</h2>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-extrabold text-slate-600 uppercase tracking-wider">
                &ge; 80% đã dùng
              </span>
            </div>

            {warningBudgets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 border border-dashed border-slate-200 rounded-2xl text-center bg-slate-50/50">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mb-2" />
                <p className="text-xs font-extrabold text-slate-600">Tuyệt vời!</p>
                <p className="text-[11px] text-slate-400 mt-1">Không có ngân sách nào đang ở mức nguy hiểm.</p>
              </div>
            ) : (
              <div className="space-y-5">
                {warningBudgets.map((budget) => {
                  const catName = budget.category?.name || "Danh mục";
                  const catIcon = budget.category?.icon || "📦";
                  const expType = getCategoryExpenseType(catName);

                  const progressColor = budget.percentUsed >= 100 ? "bg-rose-500" : "bg-amber-500";
                  const percentColor = budget.percentUsed >= 100 ? "text-rose-600" : "text-amber-600";

                  const desc =
                    expType === "FLEXIBLE"
                      ? "Đây là khoản linh hoạt, nên ưu tiên giảm nếu cần tiết kiệm."
                      : "Nếu đây là nhu cầu thiết yếu thì không nên cắt mạnh, nhưng nên hạn chế phát sinh thêm.";

                  return (
                    <div key={budget.id} className="group border border-slate-100 bg-slate-50/30 rounded-2xl p-4.5">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg w-7 shrink-0 text-center">{catIcon}</span>
                          <span className="text-xs font-extrabold text-slate-800">{catName}</span>
                          <span className={`inline-block text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                            expType === "ESSENTIAL" ? "bg-blue-50 text-blue-700 border border-blue-100" : "bg-violet-50 text-violet-700 border border-violet-100"
                          }`}>
                            {expType === "ESSENTIAL" ? "Thiết yếu" : "Linh hoạt"}
                          </span>
                        </div>
                        <span className={`text-xs font-extrabold shrink-0 ${percentColor}`}>
                          {Math.round(budget.percentUsed)}%
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-2">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${progressColor}`}
                          style={{ width: `${Math.min(budget.percentUsed, 100)}%` }}
                        />
                      </div>

                      <div className="flex justify-between items-start gap-4">
                        <p className="text-[10px] text-slate-400 font-semibold leading-relaxed max-w-[70%]">
                          {desc}
                        </p>
                        <span className="text-[10px] font-black text-slate-500 shrink-0 text-right mt-0.5">
                          {formatCurrencyVND(budget.spentAmount)} / {formatCurrencyVND(budget.limitAmount)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col gap-6">
          
          {/* A. Sức khỏe tài chính */}
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Sức khỏe tài chính</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`h-3 w-3 rounded-full ${healthStatus.dotColor} shrink-0 shadow-sm`} />
              <h3 className="text-lg font-black text-slate-800">{healthStatus.label}</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed font-semibold mt-3">
              {healthStatus.desc}
            </p>
          </div>

          {/* B. Giao dịch cần phân loại */}
          {unclassifiedCount > 0 && (
            <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Giao dịch cần phân loại</p>
                <span className="h-6 px-2.5 rounded-full bg-amber-500/15 border border-amber-500/20 text-xs font-black text-amber-600 flex items-center justify-center">
                  {unclassifiedCount}
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Còn giao dịch chưa phân loại sẽ khiến báo cáo và phân tích AI chưa chính xác. Phân loại để AI đưa ra gợi ý tốt hơn.
              </p>
              <Link
                href="/transactions?category=UNCLASSIFIED"
                className="w-full h-10 inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold shadow-sm shadow-amber-500/10 transition-all active:scale-95 text-center cursor-pointer"
              >
                Đi tới phân loại giao dịch
              </Link>
            </div>
          )}

          {/* C. Mục tiêu tiết kiệm đề xuất */}
          <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex justify-between items-start">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mục tiêu tiết kiệm đề xuất</p>
              <span className="rounded-full bg-emerald-100/80 px-2 py-0.5 text-[9px] font-extrabold text-emerald-800 uppercase tracking-wider">
                AI
              </span>
            </div>

            {suggestedSavingGoal ? (
              <div className="mt-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-emerald-500">
                    {formatCurrencyVND(suggestedSavingGoal)}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">/ Tháng {month}, {year}</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold mt-3">
                  {advice?.savingGoal?.note || `Nếu kiểm soát tốt chi tiêu và giữ tỷ lệ tiết kiệm ở mức ${advice?.savingGoal?.targetRate ?? 20}%, bạn có thể tích lũy số tiền này.`}
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-400 leading-relaxed font-semibold mt-3 text-center py-4">
                Chưa có đề xuất tiết kiệm cho kỳ này.
              </p>
            )}
          </div>

          {/* D. GEMINI · info card */}
          <div className="rounded-3xl border border-slate-100 bg-gradient-to-br from-slate-800 to-slate-900 p-5 shadow-sm text-white relative overflow-hidden">
            <div className="absolute right-[-10px] top-[-10px] opacity-10">
              <Bot className="h-28 w-28 text-white" />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white shadow-inner">
                <Bot className="h-5.5 w-5.5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 leading-none">
                  {advice?.provider || (advice?.source === "gemini" ? "GEMINI" : "RULE_BASED")} · vừa cập nhật
                </p>
                <p className="text-[9px] font-bold text-emerald-400 mt-1 block">
                  Tháng {month}, {year}
                </p>
              </div>
            </div>

            <p className="text-[11px] text-slate-300 font-semibold leading-relaxed mt-4">
              {advice?.source === "gemini"
                ? `Đang dùng Gemini Pro để phân tích dữ liệu tài chính ${month}/${year} của bạn.`
                : "Đang sử dụng bộ quy tắc mặc định để phân tích dữ liệu và tư vấn tài chính."}
            </p>
          </div>
        </div>
      </section>

      {/* ── Muốn hỏi sâu hơn ── */}
      <section className="px-2 mt-4">
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2.5 mb-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shadow-inner">
              <MessageSquare className="h-4.5 w-4.5" />
            </span>
            <h2 className="text-sm font-extrabold text-slate-800">Muốn hỏi sâu hơn?</h2>
          </div>
          
          <p className="text-xs text-slate-500 font-semibold mb-4 leading-relaxed">
            Bạn có thể hỏi thêm AI bằng chatbot nổi ở góc màn hình. Hãy gửi câu hỏi nhanh từ đây.
          </p>

          <form onSubmit={handleAskSubmit} className="flex gap-3 max-w-2xl">
            <input
              type="text"
              value={askInput}
              onChange={(e) => setAskInput(e.target.value)}
              placeholder="Ví dụ: Tôi nên cắt giảm khoản nào trước?"
              className="flex-1 h-11 px-4 rounded-2xl border border-slate-200/80 text-xs font-semibold outline-none ring-slate-100 focus:border-slate-300 focus:ring-4 transition-all duration-200"
            />
            <button
              type="submit"
              className="h-11 inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-extrabold shadow-md shadow-emerald-500/10 px-6 transition-all active:scale-95 shrink-0 cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              Mở chatbot AI
            </button>
          </form>
        </div>
      </section>

      {/* ── AI Analysis History ── */}
      <section className="px-2 mt-4">
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-extrabold text-slate-800 mb-5">Lịch sử phân tích AI</h2>
          
          {historyLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 border border-dashed border-slate-200 rounded-2xl text-center bg-slate-50/50">
              <p className="text-xs font-bold text-slate-500">Chưa có lịch sử phân tích AI</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {historyLogs.map((log) => {
                // Format period: e.g. "MONTH_2026_06" -> "Tháng 6, 2026"
                const formatPeriod = (pStr: string) => {
                  if (pStr.startsWith("MONTH_")) {
                    const parts = pStr.split("_");
                    if (parts.length >= 3) {
                      return `Tháng ${parseInt(parts[2], 10)}, ${parts[1]}`;
                    }
                  }
                  return pStr;
                };

                // Format riskLevel/healthStatus to Vietnamese status
                const getRiskLabel = (risk?: string) => {
                  if (risk === "HIGH") return { label: "Rủi ro", color: "bg-rose-50 border-rose-100 text-rose-700" };
                  if (risk === "MEDIUM") return { label: "Cần chú ý", color: "bg-amber-50 border-amber-100 text-amber-700" };
                  return { label: "Tốt", color: "bg-emerald-50 border-emerald-100 text-emerald-700" };
                };

                const riskInfo = getRiskLabel(log.result?.riskLevel);

                return (
                  <div key={log.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 first:pt-0 last:pb-0">
                    <div>
                      <h4 className="text-xs font-bold text-slate-700">{formatPeriod(log.period)}</h4>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                        {new Date(log.createdAt).toLocaleString("vi-VN", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="rounded-md bg-slate-100 border border-slate-200/50 px-2.5 py-1 text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">
                        {log.provider || "RULE_BASED"}
                      </span>
                      <span className={`rounded-md border px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider ${riskInfo.color}`}>
                        {riskInfo.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

    </main>
  );
}
