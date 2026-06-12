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

export default function ChangePasswordPage() {
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
      placeholder: "Ít nhất 8 ký tự",
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
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <section className="animate-rise rounded-[2rem] border border-white/80 bg-[linear-gradient(135deg,#ffffff_0%,#ecfeff_52%,#fff7ed_100%)] p-6 shadow-xl shadow-teal-950/[0.05] sm:p-8">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 rounded-full border border-teal-100 bg-white px-4 py-2 text-sm font-bold text-teal-800 shadow-sm transition hover:bg-teal-50"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Profile
        </Link>
        <p className="mt-6 text-xs font-black uppercase tracking-[0.24em] text-teal-700">
          Account security
        </p>
        <h1 className="mt-2 text-3xl font-black text-slate-950 sm:text-4xl">
          Đổi mật khẩu
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Cập nhật mật khẩu đăng nhập local. Sau khi đổi thành công, bạn sẽ
          được đưa về màn hình đăng nhập.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <form
          className="animate-rise rounded-[2rem] border border-white/80 bg-white/88 p-5 shadow-xl shadow-teal-950/[0.06] backdrop-blur sm:p-7"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="flex items-start gap-4 border-b border-teal-100 pb-6">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
              <KeyRound className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-2xl font-black text-slate-950">
                Bảo vệ tài khoản
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">
                Dùng mật khẩu khó đoán và không trùng với các tài khoản khác.
              </p>
            </div>
          </div>

          <div className="mt-7 grid gap-5">
            {passwordFields.map((field) => {
              const isVisible = visibleFields[field.id];
              const error = errors[field.id]?.message;

              return (
                <div key={field.id} className="space-y-2">
                  <label
                    htmlFor={field.id}
                    className="text-sm font-bold text-slate-700"
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
                      className="h-12 border-teal-100 bg-teal-50/45 px-5 pr-12 text-base text-slate-950 shadow-inner shadow-white/70 placeholder:text-slate-400 focus-visible:border-teal-500 focus-visible:ring-teal-500/20"
                      {...register(field.id)}
                    />
                    <button
                      type="button"
                      aria-label={isVisible ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                      className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 transition hover:bg-teal-100 hover:text-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/30"
                      onClick={() => toggleField(field.id)}
                    >
                      {isVisible ? (
                        <EyeOff className="size-4" aria-hidden="true" />
                      ) : (
                        <Eye className="size-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                  {error ? <p className="text-sm text-red-500">{error}</p> : null}
                </div>
              );
            })}

            {errors.root?.message ? (
              <div
                role="alert"
                className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600"
              >
                {errors.root.message}
              </div>
            ) : null}

            {successMessage ? (
              <div
                role="status"
                className="flex items-center gap-2 rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700"
              >
                <CheckCircle2 className="size-4" aria-hidden="true" />
                {successMessage}
              </div>
            ) : null}

            <Button
              type="submit"
              disabled={isSubmitting || Boolean(successMessage)}
              className={cn(
                "h-12 w-full bg-[linear-gradient(135deg,#0f766e,#2563eb)] px-6 text-base font-bold text-white shadow-lg shadow-teal-700/20 hover:opacity-95 sm:w-fit",
                (isSubmitting || successMessage) && "cursor-not-allowed opacity-80"
              )}
            >
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : null}
              Cập nhật mật khẩu
            </Button>
          </div>
        </form>

        <aside className="animate-rise rounded-[2rem] border border-white/80 bg-white/88 p-6 shadow-xl shadow-teal-950/[0.06] backdrop-blur [animation-delay:90ms]">
          <div className="flex size-14 items-center justify-center rounded-3xl bg-teal-50 text-teal-700">
            <ShieldCheck className="size-6" aria-hidden="true" />
          </div>
          <h2 className="mt-5 text-xl font-black text-slate-950">
            Gợi ý bảo mật
          </h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-500">
            <li>Không chia sẻ mật khẩu với người khác.</li>
            <li>Dùng mật khẩu mới khác mật khẩu cũ.</li>
            <li>Đăng nhập lại sau khi đổi để phiên làm việc được làm mới.</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
