import type { CSSProperties } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";

const MONO: CSSProperties = { fontFamily: "'DM Mono', monospace" };

const StatCard = ({
  label,
  value,
  change,
}: {
  label: string;
  value: string;
  change: number;
}) => {
  const isPositive = change > 0;
  const isNeutral = change === 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="absolute bottom-4 right-0 top-4 w-0.5 rounded-full" />
      <p className="text-xs font-medium uppercase tracking-widest text-neutral-500">
        {label}
      </p>
      <p
        className="mt-3 text-4xl font-medium leading-none text-neutral-950 tabular-nums"
        style={MONO}
      >
        {value}
      </p>
      {isNeutral ? (
        <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
          No change
        </span>
      ) : (
        <span
          className={`mt-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
            isPositive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}
        >
          {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          {isPositive ? `+${change}%` : `${change}%`}
        </span>
      )}
    </div>
  );
};

export default StatCard;
