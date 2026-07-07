// Core domain types for Lumina revenue intelligence platform

export interface Transaction {
  id: string;
  date: string; // ISO date
  description: string;
  amount: number; // positive = revenue, negative = refund/chargeback
  source: string; // "Stripe", "PayPal", "Manual"
  category: TransactionCategory;
  customerId?: string;
}

export type TransactionCategory =
  | "subscription"
  | "one_time"
  | "refund"
  | "upgrade"
  | "downgrade";

export interface RevenueMetrics {
  totalRevenue: number;
  mrr: number;
  arr: number;
  revenueChange: number; // % vs previous period
  totalTransactions: number;
  avgTransactionValue: number;
  refundRate: number;
  activeCustomers: number;
  arpu: number; // average revenue per user
}

export interface TimeSeriesPoint {
  date: string;
  revenue: number;
  cumulative: number;
  transactions: number;
}

export interface ForecastPoint {
  date: string;
  predicted: number;
  lowerBound: number;
  upperBound: number;
}

export interface CustomerMetrics {
  newCustomers: number;
  churnedCustomers: number;
  netGrowth: number;
  retentionRate: number;
}

export interface SegmentationData {
  source: string;
  revenue: number;
  percentage: number;
  color: string;
}
