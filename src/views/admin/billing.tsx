const MONTHLY = [
  { month: "Jan", revenue: 24500, pro: 18, business: 4 },
  { month: "Feb", revenue: 26200, pro: 19, business: 4 },
  { month: "Mar", revenue: 28100, pro: 21, business: 5 },
  { month: "Apr", revenue: 31400, pro: 24, business: 6 },
  { month: "May", revenue: 33800, pro: 26, business: 7 },
];

const maxRevenue = Math.max(...MONTHLY.map((m) => m.revenue));

export default function AdminBillingPage() {
  return (
    <main className="py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-neutral-900">Analytics</h1>
        <p className="mt-1 text-sm text-neutral-500">Platform revenue analytics.</p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total revenue (YTD)" value="₴144 000" />
        <StatCard label="MRR (May)" value="₴33 800" />
        <StatCard label="Avg revenue per user" value="₴69" />
      </div>

      <div className="mb-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-neutral-400">
          Revenue by month (₴)
        </h2>
        <div className="flex items-end gap-3" style={{ height: 120 }}>
          {MONTHLY.map((m) => (
            <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t-md bg-teal-500 transition-all"
                style={{ height: `${(m.revenue / maxRevenue) * 100}px` }}
              />
              <span className="text-xs text-neutral-400">{m.month}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50">
              <Th>Month</Th>
              <Th>PRO subscribers</Th>
              <Th>BUSINESS subscribers</Th>
              <Th>Revenue</Th>
            </tr>
          </thead>
          <tbody>
            {MONTHLY.map((m) => (
              <tr key={m.month} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
                <td className="px-4 py-3 font-medium text-neutral-900">{m.month} 2026</td>
                <td className="px-4 py-3 text-neutral-700">{m.pro}</td>
                <td className="px-4 py-3 text-neutral-700">{m.business}</td>
                <td className="px-4 py-3 font-semibold text-neutral-900">₴{m.revenue.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">{label}</p>
      <p className="mt-2 text-3xl font-bold text-neutral-900">{value}</p>
    </div>
  );
}
