import { useState } from "react";
import { useBillingHistoryQuery } from "@/api/billing";

const STATUS_CLASS = {
  PAID: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-700",
  REFUNDED: "bg-yellow-100 text-yellow-800",
} as const;

function planBadgeClass(level: number): string {
  if (level === 0) return "bg-neutral-100 text-neutral-600";
  if (level === 1) return "bg-blue-100 text-blue-800";
  if (level === 2) return "bg-purple-100 text-purple-800";
  return "bg-orange-100 text-orange-800";
}

function fmt(iso: string) {
  return iso.slice(0, 10);
}

export default function BillingPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useBillingHistoryQuery(page);

  const meta = data?.meta;
  const records = data?.items ?? [];
  const totalPages = meta?.totalPages ?? 0;

  return (
    <main className="py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-neutral-900">Billing</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Subscription payment history.
        </p>
      </div>

      {isError && (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load billing history. Please try again later.
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50">
              <Th>Date</Th>
              <Th>Period</Th>
              <Th>Plan</Th>
              <Th>Amount</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-neutral-100">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 w-24 animate-pulse rounded bg-neutral-100" />
                    </td>
                  ))}
                </tr>
              ))}

            {!isLoading && data && records.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-neutral-400">
                  No billing records yet.
                </td>
              </tr>
            )}

            {!isLoading &&
              records.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50"
                >
                  <td className="px-4 py-3 text-neutral-700">{r.paidAt ? fmt(r.paidAt) : '—'}</td>
                  <td className="px-4 py-3 text-neutral-500">
                    {fmt(r.periodStart)} — {fmt(r.periodEnd)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${planBadgeClass(r.plan.level)}`}
                    >
                      {r.plan.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-neutral-900">
                    {Number(r.amount) > 0 ? `₴${r.amount}` : "Безкоштовно"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASS[r.status]}`}
                    >
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={!meta?.hasPreviousPage}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-40 disabled:pointer-events-none"
          >
            Previous
          </button>
          <span className="text-sm text-neutral-500">
            Page {meta?.page ?? page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={!meta?.hasNextPage}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-50 disabled:opacity-40 disabled:pointer-events-none"
          >
            Next
          </button>
        </div>
      )}
    </main>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-400">
      {children}
    </th>
  );
}
