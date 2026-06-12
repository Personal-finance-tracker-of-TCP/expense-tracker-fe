export function getApiBaseUrl() {
  const rawBaseUrl =
    process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "http://localhost:5000";

  return rawBaseUrl.replace(/\/+$/, "").replace(/\/api$/, "");
}
