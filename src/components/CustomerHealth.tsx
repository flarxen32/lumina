"use client";

import { CustomerMetrics } from "@/lib/types";

interface Props {
  metrics: CustomerMetrics;
}

export default function CustomerHealth({ metrics }: Props) {
  const churnRate = 100 - metrics.retentionRate;
  const netScore = metrics.netGrowth >= 0 ? "healthy" : "at-risk";

  return (
    <div className="space-y-5">
      {/* Retention ring */}
      <div className="flex items-center gap-6">
        <RetentionRing rate={metrics.retentionRate} />
        <div className="space-y-2">
          <div className="text-3xl font-bold" style={{ color: metrics.retentionRate >= 90 ? "#34d399" : "#fbbf24" }}>
            {metrics.retentionRate.toFixed(1)}%
          </div>
          <div className="text-sm text-lumina-dim">Retention Rate</div>
          <div className="text-xs text-lumina-dim">
            Churn: <span style={{ color: churnRate > 10 ? "#f87171" : "#6b6b8a" }}>{churnRate.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-lumina-border/30 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-lumina-revenue">{metrics.newCustomers}</div>
          <div className="text-xs text-lumina-dim mt-1">New</div>
        </div>
        <div className="bg-lumina-border/30 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-lumina-danger">{metrics.churnedCustomers}</div>
          <div className="text-xs text-lumina-dim mt-1">Churned</div>
        </div>
        <div className="bg-lumina-border/30 rounded-xl p-3 text-center">
          <div className={`text-2xl font-bold ${metrics.netGrowth >= 0 ? "text-lumina-revenue" : "text-lumina-danger"}`}>
            {metrics.netGrowth >= 0 ? "+" : ""}{metrics.netGrowth}
          </div>
          <div className="text-xs text-lumina-dim mt-1">Net Growth</div>
        </div>
      </div>

      {/* Status badge */}
      <div className="flex items-center justify-center">
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
          netScore === "healthy"
            ? "bg-lumina-revenue/10 text-lumina-revenue"
            : "bg-lumina-danger/10 text-lumina-danger"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
            netScore === "healthy" ? "bg-lumina-revenue" : "bg-lumina-danger"
          }`} />
          {netScore === "healthy" ? "Customer base growing" : "Customer base declining"}
        </div>
      </div>
    </div>
  );
}

function RetentionRing({ rate }: { rate: number }) {
  const size = 100;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (rate / 100) * circumference;
  const color = rate >= 90 ? "#34d399" : rate >= 75 ? "#fbbf24" : "#f87171";

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#1a1a2e" strokeWidth={strokeWidth} />
      <circle
        cx={size/2}
        cy={size/2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={`${dash} ${circumference - dash}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.8s ease-out", filter: `drop-shadow(0 0 6px ${color}40)` }}
      />
    </svg>
  );
}
