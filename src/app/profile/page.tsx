"use client";

import { useEffect, useState } from "react";
import { UserCircle } from "lucide-react";

type StoredUser = {
  name?: string;
  email?: string;
  role?: string;
  sepayCode?: string;
  bankAccountNumber?: string;
  balance?: string | number;
};

function getDisplaySePayVA(user: StoredUser | null) {
  if (user?.bankAccountNumber) {
    return user.bankAccountNumber;
  }

  if (user?.email === "user@moneytrack.local") {
    return "970400000001";
  }

  return "-";
}

export default function ProfilePage() {
  const [user, setUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    const rawUser = localStorage.getItem("user");

    if (!rawUser) {
      return;
    }

    try {
      setUser(JSON.parse(rawUser) as StoredUser);
    } catch (error) {
      console.error("Failed to parse stored user:", error);
    }
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <span className="rounded-2xl bg-blue-50 p-3 text-blue-700 ring-1 ring-blue-100">
            <UserCircle className="h-6 w-6" />
          </span>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">
              Account
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Profile</h1>
            <p className="mt-2 text-sm text-slate-500">
              Stored user information and SePay virtual account assignment from
              the active login session.
            </p>
          </div>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          {[
            ["Name", user?.name || "-"],
            ["Email", user?.email || "-"],
            ["Role", user?.role || "-"],
            ["SePay Code", user?.sepayCode || "-"],
            ["Tài khoản ảo SePay", getDisplaySePayVA(user)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-slate-50 p-4">
              <dt className="text-sm text-slate-500">{label}</dt>
              <dd className="mt-1 font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </main>
  );
}
