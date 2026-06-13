"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Code2,
  Loader2,
  RefreshCw,
  Send,
  ShieldCheck,
  UserRoundCheck,
} from "lucide-react";
import { toast } from "sonner";

import { formatCurrencyVND } from "@/lib/finance";
import { authFetch } from "@/lib/moneytrack-api";

type LinkedUser = {
  id: string;
  name: string;
  email: string;
  bankhubAccountXid: string | null;
  bankAccountNumber: string | null;
  bankName: string | null;
  bankAccountName: string | null;
  sepayLinkedAt: string | null;
  role: string;
};

type BankHubAccount = {
  bankhubAccountXid?: string | null;
  bankAccountNumber?: string | null;
  bankName?: string | null;
  bankAccountName?: string | null;
  status?: {
    active?: unknown;
    bankApiConnected?: unknown;
  };
};

type BankHubLinkedAccountsResponse = {
  accounts?: BankHubAccount[];
};

type TransferType = "credit" | "debit";
type WebhookState = "idle" | "waiting" | "received" | "timeout";
type BankHubResult = Record<string, unknown>;

type SepayLog = {
  id: string;
  createdAt?: string;
  updatedAt?: string;
};

type SepayLogsResponse = {
  logs?: SepayLog[];
};

const WEBHOOK_MESSAGES: Record<WebhookState, string> = {
  idle: "Chưa gửi giao dịch trong phiên hiện tại.",
  waiting: "Đã gửi giao dịch sandbox. Đang chờ webhook từ SePay...",
  received: "Đã nhận webhook mới từ SePay.",
  timeout: "Chưa nhận được webhook. Vui lòng kiểm tra Notify URL hoặc SePay Logs.",
};

