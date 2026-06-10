"use client";

import { FormEvent, useEffect, useState } from "react";
import { Repeat2, Send, ShieldCheck } from "lucide-react";

import { formatCurrencyVND, formatDate } from "@/lib/finance";
import { authFetch } from "@/lib/moneytrack-api";

type SimulatorResult = {
  status?: string;
  duplicate?: boolean;
  message?: string;
  sepayCode?: string;
  logId?: string;
  log?: Record<string, unknown>;
  transaction?: {
    id?: string;
    userId?: string;
    type?: string;
    amount?: string | number;
    source?: string;
    categoryId?: string | null;
    sepayId?: string | null;
  } | null;
};

type StoredUser = {
  name?: string;
  email?: string;
  role?: string;
  sepayCode?: string;
  bankAccountNumber?: string;
};

const demoAssignedUser = {
  name: "User Demo",
  email: "user@moneytrack.local",
  sepayCode: "MTU001",
  bankAccountNumber: "970400000001",
};

export default function SepaySimulatorPage() {
  const [sepayId, setSepayId] = useState("SEPAY_TEST_001");
  const [gateway, setGateway] = useState("MBBank");
  const [transferAmount, setTransferAmount] = useState("200000");
  const [transferType, setTransferType] = useState<"IN" | "OUT">("OUT");
  const [content, setContent] = useState("MTU001 DEMO AN UONG");
  const [transactionDate, setTransactionDate] = useState("2026-06-02T10:00");
  const [result, setResult] = useState<SimulatorResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    const rawUser = localStorage.getItem("user");
    if (!rawUser) {
      return;
    }

    try {
      setCurrentUser(JSON.parse(rawUser) as StoredUser);
    } catch {
      setCurrentUser(null);
    }
  }, []);

  async function submitSimulator(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await authFetch<SimulatorResult>(
        "/api/admin/sepay-simulator",
        {
          method: "POST",
          admin: true,
          body: JSON.stringify({
            sepayId,
            gateway,
            transferAmount: Number(transferAmount),
            transferType,
            content,
            transactionDate: new Date(transactionDate).toISOString(),
          }),
        }
      );

      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cannot simulate SePay");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[420px_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm xl:col-span-2">
          <div className="flex items-start gap-4">
            <span className="rounded-2xl bg-blue-50 p-3 text-blue-700 ring-1 ring-blue-100">
              <ShieldCheck className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-600">
                Admin SePay
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">
                SePay VA simulator
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Simulate a SePay webhook for a user virtual account assignment.
                Matching can use the SePay VA/account number when available, or
                the SePay Code in transfer content such as MTU001.
              </p>
              {currentUser?.role !== "ADMIN" ? (
                <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                  Current stored user is not ADMIN. Use the admin account or set
                  adminAccessToken before calling this page.
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-semibold">Demo user assignment</h2>
              <p className="mt-1 text-sm text-slate-500">
                bankAccountNumber is displayed as the SePay VA. sepayCode stays
                as the transfer content code and is not a database rename.
              </p>
            </div>
            <span className="w-fit rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
              Virtual account mapping
            </span>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            {[
              ["User name", demoAssignedUser.name],
              ["Email", demoAssignedUser.email],
              ["SePay Code", demoAssignedUser.sepayCode],
              ["SePay VA", demoAssignedUser.bankAccountNumber],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-1 font-semibold tabular-nums">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <form
          onSubmit={submitSimulator}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">
              SePay ID
              <input
                value={sepayId}
                onChange={(event) => setSepayId(event.target.value)}
                className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none ring-blue-100 focus:border-blue-400 focus:ring-4"
                required
              />
            </label>

            <label className="block text-sm font-medium text-slate-700">
              Gateway
              <input
                value={gateway}
                onChange={(event) => setGateway(event.target.value)}
                className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none ring-blue-100 focus:border-blue-400 focus:ring-4"
                required
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm font-medium text-slate-700">
                Amount
                <input
                  type="number"
                  min={1}
                  value={transferAmount}
                  onChange={(event) => setTransferAmount(event.target.value)}
                  className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none ring-blue-100 focus:border-blue-400 focus:ring-4"
                  required
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Type
                <select
                  value={transferType}
                  onChange={(event) =>
                    setTransferType(event.target.value as "IN" | "OUT")
                  }
                  className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none ring-blue-100 focus:border-blue-400 focus:ring-4"
                >
                  <option value="OUT">OUT</option>
                  <option value="IN">IN</option>
                </select>
              </label>
            </div>

            <label className="block text-sm font-medium text-slate-700">
              Transfer content
              <input
                value={content}
                onChange={(event) => setContent(event.target.value)}
                className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none ring-blue-100 focus:border-blue-400 focus:ring-4"
                required
              />
            </label>

            <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
              Current demo keeps the existing backend flow working: content
              contains <span className="font-bold">MTU001</span>, backend
              creates a SEPAY transaction for User Demo, and the transaction
              starts with categoryId = null for later classification.
            </div>

            <label className="block text-sm font-medium text-slate-700">
              Transaction date
              <input
                type="datetime-local"
                value={transactionDate}
                onChange={(event) => setTransactionDate(event.target.value)}
                className="mt-2 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none ring-blue-100 focus:border-blue-400 focus:ring-4"
                required
              />
            </label>
          </div>

          {error ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send className="h-4 w-4" />
              {loading ? "Sending..." : "Send webhook"}
            </button>
            <button
              type="button"
              onClick={() => submitSimulator()}
              disabled={loading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Repeat2 className="h-4 w-4" />
              Resend same ID
            </button>
          </div>
        </form>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Simulator response</h2>
          {!result ? (
            <p className="mt-4 text-sm text-slate-500">
              Send a payload to see match status and transaction output.
            </p>
          ) : (
            <div className="mt-5 space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Status</p>
                  <p className="mt-1 text-xl font-bold">{result.status}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Matched SePay Code</p>
                  <p className="mt-1 text-xl font-bold">
                    {result.sepayCode || "Unmatched"}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Duplicate</p>
                  <p className="mt-1 text-xl font-bold">
                    {result.duplicate ? "Yes" : "No"}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Transaction</p>
                  <p className="mt-1 text-sm font-semibold">
                    {result.transaction?.id || "No transaction"}
                  </p>
                </div>
              </div>

              {result.transaction ? (
                <div className="rounded-xl border border-slate-200 p-4 text-sm">
                  <p>
                    <span className="text-slate-500">Amount:</span>{" "}
                    {formatCurrencyVND(result.transaction.amount)}
                  </p>
                  <p className="mt-1">
                    <span className="text-slate-500">Type:</span>{" "}
                    {result.transaction.type}
                  </p>
                  <p className="mt-1">
                    <span className="text-slate-500">Category:</span>{" "}
                    {result.transaction.categoryId || "Unclassified"}
                  </p>
                </div>
              ) : null}

              <pre className="max-h-[420px] overflow-auto rounded-xl bg-slate-950 p-4 text-xs leading-6 text-white">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
