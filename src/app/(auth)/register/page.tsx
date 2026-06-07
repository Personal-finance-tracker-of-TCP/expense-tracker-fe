"use client";

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import type { AxiosError } from "axios";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, "Tên phải có ít nhất 2 ký tự"),
    email: z.string().trim().email("Email không hợp lệ"),
    password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu không khớp",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;
type ApiErrorResponse = {
  message?: string | string[];
};

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await api.post("/auth/register", {
        name: data.fullName.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
      });
      router.push("/login?registered=true");
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const responseMessage = axiosError.response?.data?.message;
      const message = Array.isArray(responseMessage)
        ? responseMessage.join(", ")
        : responseMessage || "Đăng ký thất bại, vui lòng thử lại";

      setError("root", { message });
    }
  };

  return (
    <div className="space-y-7">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">
          Tạo tài khoản mới
        </h1>
        <p className="text-sm leading-6 text-slate-500">
          Bắt đầu theo dõi chi tiêu và tối ưu ngân sách cùng FinTrack.
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-2">
          <label
            htmlFor="fullName"
            className="text-sm font-medium text-slate-700"
          >
            Họ và tên
          </label>
          <Input
            id="fullName"
            type="text"
            placeholder="Nguyễn Văn A"
            autoComplete="name"
            aria-invalid={Boolean(errors.fullName)}
            className="h-11 border-slate-200 bg-slate-50 px-3 text-slate-950 placeholder:text-slate-400 focus-visible:border-blue-500 focus-visible:ring-blue-500/20"
            {...register("fullName")}
          />
          {errors.fullName ? (
            <p className="text-sm text-red-500">{errors.fullName.message}</p>
          ) : null}
        </div>

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
              placeholder="Ít nhất 8 ký tự"
              autoComplete="new-password"
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

        <div className="space-y-2">
          <label
            htmlFor="confirmPassword"
            className="text-sm font-medium text-slate-700"
          >
            Xác nhận mật khẩu
          </label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Nhập lại mật khẩu"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.confirmPassword)}
              className="h-11 border-slate-200 bg-slate-50 px-3 pr-11 text-slate-950 placeholder:text-slate-400 focus-visible:border-blue-500 focus-visible:ring-blue-500/20"
              {...register("confirmPassword")}
            />
            <button
              type="button"
              aria-label={
                showConfirmPassword
                  ? "Ẩn xác nhận mật khẩu"
                  : "Hiện xác nhận mật khẩu"
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
              onClick={() => setShowConfirmPassword((value) => !value)}
            >
              {showConfirmPassword ? (
                <EyeOff className="size-4" aria-hidden="true" />
              ) : (
                <Eye className="size-4" aria-hidden="true" />
              )}
            </button>
          </div>
          {errors.confirmPassword ? (
            <p className="text-sm text-red-500">
              {errors.confirmPassword.message}
            </p>
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
          Đăng ký
        </Button>
      </form>

      <p className="text-center text-sm text-slate-500">
        Đã có tài khoản?{" "}
        <Link
          href="/login"
          className="font-semibold text-blue-600 transition hover:text-blue-700 hover:underline"
        >
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
