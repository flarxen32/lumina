"use client";

import { useState, useMemo } from "react";
import { TimeSeriesPoint } from "@/lib/types";

interface Props {
  data: TimeSeriesPoint[];
}

export default function RevenueChart({ data }: Props) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const width = 800;
  const height = 280;
  const padding = { top: 20, right: 20, bottom: 30, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const { revenuePath, areaPath, cumulativePath, yMax, xScale, yScale, cumScale } = useMemo(() => {
    if (data.length === 0) {
      return { revenuePath: "", areaPath: "", cumulativePath: "", yMax: 0, xScale: () => 0, yScale: () => 0, cumScale: () => 0 };
    }

    const maxRevenue = Math.max(...data.map(d => d.revenue), 1);
    const maxCumulative = Math.max(...data.map(d => d.cumulative), 1);

    const xs = (i: number) => padding.left + (i / Math.max(data.length - 1, 1)) * chartWidth;
    const yRev = (v: number) => padding.top + chartHeight - (v / maxRevenue) * chartHeight;
    const yCum = (v: number) => padding.top + chartHeight - (v / maxCumulative) * chartHeight;

    // Revenue line (bars style — area chart)
    const revPoints = data.map((d, i) => `${xs(i)},${yRev(d.revenue)}`);
    const revenuePath = `M ${revPoints.join(" L ")}`;

    // Area fill
    const areaPath = `M ${xs(0)},${padding.top + chartHeight} L ${revPoints.join(" L ")} L ${xs(data.length - 1)},${padding.top + chartHeight} Z`;

    // Cumulative line
    const cumPoints = data.map((d, i) => `${xs(i)},${yCum(d.cumulative)}`);
    const cumulativePath = `M ${cumPoints.join(" L ")}`;

    return { revenuePath, areaPath, cumulativePath, yMax: maxRevenue, xScale: xs, yScale: yRev, cumScale: yCum };
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="h-[280px] flex items-center justify-center text-lumina-dim text-sm">
        No data yet — import a CSV or load demo data
      </div>
    );
  }

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * width;
    const idx = Math.round(((x - padding.left) / chartWidth) * (data.length - 1));
    setHoverIdx(Math.max(0, Math.min(data.length - 1, idx)));
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div className="relative">
      <svg
        width="100%"
        viewBox={`0 0 ${width} ${height}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIdx(null)}
        style={{ display: "block" }}
      >
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="cumGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* Y-axis grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(t => (
          <line
            key={t}
            x1={padding.left}
            y1={padding.top + chartHeight * t}
            x2={width - padding.right}
            y2={padding.top + chartHeight * t}
            stroke="#1a1a2e"
            strokeWidth="1"
            strokeDasharray="2 4"
          />
        ))}

        {/* Y-axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map(t => {
          const val = yMax * (1 - t);
          return (
            <text
              key={t}
              x={padding.left - 8}
              y={padding.top + chartHeight * t + 4}
              textAnchor="end"
              fontSize="10"
              fill="#6b6b8a"
            >
              ${val >= 1000 ? `${(val / 1000).toFixed(0)}K` : val.toFixed(0)}
            </text>
          );
        })}

        {/* Area fill */}
        <path d={areaPath} fill="url(#areaGradient)" />

        {/* Revenue line */}
        <path d={revenuePath} fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinejoin="round" />

        {/* Cumulative line */}
        <path d={cumulativePath} fill="none" stroke="url(#cumGradient)" strokeWidth="1.5" strokeLinejoin="round" opacity="0.8" />

        {/* Hover indicator */}
        {hoverIdx !== null && (
          <>
            <line
              x1={xScale(hoverIdx)}
              y1={padding.top}
              x2={xScale(hoverIdx)}
              y2={padding.top + chartHeight}
              stroke="#8b5cf6"
              strokeWidth="1"
              strokeDasharray="3 3"
              opacity="0.5"
            />
            <circle
              cx={xScale(hoverIdx)}
              cy={yScale(data[hoverIdx].revenue)}
              r="4"
              fill="#8b5cf6"
              stroke="#08080c"
              strokeWidth="2"
            />
          </>
        )}

        {/* X-axis labels (every 15 days) */}
        {data.map((d, i) => {
          if (i % 15 !== 0 && i !== data.length - 1) return null;
          const date = new Date(d.date);
          return (
            <text
              key={i}
              x={xScale(i)}
              y={height - 8}
              textAnchor="middle"
              fontSize="10"
              fill="#6b6b8a"
            >
              {date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </text>
          );
        })}
      </svg>

      {/* Tooltip */}
      {hoverIdx !== null && (
        <div
          className="chart-tooltip"
          style={{
            left: `${Math.min(mousePos.x + 12, 600)}px`,
            top: `${mousePos.y - 10}px`,
          }}
        >
          <div className="text-lumina-dim mb-1">
            {new Date(data[hoverIdx].date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: "#8b5cf6" }} />
            <span>Revenue: <strong>${data[hoverIdx].revenue.toFixed(0)}</strong></span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="w-2 h-2 rounded-full" style={{ background: "#34d399" }} />
            <span>Cumulative: <strong>${data[hoverIdx].cumulative.toFixed(0)}</strong></span>
          </div>
          <div className="text-lumina-dim mt-1">{data[hoverIdx].transactions} transactions</div>
        </div>
      )}
    </div>
  );
}
