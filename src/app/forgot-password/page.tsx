"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import type { AxiosError } from "axios";
import { ArrowRight, Loader2, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Email không hợp lệ"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
type ApiErrorResponse = {
  message?: string | string[];
};

function normalizeMessage(message: string | string[] | undefined) {
  return Array.isArray(message) ? message.join(", ") : message;
}

export default function ForgotPasswordPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      await api.post("/auth/forgot-password", {
        email: data.email.trim().toLowerCase(),
      });

      router.push(`/reset-password?email=${encodeURIComponent(data.email.trim().toLowerCase())}`);
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const message =
        normalizeMessage(axiosError.response?.data?.message) ||
        "Không thể gửi mã OTP, vui lòng thử lại";

      setError("root", { message });
    }
  };

  return (
    <div className="space-y-7">
      <div className="space-y-2 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
          <Mail className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">
          Quên mật khẩu
        </h1>
        <p className="text-sm leading-6 text-slate-500">
          Nhập email để nhận mã OTP đặt lại mật khẩu qua Gmail.
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
            className="h-11 border-slate-200 bg-slate-50 px-3 text-slate-950 placeholder:text-slate-400 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/20"
            {...register("email")}
          />
          {errors.email ? (
            <p className="text-sm text-red-500">{errors.email.message}</p>
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
          {isSubmitting ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <ArrowRight className="size-4" aria-hidden="true" />}
          Gửi mã OTP
        </Button>
      </form>

      <p className="text-center text-sm text-slate-500">
        Đã nhớ mật khẩu?{" "}
        <Link href="/login" className="font-semibold text-emerald-600 transition hover:text-emerald-700 hover:underline">
          Quay lại đăng nhập
        </Link>
      </p>
    </div>
  );
}