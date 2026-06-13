"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Loader2,
  RefreshCw,
  Send,
  ShieldCheck,
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

type TransferType = "credit" | "debit";
type BankHubMockResponse = Record<string, unknown>;
type WebhookWaitState = "idle" | "waiting" | "received" | "timeout";

type SepayLog = {
  id: string;
  createdAt?: string;
  updatedAt?: string;
};

type SepayLogsResponse = {
  logs: SepayLog[];
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

const CALLBACK_SUCCESS_TOAST =
  "SePay đã tạo mock transaction. Đang chờ callback về Notify URL.";
const WEBHOOK_TIMEOUT_MESSAGE =
  "Chưa nhận được webhook từ SePay. Kiểm tra Notify URL/IPN config trên SePay.";
const WEBHOOK_RECEIVED_MESSAGE =
  "Đã nhận webhook mới từ SePay. Kiểm tra SePay Logs hoặc danh sách giao dịch.";

function formatLinkedAt(value?: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function formatStatusValue(value: unknown) {
  if (typeof value === "boolean") return value ? "Có" : "Không";
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

function stringifyResult(result: BankHubMockResponse) {
  try {
    return JSON.stringify(result, null, 2);
  } catch {
    return String(result);
  }
}

export default function BankHubSandboxPage() {
  const [users, setUsers] = useState<LinkedUser[]>([]);
  const [bankhubAccounts, setBankhubAccounts] = useState<BankHubAccount[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [transferType, setTransferType] = useState<TransferType>("credit");
  const [amount, setAmount] = useState("200000");
  const [content, setContent] = useState("Giao dịch sandbox MoneyTrack");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BankHubMockResponse | null>(null);
  const [webhookWaitState, setWebhookWaitState] =
    useState<WebhookWaitState>("idle");
  const [webhookWaitStartedAt, setWebhookWaitStartedAt] = useState<number | null>(
    null
  );

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) || null,
    [selectedUserId, users]
  );

  const linkedUsers = useMemo(
    () => users.filter((user) => Boolean(user.bankhubAccountXid?.trim())),
    [users]
  );

  const reloadUsers = async () => {
    setLoadingUsers(true);
    setError(null);

    try {
      const data = await authFetch<LinkedUser[]>("/api/admin/linked-users", {
        admin: true,
      });
      const nextUsers = data || [];
      const nextLinkedUsers = nextUsers.filter((user) =>
        Boolean(user.bankhubAccountXid?.trim())
      );

      setUsers(nextUsers);
      setSelectedUserId((current) =>
        nextLinkedUsers.some((user) => user.id === current)
          ? current
          : nextLinkedUsers[0]?.id || ""
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không thể tải danh sách user"
      );
    } finally {
      setLoadingUsers(false);
    }
  };

  const reloadBankhubAccounts = async () => {
    setLoadingAccounts(true);

    try {
      const data = await authFetch<BankHubLinkedAccountsResponse>(
        "/api/bankhub/linked-accounts",
        { admin: true }
      );

      setBankhubAccounts(data.accounts || []);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Không thể lấy tài khoản đã liên kết từ SePay"
      );
      setBankhubAccounts([]);
    } finally {
      setLoadingAccounts(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      reloadUsers();
      reloadBankhubAccounts();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!webhookWaitStartedAt || webhookWaitState !== "waiting") return;

    let stopped = false;

    const markReceived = () => {
      if (stopped) return;
      setWebhookWaitState("received");
      setWebhookWaitStartedAt(null);
      toast.success(WEBHOOK_RECEIVED_MESSAGE);
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
        // Polling stays quiet; the timeout message tells admin what to check.
      }
    };

    const pollTimer = window.setInterval(checkWebhookLogs, 5000);
    const timeoutTimer = window.setTimeout(() => {
      if (stopped) return;
      setWebhookWaitState("timeout");
      setWebhookWaitStartedAt(null);
      toast.warning(WEBHOOK_TIMEOUT_MESSAGE);
    }, 30000);

    checkWebhookLogs();

    return () => {
      stopped = true;
      window.clearInterval(pollTimer);
      window.clearTimeout(timeoutTimer);
    };
  }, [webhookWaitStartedAt, webhookWaitState]);

  const validateForm = () => {
    if (!selectedUser) {
      setError("Vui lòng chọn user đã liên kết BankHub Sandbox");
      return null;
    }

    if (!selectedUser.bankhubAccountXid) {
      setError(
        "User chưa liên kết BankHub Sandbox. Hãy yêu cầu user liên kết ở trang Hồ sơ."
      );
      return null;
    }

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Số tiền phải là số lớn hơn 0");
      return null;
    }

    const trimmedContent = content.trim();
    if (!trimmedContent) {
      setError("Nội dung giao dịch là bắt buộc");
      return null;
    }

    return { parsedAmount, trimmedContent };
  };

  const submitSandboxTransaction = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validated = validateForm();
    if (!validated || !selectedUser) return;

    setSubmitting(true);
    setError(null);
    setResult(null);
    setWebhookWaitState("idle");
    setWebhookWaitStartedAt(null);
    const requestStartedAt = Date.now() - 2000;

    try {
      const response = await authFetch<BankHubMockResponse>(
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
      setWebhookWaitState("waiting");
      setWebhookWaitStartedAt(requestStartedAt);
      toast.success(CALLBACK_SUCCESS_TOAST);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể tạo giao dịch sandbox trên SePay"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <section className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-xl shadow-teal-950/[0.05] backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 lg:col-span-2">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className="rounded-2xl bg-teal-50 p-3 text-teal-700 ring-1 ring-teal-100 dark:bg-teal-950/60 dark:text-teal-200 dark:ring-teal-900">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm font-semibold uppercase text-teal-700 dark:text-teal-300">
                Admin BankHub Sandbox
              </p>
              <h1 className="mt-2 text-3xl font-black text-slate-950 dark:text-white">
                Tạo giao dịch sandbox
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                Gửi giao dịch thử qua backend, sau đó chờ webhook SePay ghi log
                và tạo transaction thật trong MoneyTrack.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              reloadUsers();
              reloadBankhubAccounts();
            }}
            disabled={loadingUsers || loadingAccounts}
            className="inline-flex h-10 items-center gap-2 rounded-2xl border border-teal-100 bg-white px-4 text-sm font-bold text-teal-800 shadow-sm transition hover:bg-teal-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-teal-200"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                loadingUsers || loadingAccounts ? "animate-spin" : ""
              }`}
            />
            Làm mới
          </button>
        </div>
      </section>

      <form
        onSubmit={submitSandboxTransaction}
        className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-xl shadow-teal-950/[0.05] backdrop-blur dark:border-slate-800 dark:bg-slate-900/90"
      >
        <div className="space-y-5">
          <div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
              User đã liên kết sandbox
            </p>
            <div className="mt-2 max-h-56 space-y-2 overflow-auto rounded-2xl border border-slate-100 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-950">
              {loadingUsers ? (
                <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-3 text-sm font-semibold text-slate-500 dark:bg-slate-900">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tải user
                </div>
              ) : linkedUsers.length === 0 ? (
                <div className="rounded-xl bg-white px-3 py-3 text-sm font-semibold text-slate-500 dark:bg-slate-900">
                  Chưa có user liên kết BankHub XID.
                </div>
              ) : (
                linkedUsers.map((user) => {
                  const active = selectedUserId === user.id;

                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => setSelectedUserId(user.id)}
                      className={`w-full rounded-xl border px-3 py-3 text-left transition-colors ${
                        active
                          ? "border-teal-200 bg-white text-slate-950 shadow-sm dark:border-teal-900 dark:bg-slate-900 dark:text-white"
                          : "border-transparent bg-transparent text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-900"
                      }`}
                    >
                      <span className="block text-sm font-bold">{user.name}</span>
                      <span className="mt-0.5 block truncate text-xs text-slate-500">
                        {user.email}
                      </span>
                      <span className="mt-1 block text-xs font-semibold text-teal-700 dark:text-teal-300">
                        {user.bankName || "BankHub"} -{" "}
                        {user.bankAccountNumber || "-"}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
            <p className="text-xs font-bold uppercase text-slate-400">
              Tài khoản BankHub Sandbox
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {[
                ["Ngân hàng", selectedUser?.bankName || "-"],
                ["Chủ tài khoản", selectedUser?.bankAccountName || "-"],
                ["Số tài khoản", selectedUser?.bankAccountNumber || "-"],
                ["BankHub XID", selectedUser?.bankhubAccountXid || "-"],
                ["Liên kết lúc", formatLinkedAt(selectedUser?.sepayLinkedAt)],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="mt-1 break-all text-sm font-bold text-slate-800 dark:text-slate-200">
                    {value}
                  </p>
                </div>
              ))}
            </div>
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
            <input
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="mt-2 h-11 w-full rounded-2xl border border-teal-100 bg-teal-50/45 px-3 text-sm font-semibold tabular-nums text-slate-950 outline-none ring-teal-100 transition focus:border-teal-400 focus:ring-4 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              required
            />
          </label>

          <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
            Nội dung giao dịch
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value.slice(0, 255))}
              maxLength={255}
              rows={4}
              className="mt-2 w-full resize-none rounded-2xl border border-teal-100 bg-teal-50/45 px-3 py-3 text-sm text-slate-950 outline-none ring-teal-100 transition focus:border-teal-400 focus:ring-4 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              required
            />
            <span className="mt-1 block text-right text-xs text-slate-400">
              {content.length}/255
            </span>
          </label>
        </div>

        {error ? (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={submitting || loadingUsers || !selectedUser?.bankhubAccountXid}
          className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 text-sm font-bold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-teal-700 dark:hover:bg-teal-800"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Tạo giao dịch sandbox qua SePay
        </button>
      </form>

      <aside className="space-y-6">
        <section className="rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-xl shadow-teal-950/[0.05] backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
          <h2 className="font-black text-slate-950 dark:text-white">
            Tài khoản đã liên kết từ SePay
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
            Danh sách lấy trực tiếp từ BankHub Sandbox để admin đối chiếu XID
            trước khi tạo giao dịch.
          </p>

          <div className="mt-4 space-y-3">
            {loadingAccounts ? (
              <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-sm font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-950">
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang lấy tài khoản từ SePay
              </div>
            ) : bankhubAccounts.length === 0 ? (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3 text-sm font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-950">
                Chưa lấy được tài khoản nào từ BankHub Sandbox.
              </div>
            ) : (
              bankhubAccounts.map((account, index) => (
                <article
                  key={account.bankhubAccountXid || `${index}`}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {account.bankName || "BankHub Sandbox"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {account.bankAccountName || "-"}
                      </p>
                    </div>
                    <span className="rounded-full bg-teal-50 px-2 py-1 text-[11px] font-bold text-teal-700 ring-1 ring-teal-100 dark:bg-teal-950 dark:text-teal-200 dark:ring-teal-900">
                      #{index + 1}
                    </span>
                  </div>
                  <dl className="mt-3 space-y-2 text-xs">
                    <div>
                      <dt className="font-semibold text-slate-400">xid</dt>
                      <dd className="mt-0.5 break-all font-bold text-slate-800 dark:text-slate-200">
                        {account.bankhubAccountXid || "-"}
                      </dd>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <dt className="font-semibold text-slate-400">
                          account_number
                        </dt>
                        <dd className="mt-0.5 font-bold text-slate-800 dark:text-slate-200">
                          {account.bankAccountNumber || "-"}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-slate-400">active</dt>
                        <dd className="mt-0.5 font-bold text-slate-800 dark:text-slate-200">
                          {formatStatusValue(account.status?.active)}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-slate-400">
                          bank_api_connected
                        </dt>
                        <dd className="mt-0.5 font-bold text-slate-800 dark:text-slate-200">
                          {formatStatusValue(account.status?.bankApiConnected)}
                        </dd>
                      </div>
                    </div>
                  </dl>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-xl shadow-teal-950/[0.05] backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
          <h2 className="font-black text-slate-950 dark:text-white">
            Payload gửi SePay
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">bank_account_xid</dt>
              <dd className="max-w-[180px] break-all text-right font-bold text-slate-900 dark:text-white">
                {selectedUser?.bankhubAccountXid || "-"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">transfer_type</dt>
              <dd className="font-bold text-slate-900 dark:text-white">
                {transferType}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">amount</dt>
              <dd className="font-bold text-slate-900 dark:text-white">
                {formatCurrencyVND(Number(amount) || 0)}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-xl shadow-teal-950/[0.05] backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
          <h2 className="font-black text-slate-950 dark:text-white">
            Kết quả BankHub
          </h2>
          {!result ? (
            <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
              Sau khi submit thành công, trang hiển thị phản hồi từ BankHub.
              Giao dịch trong MoneyTrack sẽ được tạo bởi webhook SePay.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl bg-teal-50 p-4 dark:bg-teal-950/40">
                <p className="text-xs font-semibold uppercase text-teal-700 dark:text-teal-200">
                  Đã gửi yêu cầu
                </p>
                <p className="mt-1 text-sm font-bold text-teal-900 dark:text-teal-100">
                  Đang chờ webhook từ SePay
                </p>
              </div>
              {webhookWaitState === "waiting" ? (
                <div className="rounded-2xl border border-teal-200 bg-teal-50 p-4 text-sm font-semibold text-teal-800">
                  {CALLBACK_SUCCESS_TOAST}
                </div>
              ) : null}
              {webhookWaitState === "received" ? (
                <div className="rounded-2xl border border-teal-200 bg-teal-50 p-4 text-sm font-semibold text-teal-800">
                  {WEBHOOK_RECEIVED_MESSAGE}
                </div>
              ) : null}
              {webhookWaitState === "timeout" ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
                  {WEBHOOK_TIMEOUT_MESSAGE}
                </div>
              ) : null}
              <pre className="max-h-[360px] overflow-auto rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-white">
                {stringifyResult(result)}
              </pre>
              <Link
                href="/admin/sepay-logs"
                className="inline-flex h-10 w-full items-center justify-center rounded-2xl border border-teal-100 bg-white px-4 text-sm font-bold text-teal-700 transition-colors hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-950 dark:text-teal-200"
              >
                Mở SePay Logs để kiểm tra webhook
              </Link>
            </div>
          )}
        </section>
      </aside>
    </div>
  );
}
