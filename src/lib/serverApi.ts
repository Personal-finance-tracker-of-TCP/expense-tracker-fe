// lib/serverApi.ts  ← tạo file mới, KHÔNG sửa api.ts của bạn A
import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

export async function serverFetch<T>(endpoint: string): Promise<T> {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) throw new Error("Unauthenticated");

  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}