"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export function useLogout(redirectTo = "/login") {
  const router = useRouter();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  return useCallback(async () => {
    await api.post("/auth/logout").catch(() => null);
    clearAuth();
    await signOut({ redirect: false }).catch(() => null);
    router.replace(redirectTo);
    router.refresh();
  }, [clearAuth, redirectTo, router]);
}
