"use client";

import { useEffect, useMemo, useState } from "react";
import { Link2, RefreshCw, Search, Users } from "lucide-react";
import { authFetch } from "@/lib/moneytrack-api";

type BankHubUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  bankhubAccountXid: string | null;
  bankAccountNumber: string | null;
  bankName: string | null;
  bankAccountName: string | null;
  sepayLinkedAt: string | null;
};

type LinkFilter = "ALL" | "LINKED" | "UNLINKED";

function isBankHubLinked(user: BankHubUser) {
  return Boolean(user.bankhubAccountXid?.trim());
}

function formatDate(value?: string | null) {
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

export default function LinkedUsersPage() {
  const [users, setUsers] = useState<BankHubUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<LinkFilter>("ALL");
  const [query, setQuery] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await authFetch<BankHubUser[]>("/api/admin/linked-users", {
        admin: true,
      });
      setUsers(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải danh sách user");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(fetchUsers, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return users.filter((user) => {
      const linked = isBankHubLinked(user);

      if (filter === "LINKED" && !linked) return false;
      if (filter === "UNLINKED" && linked) return false;

      if (!normalizedQuery) return true;

      return [
        user.name,
        user.email,
        user.role,
        user.bankName,
        user.bankAccountName,
        user.bankAccountNumber,
        user.bankhubAccountXid,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedQuery));
    });
  }, [users, filter, query]);

  const linkedCount = users.filter(isBankHubLinked).length;
  const unlinkedCount = users.length - linkedCount;

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <span className="rounded-2xl bg-emerald-50 p-3 text-emerald-700 ring-1 ring-emerald-100">
                <Users className="h-6 w-6" />
              </span>
              <div>
                <p className="text-sm font-semibold uppercase text-emerald-600">
                  Admin BankHub
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight">
                  Người dùng liên kết
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Trạng thái liên kết BankHub được xác định duy nhất bằng BankHub XID.
                  Số tài khoản, mã SePay hoặc dữ liệu chuyển khoản không được dùng để đánh dấu đã liên kết.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={fetchUsers}
              disabled={loading}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Làm mới
            </button>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              ["Tất cả", users.length],
              ["Đã liên kết", linkedCount],
              ["Chưa liên kết", unlinkedCount],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase text-slate-400">{label}</p>
                <p className="mt-1 text-2xl font-extrabold text-slate-900">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Tìm theo tên, email, ngân hàng, XID..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm font-medium outline-none ring-emerald-100 transition focus:border-emerald-400 focus:ring-4"
              />
            </div>

            <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-100 p-1">
              {[
                ["ALL", "Tất cả"],
                ["LINKED", "Đã liên kết"],
                ["UNLINKED", "Chưa liên kết"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value as LinkFilter)}
                  className={`rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
                    filter === value
                      ? "bg-white text-emerald-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-16 text-sm font-semibold text-slate-500">
              <RefreshCw className="h-5 w-5 animate-spin" />
              Đang tải danh sách user...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
              <Link2 className="h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-500">
                Không có user phù hợp với bộ lọc hiện tại.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1180px] text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-bold uppercase text-slate-500">
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3">Ngân hàng</th>
                    <th className="px-4 py-3">Chủ tài khoản</th>
                    <th className="px-4 py-3">Số tài khoản</th>
                    <th className="px-4 py-3">BankHub XID</th>
                    <th className="px-4 py-3">Liên kết lúc</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((user) => {
                    const linked = isBankHubLinked(user);

                    return (
                      <tr key={user.id} className="align-top transition-colors hover:bg-slate-50/70">
                        <td className="px-4 py-4">
                          <p className="font-bold text-slate-900">{user.name}</p>
                          <p className="mt-1 text-xs font-medium text-slate-500">{user.email}</p>
                        </td>
                        <td className="px-4 py-4">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                              linked
                                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {linked ? "Đã liên kết" : "Chưa liên kết"}
                          </span>
                        </td>
                        <td className="px-4 py-4 font-semibold text-slate-700">{user.bankName || "-"}</td>
                        <td className="px-4 py-4 font-semibold text-slate-700">{user.bankAccountName || "-"}</td>
                        <td className="px-4 py-4 font-mono text-xs font-bold text-slate-700">
                          {user.bankAccountNumber || "-"}
                        </td>
                        <td className="max-w-[260px] break-all px-4 py-4 font-mono text-xs font-bold text-slate-700">
                          {user.bankhubAccountXid || "-"}
                        </td>
                        <td className="px-4 py-4 text-xs font-medium text-slate-500">
                          {linked ? formatDate(user.sepayLinkedAt) : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
