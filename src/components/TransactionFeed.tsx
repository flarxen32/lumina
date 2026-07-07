"use client";

import { useState } from "react";
import { Transaction } from "@/lib/types";

interface Props {
  transactions: Transaction[];
}

export default function TransactionFeed({ transactions }: Props) {
  const [filter, setFilter] = useState<string>("all");
  const [visible, setVisible] = useState(15);

  const categories = ["all", "subscription", "upgrade", "refund", "one_time"];

  const filtered = filter === "all"
    ? transactions
    : transactions.filter(t => t.category === filter);

  const shown = filtered.slice(0, visible);

  const formatAmount = (amount: number) => {
    const sign = amount >= 0 ? "+" : "";
    const color = amount >= 0 ? "text-lumina-revenue" : "text-lumina-danger";
    const abs = Math.abs(amount);
    const formatted = abs >= 1000 ? `${(abs / 1000).toFixed(1)}K` : abs.toFixed(0);
    return (
      <span className={color}>
        {sign}${formatted}
      </span>
    );
  };

  const categoryColor = (cat: string) => {
    switch (cat) {
      case "subscription": return "#8b5cf6";
      case "upgrade": return "#22d3ee";
      case "refund": return "#f87171";
      case "one_time": return "#f472b6";
      default: return "#6b6b8a";
    }
  };

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-4 bg-lumina-bg/50 rounded-lg p-1 w-fit">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => { setFilter(cat); setVisible(15); }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${
              filter === cat
                ? "bg-lumina-border text-lumina-text"
                : "text-lumina-dim hover:text-lumina-text"
            }`}
          >
            {cat.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Transaction list */}
      <div className="space-y-1 max-h-[400px] overflow-y-auto pr-2">
        {shown.length === 0 ? (
          <div className="text-center py-8 text-lumina-dim text-sm">No transactions found</div>
        ) : (
          shown.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-lumina-border/20 transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: categoryColor(tx.category) }}
                />
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{tx.description}</div>
                  <div className="text-xs text-lumina-dim mt-0.5">
                    {new Date(tx.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    <span className="mx-1.5">·</span>
                    {tx.source}
                    <span className="mx-1.5">·</span>
                    <span className="capitalize">{tx.category.replace("_", " ")}</span>
                  </div>
                </div>
              </div>
              <div className="text-sm font-semibold tabular-nums flex-shrink-0 ml-3">
                {formatAmount(tx.amount)}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load more */}
      {visible < filtered.length && (
        <button
          onClick={() => setVisible(v => v + 20)}
          className="mt-4 w-full py-2 text-xs text-lumina-dim hover:text-lumina-text border border-lumina-border rounded-lg transition-colors"
        >
          Load {Math.min(20, filtered.length - visible)} more ({filtered.length - visible} remaining)
        </button>
      )}
    </div>
  );
}
