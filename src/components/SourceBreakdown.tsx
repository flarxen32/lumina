"use client";

import { SegmentationData } from "@/lib/types";

interface Props {
  data: SegmentationData[];
}

export default function SourceBreakdown({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-lumina-dim text-sm">
        No revenue data
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + d.revenue, 0);

  return (
    <div className="space-y-4">
      {/* Donut chart */}
      <div className="flex justify-center mb-4">
        <DonutChart data={data} total={total} />
      </div>

      {/* Legend */}
      <div className="space-y-3">
        {data.map((item, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-sm" style={{ background: item.color }} />
              <span className="text-sm">{item.source}</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-medium tabular-nums">${item.revenue.toFixed(0)}</span>
              <span className="text-xs text-lumina-dim ml-2">{item.percentage.toFixed(1)}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DonutChart({ data, total }: { data: SegmentationData[]; total: number }) {
  const size = 160;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#1a1a2e"
        strokeWidth={strokeWidth}
      />
      {data.map((item, i) => {
        const dash = (item.percentage / 100) * circumference;
        const circle = (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={item.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={-offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.6s ease-out" }}
          />
        );
        offset += dash;
        return circle;
      })}
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        className="transform rotate-90"
        fill="#e4e4ef"
        fontSize="11"
        fontWeight="600"
      >
        {total >= 1000 ? `$${(total / 1000).toFixed(1)}K` : `$${total.toFixed(0)}`}
      </text>
    </svg>
  );
}
