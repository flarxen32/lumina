# ◆ Lumina — Revenue Intelligence, Reimagined

> Turn raw financial data into living, breathing revenue intelligence.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
![Live Demo](https://img.shields.io/badge/demo-live-success)

**Lumina** is a beautiful, creative, and useful revenue intelligence platform that aligns with xro's mission: *generate always more revenue.*

## ✨ Live Demo

The app runs entirely client-side — no backend required. Open `index.html` or visit the GitHub Pages deployment.

## What Makes It Different

### Beautiful
- Dark theme with luminous accents, glassmorphism, and particle effects
- 60fps animated canvas visualizations driven by real data
- Smooth transitions, micro-interactions, and responsive layout

### Creative
Novel visualization metaphors — not just bar charts:

| Visualization | What It Does |
|---|---|
| **Revenue River** | Animated flow diagram showing revenue streams converging into a main channel. Stream width = volume. Growing streams glow; declining streams dim. |
| **Growth Garden** | Each revenue stream is a living plant. Healthy streams bloom with pulsing flowers; declining streams wilt. Leaves sway in real-time. |
| **Forecast Constellation** | Future revenue plotted as a star map. Historical months are green stars; forecast points are purple 4-point stars. Nebula clouds show confidence intervals. |

### Useful
- **Real forecasting engine**: Linear regression + Holt's exponential smoothing with R² goodness-of-fit and 95% confidence intervals
- **Interactive data input**: Paste your own CSV data or load SaaS / E-commerce / Agency sample datasets
- **Churn Radar**: Risk-scored customer segments with specific retention recommendations
- **Automated Insights**: AI-generated plain-English analysis of trends, volatility, and growth opportunities
- **KPI Dashboard**: Current MRR, growth %, 90-day forecast, and model confidence

## Tech Stack

- **Vanilla JavaScript** — no frameworks, no build step, instant load
- **HTML5 Canvas** — custom visualizations with requestAnimationFrame
- **CSS3** — custom properties, glassmorphism, responsive grid
- **Real math** — linear regression, exponential smoothing, confidence intervals, volatility (σ)

## How to Use

1. Click **Launch Live Demo**
2. Load a sample dataset (SaaS, E-commerce, or Agency) or paste your own CSV
3. Explore the dashboard — all visualizations update in real-time
4. Read the automated insights for actionable recommendations

### CSV Format
```
Jan,42000
Feb,43800
Mar,45100
...
```

## Revenue Model

| Tier | Price | Features |
|------|-------|----------|
| Free | $0/mo | CSV import, basic charts, 1 data source |
| Pro | $29/mo | API connections, ML forecasts, churn alerts |
| Scale | $99/mo | Multi-entity, teams, white-label, API access |
| Enterprise | Custom | SSO, on-prem, dedicated support |

## Project Structure

```
lumina/
├── index.html      # Landing page + dashboard SPA
├── styles.css      # Full design system (dark theme, responsive)
├── app.js          # Forecasting engine + all visualizations
├── README.md
└── LICENSE
```

## Forecasting Methodology

Lumina blends two models for robust predictions:

1. **Linear Regression** — fits a trend line to historical data, captures long-term direction
2. **Holt's Exponential Smoothing** — adaptive level + trend tracking, responsive to recent changes
3. **Blended Output** — 60% regression / 40% Holt's for stability + responsiveness
4. **95% Confidence Intervals** — computed from residual standard error, widening with forecast distance

Model fit is reported as R² (coefficient of determination).

## License

MIT — open source. Built by [xro](https://github.com/flarxen32).
