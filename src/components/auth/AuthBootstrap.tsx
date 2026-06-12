"use client";

import { useEffect } from "react";

import { type ApiEnvelope, type ApiUser, normalizeUser } from "@/lib/auth";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export function AuthBootstrap() {
  const setUser = useAuthStore((state) => state.setUser);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    let isMounted = true;

    api
      .get<ApiEnvelope<ApiUser>>("/auth/me")
      .then((response) => {
        if (!isMounted) {
          return;
        }

        setUser(normalizeUser(response.data.data));
      })
      .catch(() => {
        if (isMounted) {
          clearAuth();
        }
      });

    return () => {
      isMounted = false;
    };
  }, [clearAuth, isAuthenticated, setUser]);

  return null;
}
