"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Banknote,
  CheckCheck,
  Copy,
  Link2,
  Link2Off,
  Loader2,
  ShieldCheck,
  UserCircle,
  X,
} from "lucide-react";
import { authFetch } from "@/lib/moneytrack-api";

type StoredUser = {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  sepayCode?: string | null;
  bankAccountNumber?: string | null;
  sepayLinkedAt?: string | null;
  balance?: string | number;
};

type BankLinkInfo = {
  sepayCode: string | null;
  bankAccountNumber: string | null;
  sepayLinkedAt: string | null;
  isLinked?: boolean;
  systemBank?: {
    name: string;
    accountNumber: string;
    accountHolder: string;
  };
};

type CopyTarget = "bankAccountNumber" | "sepayCode" | null;

const SANDBOX_BANK_NAME = "SePay BankHub Sandbox";
const SANDBOX_DESCRIPTION =
  "Tài khoản sandbox dùng để mô phỏng tài khoản ngân hàng trong môi trường BankHub Sandbox. Khi phát sinh giao dịch sandbox trên tài khoản này, hệ thống sẽ tự động đồng bộ giao dịch.";

function getStoredUserSnapshot() {
  if (typeof window === "undefined") return null;

  const rawUser = localStorage.getItem("user");
  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser) as StoredUser;
  } catch {
    console.error("Failed to parse stored user");
    return null;
  }
}

