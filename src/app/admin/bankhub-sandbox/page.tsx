"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, Loader2, RefreshCw, Send, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { formatCurrencyVND } from "@/lib/finance";
import { authFetch } from "@/lib/moneytrack-api";

type LinkedUser = {
  id: string;
  name: string;
  email: string;
  sepayCode: string | null;
  bankAccountNumber: string | null;
  sepayLinkedAt: string | null;
  role: string;
};

type TransferType = "credit" | "debit";

type BankHubMockResponse = {
  code?: number;
  message?: string;
  data?: {
    transaction_id?: string;
    reference_number?: string;
    transaction_date?: string;
    amount?: number;
    transfer_type?: string;
    accumulated?: number;
  };
};

const SUCCESS_TOAST =
  "Đã gửi yêu cầu tạo giao dịch sandbox tới SePay. Đang chờ webhook.";

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

export default function BankHubSandboxPage() {
  const [users, setUsers] = useState<LinkedUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [transferType, setTransferType] = useState<TransferType>("credit");
  const [amount, setAmount] = useState("200000");
  const [content, setContent] = useState("Sandbox income demo");
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BankHubMockResponse | null>(null);

  useEffect(() => {
    let isMounted = true;

    authFetch<LinkedUser[]>("/api/admin/linked-users", { admin: true })
      .then((data) => {
        if (!isMounted) return;

        const linkedUsers = (data || []).filter((user) => user.bankAccountNumber);
        setUsers(linkedUsers);
        setSelectedUserId((current) => current || linkedUsers[0]?.id || "");
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Không thể tải danh sách user");
      })
      .finally(() => {
        if (isMounted) setLoadingUsers(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) || null,
    [selectedUserId, users]
  );

  const reloadUsers = async () => {
    setLoadingUsers(true);
    setError(null);

    try {
      const data = await authFetch<LinkedUser[]>("/api/admin/linked-users", {
        admin: true,
      });
      const linkedUsers = (data || []).filter((user) => user.bankAccountNumber);
      setUsers(linkedUsers);
      setSelectedUserId((current) =>
        linkedUsers.some((user) => user.id === current)
          ? current
          : linkedUsers[0]?.id || ""
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải danh sách user");
    } finally {
      setLoadingUsers(false);
    }
  };

  const submitSandboxTransaction = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedUser) {
      setError("Vui lòng chọn user đã liên kết BankHub Sandbox");
      return;
    }

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Số tiền phải là số lớn hơn 0");
      return;
    }

    const trimmedContent = content.trim();
    if (!trimmedContent) {
      setError("Nội dung giao dịch là bắt buộc");
      return;
    }

    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const response = await authFetch<BankHubMockResponse>(
        "/api/admin/bankhub-sandbox/transactions",
        {
          method: "POST",
          admin: true,
          body: JSON.stringify({
            userId: selectedUser.id,
            transferType,
            amount: parsedAmount,
            content: trimmedContent,
          }),
        }
      );

      setResult(response);
      toast.success(SUCCESS_TOAST);
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
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <span className="rounded-2xl bg-emerald-50 p-3 text-emerald-700 ring-1 ring-emerald-100">
                <ShieldCheck className="h-6 w-6" />
              </span>
              <div>
                <p className="text-sm font-semibold uppercase text-emerald-600">
                  Admin BankHub Sandbox
                </p>
                <h1 className="mt-2 text-3xl font-bold">
                  Tạo giao dịch sandbox
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Admin gửi mock transaction tới SePay BankHub Sandbox. MoneyTrack
                  không tự tạo giao dịch ở bước này; giao dịch chỉ xuất hiện sau khi
                  webhook SePay gọi về hệ thống.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={reloadUsers}
              disabled={loadingUsers}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loadingUsers ? "animate-spin" : ""}`} />
              Làm mới user
            </button>
          </div>
        </section>

        <form
          onSubmit={submitSandboxTransaction}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="space-y-5">
            <div>
              <p className="text-sm font-semibold text-slate-700">
                User đã liên kết sandbox
              </p>
              <div className="mt-2 max-h-56 space-y-2 overflow-auto rounded-xl border border-slate-200 bg-slate-50 p-2">
                {loadingUsers ? (
                  <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-3 text-sm font-semibold text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang tải user
                  </div>
                ) : users.length === 0 ? (
                  <div className="rounded-lg bg-white px-3 py-3 text-sm font-semibold text-slate-500">
                    Chưa có user liên kết sandbox
                  </div>
                ) : (
                  users.map((user) => {
                    const active = selectedUserId === user.id;

                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => setSelectedUserId(user.id)}
                        className={`w-full rounded-lg border px-3 py-3 text-left transition-colors ${
                          active
                            ? "border-emerald-200 bg-white text-slate-950 shadow-sm"
                            : "border-transparent bg-transparent text-slate-600 hover:bg-white"
                        }`}
                      >
                        <span className="block text-sm font-bold">{user.name}</span>
                        <span className="mt-0.5 block truncate text-xs text-slate-500">
                          {user.email}
                        </span>
                        <span className="mt-1 block break-all text-xs font-semibold text-emerald-700">
                          {user.bankAccountNumber}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase text-slate-400">
                Tài khoản BankHub Sandbox
              </p>
              <p className="mt-1 break-all text-sm font-extrabold text-slate-900">
                {selectedUser?.bankAccountNumber || "-"}
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-500">Mã chuyển khoản tiền thật</p>
                  <p className="mt-1 text-sm font-bold text-slate-800">
                    {selectedUser?.sepayCode || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Liên kết lúc</p>
                  <p className="mt-1 text-sm font-bold text-slate-800">
                    {formatLinkedAt(selectedUser?.sepayLinkedAt)}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-slate-700">Loại giao dịch</p>
              <div className="mt-2 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
                {[
                  {
                    value: "credit" as const,
                    label: "Tiền vào",
                    icon: ArrowDownLeft,
                  },
                  {
                    value: "debit" as const,
                    label: "Tiền ra",
                    icon: ArrowUpRight,
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  const active = transferType === item.value;

                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setTransferType(item.value)}
                      className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg text-sm font-bold transition-colors ${
                        active
                          ? "bg-white text-emerald-700 shadow-sm"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="block text-sm font-semibold text-slate-700">
              Số tiền
              <input
                type="number"
                min={1}
                step={1}
                inputMode="numeric"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm font-semibold tabular-nums outline-none ring-emerald-100 transition focus:border-emerald-400 focus:ring-4"
                required
              />
            </label>

            <label className="block text-sm font-semibold text-slate-700">
              Nội dung giao dịch
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value.slice(0, 255))}
                maxLength={255}
                rows={4}
                className="mt-2 w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none ring-emerald-100 transition focus:border-emerald-400 focus:ring-4"
                required
              />
              <span className="mt-1 block text-right text-xs text-slate-400">
                {content.length}/255
              </span>
            </label>
          </div>

          {error ? (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting || loadingUsers || !selectedUser}
            className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
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
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-bold text-slate-900">Payload gửi SePay</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">bank_account_xid</dt>
                <dd className="max-w-[180px] break-all text-right font-bold text-slate-900">
                  {selectedUser?.bankAccountNumber || "-"}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">transfer_type</dt>
                <dd className="font-bold text-slate-900">{transferType}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">amount</dt>
                <dd className="font-bold text-slate-900">
                  {formatCurrencyVND(Number(amount) || 0)}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-bold text-slate-900">Kết quả BankHub</h2>
            {!result ? (
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Sau khi submit thành công, trang chỉ hiển thị phản hồi từ BankHub.
                Giao dịch trong MoneyTrack sẽ được tạo bởi webhook SePay.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                <div className="rounded-xl bg-emerald-50 p-4">
                  <p className="text-xs font-semibold uppercase text-emerald-600">
                    Đã gửi yêu cầu
                  </p>
                  <p className="mt-1 text-sm font-bold text-emerald-800">
                    Đang chờ webhook từ SePay
                  </p>
                </div>
                <pre className="max-h-[360px] overflow-auto rounded-xl bg-slate-950 p-4 text-xs leading-6 text-white">
                  {JSON.stringify(result, null, 2)}
                </pre>
                <Link
                  href="/transactions"
                  className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-emerald-200 bg-white px-4 text-sm font-bold text-emerald-700 transition-colors hover:bg-emerald-50"
                >
                  Mở danh sách giao dịch để kiểm tra webhook
                </Link>
              </div>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}
