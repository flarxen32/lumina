"use client";

import { useState, useMemo, useCallback } from "react";
import { Transaction } from "@/lib/types";
import { calculateMetrics, buildTimeSeries, generateForecast, calculateCustomerMetrics, segmentBySource } from "@/lib/metrics";
import { generateDemoTransactions } from "@/lib/demoData";
import { parseCSV, generateCSVTemplate } from "@/lib/csvParser";
import MetricCard from "@/components/MetricCard";
import RevenueChart from "@/components/RevenueChart";
import ForecastChart from "@/components/ForecastChart";
import SourceBreakdown from "@/components/SourceBreakdown";
import CustomerHealth from "@/components/CustomerHealth";
import TransactionFeed from "@/components/TransactionFeed";
import CSVImporter from "@/components/CSVImporter";

export default function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>(() => generateDemoTransactions());
  const [showLanding, setShowLanding] = useState(false);

  const metrics = useMemo(() => calculateMetrics(transactions), [transactions]);
  const timeSeries = useMemo(() => buildTimeSeries(transactions, 90), [transactions]);
  const forecast = useMemo(() => generateForecast(timeSeries, 30), [timeSeries]);
  const customerMetrics = useMemo(() => calculateCustomerMetrics(transactions), [transactions]);
  const segmentation = useMemo(() => segmentBySource(transactions), [transactions]);

  const handleImport = useCallback((newTx: Transaction[]) => {
    setTransactions(prev => [...newTx, ...prev].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    ));
  }, []);

  const handleResetDemo = useCallback(() => {
    setTransactions(generateDemoTransactions());
  }, []);

  const handleClearData = useCallback(() => {
    setTransactions([]);
  }, []);

  return (
    <div className="min-h-screen relative">
      {/* Ambient glow orbs */}
      <div className="fixed top-0 right-0 w-[600px] h-[600px] rounded-full opacity-[0.07] pointer-events-none"
           style={{ background: "#8b5cf6", filter: "blur(120px)" }} />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] rounded-full opacity-[0.05] pointer-events-none"
           style={{ background: "#22d3ee", filter: "blur(120px)" }} />

      {/* Navigation */}
      <nav className="relative z-10 border-b border-lumina-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                 style={{ background: "linear-gradient(135deg, #8b5cf6, #22d3ee)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="white" strokeWidth="2" strokeLinejoin="round"/>
                <path d="M2 17l10 5 10-5" stroke="white" strokeWidth="2" strokeLinejoin="round" opacity="0.6"/>
                <path d="M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinejoin="round" opacity="0.8"/>
              </svg>
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight gradient-text">Lumina</span>
              <span className="text-xs text-lumina-dim ml-2">Revenue Intelligence</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <CSVImporter onImport={handleImport} />
            <button
              onClick={handleResetDemo}
              className="text-sm text-lumina-dim hover:text-lumina-text transition-colors px-3 py-2"
            >
              Demo Data
            </button>
            <button
              onClick={handleClearData}
              className="text-sm text-lumina-dim hover:text-lumina-danger transition-colors px-3 py-2"
            >
              Clear
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Hero metric row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Total Revenue"
            value={metrics.totalRevenue}
            format="currency"
            change={metrics.revenueChange}
            icon={
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
            }
            gradient="from-purple-500/20 to-purple-500/0"
          />
          <MetricCard
            label="MRR (30d)"
            value={metrics.mrr}
            format="currency"
            subtitle={`ARR: $${(metrics.arr / 1000).toFixed(1)}K`}
            icon={<path d="M3 3v18h18M7 14l4-4 4 4 6-6" />}
            gradient="from-cyan-500/20 to-cyan-500/0"
          />
          <MetricCard
            label="Transactions"
            value={metrics.totalTransactions}
            format="number"
            subtitle={`Avg: $${metrics.avgTransactionValue.toFixed(0)}`}
            icon={<path d="M4 6h16M4 12h16M4 18h16" />}
            gradient="from-pink-500/20 to-pink-500/0"
          />
          <MetricCard
            label="Active Customers"
            value={metrics.activeCustomers}
            format="number"
            subtitle={`ARPU: $${metrics.arpu.toFixed(0)}`}
            icon={<path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />}
            gradient="from-emerald-500/20 to-emerald-500/0"
          />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue chart - spans 2 columns */}
          <div className="lg:col-span-2 glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold">Revenue Flow</h2>
                <p className="text-sm text-lumina-dim mt-0.5">Daily revenue, last 90 days</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#8b5cf6" }} />
                  <span className="text-lumina-dim">Revenue</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#34d399" }} />
                  <span className="text-lumina-dim">Cumulative</span>
                </span>
              </div>
            </div>
            <RevenueChart data={timeSeries} />
          </div>

          {/* Source breakdown */}
          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-1">Revenue Sources</h2>
            <p className="text-sm text-lumina-dim mb-6">Breakdown by payment channel</p>
            <SourceBreakdown data={segmentation} />
          </div>
        </div>

        {/* Forecast + Customer Health */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold">30-Day Forecast</h2>
                <p className="text-sm text-lumina-dim mt-0.5">Linear trend with 95% confidence bounds</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-md bg-lumina-purple/10 text-lumina-purple font-medium">
                ML PREDICTION
              </span>
            </div>
            <ForecastChart historical={timeSeries} forecast={forecast} />
          </div>

          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-semibold mb-1">Customer Health</h2>
            <p className="text-sm text-lumina-dim mb-6">Retention and growth metrics (30 days)</p>
            <CustomerHealth metrics={customerMetrics} />
          </div>
        </div>

        {/* Transaction Feed */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-1">Transaction Stream</h2>
          <p className="text-sm text-lumina-dim mb-6">Live feed of all revenue events</p>
          <TransactionFeed transactions={transactions} />
        </div>

        {/* Footer */}
        <div className="text-center py-6 text-sm text-lumina-dim">
          <p>
            <span className="gradient-text font-semibold">Lumina</span> — Revenue Intelligence, Reimagined ·
            <span className="ml-1">Built by xro</span>
          </p>
        </div>
      </main>
    </div>
  );
}
