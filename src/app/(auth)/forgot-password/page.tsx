"use client";

import { useState } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import type { AxiosError } from "axios";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  MailCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import { type ApiEnvelope } from "@/lib/auth";
import { cn } from "@/lib/utils";

const requestOtpSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
});

const verifyOtpSchema = z.object({
  otp: z.string().regex(/^\d{6}$/, "Mã OTP phải gồm 6 chữ số"),
});

const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(8, "Mật khẩu mới phải có ít nhất 8 ký tự"),
    confirmNewPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu mới"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmNewPassword"],
  });

type RequestOtpFormData = z.infer<typeof requestOtpSchema>;
type VerifyOtpFormData = z.infer<typeof verifyOtpSchema>;
type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
type ApiErrorResponse = {
  message?: string | string[];
};
type ForgotPasswordPayload = {
  message?: string;
  expiresAt?: string;
};
type RecoveryStep = "email" | "otp" | "password";

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

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<RecoveryStep>("email");
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [verifiedOtp, setVerifiedOtp] = useState("");
  const [otpMessage, setOtpMessage] = useState("");
  const [verifyMessage, setVerifyMessage] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const requestForm = useForm<RequestOtpFormData>({
    resolver: zodResolver(requestOtpSchema),
    defaultValues: {
      email: "",
    },
  });

  const verifyForm = useForm<VerifyOtpFormData>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: {
      otp: "",
    },
  });

  const resetForm = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const handleRequestOtp = async (data: RequestOtpFormData) => {
    setOtpMessage("");
    setVerifyMessage("");
    setSuccessMessage("");
    setVerifiedOtp("");
    verifyForm.reset({ otp: "" });
    resetForm.reset({
      newPassword: "",
      confirmNewPassword: "",
    });

    try {
      const response = await api.post<ApiEnvelope<ForgotPasswordPayload>>(
        "/auth/forgot-password",
        { email: data.email }
      );
      const payload = response.data.data;

      setSubmittedEmail(data.email.trim().toLowerCase());
      setOtpMessage(
        payload.message ||
          "Nếu email tồn tại trong hệ thống, chúng tôi đã gửi mã OTP."
      );
      setExpiresAt(payload.expiresAt || "");
      setStep("otp");
    } catch (error) {
      requestForm.setError("root", {
        message: getApiErrorMessage(error),
      });
    }
  };

  const handleVerifyOtp = async (data: VerifyOtpFormData) => {
    setVerifyMessage("");
    resetForm.clearErrors();

    try {
      const response = await api.post<ApiEnvelope<ForgotPasswordPayload>>(
        "/auth/forgot-password/verify-otp",
        {
          email: submittedEmail,
          otp: data.otp,
        }
      );

      setVerifiedOtp(data.otp);
      setVerifyMessage(
        response.data.data.message ||
          "Xác thực OTP thành công. Vui lòng đặt mật khẩu mới."
      );
      setStep("password");
    } catch (error) {
      verifyForm.setError("root", {
        message: getApiErrorMessage(
          error,
          "Mã OTP không hợp lệ hoặc đã hết hạn."
        ),
      });
    }
  };

  const handleResetPassword = async (data: ResetPasswordFormData) => {
    setSuccessMessage("");

    try {
      const response = await api.post<ApiEnvelope<ForgotPasswordPayload>>(
        "/auth/reset-password",
        {
          email: submittedEmail,
          otp: verifiedOtp,
          newPassword: data.newPassword,
          confirmNewPassword: data.confirmNewPassword,
        }
      );

      setSuccessMessage(
        response.data.data.message ||
          "Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại."
      );
      window.setTimeout(() => {
        router.push("/login?reset=success");
      }, 900);
    } catch (error) {
      resetForm.setError("root", {
        message: getApiErrorMessage(error, "Không thể đặt lại mật khẩu."),
      });
    }
  };

  const expiryText = formatExpiry(expiresAt);

  return (
    <div className="mx-auto w-full max-w-md space-y-5">
      <Link
        href="/login"
        className="inline-flex items-center gap-2 text-sm font-bold text-teal-700 transition hover:text-teal-800 hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Đăng nhập
      </Link>

      <div className="space-y-1 text-left">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-700">
          Account recovery
        </p>
        <h1 className="text-2xl font-black tracking-tight text-slate-950">
          Quên mật khẩu
        </h1>
        <p className="text-sm leading-5 text-slate-500">
          Nhận OTP qua email, xác thực mã rồi đặt mật khẩu mới.
        </p>
      </div>

      <form
        className="space-y-4 rounded-2xl border border-teal-100 bg-teal-50/35 p-4"
        onSubmit={requestForm.handleSubmit(handleRequestOtp)}
      >
        <div className="flex items-center gap-2 text-sm font-black text-slate-800">
          <MailCheck className="size-4 text-teal-700" aria-hidden="true" />
          Email xác thực
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
            disabled={requestForm.formState.isSubmitting || Boolean(successMessage)}
            aria-invalid={Boolean(requestForm.formState.errors.email)}
            className="h-11 border-teal-100 bg-white px-3 text-slate-950 shadow-inner shadow-white/70 placeholder:text-slate-400 focus-visible:border-teal-500 focus-visible:ring-teal-500/20"
            {...requestForm.register("email")}
          />
          {requestForm.formState.errors.email ? (
            <p className="text-sm text-red-500">
              {requestForm.formState.errors.email.message}
            </p>
          ) : null}
        </div>

        {requestForm.formState.errors.root?.message ? (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600"
          >
            {requestForm.formState.errors.root.message}
          </div>
        ) : null}

        <Button
          type="submit"
          disabled={requestForm.formState.isSubmitting || Boolean(successMessage)}
          className={cn(
            "h-11 w-full bg-[linear-gradient(135deg,#0f766e,#2563eb)] text-base font-bold text-white shadow-lg shadow-teal-700/20 hover:opacity-95",
            requestForm.formState.isSubmitting &&
              "cursor-not-allowed opacity-80"
          )}
        >
          {requestForm.formState.isSubmitting ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : null}
          {submittedEmail ? "Gửi lại OTP" : "Gửi OTP"}
        </Button>
      </form>

      {otpMessage ? (
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

      {step === "otp" ? (
        <form
          className="space-y-4 rounded-2xl border border-teal-100 bg-white p-4"
          onSubmit={verifyForm.handleSubmit(handleVerifyOtp)}
        >
          <div className="flex items-center gap-2 text-sm font-black text-slate-800">
            <KeyRound className="size-4 text-teal-700" aria-hidden="true" />
            Xác thực OTP
          </div>

          <div className="space-y-2">
            <label htmlFor="otp" className="text-sm font-medium text-slate-700">
              OTP
            </label>
            <Input
              id="otp"
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              autoComplete="one-time-code"
              aria-invalid={Boolean(verifyForm.formState.errors.otp)}
              className="h-11 border-teal-100 bg-teal-50/50 px-3 text-center text-lg font-black tracking-[0.32em] text-slate-950 shadow-inner shadow-white/70 placeholder:text-slate-300 focus-visible:border-teal-500 focus-visible:ring-teal-500/20"
              {...verifyForm.register("otp")}
            />
            {verifyForm.formState.errors.otp ? (
              <p className="text-sm text-red-500">
                {verifyForm.formState.errors.otp.message}
              </p>
            ) : null}
          </div>

          {verifyForm.formState.errors.root?.message ? (
            <div
              role="alert"
              className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600"
            >
              {verifyForm.formState.errors.root.message}
            </div>
          ) : null}

          <Button
            type="submit"
            disabled={verifyForm.formState.isSubmitting}
            className={cn(
              "h-11 w-full bg-[linear-gradient(135deg,#0f766e,#2563eb)] text-base font-bold text-white shadow-lg shadow-teal-700/20 hover:opacity-95",
              verifyForm.formState.isSubmitting &&
                "cursor-not-allowed opacity-80"
            )}
          >
            {verifyForm.formState.isSubmitting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : null}
            Xác thực OTP
          </Button>
        </form>
      ) : null}

      {step === "password" ? (
        <form
          className="space-y-4"
          onSubmit={resetForm.handleSubmit(handleResetPassword)}
        >
          <div className="flex items-center gap-2 text-sm font-black text-slate-800">
            <KeyRound className="size-4 text-teal-700" aria-hidden="true" />
            Đặt mật khẩu mới
          </div>

          {verifyMessage ? (
            <div
              role="status"
              className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700"
            >
              <CheckCircle2
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />
              {verifyMessage}
            </div>
          ) : null}

          <div className="space-y-2">
            <label
              htmlFor="newPassword"
              className="text-sm font-medium text-slate-700"
            >
              Mật khẩu mới
            </label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                placeholder="Ít nhất 8 ký tự"
                autoComplete="new-password"
                disabled={Boolean(successMessage)}
                aria-invalid={Boolean(resetForm.formState.errors.newPassword)}
                className="h-11 border-teal-100 bg-teal-50/50 px-3 pr-11 text-slate-950 shadow-inner shadow-white/70 placeholder:text-slate-400 focus-visible:border-teal-500 focus-visible:ring-teal-500/20"
                {...resetForm.register("newPassword")}
              />
              <button
                type="button"
                aria-label={showNewPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-teal-100 hover:text-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/30"
                onClick={() => setShowNewPassword((value) => !value)}
              >
                {showNewPassword ? (
                  <EyeOff className="size-4" aria-hidden="true" />
                ) : (
                  <Eye className="size-4" aria-hidden="true" />
                )}
              </button>
            </div>
            {resetForm.formState.errors.newPassword ? (
              <p className="text-sm text-red-500">
                {resetForm.formState.errors.newPassword.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <label
              htmlFor="confirmNewPassword"
              className="text-sm font-medium text-slate-700"
            >
              Xác nhận mật khẩu mới
            </label>
            <div className="relative">
              <Input
                id="confirmNewPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Nhập lại mật khẩu mới"
                autoComplete="new-password"
                disabled={Boolean(successMessage)}
                aria-invalid={Boolean(
                  resetForm.formState.errors.confirmNewPassword
                )}
                className="h-11 border-teal-100 bg-teal-50/50 px-3 pr-11 text-slate-950 shadow-inner shadow-white/70 placeholder:text-slate-400 focus-visible:border-teal-500 focus-visible:ring-teal-500/20"
                {...resetForm.register("confirmNewPassword")}
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
            {resetForm.formState.errors.confirmNewPassword ? (
              <p className="text-sm text-red-500">
                {resetForm.formState.errors.confirmNewPassword.message}
              </p>
            ) : null}
          </div>

          {resetForm.formState.errors.root?.message ? (
            <div
              role="alert"
              className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600"
            >
              {resetForm.formState.errors.root.message}
            </div>
          ) : null}

          {successMessage ? (
            <div
              role="status"
              className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700"
            >
              <CheckCircle2
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />
              {successMessage}
            </div>
          ) : null}

          <Button
            type="submit"
            disabled={resetForm.formState.isSubmitting || Boolean(successMessage)}
            className={cn(
              "h-11 w-full bg-[linear-gradient(135deg,#0f766e,#2563eb)] text-base font-bold text-white shadow-lg shadow-teal-700/20 hover:opacity-95",
              resetForm.formState.isSubmitting &&
                "cursor-not-allowed opacity-80"
            )}
          >
            {resetForm.formState.isSubmitting ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : null}
            Cập nhật mật khẩu
          </Button>
        </form>
      ) : null}
    </div>
  );
}
