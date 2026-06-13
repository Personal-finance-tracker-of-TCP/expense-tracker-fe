import axios, { AxiosHeaders } from "axios";
import type {
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";
import { toast } from "sonner";

import {
  setAccessTokenCookie,
  setUserRoleCookie,
  useAuthStore,
} from "@/store/authStore";
import { getApiBaseUrl } from "@/lib/api-url";

export const API_URL = getApiBaseUrl();

const REFRESH_ENDPOINT = "/auth/refresh";
const SESSION_EXPIRED_MESSAGE =
  "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
const AUTH_STORAGE_KEYS = [
  "accessToken",
  "refreshToken",
  "user",
  "authUser",
  "currentUser",
  "adminAccessToken",
];

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

interface RetryableRequest extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

type AuthResponse = {
  data?: {
    accessToken?: string;
    refreshToken?: string;
    token?: string;
  };
  accessToken?: string;
  refreshToken?: string;
  token?: string;
};

let refreshPromise: Promise<{
  accessToken: string;
  refreshToken?: string;
}> | null = null;
let sessionExpiredNotified = false;
let sessionExpiredRedirecting = false;

function getStoredAccessToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

function getStoredRefreshToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refreshToken");
}

function removeStoredAuthKeys() {
  if (typeof window === "undefined") return;

  for (const key of AUTH_STORAGE_KEYS) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  }
}

function getRequestPath(config: Pick<AxiosRequestConfig, "baseURL" | "url">) {
  const url = config.url || "";

  if (/^https?:\/\//i.test(url)) {
    try {
      return new URL(url).pathname;
    } catch {
      return url;
    }
  }

  return url.startsWith("/") ? url : `/${url}`;
}

function isAuthEndpoint(config: Pick<AxiosRequestConfig, "baseURL" | "url">) {
  const path = getRequestPath(config).split(/[?#]/)[0].replace(/\/+$/, "");

  return [
    "/auth/login",
    "/auth/register",
    "/auth/refresh",
    "/auth/logout",
    "/auth/forgot-password",
    "/auth/reset-password",
  ].includes(path);
}

function shouldSkipAuthHeader(config: Pick<AxiosRequestConfig, "baseURL" | "url">) {
  const path = getRequestPath(config).split(/[?#]/)[0].replace(/\/+$/, "");

  return [
    "/auth/login",
    "/auth/register",
    "/auth/refresh",
    "/auth/forgot-password",
    "/auth/reset-password",
  ].includes(path);
}

function hasAuthorizationHeader(config: InternalAxiosRequestConfig) {
  const headers = config.headers;
  if (!headers) return false;

  if (headers instanceof AxiosHeaders) {
    return headers.has("Authorization") || headers.has("authorization");
  }

  const headerRecord = headers as Record<string, unknown>;
  return Boolean(headerRecord.Authorization || headerRecord.authorization);
}

function setAuthorizationHeader(
  config: InternalAxiosRequestConfig,
  accessToken: string
) {
  if (!config.headers) {
    config.headers = new AxiosHeaders();
  }

  if (config.headers instanceof AxiosHeaders) {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
    return;
  }

  (config.headers as Record<string, string>).Authorization =
    `Bearer ${accessToken}`;
}

function extractAccessToken(data: AuthResponse) {
  return (
    data?.data?.accessToken ||
    data?.accessToken ||
    data?.token ||
    data?.data?.token ||
    null
  );
}

function extractRefreshToken(data: AuthResponse) {
  return data?.data?.refreshToken || data?.refreshToken || null;
}

function notifySessionExpiredOnce() {
  if (sessionExpiredNotified) return;

  sessionExpiredNotified = true;
  toast.warning(SESSION_EXPIRED_MESSAGE);
}

function redirectToLoginAfterToast() {
  if (typeof window === "undefined" || sessionExpiredRedirecting) return;

  const { pathname, search, hash } = window.location;
  if (pathname === "/login") return;

  sessionExpiredRedirecting = true;
  const currentPath = `${pathname}${search}${hash}`;
  const loginUrl = `/login?expired=1&returnUrl=${encodeURIComponent(currentPath)}`;

  window.setTimeout(() => {
    window.location.assign(loginUrl);
  }, 800);
}

function expireSession() {
  useAuthStore.getState().clearAuth();
  removeStoredAuthKeys();
  notifySessionExpiredOnce();
  redirectToLoginAfterToast();
}

async function refreshAccessToken() {
  if (!refreshPromise) {
    const refreshToken = getStoredRefreshToken();

    if (!refreshToken) {
      return Promise.reject(new Error("Missing refresh token"));
    }

    refreshPromise = axios
      .post<AuthResponse>(
        `${API_URL}${REFRESH_ENDPOINT}`,
        { refreshToken },
        { withCredentials: true }
      )
      .then((response) => {
        const accessToken = extractAccessToken(response.data);

        if (!accessToken) {
          throw new Error("Missing access token in refresh response");
        }

        return {
          accessToken,
          refreshToken: extractRefreshToken(response.data) || refreshToken,
        };
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

function persistRefreshedTokens(accessToken: string, refreshToken?: string) {
  setAccessTokenCookie(accessToken);

  const { user, setAuth } = useAuthStore.getState();

  if (user) {
    setUserRoleCookie(user.role);
    setAuth(user, accessToken, refreshToken);
    return;
  }

  if (typeof window === "undefined") return;

  localStorage.setItem("accessToken", accessToken);
  if (refreshToken) {
    localStorage.setItem("refreshToken", refreshToken);
  }
}

api.interceptors.request.use((config) => {
  if (shouldSkipAuthHeader(config) || hasAuthorizationHeader(config)) {
    return config;
  }

  const accessToken =
    useAuthStore.getState().accessToken || getStoredAccessToken();

  if (accessToken) {
    setAuthorizationHeader(config, accessToken);
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequest | undefined;

    if (!originalRequest || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    if (isAuthEndpoint(originalRequest)) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      expireSession();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const { accessToken, refreshToken } = await refreshAccessToken();
      persistRefreshedTokens(accessToken, refreshToken);
      setAuthorizationHeader(originalRequest, accessToken);
      return api(originalRequest);
    } catch {
      expireSession();
      return Promise.reject(error);
    }
  }
);

export default api;
