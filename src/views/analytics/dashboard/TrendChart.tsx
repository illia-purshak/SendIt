import { useState } from "react";

const TrendChart = ({ data }: { data: { date: string; count: number }[] }) => {
  const [hovered, setHovered] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-neutral-500">
        No trend data available.
      </div>
    );
  }

  const SVG_W = 600;
  const SVG_H = 152;
  const PAD_X = 30;
  const PAD_TOP = 28;
  const PAD_BOTTOM = 16;
  const LABEL_H = 24;
  const TOOLTIP_W = 44;
  const TOOLTIP_H = 24;
  const TOOLTIP_GAP = 14;

  const max = Math.max(...data.map((d) => d.count), 1);
  const pts = data.map((d, i) => {
    const [, mm, dd] = d.date.split("-");
    const label = `${Number(mm)}/${Number(dd)}`;
    const chartHeight = SVG_H - PAD_TOP - PAD_BOTTOM - LABEL_H;
    return {
      x: PAD_X + (i / Math.max(data.length - 1, 1)) * (SVG_W - PAD_X * 2),
      y: PAD_TOP + (1 - d.count / max) * chartHeight,
      label,
      count: d.count,
    };
  });

  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath =
    `M${pts[0].x},${SVG_H - LABEL_H - PAD_BOTTOM} ` +
    pts.map((p) => `L${p.x},${p.y}`).join(" ") +
    ` L${pts[pts.length - 1].x},${SVG_H - LABEL_H - PAD_BOTTOM} Z`;

  // show every 5th label to avoid crowding 30 dates
  const showLabel = (_: unknown, i: number) => i % 5 === 0 || i === data.length - 1;

  return (
    <svg
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      className="w-full"
      style={{ height: 176 }}
      aria-label="30-day shipment trend"
    >
      <defs>
        <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(15,118,110,0.3)" />
          <stop offset="100%" stopColor="rgba(15,118,110,0)" />
        </linearGradient>
      </defs>

      <path d={areaPath} fill="url(#trendGradient)" />
      <path
        d={linePath}
        fill="none"
        stroke="#0F766E"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {pts.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={hovered === i ? 5 : 3}
          fill="#0F766E"
          stroke="#fff"
          strokeWidth={hovered === i ? 2 : 1.5}
          style={{ cursor: "pointer", transition: "r 0.15s ease" }}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(null)}
        />
      ))}

      {pts.map((p, i) =>
        showLabel(null, i) ? (
          <text
            key={`lbl-${i}`}
            x={p.x}
            y={SVG_H - 4}
            textAnchor="middle"
            fontSize={9}
            fill="#9ca3af"
            fontFamily="'Plus Jakarta Sans', sans-serif"
          >
            {p.label}
          </text>
        ) : null,
      )}

      {hovered !== null &&
        (() => {
          const p = pts[hovered];
          const tx = Math.max(TOOLTIP_W / 2, Math.min(SVG_W - TOOLTIP_W / 2, p.x));
          const ty = Math.max(TOOLTIP_H + 6, p.y - TOOLTIP_GAP);
          return (
            <g transform={`translate(${tx}, ${ty})`}>
              <rect
                x={-TOOLTIP_W / 2}
                y={-TOOLTIP_H}
                width={TOOLTIP_W}
                height={TOOLTIP_H}
                rx="6"
                fill="#111827"
              />
              <text
                x="0"
                y="-8"
                textAnchor="middle"
                fontSize={11}
                fill="white"
                fontFamily="'DM Mono', monospace"
                fontWeight={500}
              >
                {p.count}
              </text>
            </g>
          );
        })()}
    </svg>
  );
};

export default TrendChart;
