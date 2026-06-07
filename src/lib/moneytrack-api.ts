import { API_URL } from "@/lib/api";

type JsonRecord = Record<string, unknown>;

export type ApiEnvelope<T> = {
  success?: boolean;
  data?: T;
  message?: string | string[];
};

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

export async function authFetch<T>(
  path: string,
  options: RequestInit & { admin?: boolean } = {}
) {
  const token = getAccessToken({ admin: options.admin });
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(getUrl(path), {
    ...options,
    headers,
    credentials: "include",
  });

  const json = (await response.json().catch(() => ({}))) as ApiEnvelope<T> &
    JsonRecord;

  if (!response.ok || json.success === false) {
    throw new Error(
      normalizeMessage(json.message) ||
        `Request failed with status ${response.status}`
    );
  }

  return (json.data ?? json) as T;
}

export async function authDownload(
  path: string,
  filename: string,
  options: RequestInit & { admin?: boolean } = {}
) {
  const token = getAccessToken({ admin: options.admin });
  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(getUrl(path), {
    ...options,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    const json = (await response.json().catch(() => ({}))) as ApiEnvelope<never>;
    throw new Error(
      normalizeMessage(json.message) ||
        `Download failed with status ${response.status}`
    );
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

export function toNumber(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

export function getCurrentDemoPeriod() {
  return { month: 6, year: 2026 };
}
