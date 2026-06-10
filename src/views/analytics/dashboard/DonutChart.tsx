import { useState } from "react";

const COLORS = ["#0F766E", "#5EEAD4"];
const LABELS = ["Ukrposhta", "Meest"];

const DonutChart = ({
  ukrposhta,
  meest,
}: {
  ukrposhta: number;
  meest: number;
}) => {
  const [hovered, setHovered] = useState<number | null>(null);

  const values = [ukrposhta, meest];
  const total = ukrposhta + meest;

  const R = 54;
  const STROKE = 20;
  const C = 2 * Math.PI * R;

  let offset = 0;
  const segments = values.map((v, i) => {
    const pct = total > 0 ? v / total : i === 0 ? 0.5 : 0.5;
    const dash = pct * C;
    const gap = C - dash;
    const seg = { dash, gap, offset, value: v, pct };
    offset += dash;
    return seg;
  });

  return (
    <div className="flex items-center gap-6">
      <div className="relative shrink-0">
        <svg width={140} height={140} viewBox="0 0 140 140">
          {total === 0 ? (
            <circle
              cx={70}
              cy={70}
              r={R}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth={STROKE}
            />
          ) : (
            segments.map((seg, i) => (
              <circle
                key={i}
                cx={70}
                cy={70}
                r={R}
                fill="none"
                stroke={COLORS[i]}
                strokeWidth={hovered === i ? STROKE + 4 : STROKE}
                strokeDasharray={`${seg.dash} ${seg.gap}`}
                strokeDashoffset={-seg.offset + C / 4}
                style={{
                  cursor: "pointer",
                  transition: "stroke-width 0.15s ease",
                  transformOrigin: "70px 70px",
                  transform: "rotate(-90deg)",
                }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              />
            ))
          )}
          <text
            x={70}
            y={65}
            textAnchor="middle"
            fontSize={22}
            fontWeight={600}
            fill="#111827"
            fontFamily="'DM Mono', monospace"
          >
            {hovered !== null ? values[hovered] : total}
          </text>
          <text
            x={70}
            y={82}
            textAnchor="middle"
            fontSize={11}
            fill="#9ca3af"
            fontFamily="'Plus Jakarta Sans', sans-serif"
          >
            {hovered !== null ? LABELS[hovered] : "total"}
          </text>
        </svg>
      </div>

      <div className="flex flex-col gap-3">
        {segments.map((seg, i) => (
          <div
            key={i}
            className="flex items-center gap-2"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{ cursor: "default" }}
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: COLORS[i] }}
            />
            <span className="text-sm text-neutral-600">{LABELS[i]}</span>
            <span
              className="ml-auto pl-4 text-sm font-medium text-neutral-900"
              style={{ fontFamily: "'DM Mono', monospace" }}
            >
              {seg.value}
            </span>
            <span className="text-xs text-neutral-400">
              {total > 0 ? `${Math.round(seg.pct * 100)}%` : "0%"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DonutChart;
