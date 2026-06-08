"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import type { AxiosError } from "axios";
import { CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api, { API_URL } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuthStore, type User } from "@/store/authStore";

const loginSchema = z.object({
  email: z.string().trim().email("Email không hợp lệ"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

type LoginFormData = z.infer<typeof loginSchema>;
type ApiResponse<T> = {
  success?: boolean;
  data?: T;
  message?: string | string[];
  user?: User;
  accessToken?: string;
  refreshToken?: string;
  token?: string;
};
type AuthPayload = {
  user?: User;
  accessToken?: string;
  refreshToken?: string;
  token?: string;
};
type ApiErrorResponse = {
  message?: string | string[];
};

function normalizeMessage(message: string | string[] | undefined) {
  return Array.isArray(message) ? message.join(", ") : message;
}



  function GoogleIcon() {
    return (
      <span
        aria-hidden="true"
        className="inline-flex size-5 items-center justify-center text-base font-bold"
      >
        <span className="text-blue-600">G</span>
      </span>
    );
  }

  function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const registered = searchParams.get("registered") === "true";
    const setAuth = useAuthStore((state) => state.setAuth);
    const [showPassword, setShowPassword] = useState(false);

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
      const loginUrl = `${API_URL}/auth/login`;

      try {
        console.log("Login endpoint:", loginUrl);

        const response = await api.post<ApiResponse<AuthPayload>>("/auth/login", {
          email: data.email.trim().toLowerCase(),
          password: data.password,
        });

        const json = response.data;
        console.log("Login response:", json);

        if (json.success === false) {
          throw new Error(normalizeMessage(json.message) || "Đăng nhập thất bại");
        }

        const accessToken =
          json.data?.accessToken || json.accessToken || json.token || json.data?.token;
        const refreshToken = json.data?.refreshToken || json.refreshToken;
        const user = json.data?.user || json.user;

        if (!accessToken) {
          throw new Error("Backend không trả accessToken");
        }

        if (!user) {
          throw new Error("Backend không trả thông tin user");
        }

        setAuth(user, accessToken, refreshToken);
        console.log('User email:', user.email);
        // Verify cookie is set
        console.log('Cookie set?', document.cookie.includes('access_token'));
        // Use replace to navigate to dashboard
        router.replace('/dashboard');
      } catch (error) {
        const axiosError = error as AxiosError<ApiErrorResponse>;
        const responseMessage = normalizeMessage(axiosError.response?.data?.message);
        const message =
          responseMessage ||
          (error instanceof Error ? error.message : undefined) ||
          "Đăng nhập thất bại, vui lòng thử lại";

        console.error("Login failed:", {
          endpoint: loginUrl,
          status: axiosError.response?.status,
          response: axiosError.response?.data,
          error,
        });

        setError("root", { message });
      }
    };

    return (
      <div className="space-y-7">
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

        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
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
              className="h-11 border-slate-200 bg-slate-50 px-3 text-slate-950 placeholder:text-slate-400 focus-visible:border-blue-500 focus-visible:ring-blue-500/20"
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
                className="h-11 border-slate-200 bg-slate-50 px-3 pr-11 text-slate-950 placeholder:text-slate-400 focus-visible:border-blue-500 focus-visible:ring-blue-500/20"
                {...register("password")}
              />
              <button
                type="button"
                aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
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
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600"
            >
              {errors.root.message}
            </div>
          ) : null}

          <Button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              "h-11 w-full bg-blue-600 text-base font-semibold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-700",
              isSubmitting && "cursor-not-allowed opacity-80"
            )}
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : null}
            Đăng nhập
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <span className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-3 font-medium text-slate-400">hoặc</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="h-11 w-full border-slate-200 bg-white text-base font-semibold text-slate-800 hover:bg-slate-50"
        >
          <GoogleIcon />
          Đăng nhập với Google
        </Button>

        <p className="text-center text-sm text-slate-500">
          Chưa có tài khoản?{" "}
          <Link
            href="/register"
            className="font-semibold text-blue-600 transition hover:text-blue-700 hover:underline"
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
