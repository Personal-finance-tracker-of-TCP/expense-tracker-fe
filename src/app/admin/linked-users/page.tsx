"use client";

import { useEffect, useState } from "react";
import { Users, Link2, RefreshCw } from "lucide-react";
import { authFetch } from "@/lib/moneytrack-api";

type LinkedUser = {
  id: string;
  name: string;
  email: string;
  sepayCode: string;
  sepayLinkedAt: string | null;
  role: string;
};

export default function LinkedUsersPage() {
  const [users, setUsers] = useState<LinkedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await authFetch<LinkedUser[]>("/api/admin/linked-users", {
        admin: true,
      });
      setUsers(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải danh sách");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-4">
              <span className="rounded-2xl bg-indigo-50 p-3 text-indigo-700 ring-1 ring-indigo-100">
                <Users className="h-6 w-6" />
              </span>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-600">
                  Admin
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight">
                  Người dùng liên kết
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  Danh sách tất cả tài khoản đã liên kết ngân hàng và được gán mã SePay.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={fetchUsers}
              disabled={loading}
              className="inline-flex items-center gap-2 h-9 px-4 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 shrink-0 mt-1"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Làm mới
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3 text-slate-400">
                <RefreshCw className="h-8 w-8 animate-spin" />
                <p className="text-sm font-medium">Đang tải danh sách...</p>
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <Link2 className="h-10 w-10 text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-400">
                Chưa có người dùng nào liên kết ngân hàng
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Người dùng cần truy cập trang Profile và nhấn "Liên kết ngân hàng".
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Người dùng
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Mã SePay
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Ngày liên kết
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Vai trò
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 font-bold text-xs flex items-center justify-center shrink-0">
                            {u.name.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="font-semibold text-slate-800">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">{u.email}</td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 tracking-wider">
                          <Link2 className="h-3 w-3" />
                          {u.sepayCode}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 text-xs">
                        {formatDate(u.sepayLinkedAt)}
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            u.role === "ADMIN"
                              ? "bg-indigo-100 text-indigo-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {u.role === "ADMIN" ? "Admin" : "User"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-400">
                Tổng cộng {users.length} người dùng đã liên kết
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
