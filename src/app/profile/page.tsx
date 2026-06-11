"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Banknote,
  CheckCheck,
  Copy,
  ExternalLink,
  Loader2,
  RefreshCw,
  ShieldCheck,
  UserCircle,
} from "lucide-react";
import { ApiRequestError, authFetch } from "@/lib/moneytrack-api";

type StoredUser = {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
  bankhubAccountXid?: string | null;
  bankAccountNumber?: string | null;
  bankName?: string | null;
  bankAccountName?: string | null;
  sepayLinkedAt?: string | null;
  balance?: string | number;
};

type BankhubAccount = {
  bankhubAccountXid: string | null;
  bankAccountNumber: string | null;
  bankName: string | null;
  bankAccountName: string | null;
  status?: unknown;
};

type HostedLinkResponse = {
  hostedLinkUrl?: string | null;
  hosted_link_url?: string | null;
  createdCompanyXid?: string | null;
  companyXid?: string | null;
};

type SyncResponse = StoredUser & {
  isLinked?: boolean;
  message?: string;
  accounts?: BankhubAccount[];
};

const SANDBOX_DESCRIPTION =
  "Tài khoản sandbox dùng để mô phỏng tài khoản ngân hàng trong môi trường BankHub Sandbox. Khi phát sinh giao dịch sandbox trên tài khoản này, hệ thống sẽ tự động đồng bộ giao dịch.";

function getStoredUserSnapshot() {
  if (typeof window === "undefined") return null;

  const rawUser = localStorage.getItem("user");
  if (!rawUser) return null;

  try {
    return JSON.parse(rawUser) as StoredUser;
  } catch {
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

function persistUser(user: StoredUser) {
  localStorage.setItem("user", JSON.stringify(user));
}

export default function ProfilePage() {
  const [user, setUser] = useState<StoredUser | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [selectableAccounts, setSelectableAccounts] = useState<BankhubAccount[]>([]);

  const loadProfile = useCallback(async () => {
    setLoadingProfile(true);
    setError(null);

    try {
      const data = await authFetch<StoredUser>("/auth/me");
      setUser(data);
      persistUser(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải profile.");
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const storedUser = getStoredUserSnapshot();
      if (storedUser) {
        setUser(storedUser);
      }
      loadProfile();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadProfile]);

  const mergeSyncedAccount = useCallback((data: SyncResponse) => {
    setUser((prev) => {
      const updated = {
        ...(prev || {}),
        bankhubAccountXid: data.bankhubAccountXid || null,
        bankAccountNumber: data.bankAccountNumber || null,
        bankName: data.bankName || null,
        bankAccountName: data.bankAccountName || null,
        sepayLinkedAt: data.sepayLinkedAt || null,
      };
      persistUser(updated);
      return updated;
    });
  }, []);

  const handleCreateHostedLink = async () => {
    setLinkLoading(true);
    setError(null);
    setNotice(null);

    try {
      const data = await authFetch<HostedLinkResponse>("/api/bankhub/hosted-link", {
        method: "POST",
      });
      const url = data.hostedLinkUrl || data.hosted_link_url;

      if (!url) {
        setNotice(
          data.createdCompanyXid
            ? `Đã tạo company ${data.createdCompanyXid}. Copy vào BANKHUB_COMPANY_XID rồi tạo link lại.`
            : "BankHub không trả hosted link."
        );
        return;
      }

      window.open(url, "_blank", "noopener,noreferrer");
      setNotice("Đã mở Hosted Link. Sau khi liên kết xong, bấm Đồng bộ tài khoản.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tạo Hosted Link.");
    } finally {
      setLinkLoading(false);
    }
  };

  const handleSyncAccount = async (bankhubAccountXid?: string | null) => {
    setSyncLoading(true);
    setError(null);
    setNotice(null);

    try {
      const data = await authFetch<SyncResponse>("/api/bankhub/sync-linked-account", {
        method: "POST",
        body: JSON.stringify(
          bankhubAccountXid ? { bankhubAccountXid } : {}
        ),
      });

      if (data.bankhubAccountXid) {
        mergeSyncedAccount(data);
        setSelectableAccounts([]);
        setNotice("Đã đồng bộ tài khoản BankHub Sandbox.");
      } else {
        setNotice(data.message || "Chưa có tài khoản BankHub mới để đồng bộ.");
      }
    } catch (err) {
      if (err instanceof ApiRequestError) {
        const body = err.body as { data?: { accounts?: BankhubAccount[] } } | null;
        const accounts = body?.data?.accounts || [];
        if (accounts.length > 0) {
          setSelectableAccounts(accounts);
        }
      }
      setError(err instanceof Error ? err.message : "Không thể đồng bộ tài khoản.");
    } finally {
      setSyncLoading(false);
    }
  };

  const handleCopy = (key: string, text?: string | null) => {
    if (!text) return;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const isLinked = Boolean(user?.bankhubAccountXid);
  const detailRows = [
    ["Ngân hàng", user?.bankName || "-"],
    ["Chủ tài khoản", user?.bankAccountName || "-"],
    ["Số tài khoản sandbox", user?.bankAccountNumber || "-"],
    ["Trạng thái", isLinked ? "Đã liên kết" : "Chưa liên kết"],
    ["Liên kết lúc", isLinked ? formatVietnamDateTime(user?.sepayLinkedAt) : "-"],
  ];

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
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

            <button
              type="button"
              onClick={loadProfile}
              disabled={loadingProfile}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loadingProfile ? "animate-spin" : ""}`} />
              Làm mới
            </button>
          </div>

          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              ["Họ tên", user?.name || "-"],
              ["Email", user?.email || "-"],
              ["Vai trò", user?.role || "-"],
              ["Số dư", user?.balance?.toString() || "-"],
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
                  BankHub Sandbox
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

            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCreateHostedLink}
                disabled={linkLoading}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition-colors hover:bg-slate-700 disabled:opacity-50"
              >
                {linkLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4" />
                )}
                Liên kết BankHub Sandbox
              </button>
              <button
                type="button"
                onClick={() => handleSyncAccount()}
                disabled={syncLoading}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
              >
                {syncLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                Đồng bộ tài khoản đã liên kết
              </button>
            </div>
          </div>

          {selectableAccounts.length > 0 ? (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-bold text-amber-900">
                Có nhiều tài khoản BankHub. Chọn tài khoản cần gán:
              </p>
              <div className="mt-3 grid gap-2">
                {selectableAccounts.map((account) => (
                  <button
                    key={account.bankhubAccountXid || account.bankAccountNumber}
                    type="button"
                    onClick={() => handleSyncAccount(account.bankhubAccountXid)}
                    className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-left text-sm transition-colors hover:bg-amber-100"
                  >
                    <span className="block font-bold">
                      {account.bankName || "BankHub"} - {account.bankAccountNumber || "-"}
                    </span>
                    <span className="block text-xs text-slate-500">
                      {account.bankAccountName || "-"} · {account.bankhubAccountXid}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

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

          {isLinked ? (
            <div className="mt-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-500">
                    BankHub XID
                  </p>
                  <p className="mt-1 break-all text-sm font-bold text-slate-900">
                    {user?.bankhubAccountXid}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy("bankhubAccountXid", user?.bankhubAccountXid)}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900"
                  aria-label="Sao chép BankHub XID"
                  title="Sao chép BankHub XID"
                >
                  {copied === "bankhubAccountXid" ? (
                    <CheckCheck className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          ) : null}

          {notice ? (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              {notice}
            </div>
          ) : null}

          {error ? (
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
