import { Transaction, RevenueMetrics, TimeSeriesPoint, ForecastPoint, CustomerMetrics, SegmentationData } from "./types";

// ─── Revenue Metrics Engine ─────────────────────────────────────────────

export function calculateMetrics(transactions: Transaction[]): RevenueMetrics {
  if (transactions.length === 0) {
    return {
      totalRevenue: 0, mrr: 0, arr: 0, revenueChange: 0,
      totalTransactions: 0, avgTransactionValue: 0, refundRate: 0,
      activeCustomers: 0, arpu: 0,
    };
  }

  const totalRevenue = transactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const refunds = transactions.filter(t => t.category === "refund");
  const refundAmount = refunds.reduce((sum, t) => sum + Math.abs(t.amount), 0);

  // Last 30 days revenue for MRR proxy
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const last30 = transactions.filter(t => new Date(t.date) >= thirtyDaysAgo && t.amount > 0);
  const last30Revenue = last30.reduce((sum, t) => sum + t.amount, 0);

  // Previous 30 days for change calculation
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
  const prev30 = transactions.filter(t => {
    const d = new Date(t.date);
    return d >= sixtyDaysAgo && d < thirtyDaysAgo && t.amount > 0;
  });
  const prev30Revenue = prev30.reduce((sum, t) => sum + t.amount, 0);

  const revenueChange = prev30Revenue > 0
    ? ((last30Revenue - prev30Revenue) / prev30Revenue) * 100
    : 0;

  const positiveTx = transactions.filter(t => t.amount > 0);
  const avgTransactionValue = positiveTx.length > 0
    ? totalRevenue / positiveTx.length
    : 0;

  const uniqueCustomers = new Set(
    transactions.filter(t => t.customerId).map(t => t.customerId)
  );

  return {
    totalRevenue,
    mrr: last30Revenue,
    arr: last30Revenue * 12,
    revenueChange,
    totalTransactions: transactions.length,
    avgTransactionValue,
    refundRate: totalRevenue > 0 ? (refundAmount / totalRevenue) * 100 : 0,
    activeCustomers: uniqueCustomers.size,
    arpu: uniqueCustomers.size > 0 ? totalRevenue / uniqueCustomers.size : 0,
  };
}

// ─── Time Series Generation ─────────────────────────────────────────────

export function buildTimeSeries(transactions: Transaction[], days = 90): TimeSeriesPoint[] {
  const now = new Date();
  const points: TimeSeriesPoint[] = [];
  let cumulative = 0;

  // Calculate starting cumulative from transactions before our window
  const windowStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const preWindow = transactions.filter(t => new Date(t.date) < windowStart && t.amount > 0);
  cumulative = preWindow.reduce((sum, t) => sum + t.amount, 0);

  for (let i = days - 1; i >= 0; i--) {
    const dayStart = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    const dateStr = dayStart.toISOString().split("T")[0];

    const dayTx = transactions.filter(t => {
      const td = new Date(t.date);
      return td >= dayStart && td < dayEnd && t.amount > 0;
    });

    const dayRevenue = dayTx.reduce((sum, t) => sum + t.amount, 0);
    cumulative += dayRevenue;

    points.push({
      date: dateStr,
      revenue: dayRevenue,
      cumulative,
      transactions: dayTx.length,
    });
  }

  return points;
}

// ─── Simple ML Forecast (linear regression + confidence) ────────────────

export function generateForecast(timeSeries: TimeSeriesPoint[], forecastDays = 30): ForecastPoint[] {
  if (timeSeries.length < 7) return [];

  // Use last 30 days of revenue data for the trend
  const recent = timeSeries.slice(-30);
  const n = recent.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = recent.map(p => p.revenue);

  // Linear regression: y = mx + b
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Standard deviation for confidence bounds
  const predictions = x.map(xi => slope * xi + intercept);
  const residuals = y.map((yi, i) => yi - predictions[i]);
  const stdDev = Math.sqrt(residuals.reduce((sum, r) => sum + r * r, 0) / n);

  const points: ForecastPoint[] = [];
  const lastDate = new Date(timeSeries[timeSeries.length - 1].date);
  const lastRevenue = timeSeries[timeSeries.length - 1].revenue;

  for (let i = 1; i <= forecastDays; i++) {
    const predicted = Math.max(0, slope * (n + i - 1) + intercept);
    const date = new Date(lastDate.getTime() + i * 24 * 60 * 60 * 1000);
    const variance = stdDev * Math.sqrt(1 + i / n); // widening cone

    points.push({
      date: date.toISOString().split("T")[0],
      predicted,
      lowerBound: Math.max(0, predicted - 1.96 * variance),
      upperBound: predicted + 1.96 * variance,
    });
  }

  return points;
}

// ─── Customer Metrics ───────────────────────────────────────────────────

export function calculateCustomerMetrics(transactions: Transaction[], days = 30): CustomerMetrics {
  const now = new Date();
  const periodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const prevPeriodStart = new Date(now.getTime() - 2 * days * 24 * 60 * 60 * 1000);

  const customersThisPeriod = new Set(
    transactions
      .filter(t => new Date(t.date) >= periodStart && t.customerId)
      .map(t => t.customerId!)
  );
  const customersPrevPeriod = new Set(
    transactions
      .filter(t => {
        const d = new Date(t.date);
        return d >= prevPeriodStart && d < periodStart && t.customerId;
      })
      .map(t => t.customerId!)
  );

  const newCustomers = Array.from(customersThisPeriod).filter(c => !customersPrevPeriod.has(c)).length;
  const churnedCustomers = Array.from(customersPrevPeriod).filter(c => !customersThisPeriod.has(c)).length;

  const retentionRate = customersPrevPeriod.size > 0
    ? ((customersPrevPeriod.size - churnedCustomers) / customersPrevPeriod.size) * 100
    : 100;

  return {
    newCustomers,
    churnedCustomers,
    netGrowth: newCustomers - churnedCustomers,
    retentionRate,
  };
}

// ─── Source Segmentation ────────────────────────────────────────────────

export function segmentBySource(transactions: Transaction[]): SegmentationData[] {
  const sourceMap = new Map<string, number>();
  const colors: Record<string, string> = {
    "Stripe": "#8b5cf6",
    "PayPal": "#22d3ee",
    "Manual": "#f472b6",
    "Bank Transfer": "#34d399",
    "Other": "#fbbf24",
  };

  transactions.filter(t => t.amount > 0).forEach(t => {
    sourceMap.set(t.source, (sourceMap.get(t.source) || 0) + t.amount);
  });

  const total = Array.from(sourceMap.values()).reduce((a, b) => a + b, 0);

  return Array.from(sourceMap.entries())
    .map(([source, revenue]) => ({
      source,
      revenue,
      percentage: total > 0 ? (revenue / total) * 100 : 0,
      color: colors[source] || "#6b6b8a",
    }))
    .sort((a, b) => b.revenue - a.revenue);
}
