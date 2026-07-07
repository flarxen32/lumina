"use client";

import { useEffect, useState, useRef } from "react";

interface Props {
  label: string;
  value: number;
  format: "currency" | "number";
  change?: number;
  subtitle?: string;
  icon: React.ReactNode;
  gradient: string;
}

export default function MetricCard({ label, value, format, change, subtitle, icon, gradient }: Props) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Count-up animation
  useEffect(() => {
    if (!isVisible) return;

    const duration = 1200;
    const start = performance.now();
    const startValue = 0;

    let frame: number;
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(startValue + (value - startValue) * eased);
      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [value, isVisible]);

  // Intersection observer for reveal
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const formatValue = (v: number) => {
    if (format === "currency") {
      return v >= 1000
        ? `$${(v / 1000).toFixed(1)}K`
        : `$${v.toFixed(0)}`;
    }
    return v >= 1000 ? `${(v / 1000).toFixed(1)}K` : Math.round(v).toString();
  };

  const isPositiveChange = (change ?? 0) >= 0;

  return (
    <div
      ref={ref}
      className={`animated-border p-5 bg-gradient-to-br ${gradient} opacity-0 animate-[fadeIn_0.6s_ease-out_forwards]`}
      style={{ animationDelay: `${Math.random() * 200}ms` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="text-sm text-lumina-dim font-medium">{label}</div>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-lumina-border/50">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-lumina-cyan">
            {icon}
          </svg>
        </div>
      </div>
      <div className="text-3xl font-bold tracking-tight mb-1" style={{ fontVariantNumeric: "tabular-nums" }}>
        {formatValue(displayValue)}
      </div>
      <div className="flex items-center gap-2 text-xs">
        {change !== undefined && (
          <span className={isPositiveChange ? "text-lumina-revenue" : "text-lumina-danger"}>
            {isPositiveChange ? "↑" : "↓"} {Math.abs(change).toFixed(1)}%
          </span>
        )}
        {subtitle && <span className="text-lumina-dim">{subtitle}</span>}
      </div>
    </div>
  );
}
