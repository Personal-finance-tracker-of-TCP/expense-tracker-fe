"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";

import { ProfileForm } from "./ProfileForm";
import { type ApiUser, normalizeUser, type User } from "@/lib/auth";
import { authFetch } from "@/lib/moneytrack-api";
import { useAuthStore } from "@/store/authStore";

export default function ProfilePage() {
  const setUser = useAuthStore((state) => state.setUser);
  const [user, setProfileUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadProfile() {
    setLoading(true);
    setError(null);

    try {
      const apiUser = await authFetch<ApiUser>("/auth/me");
      const normalizedUser = normalizeUser(apiUser);
      setProfileUser(normalizedUser);
      setUser(normalizedUser);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Không thể tải hồ sơ người dùng"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    queueMicrotask(() => {
      if (active) {
        void loadProfile();
      }
    });

    return () => {
      active = false;
    };
    // loadProfile intentionally reads stable Zustand setters and local state setters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <main className="mx-auto flex min-h-[420px] max-w-6xl items-center justify-center">
        <div className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white px-6 py-5 text-sm font-bold text-slate-500 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
          Đang tải hồ sơ từ backend...
        </div>
      </main>
    );
  }

  if (error || !user) {
    return (
      <main className="mx-auto max-w-3xl">
        <div className="rounded-3xl border border-red-100 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-1 h-5 w-5 shrink-0 text-red-600" />
            <div>
              <h1 className="text-lg font-black text-slate-950">
                Không tải được hồ sơ
              </h1>
              <p className="mt-1 text-sm font-medium text-slate-500">
                {error || "Phiên đăng nhập không hợp lệ."}
              </p>
              <button
                type="button"
                onClick={() => loadProfile()}
                className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white transition hover:bg-emerald-700"
              >
                <RefreshCw className="h-4 w-4" />
                Tải lại
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <ProfileForm user={user} />
    </div>
  );
}
