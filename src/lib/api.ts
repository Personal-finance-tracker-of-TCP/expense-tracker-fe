import axios from "axios";
import type { AxiosError, InternalAxiosRequestConfig } from "axios";

import { useAuthStore } from "@/store/authStore";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

function getStoredAccessToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("accessToken");
}

function getStoredRefreshToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("refreshToken");
}

// Đánh dấu request đang retry để tránh vòng lặp vô tận
interface RetryableRequest extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// ── Request interceptor: gắn access token vào mọi request ─────────────────
api.interceptors.request.use((config) => {
  const accessToken =
    useAuthStore.getState().accessToken || getStoredAccessToken();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

// ── Response interceptor: tự động refresh token khi nhận 401 ──────────────
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequest;

    // Chỉ xử lý lỗi 401 và chỉ retry 1 lần
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      !originalRequest
    ) {
      return Promise.reject(error);
    }

    // Không retry chính request /auth/refresh để tránh loop
    if (originalRequest.url?.includes("/auth/refresh")) {
      useAuthStore.getState().clearAuth();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    const refreshToken = getStoredRefreshToken();

    if (!refreshToken) {
      useAuthStore.getState().clearAuth();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }

    try {
      // Gọi trực tiếp axios (không dùng api instance) để tránh interceptor loop
      const { data } = await axios.post(`${API_URL}/auth/refresh`, {
        refreshToken,
      });

      const newAccessToken: string =
        data?.data?.accessToken || data?.accessToken;

      if (!newAccessToken) throw new Error("No access token in refresh response");

      // Cập nhật store và localStorage với token mới
      const { user } = useAuthStore.getState();
      if (user) {
        useAuthStore.getState().setAuth(user, newAccessToken, data?.data?.refreshToken || data?.refreshToken || refreshToken);
      } else {
        localStorage.setItem("accessToken", newAccessToken);
      }

      // Retry request gốc với token mới
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(originalRequest);
    } catch {
      // Refresh thất bại → đăng xuất và chuyển về login
      useAuthStore.getState().clearAuth();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }
  }
);

export default api;
