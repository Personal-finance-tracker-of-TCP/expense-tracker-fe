"use client";

import { create } from "zustand";

import { ACCESS_TOKEN_COOKIE, type User } from "@/lib/auth";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  hydrateAuth: () => void;
  setAuth: (user: User, accessToken: string, refreshToken?: string | null) => void;
  setUser: (user: User) => void;
  updateTokens: (accessToken: string, refreshToken?: string | null) => void;
  clearAuth: () => void;
  updateUser: (partial: Partial<User>) => void;
}

const AUTH_STORAGE_KEY = "fintrack_auth";
const ACCESS_TOKEN_MAX_AGE = 60 * 60 * 24 * 7;

type PersistedAuth = {
  user: User;
  accessToken: string;
  refreshToken?: string | null;
};

function setAccessTokenCookie(accessToken: string) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${ACCESS_TOKEN_COOKIE}=${encodeURIComponent(
    accessToken
  )}; path=/; max-age=${ACCESS_TOKEN_MAX_AGE}; SameSite=Lax`;
}

function removeAccessTokenCookie() {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${ACCESS_TOKEN_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

function getAccessTokenCookie() {
  if (typeof document === "undefined") {
    return null;
  }

  const cookie = document.cookie
    .split("; ")
    .find((value) => value.startsWith(`${ACCESS_TOKEN_COOKIE}=`));

  return cookie ? decodeURIComponent(cookie.split("=").slice(1).join("=")) : null;
}

function persistAuth(data: PersistedAuth) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(data));
}

function clearPersistedAuth() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}

const initialState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
};

function readPersistedState() {
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
      return {
        user: null,
        accessToken: getAccessTokenCookie(),
        refreshToken: null,
        isAuthenticated: Boolean(getAccessTokenCookie()),
      };
    }

    const parsed = JSON.parse(raw) as PersistedAuth;
    if (!parsed.user || !parsed.accessToken) {
      throw new Error("Invalid auth storage");
    }

    setAccessTokenCookie(parsed.accessToken);

    return {
      user: parsed.user,
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken ?? null,
      isAuthenticated: true,
    };
  } catch {
    clearPersistedAuth();
    removeAccessTokenCookie();

    return {
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    };
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  ...initialState,
  hydrateAuth: () => {
    if (typeof window === "undefined") {
      return;
    }

    set(readPersistedState());
  },
  setAuth: (user, accessToken, refreshToken = null) => {
    setAccessTokenCookie(accessToken);
    persistAuth({
      user,
      accessToken,
      refreshToken,
    });
    set({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: true,
    });
  },
  setUser: (user) => {
    const state = get();
    const accessToken = state.accessToken || getAccessTokenCookie();

    if (accessToken) {
      persistAuth({
        user,
        accessToken,
        refreshToken: state.refreshToken,
      });
    }

    set({
      user,
      accessToken,
      isAuthenticated: true,
    });
  },
  updateTokens: (accessToken, refreshToken) => {
    const state = get();

    setAccessTokenCookie(accessToken);
    if (state.user) {
      persistAuth({
        user: state.user,
        accessToken,
        refreshToken: refreshToken ?? state.refreshToken,
      });
    }

    set({
      accessToken,
      refreshToken: refreshToken ?? state.refreshToken,
      isAuthenticated: true,
    });
  },
  clearAuth: () => {
    removeAccessTokenCookie();
    clearPersistedAuth();
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },
  updateUser: (partial) => {
    const state = get();
    const user = state.user ? { ...state.user, ...partial } : state.user;

    if (user && state.accessToken) {
      persistAuth({
        user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      });
    }

    set({ user });
  },
}));
