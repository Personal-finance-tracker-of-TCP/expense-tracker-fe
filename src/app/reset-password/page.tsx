"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import type { AxiosError } from "axios";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

const resetPasswordSchema = z
  .object({
    email: z.string().trim().email("Email không hợp lệ"),
    otp: z.string().trim().regex(/^\d{6}$/, "Mã OTP phải gồm 6 chữ số"),
    newPassword: z.string().min(8, "Mật khẩu mới phải có ít nhất 8 ký tự"),
    confirmNewPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu mới"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmNewPassword"],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
type ApiErrorResponse = {
  message?: string | string[];
};

function normalizeMessage(message: string | string[] | undefined) {
  return Array.isArray(message) ? message.join(", ") : message;
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultEmail = searchParams.get("email") || "";
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: defaultEmail,
      otp: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      await api.post("/auth/reset-password", {
        email: data.email.trim().toLowerCase(),
        otp: data.otp.trim(),
        newPassword: data.newPassword,
        confirmNewPassword: data.confirmNewPassword,
      });

      router.push("/login?passwordReset=true");
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const message =
        normalizeMessage(axiosError.response?.data?.message) ||
        "Không thể đặt lại mật khẩu, vui lòng thử lại";

      setError("root", { message });
    }
  };

  return (
    <div className="space-y-7">
      <div className="space-y-2 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">
          Đặt lại mật khẩu
        </h1>
        <p className="text-sm leading-6 text-slate-500">
          Nhập mã OTP từ Gmail và đặt mật khẩu mới cho tài khoản của bạn.
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
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            className="h-11 border-slate-200 bg-slate-50 px-3 text-slate-950 placeholder:text-slate-400 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
            {...register("email")}
          />
          {errors.email ? (
            <p className="text-sm text-red-500">{errors.email.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="otp" className="text-sm font-medium text-slate-700">
            Mã OTP
          </label>
          <Input
            id="otp"
            inputMode="numeric"
            placeholder="123456"
            autoComplete="one-time-code"
            aria-invalid={Boolean(errors.otp)}
            className="h-11 border-slate-200 bg-slate-50 px-3 text-slate-950 placeholder:text-slate-400 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
            {...register("otp")}
          />
          {errors.otp ? (
            <p className="text-sm text-red-500">{errors.otp.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="newPassword" className="text-sm font-medium text-slate-700">
            Mật khẩu mới
          </label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              aria-invalid={Boolean(errors.newPassword)}
              className="h-11 border-slate-200 bg-slate-50 px-3 pr-11 text-slate-950 placeholder:text-slate-400 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
              {...register("newPassword")}
            />
            <button
              type="button"
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30"
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>
          {errors.newPassword ? (
            <p className="text-sm text-red-500">{errors.newPassword.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmNewPassword" className="text-sm font-medium text-slate-700">
            Xác nhận mật khẩu mới
          </label>
          <div className="relative">
            <Input
              id="confirmNewPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              aria-invalid={Boolean(errors.confirmNewPassword)}
              className="h-11 border-slate-200 bg-slate-50 px-3 pr-11 text-slate-950 placeholder:text-slate-400 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
              {...register("confirmNewPassword")}
            />
            <button
              type="button"
              aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30"
              onClick={() => setShowConfirmPassword((value) => !value)}
            >
              {showConfirmPassword ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>
          {errors.confirmNewPassword ? (
            <p className="text-sm text-red-500">{errors.confirmNewPassword.message}</p>
          ) : null}
        </div>

        {errors.root?.message ? (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {errors.root.message}
          </div>
        ) : null}

        <Button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            "h-11 w-full bg-emerald-600 text-base font-semibold text-white shadow-sm shadow-emerald-500/20 hover:bg-emerald-700",
            isSubmitting && "cursor-not-allowed opacity-80"
          )}
        >
          {isSubmitting ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : null}
          Cập nhật mật khẩu
        </Button>
      </form>

      <p className="text-center text-sm text-slate-500">
        Chưa nhận được mã?{" "}
        <Link href="/forgot-password" className="font-semibold text-emerald-600 transition hover:text-emerald-700 hover:underline">
          Gửi lại OTP
        </Link>
      </p>
    </div>
  );
}