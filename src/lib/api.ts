import axios from "axios";

import { type ApiEnvelope, type RefreshPayload } from "@/lib/auth";
import { getApiBaseUrl } from "@/lib/api-url";
import { useAuthStore } from "@/store/authStore";

const api = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken;

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

let refreshPromise: Promise<RefreshPayload | null> | null = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status !== 401 ||
      originalRequest?._retry ||
      originalRequest?.url?.includes("/auth/refresh")
    ) {
      return Promise.reject(error);
    }

    const refreshToken = useAuthStore.getState().refreshToken;
    if (!refreshToken) {
      useAuthStore.getState().clearAuth();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    refreshPromise ??= axios
      .post<ApiEnvelope<RefreshPayload>>(
        `${getApiBaseUrl()}/auth/refresh`,
        { refreshToken },
        { withCredentials: true }
      )
      .then((response) => response.data.data)
      .catch(() => null)
      .finally(() => {
        refreshPromise = null;
      });

    const refreshed = await refreshPromise;

    if (!refreshed?.accessToken) {
      useAuthStore.getState().clearAuth();
      return Promise.reject(error);
    }

    useAuthStore
      .getState()
      .updateTokens(refreshed.accessToken, refreshed.refreshToken);

    originalRequest.headers.Authorization = `Bearer ${refreshed.accessToken}`;
    return api(originalRequest);
  }
);

export default api;
