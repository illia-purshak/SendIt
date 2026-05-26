import { useState } from "react";

const AreaChart = ({
  data,
  animationKey,
}: {
  data: { label: string; count: number }[];
  animationKey: string;
}) => {
  const [hovered, setHovered] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-neutral-500">
        No shipment data for this period.
      </div>
    );
  }

  const SVG_W = 600;
  const SVG_H = 120;
  const PAD_X = 30;
  const PAD_Y = 12;
  const LABEL_H = 20;

  const max = Math.max(...data.map((m) => m.count), 1);
  const pts = data.map((m, i) => ({
    x: PAD_X + (i / Math.max(data.length - 1, 1)) * (SVG_W - PAD_X * 2),
    y: PAD_Y + (1 - m.count / max) * (SVG_H - PAD_Y * 2 - LABEL_H),
    label: m.label,
    count: m.count,
  }));

  const linePath = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
    .join(" ");
  const areaPath =
    `M${pts[0].x},${SVG_H - LABEL_H} ` +
    pts.map((p) => `L${p.x},${p.y}`).join(" ") +
    ` L${pts[pts.length - 1].x},${SVG_H - LABEL_H} Z`;

  return (
    <div key={animationKey} className="animate-fade-up">
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        className="w-full "
        style={{ height: 140 }}
        aria-label="Shipments over time chart"
      >
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(31,111,95,0.35)" />
            <stop offset="100%" stopColor="rgba(31,111,95,0)" />
          </linearGradient>
        </defs>

        <path d={areaPath} fill="url(#chartGradient)" />
        <path
          d={linePath}
          fill="none"
          stroke="#1F6F5F"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          className="pt-5"
        />

        {pts.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={hovered === i ? 5 : 3.5}
            fill="#1F6F5F"
            stroke="#fff"
            strokeWidth={hovered === i ? 2 : 1.5}
            style={{ cursor: "pointer", transition: "r 0.15s ease" }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}

        {pts.map((p, i) => (
          <text
            key={`lbl-${i}`}
            x={p.x}
            y={SVG_H - 4}
            textAnchor="middle"
            fontSize="10"
            fill="#919191"
            fontFamily="'Plus Jakarta Sans', sans-serif"
          >
            {p.label}
          </text>
        ))}

        {hovered !== null &&
          (() => {
            const p = pts[hovered];
            const tx = Math.max(18, Math.min(SVG_W - 18, p.x));
            return (
              <g transform={`translate(${tx}, ${p.y - 14})`}>
                <rect
                  x="-18"
                  y="-16"
                  width="36"
                  height="20"
                  rx="4"
                  fill="#111827"
                />
                <text
                  x="0"
                  y="-2"
                  textAnchor="middle"
                  fontSize="11"
                  fill="white"
                  fontFamily="'DM Mono', monospace"
                  fontWeight="500"
                >
                  {p.count}
                </text>
              </g>
            );
          })()}
      </svg>
    </div>
  );
};

export default AreaChart;
