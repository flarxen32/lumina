"use client";

import { TimeSeriesPoint, ForecastPoint } from "@/lib/types";

interface Props {
  historical: TimeSeriesPoint[];
  forecast: ForecastPoint[];
}

export default function ForecastChart({ historical, forecast }: Props) {
  const width = 500;
  const height = 240;
  const padding = { top: 20, right: 20, bottom: 30, left: 45 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  if (historical.length === 0 || forecast.length === 0) {
    return (
      <div className="h-[240px] flex items-center justify-center text-lumina-dim text-sm">
        Need at least 7 days of data for forecast
      </div>
    );
  }

  const histRecent = historical.slice(-30);
  const allValues = [
    ...histRecent.map(d => d.revenue),
    ...forecast.map(d => d.upperBound),
  ];
  const maxVal = Math.max(...allValues, 1);

  const totalPoints = histRecent.length + forecast.length;
  const xScale = (i: number) => padding.left + (i / Math.max(totalPoints - 1, 1)) * chartWidth;
  const yScale = (v: number) => padding.top + chartHeight - (v / maxVal) * chartHeight;

  // Historical path
  const histPoints = histRecent.map((d, i) => `${xScale(i)},${yScale(d.revenue)}`);
  const histPath = `M ${histPoints.join(" L ")}`;

  // Forecast center line
  const fcStart = histRecent.length - 1;
  const fcPoints = forecast.map((d, i) => `${xScale(fcStart + i)},${yScale(d.predicted)}`);
  const fcPath = `M ${xScale(fcStart)},${yScale(histRecent[histRecent.length - 1].revenue)} L ${fcPoints.join(" L ")}`;

  // Confidence band
  const upperPath = forecast.map((d, i) => `${xScale(fcStart + i)},${yScale(d.upperBound)}`);
  const lowerPath = forecast.map((d, i) => `${xScale(fcStart + i)},${yScale(d.lowerBound)}`).reverse();
  const bandPath = `M ${upperPath.join(" L ")} L ${lowerPath.join(" L ")} Z`;

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: "block" }}>
      <defs>
        <linearGradient id="forecastBand" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
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
        const val = maxVal * (1 - t);
        return (
          <text key={t} x={padding.left - 6} y={padding.top + chartHeight * t + 4} textAnchor="end" fontSize="9" fill="#6b6b8a">
            ${val >= 1000 ? `${(val / 1000).toFixed(0)}K` : val.toFixed(0)}
          </text>
        );
      })}

      {/* Confidence band */}
      <path d={bandPath} fill="url(#forecastBand)" />

      {/* Historical line */}
      <path d={histPath} fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinejoin="round" />

      {/* Forecast line */}
      <path d={fcPath} fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinejoin="round" strokeDasharray="4 3" />

      {/* Divider line */}
      <line
        x1={xScale(fcStart)}
        y1={padding.top}
        x2={xScale(fcStart)}
        y2={padding.top + chartHeight}
        stroke="#6b6b8a"
        strokeWidth="1"
        strokeDasharray="2 2"
        opacity="0.5"
      />
      <text x={xScale(fcStart) + 4} y={padding.top + 12} fontSize="9" fill="#6b6b8a">Forecast →</text>

      {/* X-axis labels */}
      {[0, Math.floor(totalPoints / 2), totalPoints - 1].map(i => {
        if (i < histRecent.length) {
          return (
            <text key={i} x={xScale(i)} y={height - 8} textAnchor="middle" fontSize="9" fill="#6b6b8a">
              {new Date(histRecent[i].date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </text>
          );
        }
        const fcIdx = i - histRecent.length;
        if (forecast[fcIdx]) {
          return (
            <text key={i} x={xScale(i)} y={height - 8} textAnchor="middle" fontSize="9" fill="#6b6b8a">
              {new Date(forecast[fcIdx].date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </text>
          );
        }
        return null;
      })}
    </svg>
  );
}