function isLinked(user: LinkedUser) {
  return Boolean(user.bankhubAccountXid?.trim());
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatAmountInput(value: string) {
  const numericValue = value.replace(/\D/g, "");
  if (!numericValue) return "";

  return new Intl.NumberFormat("vi-VN").format(Number(numericValue));
}

function parseAmountInput(value: string) {
  return Number(value.replace(/\D/g, ""));
}

function stringifyResult(result: BankHubResult) {
  try {
    return JSON.stringify(result, null, 2);
  } catch {
    return String(result);
  }
}

function formatStatusValue(value: unknown) {
  if (typeof value === "boolean") return value ? "Có" : "Không";
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

export default function BankHubSandboxPage() {
  const [users, setUsers] = useState<LinkedUser[]>([]);
  const [bankhubAccounts, setBankhubAccounts] = useState<BankHubAccount[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [transferType, setTransferType] = useState<TransferType>("credit");
  const [amount, setAmount] = useState(formatAmountInput("1000000"));
  const [content, setContent] = useState("Giao dịch sandbox MoneyTrack");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BankHubResult | null>(null);
  const [webhookState, setWebhookState] = useState<WebhookState>("idle");
  const [webhookWaitStartedAt, setWebhookWaitStartedAt] = useState<number | null>(
    null
  );

  const linkedUsers = useMemo(() => users.filter(isLinked), [users]);

  const selectedUser = useMemo(
    () => linkedUsers.find((user) => user.id === selectedUserId) || null,
    [linkedUsers, selectedUserId]
  );

  const selectedBankHubAccount = useMemo(() => {
    if (!selectedUser?.bankhubAccountXid) return null;

    return (
      bankhubAccounts.find(
        (account) =>
          account.bankhubAccountXid === selectedUser.bankhubAccountXid
      ) || null
    );
  }, [bankhubAccounts, selectedUser]);

  const loadSandboxData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [userData, accountData] = await Promise.all([
        authFetch<LinkedUser[]>("/api/admin/linked-users", { admin: true }),
        authFetch<BankHubLinkedAccountsResponse>("/api/bankhub/linked-accounts", {
          admin: true,
        }),
      ]);

      const nextUsers = userData || [];
      const nextLinkedUsers = nextUsers.filter(isLinked);

      setUsers(nextUsers);
      setBankhubAccounts(accountData.accounts || []);
      setSelectedUserId((current) =>
        nextLinkedUsers.some((user) => user.id === current)
          ? current
          : nextLinkedUsers[0]?.id || ""
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể tải danh sách người dùng đã liên kết"
      );
      setBankhubAccounts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSandboxData();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadSandboxData]);

  useEffect(() => {
    if (!webhookWaitStartedAt || webhookState !== "waiting") return;

    let stopped = false;

    const markReceived = () => {
      if (stopped) return;
      setWebhookState("received");
      setWebhookWaitStartedAt(null);
      toast.success("Đã nhận webhook mới từ SePay.");
    };

    const checkWebhookLogs = async () => {
      try {
        const data = await authFetch<SepayLogsResponse>(
          "/api/admin/sepay-logs?limit=20",
          { admin: true }
        );
        const hasNewLog = (data.logs || []).some((log) => {
          const timestamp = Date.parse(log.createdAt || log.updatedAt || "");
          return Number.isFinite(timestamp) && timestamp >= webhookWaitStartedAt;
        });

        if (hasNewLog) markReceived();
      } catch {
        // Keep polling quiet; the timeout state tells admin where to inspect.
      }
    };

    const pollTimer = window.setInterval(checkWebhookLogs, 5000);
    const timeoutTimer = window.setTimeout(() => {
      if (stopped) return;
      setWebhookState("timeout");
      setWebhookWaitStartedAt(null);
      toast.warning(WEBHOOK_MESSAGES.timeout);
    }, 30000);

    void checkWebhookLogs();

    return () => {
      stopped = true;
      window.clearInterval(pollTimer);
      window.clearTimeout(timeoutTimer);
    };
  }, [webhookState, webhookWaitStartedAt]);

  function validateForm() {
    if (!selectedUser) {
      setError("Vui lòng chọn người dùng đã liên kết BankHub.");
      return null;
    }

    if (!selectedUser.bankhubAccountXid) {
      setError("Người dùng này chưa có BankHub XID.");
      return null;
    }

    const parsedAmount = parseAmountInput(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Số tiền phải là số lớn hơn 0.");
      return null;
    }

    const trimmedContent = content.trim();
    if (!trimmedContent) {
      setError("Nội dung giao dịch là bắt buộc.");
      return null;
    }

    return { parsedAmount, trimmedContent };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validated = validateForm();
    if (!validated || !selectedUser) return;

    setSubmitting(true);
    setError(null);
    setResult(null);
    setWebhookState("idle");
    setWebhookWaitStartedAt(null);

    const requestStartedAt = Date.now() - 2000;

    try {
      const response = await authFetch<BankHubResult>(
        "/api/admin/bankhub-sandbox/transactions",
        {
          method: "POST",
          admin: true,
          body: JSON.stringify({
            userId: selectedUser.id,
            transferType,
            amount: validated.parsedAmount,
            content: validated.trimmedContent,
          }),
        }
      );

      setResult(response);
      setWebhookState("waiting");
      setWebhookWaitStartedAt(requestStartedAt);
      toast.success("Đã tạo giao dịch sandbox. Đang chờ webhook từ SePay.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể tạo giao dịch sandbox. Vui lòng thử lại."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const parsedAmount = parseAmountInput(amount);
  const canSubmit = Boolean(selectedUser?.bankhubAccountXid) && !submitting;
  const statusTone =
    webhookState === "received"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : webhookState === "timeout"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : webhookState === "waiting"
          ? "border-teal-200 bg-teal-50 text-teal-800"
          : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <section className="rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-xl shadow-teal-950/[0.05] backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <span className="rounded-2xl bg-teal-50 p-3 text-teal-700 ring-1 ring-teal-100 dark:bg-teal-950/60 dark:text-teal-200 dark:ring-teal-900">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white">
                BankHub Sandbox
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                Mô phỏng giao dịch ngân hàng và kiểm tra webhook SePay
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void loadSandboxData()}
            disabled={loading}
            className="inline-flex h-10 w-fit items-center gap-2 rounded-2xl border border-teal-100 bg-white px-4 text-sm font-bold text-teal-800 shadow-sm transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-teal-200"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Làm mới
          </button>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <form
          onSubmit={handleSubmit}
          className="rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-xl shadow-teal-950/[0.05] backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 sm:p-6"
        >
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
            <span className="rounded-2xl bg-emerald-50 p-2.5 text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-200 dark:ring-emerald-900">
              <Send className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-xl font-black text-slate-950 dark:text-white">
                Tạo giao dịch mô phỏng
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Chọn user đã liên kết, nhập số tiền và gửi qua backend.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-5">
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
              Người dùng đã liên kết
              <select
                value={selectedUserId}
                onChange={(event) => setSelectedUserId(event.target.value)}
                disabled={loading || linkedUsers.length === 0}
                className="mt-2 h-12 w-full rounded-2xl border border-teal-100 bg-teal-50/45 px-4 text-sm font-bold text-slate-900 outline-none ring-teal-100 transition focus:border-teal-400 focus:bg-white focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              >
                {linkedUsers.length === 0 ? (
                  <option value="">Chưa có user liên kết BankHub</option>
                ) : null}
                {linkedUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} - {user.email}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950 md:grid-cols-2">
              {[
                ["Tên user", selectedUser?.name || "-"],
                ["Email", selectedUser?.email || "-"],
                ["Ngân hàng", selectedUser?.bankName || "-"],
                ["Số tài khoản", selectedUser?.bankAccountNumber || "-"],
                ["BankHub XID", selectedUser?.bankhubAccountXid || "-"],
              ].map(([label, value]) => (
                <div key={label} className="min-w-0">
                  <p className="text-xs font-bold uppercase text-slate-400">
                    {label}
                  </p>
                  <p className="mt-1 break-all text-sm font-black text-slate-900 dark:text-white">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                Loại giao dịch
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1 dark:bg-slate-950">
                {[
                  { value: "credit" as const, label: "Tiền vào", icon: ArrowDownLeft },
                  { value: "debit" as const, label: "Tiền ra", icon: ArrowUpRight },
                ].map((item) => {
                  const Icon = item.icon;
                  const active = transferType === item.value;

                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setTransferType(item.value)}
                      className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl text-sm font-bold transition-colors ${
                        active
                          ? "bg-white text-teal-700 shadow-sm dark:bg-slate-800 dark:text-teal-200"
                          : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
              Số tiền
              <div className="mt-2 flex h-12 items-center rounded-2xl border border-teal-100 bg-teal-50/45 px-4 ring-teal-100 transition focus-within:border-teal-400 focus-within:bg-white focus-within:ring-4 dark:border-slate-700 dark:bg-slate-950">
                <input
                  type="text"
                  inputMode="numeric"
                  value={amount}
                  onChange={(event) =>
                    setAmount(formatAmountInput(event.target.value))
                  }
                  placeholder="1.000.000"
                  className="min-w-0 flex-1 bg-transparent text-sm font-black tabular-nums text-slate-950 outline-none placeholder:text-slate-400 dark:text-white"
                  required
                />
                <span className="ml-3 rounded-xl bg-white px-2.5 py-1 text-xs font-black text-teal-700 ring-1 ring-teal-100 dark:bg-slate-900 dark:text-teal-200 dark:ring-slate-700">
                  VND
                </span>
              </div>
            </label>

            <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
              Nội dung giao dịch
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value.slice(0, 255))}
                maxLength={255}
                rows={3}
                className="mt-2 w-full resize-none rounded-2xl border border-teal-100 bg-teal-50/45 px-4 py-3 text-sm font-semibold text-slate-950 outline-none ring-teal-100 transition placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-4 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                required
              />
              <span className="mt-1 block text-right text-xs text-slate-400">
                {content.length}/255
              </span>
            </label>

            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-4 text-sm font-black text-white shadow-lg shadow-teal-500/25 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-teal-500/30 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {submitting ? "Đang tạo giao dịch..." : "Tạo giao dịch sandbox"}
            </button>
          </div>
        </form>

        <aside className="space-y-5">
          <section className="rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-xl shadow-teal-950/[0.05] backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
            <div className="flex items-center gap-3">
              <span className="rounded-2xl bg-teal-50 p-2.5 text-teal-700 ring-1 ring-teal-100 dark:bg-teal-950/50 dark:text-teal-200 dark:ring-teal-900">
                <UserRoundCheck className="h-5 w-5" />
              </span>
              <h2 className="text-lg font-black text-slate-950 dark:text-white">
                User đang chọn
              </h2>
            </div>

            <dl className="mt-4 space-y-3 text-sm">
              {[
                ["Tên", selectedUser?.name || "-"],
                ["Email", selectedUser?.email || "-"],
                ["Ngân hàng", selectedUser?.bankName || "-"],
                ["Chủ tài khoản", selectedUser?.bankAccountName || "-"],
                ["Số tài khoản", selectedUser?.bankAccountNumber || "-"],
                ["BankHub XID", selectedUser?.bankhubAccountXid || "-"],
                ["Liên kết lúc", formatDateTime(selectedUser?.sepayLinkedAt)],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-3">
                  <dt className="shrink-0 text-slate-500">{label}</dt>
                  <dd className="max-w-[240px] break-all text-right font-bold text-slate-900 dark:text-white">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>

            {selectedBankHubAccount ? (
              <div className="mt-4 rounded-2xl border border-teal-100 bg-teal-50/70 p-3 text-xs font-semibold text-teal-800 dark:border-teal-900 dark:bg-teal-950/30 dark:text-teal-200">
                BankHub đối chiếu: active{" "}
                {formatStatusValue(selectedBankHubAccount.status?.active)}, API{" "}
                {formatStatusValue(
                  selectedBankHubAccount.status?.bankApiConnected
                )}
              </div>
            ) : null}
          </section>

          <section className="rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-xl shadow-teal-950/[0.05] backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="rounded-2xl bg-slate-50 p-2.5 text-slate-600 ring-1 ring-slate-100 dark:bg-slate-950 dark:text-slate-300 dark:ring-slate-800">
                  {webhookState === "received" ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Clock3 className="h-5 w-5" />
                  )}
                </span>
                <h2 className="text-lg font-black text-slate-950 dark:text-white">
                  Trạng thái webhook
                </h2>
              </div>
              <Link
                href="/admin/sepay-logs"
                className="text-sm font-bold text-teal-700 hover:text-teal-900 dark:text-teal-300"
              >
                Mở SePay Logs
              </Link>
            </div>

            <div className={`mt-4 rounded-2xl border p-4 text-sm font-bold ${statusTone}`}>
              {WEBHOOK_MESSAGES[webhookState]}
            </div>

            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">transfer_type</dt>
                <dd className="font-bold text-slate-900 dark:text-white">
                  {transferType}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">amount</dt>
                <dd className="font-bold text-slate-900 dark:text-white">
                  {formatCurrencyVND(parsedAmount || 0)}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-xl shadow-teal-950/[0.05] backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
            <div className="flex items-center gap-3">
              <span className="rounded-2xl bg-slate-50 p-2.5 text-slate-600 ring-1 ring-slate-100 dark:bg-slate-950 dark:text-slate-300 dark:ring-slate-800">
                <Code2 className="h-5 w-5" />
              </span>
              <h2 className="text-lg font-black text-slate-950 dark:text-white">
                Kết quả BankHub
              </h2>
            </div>

            {!result ? (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                Chưa có phản hồi. Sau khi tạo giao dịch sandbox, JSON response
                sẽ hiển thị tại đây.
              </div>
            ) : (
              <pre className="mt-4 max-h-[320px] overflow-auto rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-slate-100">
                {stringifyResult(result)}
              </pre>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
