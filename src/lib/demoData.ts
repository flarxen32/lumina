import { Transaction, TransactionCategory } from "./types";

// Generate realistic demo data: 90 days of transactions for a growing SaaS

const CUSTOMER_NAMES = [
  "Acme Corp", "TechFlow Labs", "Globex", "Initech", "Umbra Systems",
  "Vertex AI", "Nimbus Co", "Quanta Labs", "Helix Digital", "Zenith Group",
  "Apex Industries", "Stratus Tech", "Cipher Wave", "Lumio Software", "Forge Analytics",
  "Cobalt Inc", "Pulse Networks", "Drift Studios", "Cascade Media", "Orbit Dynamics",
];

const SOURCES = ["Stripe", "PayPal", "Manual", "Bank Transfer"];
const PLANS = [
  { name: "Pro Monthly", price: 29 },
  { name: "Scale Monthly", price: 99 },
  { name: "Pro Annual", price: 290 },
  { name: "Scale Annual", price: 990 },
  { name: "Enterprise", price: 2500 },
];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomId(): string {
  return Math.random().toString(36).substring(2, 10);
}

function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

export function generateDemoTransactions(): Transaction[] {
  const rng = seededRandom(42); // deterministic seed for stable demo
  const transactions: Transaction[] = [];
  const now = new Date();

  // Generate transactions for the past 90 days
  for (let dayAgo = 90; dayAgo >= 0; dayAgo--) {
    const date = new Date(now.getTime() - dayAgo * 24 * 60 * 60 * 1000);

    // Base daily transactions with growth trend (revenue grows over time)
    const growthFactor = 1 + (90 - dayAgo) / 90 * 1.5; // 1x to 2.5x over 90 days
    const baseCount = 3 + Math.floor(rng() * 5 * growthFactor);
    const txCount = Math.max(2, baseCount);

    for (let i = 0; i < txCount; i++) {
      const plan = randomFrom(PLANS);
      const customer = randomFrom(CUSTOMER_NAMES);
      const source = randomFrom(SOURCES);
      const isRefund = rng() < 0.04; // 4% refund rate
      const isUpgrade = rng() < 0.08; // 8% upgrade rate

      let amount = plan.price;
      let category: TransactionCategory = "subscription";
      let description = `${plan.name} — ${customer}`;

      if (isRefund) {
        amount = -plan.price;
        category = "refund";
        description = `Refund — ${customer}`;
      } else if (isUpgrade) {
        amount = plan.price * 0.5; // prorated upgrade
        category = "upgrade";
        description = `Upgrade — ${customer} → ${plan.name}`;
      }

      // Add some randomness to amounts
      if (!isRefund) {
        amount = Math.round(amount * (0.9 + rng() * 0.2) * 100) / 100;
      }

      transactions.push({
        id: randomId(),
        date: date.toISOString(),
        description,
        amount,
        source,
        category,
        customerId: `${customer.toLowerCase().replace(/\s+/g, "_")}_${randomId().slice(0, 4)}`,
      });
    }
  }

  return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
