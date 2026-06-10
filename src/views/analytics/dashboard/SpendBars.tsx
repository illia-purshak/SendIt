import { useState } from "react";

const MONTH_ABBR: Record<string, string> = {
  "01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr",
  "05": "May", "06": "Jun", "07": "Jul", "08": "Aug",
  "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dec",
};

const SpendBars = ({ data }: { data: { month: string; amount: number }[] }) => {
  const [hovered, setHovered] = useState<number | null>(null);

  const SVG_W = 500;
  const SVG_H = 140;
  const PAD_X = 30;
  const PAD_TOP = 20;
  const LABEL_H = 20;
  const CHART_H = SVG_H - PAD_TOP - LABEL_H;

  const max = Math.max(...data.map((d) => d.amount), 1);
  const barW = (SVG_W - PAD_X * 2) / data.length;
  const GAP = barW * 0.3;

  return (
    <svg
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      className="w-full"
      style={{ height: 160 }}
      aria-label="6-month spend chart"
    >
      {data.map((d, i) => {
        const barH = max > 0 ? (d.amount / max) * CHART_H : 0;
        const x = PAD_X + i * barW + GAP / 2;
        const w = barW - GAP;
        const y = PAD_TOP + CHART_H - barH;
        const [, mm] = d.month.split("-");
        const label = MONTH_ABBR[mm] ?? mm;

        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={w}
              height={Math.max(barH, 2)}
              rx={4}
              fill={hovered === i ? "#0F766E" : "#5EEAD4"}
              style={{ cursor: "pointer", transition: "fill 0.15s ease" }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
            <text
              x={x + w / 2}
              y={SVG_H - 4}
              textAnchor="middle"
              fontSize={11}
              fill="#9ca3af"
              fontFamily="'Plus Jakarta Sans', sans-serif"
            >
              {label}
            </text>
            {hovered === i && d.amount > 0 && (
              <g transform={`translate(${x + w / 2}, ${y - 6})`}>
                <rect
                  x="-28"
                  y="-18"
                  width="56"
                  height="20"
                  rx="4"
                  fill="#111827"
                />
                <text
                  x="0"
                  y="-4"
                  textAnchor="middle"
                  fontSize={10}
                  fill="white"
                  fontFamily="'DM Mono', monospace"
                  fontWeight={500}
                >
                  ₴{d.amount.toFixed(2)}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
};

export default SpendBars;
