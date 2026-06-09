import axios from "axios";

import api, { API_URL } from "@/lib/api";

type JsonRecord = Record<string, unknown>;

export type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  message?: string | string[];
};

export class ApiRequestError extends Error {
  status: number;
  url: string;
  body: unknown;

  constructor(message: string, status: number, url: string, body: unknown) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.url = url;
    this.body = body;
  }
}

export function getAccessToken(options?: { admin?: boolean }) {
  if (typeof window === "undefined") {
    return null;
  }

  if (options?.admin) {
    return (
      localStorage.getItem("adminAccessToken") ||
      localStorage.getItem("accessToken")
    );
  }

  return localStorage.getItem("accessToken");
}

function normalizeMessage(message: string | string[] | undefined) {
  return Array.isArray(message) ? message.join(", ") : message;
}

function getUrl(path: string) {
  return path.startsWith("http") ? path : `${API_URL}${path}`;
}

function headersToRecord(headers: Headers) {
  const record: Record<string, string> = {};
  headers.forEach((value, key) => {
    record[key] = value;
  });
  return record;
}

function isAuthPath(path: string) {
  const pathname = path.startsWith("http")
    ? new URL(path).pathname
    : path.startsWith("/")
      ? path
      : `/${path}`;

  const cleanPathname = pathname.split(/[?#]/)[0].replace(/\/+$/, "");

  return [
    "/auth/login",
    "/auth/register",
    "/auth/refresh",
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/refresh",
  ].includes(cleanPathname);
}

function buildHeaders(path: string, options: RequestInit & { admin?: boolean }) {
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const token = getAccessToken({ admin: options.admin });
  if (token && !isAuthPath(path)) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return headersToRecord(headers);
}

export async function authFetch<T>(
  path: string,
  options: RequestInit & { admin?: boolean } = {}
) {
  const url = getUrl(path);

  try {
    const response = await api.request<ApiEnvelope<T> & JsonRecord>({
      url,
      method: options.method || "GET",
      headers: buildHeaders(path, options),
      data: options.body,
      withCredentials: true,
    });

    const json = response.data;

    if (json.success === false) {
      throw new ApiRequestError(
        normalizeMessage(json.message) || "Request failed",
        response.status,
        url,
        json
      );
    }

    return (json.data ?? json) as T;
  } catch (error) {
    if (error instanceof ApiRequestError) {
      throw error;
    }

    if (axios.isAxiosError(error)) {
      const body = error.response?.data as
        | (ApiEnvelope<never> & JsonRecord)
        | undefined;
      const status = error.response?.status || 0;

      throw new ApiRequestError(
        normalizeMessage(body?.message) ||
          `Request failed with status ${status || "unknown"}`,
        status,
        url,
        body || null
      );
    }

    throw error;
  }
}

export async function authDownload(
  path: string,
  filename: string,
  options: RequestInit & { admin?: boolean } = {}
) {
  const url = getUrl(path);

  try {
    const response = await api.request<Blob>({
      url,
      method: options.method || "GET",
      headers: buildHeaders(path, options),
      data: options.body,
      responseType: "blob",
      withCredentials: true,
    });

    const objectUrl = URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 0;
      const body = error.response?.data;

      throw new ApiRequestError(
        `Download failed with status ${status || "unknown"}`,
        status,
        url,
        body || null
      );
    }

    throw error;
  }
}

export function toNumber(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

export function getCurrentDemoPeriod() {
  return { month: 6, year: 2026 };
}
