"use client";

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import type { AxiosError } from "axios";
import { CheckCircle2, Eye, EyeOff, Loader2, MailCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type ApiEnvelope, type AuthPayload } from "@/lib/auth";
import api from "@/lib/api";
import { cn } from "@/lib/utils";

const registerSchema = z
  .object({
    fullName: z.string().min(2, "Tên phải có ít nhất 2 ký tự"),
    email: z.string().email("Email không hợp lệ"),
    password: z.string().min(8, "Mật khẩu phải có ít nhất 8 ký tự"),
    confirmPassword: z.string(),
    otp: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu không khớp",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;
type ApiErrorResponse = {
  message?: string | string[];
};
type RegistrationOtpPayload = {
  message?: string;
  expiresAt?: string;
};

function getApiErrorMessage(
  error: unknown,
  fallback = "Không thể xử lý yêu cầu. Vui lòng thử lại."
) {
  const axiosError = error as AxiosError<ApiErrorResponse>;
  const responseMessage = axiosError.response?.data?.message;

  return Array.isArray(responseMessage)
    ? responseMessage.join(", ")
    : responseMessage || fallback;
}

function formatExpiry(value?: string) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");
  const [otpMessage, setOtpMessage] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      otp: "",
    },
  });

  const watchedEmail = useWatch({ control, name: "email" }) || "";
  const currentEmail = watchedEmail.trim().toLowerCase();
  const canCreateAccount = Boolean(otpEmail && currentEmail === otpEmail);
  const expiryText = formatExpiry(expiresAt);

  const onSubmit = async (data: RegisterFormData) => {
    clearErrors("root");
    const normalizedEmail = data.email.trim().toLowerCase();

    try {
      if (!canCreateAccount) {
        const response = await api.post<ApiEnvelope<RegistrationOtpPayload>>(
          "/auth/register/request-otp",
          {
            fullName: data.fullName,
            email: normalizedEmail,
          }
        );
        const payload = response.data.data;

        setOtpEmail(normalizedEmail);
        setOtpMessage(
          payload.message ||
            "Mã OTP xác thực đăng ký đã được gửi đến email của bạn."
        );
        setExpiresAt(payload.expiresAt || "");
        return;
      }

      const otp = data.otp?.trim() || "";
      if (!/^\d{6}$/.test(otp)) {
        setError("otp", { message: "Mã OTP phải gồm 6 chữ số" });
        return;
      }

      await api.post<ApiEnvelope<AuthPayload>>("/auth/register", {
        fullName: data.fullName,
        email: normalizedEmail,
        password: data.password,
        otp,
      });
      router.push("/login?registered=true");
    } catch (error) {
      setError("root", {
        message: getApiErrorMessage(error, "Đăng ký thất bại, vui lòng thử lại"),
      });
    }
  };

  return (
    <div className="mx-auto w-full max-w-md space-y-5">
      <div className="space-y-1 text-left">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-700">
          Create workspace
        </p>
        <h1 className="text-2xl font-black tracking-tight text-slate-950">
          Tạo tài khoản mới
        </h1>
        <p className="text-sm leading-5 text-slate-500">
          Bắt đầu theo dõi chi tiêu và tối ưu ngân sách cùng FinTrack.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
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
            className="h-11 border-teal-100 bg-teal-50/50 px-3 text-slate-950 shadow-inner shadow-white/70 placeholder:text-slate-400 focus-visible:border-teal-500 focus-visible:ring-teal-500/20"
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
              placeholder="Ít nhất 8 ký tự"
              autoComplete="new-password"
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
              className="h-11 border-teal-100 bg-teal-50/50 px-3 pr-11 text-slate-950 shadow-inner shadow-white/70 placeholder:text-slate-400 focus-visible:border-teal-500 focus-visible:ring-teal-500/20"
              {...register("confirmPassword")}
            />
            <button
              type="button"
              aria-label={
                showConfirmPassword
                  ? "Ẩn xác nhận mật khẩu"
                  : "Hiện xác nhận mật khẩu"
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-teal-100 hover:text-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/30"
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

        {otpMessage && canCreateAccount ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 shadow-sm">
            <div className="flex items-start gap-3">
              <CheckCircle2
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />
              <p className="font-medium">
                {otpMessage}
                {expiryText ? ` Mã hết hạn lúc ${expiryText}.` : ""}
              </p>
            </div>
          </div>
        ) : null}

        {otpEmail && !canCreateAccount ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
            Email đã thay đổi, vui lòng gửi lại OTP cho email mới.
          </div>
        ) : null}

        {canCreateAccount ? (
          <div className="space-y-2">
            <label htmlFor="otp" className="text-sm font-medium text-slate-700">
              OTP xác thực email
            </label>
            <div className="relative">
              <Input
                id="otp"
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                autoComplete="one-time-code"
                aria-invalid={Boolean(errors.otp)}
                className="h-11 border-teal-100 bg-teal-50/50 px-3 pl-10 text-center text-lg font-black tracking-[0.28em] text-slate-950 shadow-inner shadow-white/70 placeholder:text-slate-300 focus-visible:border-teal-500 focus-visible:ring-teal-500/20"
                {...register("otp")}
              />
              <MailCheck
                className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-teal-700"
                aria-hidden="true"
              />
            </div>
            {errors.otp ? (
              <p className="text-sm text-red-500">{errors.otp.message}</p>
            ) : null}
          </div>
        ) : null}

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
          {canCreateAccount ? "Tạo tài khoản" : "Gửi OTP xác thực"}
        </Button>
      </form>

      <p className="text-center text-sm text-slate-500">
        Đã có tài khoản?{" "}
        <Link
          href="/login"
          className="font-bold text-teal-700 transition hover:text-teal-800 hover:underline"
        >
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
