"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, RefreshCw, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { authFetch } from "@/lib/moneytrack-api";
import { useAuthStore } from "@/store/authStore";

type BankHubSyncResponse = {
  isLinked?: boolean;
  linked?: boolean;
  message?: string;
  bankhubAccountXid?: string | null;
  bankAccountNumber?: string | null;
  bankName?: string | null;
  bankAccountName?: string | null;
  sepayLinkedAt?: string | null;
};

const BANKHUB_PENDING_SYNC_KEY = "fintrack-bankhub-pending-sync";

function isLinked(response: BankHubSyncResponse) {
  return Boolean(response.isLinked ?? response.linked ?? response.bankhubAccountXid);
}

export default function BankHubCallbackPage() {
  const router = useRouter();
  const updateUser = useAuthStore((state) => state.updateUser);
  const hasStartedSyncRef = useRef(false);
  const [status, setStatus] = useState<"syncing" | "success" | "error">("syncing");
  const [message, setMessage] = useState("Đang đồng bộ tài khoản BankHub...");

  useEffect(() => {
    let active = true;

    async function syncBankHubAccount() {
      if (hasStartedSyncRef.current) return;
      hasStartedSyncRef.current = true;

      setStatus("syncing");
      setMessage("Đang đồng bộ tài khoản BankHub...");

      try {
        const response = await authFetch<BankHubSyncResponse>(
          "/api/bankhub/sync-linked-account",
          { method: "POST" }
        );

        if (!active) return;

        if (!isLinked(response)) {
          window.sessionStorage.removeItem(BANKHUB_PENDING_SYNC_KEY);
          setStatus("error");
          setMessage(
            response.message ||
              "Chưa tìm thấy tài khoản BankHub mới. Vui lòng quay lại hoàn tất liên kết."
          );
          return;
        }

        updateUser({
          bankhubAccountXid: response.bankhubAccountXid ?? null,
          bankAccountNumber: response.bankAccountNumber ?? null,
          bankName: response.bankName ?? null,
          bankAccountName: response.bankAccountName ?? null,
          sepayLinkedAt: response.sepayLinkedAt ?? new Date().toISOString(),
        });
        window.sessionStorage.removeItem(BANKHUB_PENDING_SYNC_KEY);
        setStatus("success");
        setMessage("Đã đồng bộ tài khoản BankHub thành công.");

        window.setTimeout(() => {
          router.replace("/profile");
        }, 900);
      } catch (error) {
        if (!active) return;

        window.sessionStorage.removeItem(BANKHUB_PENDING_SYNC_KEY);
        setStatus("error");
        setMessage(
          error instanceof Error
            ? error.message
            : "Không thể đồng bộ tài khoản BankHub."
        );
      }
    }

    void syncBankHubAccount();

    return () => {
      active = false;
    };
  }, [router, updateUser]);

  const Icon =
    status === "syncing" ? Loader2 : status === "success" ? CheckCircle2 : XCircle;

  return (
    <main className="mx-auto flex min-h-[420px] max-w-xl items-center justify-center">
      <section className="w-full rounded-[2rem] border border-white/80 bg-white/90 p-6 text-center shadow-xl shadow-teal-950/[0.06] backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <span
          className={`mx-auto flex size-14 items-center justify-center rounded-2xl ${
            status === "error"
              ? "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300"
              : "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300"
          }`}
        >
          <Icon
            className={`size-7 ${status === "syncing" ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
        </span>
        <h1 className="mt-5 text-2xl font-black text-slate-950 dark:text-white">
          Đồng bộ BankHub
        </h1>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-500 dark:text-slate-300">
          {message}
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {status === "error" ? (
            <Button
              type="button"
              className="h-11 gap-2 rounded-full bg-teal-600 px-5 text-sm font-bold text-white hover:bg-teal-700"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="size-4" aria-hidden="true" />
              Thử lại
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-full border-teal-100 bg-white px-5 text-sm font-bold text-slate-700 hover:bg-teal-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
            onClick={() => router.replace("/profile")}
          >
            Về hồ sơ
          </Button>
        </div>
      </section>
    </main>
  );
}
