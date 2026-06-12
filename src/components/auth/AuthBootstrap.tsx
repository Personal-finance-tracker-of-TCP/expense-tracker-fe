"use client";

import { useEffect } from "react";

import { type ApiEnvelope, type ApiUser, normalizeUser } from "@/lib/auth";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export function AuthBootstrap() {
  const hydrateAuth = useAuthStore((state) => state.hydrateAuth);
  const setUser = useAuthStore((state) => state.setUser);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  useEffect(() => {
    let isMounted = true;
    hydrateAuth();

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
  }, [clearAuth, hydrateAuth, setUser]);

  return null;
}