function formatVietnamDateTime(value?: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

export default function ProfilePage() {
  const [user, setUser] = useState<StoredUser | null>(getStoredUserSnapshot);
  const [bankLink, setBankLink] = useState<BankLinkInfo | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unlinkLoading, setUnlinkLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<CopyTarget>(null);

  const syncStoredUserSandboxLink = useCallback((link: BankLinkInfo) => {
    setUser((prev) => {
      if (!prev) return prev;

      const updated = {
        ...prev,
        sepayCode: link.sepayCode,
        bankAccountNumber: link.bankAccountNumber,
        sepayLinkedAt: link.sepayLinkedAt,
      };
      localStorage.setItem("user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  useEffect(() => {
    async function fetchBankLink() {
      try {
        const data = await authFetch<BankLinkInfo>("/api/bank-link");
        setBankLink(data);
        syncStoredUserSandboxLink(data);
      } catch {
        // The page can still render profile information from local storage.
      }
    }

    fetchBankLink();
  }, [syncStoredUserSandboxLink]);

  const handleLink = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await authFetch<BankLinkInfo>(
        "/api/users/me/sepay-sandbox-link",
        { method: "PATCH" }
      );

      let latestLink = data;
      try {
        latestLink = await authFetch<BankLinkInfo>("/api/bank-link");
      } catch {
        // Keep the PATCH response if the follow-up read fails.
      }

      setBankLink(latestLink);
      syncStoredUserSandboxLink(latestLink);
      setShowModal(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể liên kết SePay BankHub Sandbox."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUnlink = async () => {
    if (
      !confirm(
        "Bạn có chắc muốn hủy liên kết tài khoản sandbox? Mã chuyển khoản tiền thật vẫn được giữ cho luồng VA sau này."
      )
    ) {
      return;
    }

    setUnlinkLoading(true);
    setError(null);

    try {
      await authFetch("/api/bank-link", { method: "DELETE" });
      setBankLink((prev) =>
        prev
          ? { ...prev, bankAccountNumber: null, sepayLinkedAt: null, isLinked: false }
          : null
      );
      syncStoredUserSandboxLink({
        sepayCode: bankLink?.sepayCode || null,
        bankAccountNumber: null,
        sepayLinkedAt: null,
        isLinked: false,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể hủy liên kết tài khoản sandbox."
      );
    } finally {
      setUnlinkLoading(false);
    }
  };

  const handleCopy = (target: Exclude<CopyTarget, null>, text?: string | null) => {
    if (!text) return;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(target);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const isLinked = Boolean(bankLink?.bankAccountNumber);
  const linkedAt = formatVietnamDateTime(bankLink?.sepayLinkedAt);

  const detailRows = [
    ["Ngân hàng", SANDBOX_BANK_NAME],
    ["Tài khoản sandbox", bankLink?.bankAccountNumber || "-"],
    ["Trạng thái", isLinked ? "Đã liên kết" : "Chưa liên kết"],
    ["Liên kết lúc", isLinked ? linkedAt : "-"],
    ["Mã chuyển khoản tiền thật", bankLink?.sepayCode || "-"],
  ];

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <span className="rounded-2xl bg-blue-50 p-3 text-blue-700 ring-1 ring-blue-100">
              <UserCircle className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm font-semibold uppercase text-blue-600">
                Account
              </p>
              <h1 className="mt-2 text-3xl font-bold">Profile</h1>
              <p className="mt-2 text-sm text-slate-500">
                Thông tin tài khoản và liên kết SePay BankHub Sandbox.
              </p>
            </div>
          </div>

          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              ["Họ tên", user?.name || "-"],
              ["Email", user?.email || "-"],
              ["Vai trò", user?.role || "-"],
              ["Tài khoản sandbox", bankLink?.bankAccountNumber || "-"],
              ["Mã chuyển khoản tiền thật", bankLink?.sepayCode || "-"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-slate-50 p-4">
                <dt className="text-sm text-slate-500">{label}</dt>
                <dd className="mt-1 break-all font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <span
                className={`rounded-2xl p-3 ring-1 ${
                  isLinked
                    ? "bg-emerald-50 text-emerald-600 ring-emerald-100"
                    : "bg-slate-50 text-slate-500 ring-slate-100"
                }`}
              >
                <Banknote className="h-6 w-6" />
              </span>
              <div>
                <p className="text-sm font-semibold uppercase text-slate-500">
                  Liên kết BankHub Sandbox
                </p>
                <h2 className="mt-1 text-xl font-bold">
                  {isLinked
                    ? "Đã liên kết SePay BankHub Sandbox"
                    : "Chưa liên kết SePay BankHub Sandbox"}
                </h2>
                <p className="mt-2 max-w-xl text-sm text-slate-500">
                  {SANDBOX_DESCRIPTION}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {isLinked ? (
                <>
                  <button
                    type="button"
                    onClick={() => setShowModal(true)}
                    className="inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Xem thông tin
                  </button>
                  <button
                    type="button"
                    onClick={handleUnlink}
                    disabled={unlinkLoading}
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
                  >
                    {unlinkLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Link2Off className="h-4 w-4" />
                    )}
                    Hủy liên kết
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleLink}
                  disabled={loading}
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-slate-700 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Link2 className="h-4 w-4" />
                  )}
                  Liên kết sandbox
                </button>
              )}
            </div>
          </div>

          {isLinked ? (
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {detailRows.map(([label, value]) => (
                <div key={label} className="rounded-xl bg-slate-50 px-4 py-3">
                  <p className="text-xs font-medium text-slate-500">{label}</p>
                  <p className="mt-1 break-all text-sm font-bold text-slate-900">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          ) : null}

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
        </div>
      </div>

      {showModal && isLinked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900">
                  Đã liên kết SePay BankHub Sandbox
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                aria-label="Đóng"
                title="Đóng"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-6">
              <p className="text-sm leading-6 text-slate-500">
                {SANDBOX_DESCRIPTION}
              </p>

              <div className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                {detailRows.map(([label, value]) => {
                  const copyTarget =
                    label === "Tài khoản sandbox"
                      ? "bankAccountNumber"
                      : label === "Mã chuyển khoản tiền thật"
                        ? "sepayCode"
                        : null;

                  return (
                    <div
                      key={label}
                      className="flex items-center justify-between gap-3 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-500">
                          {label}
                        </p>
                        <p className="mt-1 break-all text-sm font-bold text-slate-900">
                          {value}
                        </p>
                      </div>
                      {copyTarget ? (
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(
                              copyTarget,
                              copyTarget === "bankAccountNumber"
                                ? bankLink?.bankAccountNumber
                                : bankLink?.sepayCode
                            )
                          }
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
                          aria-label={`Sao chép ${label}`}
                          title={`Sao chép ${label}`}
                        >
                          {copied === copyTarget ? (
                            <CheckCheck className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-slate-100 px-6 py-4">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="h-10 w-full rounded-xl bg-slate-900 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
