import type { CSSProperties } from "react";

const MONO: CSSProperties = { fontFamily: "'DM Mono', monospace" };

const OperatorRow = ({
  op,
  total,
  rank,
}: {
  op: { name: string; count: number };
  total: number;
  rank: number;
}) => {
  const pct = total > 0 ? Math.round((op.count / total) * 100) : 0;

  return (
    <div className="flex items-center gap-3">
      <span
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-xs font-medium text-neutral-400"
        style={MONO}
      >
        {rank}
      </span>
      <span className="w-28 shrink-0 text-sm font-medium text-neutral-900">
        {op.name}
      </span>
      <div
        className="flex-1 overflow-hidden rounded-full bg-neutral-300"
        style={{ height: 10 }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(to right, #1F6F5F, #3FE7A4)",
          }}
        />
      </div>
      <div className="flex w-16 shrink-0 flex-col items-end">
        <span className="text-sm font-medium text-neutral-900" style={MONO}>
          {op.count}
        </span>
        <span className="text-xs text-neutral-400">{pct}%</span>
      </div>
    </div>
  );
};

export default OperatorRow;
