"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import type { AxiosError } from "axios";
import { CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type ApiEnvelope, type AuthPayload, normalizeUser } from "@/lib/auth";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

type LoginFormData = z.infer<typeof loginSchema>;
type ApiErrorResponse = {
  message?: string | string[];
};
type GoogleOAuthStatus = {
  enabled?: boolean;
};

function GoogleIcon() {
  return (
    <span
      aria-hidden="true"
      className="inline-flex size-5 items-center justify-center text-base font-black"
    >
      <span className="text-teal-700">G</span>
    </span>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered") === "true";
  const oauthError = searchParams.get("oauth") === "failed";
  const sessionExpired = searchParams.get("expired") === "1";
  const resetSuccess = searchParams.get("reset") === "success";
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isGoogleConfigured, setIsGoogleConfigured] = useState<boolean | null>(
    null
  );

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const response = await api.post<ApiEnvelope<AuthPayload>>("/auth/login", {
        email: data.email,
        password: data.password,
      });

      const authData = response.data.data;
      setAuth(
        normalizeUser(authData.user),
        authData.accessToken,
        authData.refreshToken
      );
      router.push("/dashboard");
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const responseMessage = axiosError.response?.data?.message;
      const message = Array.isArray(responseMessage)
        ? responseMessage.join(", ")
        : responseMessage || "Đăng nhập thất bại, vui lòng thử lại";

      setError("root", { message });
    }
  };

  useEffect(() => {
    if (sessionExpired || oauthError) {
      clearAuth();
    }
  }, [clearAuth, oauthError, sessionExpired]);

  useEffect(() => {
    let isMounted = true;

    fetch("/api/auth/google-status", { cache: "no-store" })
      .then((response) => response.json() as Promise<GoogleOAuthStatus>)
      .then((status) => {
        if (isMounted) {
          setIsGoogleConfigured(Boolean(status.enabled));
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsGoogleConfigured(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleGoogleSignIn = async () => {
    if (isGoogleConfigured === false) {
      return;
    }

    try {
      setIsGoogleLoading(true);
      const callbackUrl = `${window.location.origin}/oauth-callback`;
      await signIn("google", { callbackUrl });
    } catch {
      router.replace("/login?oauth=failed");
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md space-y-5">
      {registered ? (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-sm">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p className="font-medium">Đăng ký thành công! Vui lòng đăng nhập.</p>
        </div>
      ) : null}

      {resetSuccess ? (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-sm">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p className="font-medium">
            Mật khẩu đã được cập nhật. Vui lòng đăng nhập lại.
          </p>
        </div>
      ) : null}

      {oauthError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600 shadow-sm">
          Đăng nhập Google thất bại. Vui lòng kiểm tra cấu hình OAuth hoặc thử
          đăng nhập bằng email.
        </div>
      ) : null}

      {sessionExpired ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700 shadow-sm">
          Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để mở hồ sơ.
        </div>
      ) : null}

      <div className="space-y-1 text-left">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-700">
          Welcome back
        </p>
        <h1 className="text-2xl font-black tracking-tight text-slate-950">
          Đăng nhập
        </h1>
        <p className="text-sm leading-5 text-slate-500">
          Tiếp tục quản lý chi tiêu thông minh với FinTrack.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-slate-700">
            Email
          </label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            className="h-11 border-teal-100 bg-teal-50/50 px-3 text-slate-950 shadow-inner shadow-white/70 placeholder:text-slate-400 focus-visible:border-teal-500 focus-visible:ring-teal-500/20"
            {...register("email")}
          />
          {errors.email ? (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="password"
            className="text-sm font-medium text-slate-700"
          >
            Mật khẩu
          </label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Nhập mật khẩu"
              autoComplete="current-password"
              aria-invalid={Boolean(errors.password)}
              className="h-11 border-teal-100 bg-teal-50/50 px-3 pr-11 text-slate-950 shadow-inner shadow-white/70 placeholder:text-slate-400 focus-visible:border-teal-500 focus-visible:ring-teal-500/20"
              {...register("password")}
            />
            <button
              type="button"
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-teal-100 hover:text-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/30"
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>
          {errors.password ? (
            <p className="text-sm text-red-500">{errors.password.message}</p>
          ) : null}
        </div>

        {errors.root?.message ? (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600"
          >
            {errors.root.message}
          </div>
        ) : null}

        <Button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            "h-11 w-full bg-[linear-gradient(135deg,#0f766e,#2563eb)] text-base font-bold text-white shadow-lg shadow-teal-700/20 hover:opacity-95",
            isSubmitting && "cursor-not-allowed opacity-80"
          )}
        >
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : null}
          Đăng nhập
        </Button>
      </form>

      <div className="-mt-2 flex justify-end">
        <Link
          href="/forgot-password"
          className="text-sm font-bold text-teal-700 transition hover:text-teal-800 hover:underline"
        >
          Quên mật khẩu?
        </Link>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <span className="w-full border-t border-teal-100" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white/80 px-3 font-bold text-slate-400">hoặc</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        disabled={isGoogleLoading || isGoogleConfigured === false}
        className="h-11 w-full border-teal-100 bg-white text-base font-bold text-slate-800 shadow-sm hover:bg-teal-50"
        onClick={handleGoogleSignIn}
      >
        {isGoogleLoading ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <GoogleIcon />
        )}
        Đăng nhập với Google
      </Button>

      {isGoogleConfigured === false ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm font-bold text-amber-700">
          Google OAuth chưa được cấu hình trên môi trường này.
        </p>
      ) : null}

      <p className="text-center text-sm text-slate-500">
        Chưa có tài khoản?{" "}
        <Link
          href="/register"
          className="font-bold text-teal-700 transition hover:text-teal-800 hover:underline"
        >
          Đăng ký
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
