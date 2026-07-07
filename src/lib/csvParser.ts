import { Transaction, TransactionCategory } from "./types";

// Parse CSV text into Transaction[]
// Expected columns: date,description,amount,source,category,customerId
// Flexible: if headers don't match, tries positional parsing

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

const VALID_CATEGORIES: TransactionCategory[] = [
  "subscription", "one_time", "refund", "upgrade", "downgrade",
];

export function parseCSV(csvText: string): Transaction[] {
  const lines = csvText.trim().split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return [];

  const header = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, "_"));

  // Build column index map
  const colMap: Record<string, number> = {};
  header.forEach((h, i) => { colMap[h] = i; });

  const getCol = (row: string[], ...names: string[]): string => {
    for (const name of names) {
      if (colMap[name] !== undefined && row[colMap[name]] !== undefined) {
        return row[colMap[name]];
      }
    }
    return "";
  };

  const transactions: Transaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    if (row.length < 2) continue;

    const dateStr = getCol(row, "date", "transaction_date", "timestamp");
    const description = getCol(row, "description", "desc", "name", "memo");
    const amountStr = getCol(row, "amount", "value", "total", "price");
    const source = getCol(row, "source", "payment_method", "channel", "platform") || "Manual";
    const categoryStr = getCol(row, "category", "type") as TransactionCategory;
    const customerId = getCol(row, "customer_id", "customer", "client_id", "email");

    // Parse date - accept ISO or MM/DD/YYYY
    let date = dateStr;
    if (!dateStr) continue;
    const parsed = new Date(dateStr);
    if (isNaN(parsed.getTime())) {
      // Try MM/DD/YYYY
      const parts = dateStr.split("/");
      if (parts.length === 3) {
        date = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1])).toISOString();
      } else {
        continue; // skip unparseable dates
      }
    } else {
      date = parsed.toISOString();
    }

    const amount = parseFloat(amountStr.replace(/[$,]/g, ""));
    if (isNaN(amount)) continue;

    const category: TransactionCategory = VALID_CATEGORIES.includes(categoryStr)
      ? categoryStr
      : (amount < 0 ? "refund" : "subscription");

    transactions.push({
      id: `csv_${i}_${Math.random().toString(36).substring(2, 8)}`,
      date,
      description: description || "Imported transaction",
      amount,
      source: source || "Manual",
      category,
      customerId: customerId || undefined,
    });
  }

  return transactions;
}

export function generateCSVTemplate(): string {
  return `date,description,amount,source,category,customerId
2025-01-15,Pro Monthly — Acme Corp,29,Stripe,subscription,cust_001
2025-01-16,Scale Annual — Globex,990,Stripe,subscription,cust_002
2025-01-17,Refund — Initech,-29,PayPal,refund,cust_003
2025-01-18,Upgrade — Umbra Systems,50,Stripe,upgrade,cust_004
`;
}
