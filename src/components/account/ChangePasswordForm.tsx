"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import type { AxiosError } from "axios";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import { type ApiEnvelope } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Vui lòng nhập mật khẩu hiện tại"),
    newPassword: z.string().min(8, "Mật khẩu mới phải có ít nhất 8 ký tự"),
    confirmNewPassword: z.string().min(1, "Vui lòng xác nhận mật khẩu mới"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmNewPassword"],
  });

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

type ApiErrorResponse = {
  message?: string | string[];
};

type ChangePasswordFormProps = {
  backHref: string;
  backLabel: string;
  eyebrow?: string;
};

export function ChangePasswordForm({
  backHref,
  backLabel,
  eyebrow = "Bảo mật tài khoản",
}: ChangePasswordFormProps) {
  const router = useRouter();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const [successMessage, setSuccessMessage] = useState("");
  const [visibleFields, setVisibleFields] = useState({
    currentPassword: false,
    newPassword: false,
    confirmNewPassword: false,
  });

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  const toggleField = (field: keyof typeof visibleFields) => {
    setVisibleFields((current) => ({
      ...current,
      [field]: !current[field],
    }));
  };

  const handleLogoutAfterChange = async () => {
    await api.post("/auth/logout").catch(() => null);
    clearAuth();
    await signOut({ redirect: false }).catch(() => null);
    router.push("/login");
  };

  const onSubmit = async (data: ChangePasswordFormData) => {
    setSuccessMessage("");

    try {
      const response = await api.patch<ApiEnvelope<{ message?: string }>>(
        "/api/users/me/password",
        data
      );

      setSuccessMessage(
        response.data.data.message ||
          "Đổi mật khẩu thành công. Vui lòng đăng nhập lại."
      );

      window.setTimeout(() => {
        void handleLogoutAfterChange();
      }, 900);
    } catch (error) {
      const axiosError = error as AxiosError<ApiErrorResponse>;
      const responseMessage = axiosError.response?.data?.message;

      const message = Array.isArray(responseMessage)
        ? responseMessage.join(", ")
        : responseMessage || "Không thể đổi mật khẩu. Vui lòng thử lại.";

      setError("root", { message });
    }
  };

  const passwordFields: Array<{
    id: keyof ChangePasswordFormData;
    label: string;
    placeholder: string;
    autoComplete: string;
  }> = [
    {
      id: "currentPassword",
      label: "Mật khẩu hiện tại",
      placeholder: "Nhập mật khẩu hiện tại",
      autoComplete: "current-password",
    },
    {
      id: "newPassword",
      label: "Mật khẩu mới",
      placeholder: "Tối thiểu 8 ký tự",
      autoComplete: "new-password",
    },
    {
      id: "confirmNewPassword",
      label: "Xác nhận mật khẩu mới",
      placeholder: "Nhập lại mật khẩu mới",
      autoComplete: "new-password",
    },
  ];

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[2rem] border border-teal-100/80 bg-white shadow-xl shadow-teal-950/[0.06] dark:border-slate-800 dark:bg-slate-900">
        <div className="relative bg-gradient-to-br from-slate-950 via-teal-950 to-emerald-900 px-6 py-7 text-white sm:px-8 sm:py-8">
          <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-teal-400/20 blur-3xl" />
          <div className="absolute -bottom-24 left-10 h-56 w-56 rounded-full bg-emerald-400/15 blur-3xl" />

          <div className="relative">
            <Link
              href={backHref}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 text-sm font-bold text-white/90 backdrop-blur transition hover:bg-white/15"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              {backLabel}
            </Link>

            <div className="mt-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-teal-200">
                  {eyebrow}
                </p>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
                  Đổi mật khẩu
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                  Cập nhật mật khẩu đăng nhập. Sau khi đổi thành công, hệ thống
                  sẽ đăng xuất để bạn đăng nhập lại bằng mật khẩu mới.
                </p>
              </div>

              <div className="hidden rounded-3xl border border-white/10 bg-white/10 p-4 backdrop-blur sm:block">
                <ShieldCheck className="size-8 text-teal-200" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>

        <form
          className="grid gap-6 p-6 sm:p-8"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="flex items-start gap-4 rounded-3xl border border-teal-100 bg-teal-50/60 p-4 dark:border-slate-700 dark:bg-slate-950">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white text-teal-700 shadow-sm dark:bg-slate-900 dark:text-teal-300">
              <KeyRound className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-lg font-black text-slate-950 dark:text-white">
                Thiết lập mật khẩu mới
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Dùng mật khẩu khó đoán, không trùng với email, số điện thoại
                hoặc mật khẩu cũ.
              </p>
            </div>
          </div>

          <div className="grid gap-5">
            {passwordFields.map((field) => {
              const isVisible = visibleFields[field.id];
              const error = errors[field.id]?.message;

              return (
                <div key={field.id} className="space-y-2">
                  <label
                    htmlFor={field.id}
                    className="text-sm font-black text-slate-700 dark:text-slate-200"
                  >
                    {field.label}
                  </label>

                  <div className="relative">
                    <Input
                      id={field.id}
                      type={isVisible ? "text" : "password"}
                      placeholder={field.placeholder}
                      autoComplete={field.autoComplete}
                      aria-invalid={Boolean(error)}
                      className={cn(
                        "h-12 rounded-2xl border-slate-200 bg-slate-50 px-4 pr-12 text-sm font-bold text-slate-950 shadow-none outline-none transition placeholder:text-slate-400 focus-visible:border-teal-400 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-teal-500/15 dark:border-slate-700 dark:bg-slate-950 dark:text-white",
                        error &&
                          "border-red-300 bg-red-50 focus-visible:border-red-400 focus-visible:ring-red-500/15 dark:border-red-800"
                      )}
                      {...register(field.id)}
                    />

                    <button
                      type="button"
                      aria-label={isVisible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                      className="absolute right-3 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 transition hover:bg-teal-50 hover:text-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/30 dark:hover:bg-slate-800 dark:hover:text-teal-300"
                      onClick={() => toggleField(field.id)}
                    >
                      {isVisible ? (
                        <EyeOff className="size-4" aria-hidden="true" />
                      ) : (
                        <Eye className="size-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>

                  {error ? (
                    <p className="text-sm font-semibold text-red-500">
                      {error}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>

          {errors.root?.message ? (
            <div
              role="alert"
              className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300"
            >
              {errors.root.message}
            </div>
          ) : null}

          {successMessage ? (
            <div
              role="status"
              className="flex items-center gap-2 rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300"
            >
              <CheckCircle2 className="size-4" aria-hidden="true" />
              {successMessage}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-semibold leading-5 text-slate-400">
              Sau khi cập nhật, phiên đăng nhập hiện tại sẽ kết thúc.
            </p>

            <Button
              type="submit"
              disabled={isSubmitting || Boolean(successMessage)}
              className={cn(
                "h-12 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-500 px-6 text-sm font-black text-white shadow-lg shadow-teal-700/20 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-teal-700/25",
                (isSubmitting || successMessage) &&
                  "translate-y-0 cursor-not-allowed opacity-80"
              )}
            >
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <LockKeyhole className="size-4" aria-hidden="true" />
              )}
              Cập nhật mật khẩu
            </Button>
          </div>
        </form>
      </section>

      <section className="grid gap-3 rounded-[1.5rem] border border-slate-200 bg-white/80 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 sm:grid-cols-3">
        {[
          "Không dùng lại mật khẩu cũ.",
          "Không chia sẻ mật khẩu cho người khác.",
          "Đăng nhập lại sau khi đổi mật khẩu.",
        ].map((item) => (
          <div key={item} className="flex items-start gap-3">
            <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
              <CheckCircle2 className="size-4" aria-hidden="true" />
            </span>
            <p className="text-sm font-bold leading-6 text-slate-600 dark:text-slate-300">
              {item}
            </p>
          </div>
        ))}
      </section>
    </main>
  );
}