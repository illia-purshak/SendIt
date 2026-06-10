import type { ShipmentStatus } from "@/types/analytics";

const STATUS_LABEL: Record<ShipmentStatus, string> = {
  DRAFT: "Draft",
  CREATED: "Created",
  PREPARING: "Preparing",
  IN_TRANSIT: "In Transit",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  RETURNED: "Returned",
  UNKNOWN: "Unknown",
};

const STATUS_COLOR: Record<ShipmentStatus, string> = {
  DRAFT: "#d1d5db",
  CREATED: "#93c5fd",
  PREPARING: "#fbbf24",
  IN_TRANSIT: "#f59e0b",
  DELIVERED: "#0F766E",
  CANCELLED: "#ef4444",
  RETURNED: "#f97316",
  UNKNOWN: "#9ca3af",
};

const HorizontalBars = ({
  byStatus,
}: {
  byStatus: Partial<Record<ShipmentStatus, number>>;
}) => {
  const entries = Object.entries(byStatus) as [ShipmentStatus, number][];
  const total = entries.reduce((s, [, v]) => s + v, 0);

  if (entries.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-neutral-400">No shipment data.</p>
    );
  }

  const sorted = [...entries].sort(([, a], [, b]) => b - a);

  return (
    <div className="flex flex-col gap-3">
      {sorted.map(([status, count]) => {
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={status} className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-xs font-medium text-neutral-600">
              {STATUS_LABEL[status]}
            </span>
            <div className="flex-1 overflow-hidden rounded-full bg-neutral-100" style={{ height: 8 }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: STATUS_COLOR[status] }}
              />
            </div>
            <span
              className="w-8 shrink-0 text-right text-xs font-medium text-neutral-900"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default HorizontalBars;
