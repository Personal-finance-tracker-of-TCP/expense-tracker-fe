import axios from "axios";

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
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("accessToken");
}

api.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken || getStoredAccessToken();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

export default api;
