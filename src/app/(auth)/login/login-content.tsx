"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { useSearchParams } from "next/navigation";

export default function LoginContent() {
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered") === "true";

  return (
    <div className="space-y-6">
      {registered ? (
        <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p className="font-medium">Đăng ký thành công! Vui lòng đăng nhập.</p>
        </div>
      ) : null}

      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">
          Đăng nhập
        </h1>
        <p className="text-sm leading-6 text-slate-500">
          Tiếp tục quản lý chi tiêu thông minh với FinTrack.
        </p>
      </div>

      <Link
        href="/register"
        className="block text-center text-sm font-semibold text-blue-600 transition hover:text-blue-700 hover:underline"
      >
        Chưa có tài khoản? Đăng ký
      </Link>
    </div>
  );
}
