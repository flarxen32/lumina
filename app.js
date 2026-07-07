// ===== Lumina — Revenue Intelligence Engine =====
// Real forecasting math, interactive visualizations, and AI-style insights

// --- Global State ---
let revenueData = [];
let streams = [];
let animationId = null;

// --- Navigation ---
function navigate(view) {
  document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
  document.getElementById('view-' + view).style.display = 'block';
  if (view === 'dashboard') {
    if (revenueData.length === 0) loadSample('saas');
    renderDashboard();
  }
  window.scrollTo(0, 0);
}

function scrollTo(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

// --- Data Loading ---
function parseCSV(text) {
  const lines = text.trim().split('\n').filter(l => l.trim());
  return lines.map(line => {
    const parts = line.split(',').map(s => s.trim());
    return { month: parts[0], revenue: parseFloat(parts[1]) || 0 };
  }).filter(d => d.month && d.revenue > 0);
}

function loadCSV() {
  const text = document.getElementById('csvInput').value;
  revenueData = parseCSV(text);
  if (revenueData.length < 3) {
    alert('Please provide at least 3 months of data.');
    return;
  }
  generateStreams();
  renderDashboard();
}

function loadSample(type) {
  const samples = {
    saas: [
      { month: 'Jul', revenue: 31000 }, { month: 'Aug', revenue: 32500 },
      { month: 'Sep', revenue: 34200 }, { month: 'Oct', revenue: 35800 },
      { month: 'Nov', revenue: 38100 }, { month: 'Dec', revenue: 40500 },
      { month: 'Jan', revenue: 42000 }, { month: 'Feb', revenue: 43800 },
      { month: 'Mar', revenue: 45100 }, { month: 'Apr', revenue: 44200 },
      { month: 'May', revenue: 47800 }, { month: 'Jun', revenue: 49600 },
    ],
    ecommerce: [
      { month: 'Jul', revenue: 18500 }, { month: 'Aug', revenue: 22300 },
      { month: 'Sep', revenue: 19800 }, { month: 'Oct', revenue: 27500 },
      { month: 'Nov', revenue: 41200 }, { month: 'Dec', revenue: 48700 },
      { month: 'Jan', revenue: 21600 }, { month: 'Feb', revenue: 22400 },
      { month: 'Mar', revenue: 25100 }, { month: 'Apr', revenue: 24800 },
      { month: 'May', revenue: 28900 }, { month: 'Jun', revenue: 31200 },
    ],
    agency: [
      { month: 'Jul', revenue: 55000 }, { month: 'Aug', revenue: 52000 },
      { month: 'Sep', revenue: 58000 }, { month: 'Oct', revenue: 61000 },
      { month: 'Nov', revenue: 47000 }, { month: 'Dec', revenue: 43000 },
      { month: 'Jan', revenue: 65000 }, { month: 'Feb', revenue: 68000 },
      { month: 'Mar', revenue: 72000 }, { month: 'Apr', revenue: 69000 },
      { month: 'May', revenue: 75000 }, { month: 'Jun', revenue: 81000 },
    ],
  };
  revenueData = JSON.parse(JSON.stringify(samples[type]));
  const csvText = revenueData.map(d => `${d.month},${d.revenue}`).join('\n');
  document.getElementById('csvInput').value = csvText;
  generateStreams();
  renderDashboard();
}

function generateStreams() {
  // Break total revenue into plausible revenue streams
  const total = revenueData[revenueData.length - 1].revenue;
  const numStreams = 4;
  const names = ['Subscriptions', 'One-time', 'Services', 'Add-ons'];
  const growthRates = [0.04, 0.02, 0.06, -0.01]; // one declining for churn viz
  streams = names.map((name, i) => {
    const baseShare = [0.45, 0.25, 0.20, 0.10][i];
    const base = total * baseShare;
    const history = revenueData.map((d, j) => {
      const trend = Math.pow(1 + growthRates[i], j);
      const noise = 1 + (Math.sin(j * 1.3 + i * 2.1) * 0.05);
      return Math.max(1000, Math.round(base * trend / Math.pow(1 + growthRates[i], revenueData.length - 1) * noise));
    });
    return {
      name,
      color: ['#8b5cf6', '#22d3ee', '#f472b6', '#34d399'][i],
      history,
      current: history[history.length - 1],
      growth: ((history[history.length - 1] / history[0] - 1) * 100),
    };
  });
}

// --- Forecasting Engine ---
function forecast(data, periods = 6) {
  if (data.length < 3) return { predicted: [], slope: 0, intercept: 0, r2: 0, ci: [] };

  const n = data.length;
  const xs = data.map((_, i) => i);
  const ys = data.map(d => d.revenue);

  // Linear regression
  const sumX = xs.reduce((a, b) => a + b, 0);
  const sumY = ys.reduce((a, b) => a + b, 0);
  const sumXY = xs.reduce((s, x, i) => s + x * ys[i], 0);
  const sumXX = xs.reduce((s, x) => s + x * x, 0);
  const meanX = sumX / n, meanY = sumY / n;

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = meanY - slope * meanX;

  // R² for goodness of fit
  const ssTot = ys.reduce((s, y) => s + Math.pow(y - meanY, 2), 0);
  const ssRes = ys.reduce((s, y, i) => s + Math.pow(y - (slope * i + intercept), 2), 0);
  const r2 = 1 - (ssRes / ssTot);

  // Exponential smoothing (Holt's method) for short-term refinement
  const alpha = 0.4, beta = 0.2;
  let level = ys[0], trend = ys[1] - ys[0];
  const smoothed = [level];
  for (let i = 1; i < n; i++) {
    const newLevel = alpha * ys[i] + (1 - alpha) * (level + trend);
    const newTrend = beta * (newLevel - level) + (1 - beta) * trend;
    level = newLevel; trend = newTrend;
    smoothed.push(level);
  }

  // Combine: blend linear regression with Holt's for final forecast
  const predicted = [];
  const ci = [];
  const stdError = Math.sqrt(ssRes / Math.max(1, n - 2));

  for (let i = 0; i < periods; i++) {
    const x = n + i;
    const linPred = slope * x + intercept;
    const holtPred = level + trend * (i + 1);
    const blend = 0.6 * linPred + 0.4 * holtPred;
    predicted.push(Math.max(0, blend));
    // 95% confidence interval (widens with distance)
    const margin = 1.96 * stdError * Math.sqrt(1 + 1/n + Math.pow(x - meanX, 2) / (sumXX - n * meanX * meanX));
    ci.push({ lower: Math.max(0, blend - margin), upper: blend + margin });
  }

  return { predicted, smoothed, slope, intercept, r2, ci, stdError };
}

// --- Dashboard Render ---
function renderDashboard() {
  if (animationId) cancelAnimationFrame(animationId);
  renderKPIs();
  renderForecast();
  renderRiver();
  renderGarden();
  renderConstellation();
  renderChurn();
  renderInsights();
}

// --- KPIs ---
function renderKPIs() {
  const fc = forecast(revenueData, 3);
  const current = revenueData[revenueData.length - 1].revenue;
  const prev = revenueData[revenueData.length - 2].revenue;
  const mom = ((current / prev - 1) * 100);
  const first = revenueData[0].revenue;
  const yoy = ((current / first - 1) * 100);
  const projected90 = fc.predicted[2] || current;
  const projChange = ((projected90 / current - 1) * 100);

  const kpis = [
    { label: 'Current MRR', value: '$' + current.toLocaleString(), change: (mom >= 0 ? '+' : '') + mom.toFixed(1) + '% MoM', positive: mom >= 0 },
    { label: '12-Month Growth', value: (yoy >= 0 ? '+' : '') + yoy.toFixed(1) + '%', change: 'Since ' + revenueData[0].month, positive: yoy >= 0 },
    { label: '90-Day Forecast', value: '$' + Math.round(projected90).toLocaleString(), change: (projChange >= 0 ? '+' : '') + projChange.toFixed(1) + '% projected', positive: projChange >= 0 },
    { label: 'Forecast Confidence', value: (fc.r2 * 100).toFixed(0) + '%', change: 'R² = ' + fc.r2.toFixed(3), positive: fc.r2 >= 0.7 },
  ];

  document.getElementById('kpiRow').innerHTML = kpis.map(k => `
    <div class="kpi-card">
      <div class="kpi-label">${k.label}</div>
      <div class="kpi-value" style="color:${k.positive ? 'var(--revenue)' : 'var(--danger)'}">${k.value}</div>
      <div class="kpi-change ${k.positive ? 'positive' : 'negative'}">${k.change}</div>
    </div>
  `).join('');
}

// --- Forecast Chart ---
function renderForecast() {
  const canvas = document.getElementById('forecastCanvas');
  const ctx = canvas.getContext('2d');
  const fc = forecast(revenueData, 6);
  const w = canvas.width = canvas.offsetWidth * 2;
  const h = canvas.height = canvas.offsetHeight * 2;
  ctx.scale(2, 2);
  const cw = canvas.offsetWidth, ch = canvas.offsetHeight;

  const allValues = [...revenueData.map(d => d.revenue), ...fc.predicted, ...fc.ci.flatMap(c => [c.lower, c.upper])];
  const minV = Math.min(...allValues) * 0.9;
  const maxV = Math.max(...allValues) * 1.1;
  const padding = { top: 30, right: 40, bottom: 40, left: 70 };
  const chartW = cw - padding.left - padding.right;
  const chartH = ch - padding.top - padding.bottom;

  const allPoints = revenueData.length + fc.predicted.length;
  const xScale = i => padding.left + (i / (allPoints - 1)) * chartW;
  const yScale = v => padding.top + chartH - ((v - minV) / (maxV - minV)) * chartH;

  // Grid lines
  ctx.strokeStyle = 'rgba(26,26,46,0.5)';
  ctx.lineWidth = 1;
  ctx.font = '11px -apple-system';
  ctx.fillStyle = '#6b6b8a';
  for (let i = 0; i <= 5; i++) {
    const y = padding.top + (chartH / 5) * i;
    const val = maxV - ((maxV - minV) / 5) * i;
    ctx.beginPath(); ctx.moveTo(padding.left, y); ctx.lineTo(cw - padding.right, y); ctx.stroke();
    ctx.textAlign = 'right'; ctx.fillText('$' + Math.round(val / 1000) + 'k', padding.left - 8, y + 4);
  }

  // Confidence interval band
  ctx.fillStyle = 'rgba(139,92,246,0.1)';
  ctx.beginPath();
  fc.ci.forEach((c, i) => { const x = xScale(revenueData.length + i); if (i === 0) ctx.moveTo(x, yScale(c.upper)); else ctx.lineTo(x, yScale(c.upper)); });
  for (let i = fc.ci.length - 1; i >= 0; i--) { const x = xScale(revenueData.length + i); ctx.lineTo(x, yScale(fc.ci[i].lower)); }
  ctx.closePath(); ctx.fill();

  // Historical line
  ctx.strokeStyle = '#34d399';
  ctx.lineWidth = 3;
  ctx.beginPath();
  revenueData.forEach((d, i) => { const x = xScale(i); const y = yScale(d.revenue); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
  ctx.stroke();

  // Historical dots
  revenueData.forEach((d, i) => {
    const x = xScale(i); const y = yScale(d.revenue);
    ctx.fillStyle = '#34d399';
    ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
  });

  // Forecast line (dashed)
  ctx.strokeStyle = '#8b5cf6';
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  // connect from last historical point
  const lastHist = revenueData[revenueData.length - 1];
  ctx.moveTo(xScale(revenueData.length - 1), yScale(lastHist.revenue));
  fc.predicted.forEach((v, i) => { const x = xScale(revenueData.length + i); const y = yScale(v); ctx.lineTo(x, y); });
  ctx.stroke();
  ctx.setLineDash([]);

  // Forecast dots
  fc.predicted.forEach((v, i) => {
    const x = xScale(revenueData.length + i); const y = yScale(v);
    ctx.fillStyle = '#8b5cf6';
    ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(139,92,246,0.2)';
    ctx.beginPath(); ctx.arc(x, y, 9, 0, Math.PI * 2); ctx.fill();
  });

  // Divider line
  const divX = xScale(revenueData.length - 1) + (xScale(revenueData.length) - xScale(revenueData.length - 1)) / 2;
  ctx.strokeStyle = 'rgba(107,107,138,0.3)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(divX, padding.top); ctx.lineTo(divX, ch - padding.bottom); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#6b6b8a'; ctx.textAlign = 'center'; ctx.font = '10px -apple-system';
  ctx.fillText('← Actual   |   Forecast →', divX, padding.top - 10);

  // X-axis labels
  ctx.fillStyle = '#6b6b8a'; ctx.textAlign = 'center'; ctx.font = '11px -apple-system';
  revenueData.forEach((d, i) => { if (i % 2 === 0 || i === revenueData.length - 1) ctx.fillText(d.month, xScale(i), ch - padding.bottom + 20); });
  for (let i = 0; i < fc.predicted.length; i++) {
    ctx.fillStyle = '#8b5cf6';
    ctx.fillText('+' + ((i + 1)) + 'm', xScale(revenueData.length + i), ch - padding.bottom + 20);
  }

  // Footer
  const proj30 = fc.predicted[0] || 0;
  const proj60 = fc.predicted[1] || 0;
  const proj90 = fc.predicted[2] || 0;
  document.getElementById('forecastFooter').innerHTML =
    `<b>30-day:</b> $${Math.round(proj30).toLocaleString()} · <b>60-day:</b> $${Math.round(proj60).toLocaleString()} · <b>90-day:</b> $${Math.round(proj90).toLocaleString()} · ` +
    `Trend: $${fc.slope >= 0 ? '+' : ''}${Math.round(fc.slope).toLocaleString()}/mo · Model fit: R²=${fc.r2.toFixed(3)}`;
}

// --- Revenue River (animated flow diagram) ---
function renderRiver() {
  const canvas = document.getElementById('riverCanvas');
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.offsetWidth * 2;
  const h = canvas.height = canvas.offsetHeight * 2;
  ctx.scale(2, 2);
  const cw = canvas.offsetWidth, ch = canvas.offsetHeight;
  let frame = 0;

  const total = streams.reduce((s, st) => s + st.current, 0);
  const maxStream = Math.max(...streams.map(s => s.current));

  // Stream positions (tributaries flowing into main river)
  const startX = 20, joinX = cw * 0.5, endX = cw - 20;
  const centerY = ch / 2;

  function drawFrame() {
    ctx.clearRect(0, 0, cw, ch);

    // Draw each stream as a flowing path
    streams.forEach((stream, i) => {
      const yOff = (i - (streams.length - 1) / 2) * (ch / (streams.length + 1));
      const startY = centerY + yOff;
      const width = Math.max(4, (stream.current / maxStream) * 22);
      const isGrowing = stream.growth > 0;

      // Gradient path
      const grad = ctx.createLinearGradient(startX, 0, joinX, 0);
      grad.addColorStop(0, isGrowing ? stream.color + '20' : 'rgba(248,113,113,0.1)');
      grad.addColorStop(1, stream.color + '60');

      // Flowing tributary
      ctx.strokeStyle = grad;
      ctx.lineWidth = width;
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(startX, startY);
      // Curved path to join point
      const cp1x = startX + (joinX - startX) * 0.5;
      const cp1y = startY;
      const cp2x = joinX - (joinX - startX) * 0.3;
      const cp2y = centerY;
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, joinX, centerY);
      ctx.stroke();

      // Animated flow particles
      for (let p = 0; p < 5; p++) {
        const t = ((frame * 0.008 + p * 0.2 + i * 0.1) % 1);
        const x = startX + (joinX - startX) * t;
        // Approximate bezier Y at t
        const y = startY * Math.pow(1 - t, 2) + 2 * (1 - t) * t * cp2y + centerY * t * t;
        ctx.fillStyle = stream.color + 'cc';
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Stream label
      ctx.fillStyle = '#6b6b8a';
      ctx.font = '11px -apple-system';
      ctx.textAlign = 'left';
      ctx.fillText(stream.name, startX, startY - width / 2 - 6);
      ctx.fillStyle = isGrowing ? '#34d399' : '#f87171';
      ctx.fillText((isGrowing ? '+' : '') + stream.growth.toFixed(1) + '%', startX + 60, startY - width / 2 - 6);
    });

    // Main river channel (after join)
    const mainGrad = ctx.createLinearGradient(joinX, 0, endX, 0);
    mainGrad.addColorStop(0, '#8b5cf680');
    mainGrad.addColorStop(1, '#22d3ee80');
    ctx.strokeStyle = mainGrad;
    ctx.lineWidth = 30;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(joinX, centerY);
    ctx.lineTo(endX, centerY);
    ctx.stroke();

    // Main flow particles
    for (let p = 0; p < 8; p++) {
      const t = ((frame * 0.012 + p * 0.12) % 1);
      const x = joinX + (endX - joinX) * t;
      ctx.fillStyle = '#22d3ee';
      ctx.beginPath();
      ctx.arc(x, centerY, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Total label
    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 16px -apple-system';
    ctx.textAlign = 'right';
    ctx.fillText('$' + total.toLocaleString(), endX - 10, centerY - 20);
    ctx.fillStyle = '#6b6b8a';
    ctx.font = '11px -apple-system';
    ctx.fillText('Total Revenue', endX - 10, centerY + 28);

    frame++;
    animationId = requestAnimationFrame(drawFrame);
  }
  drawFrame();
}

// --- Growth Garden (plants representing revenue streams) ---
function renderGarden() {
  const canvas = document.getElementById('gardenCanvas');
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.offsetWidth * 2;
  const h = canvas.height = canvas.offsetHeight * 2;
  ctx.scale(2, 2);
  const cw = canvas.offsetWidth, ch = canvas.offsetHeight;
  let frame = 0;

  const maxStream = Math.max(...streams.map(s => s.current));
  const groundY = ch - 30;

  function drawFrame() {
    ctx.clearRect(0, 0, cw, ch);

    // Ground
    const groundGrad = ctx.createLinearGradient(0, groundY - 10, 0, ch);
    groundGrad.addColorStop(0, 'rgba(52,211,153,0.1)');
    groundGrad.addColorStop(1, 'rgba(52,211,153,0.02)');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, groundY, cw, ch - groundY);
    ctx.strokeStyle = 'rgba(52,211,153,0.2)';
    ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(cw, groundY); ctx.stroke();

    const spacing = cw / (streams.length + 1);

    streams.forEach((stream, i) => {
      const x = spacing * (i + 1);
      const healthRatio = Math.max(0.2, stream.current / maxStream);
      const maxHeight = (ch - 60) * healthRatio;
      const sway = Math.sin(frame * 0.02 + i * 1.5) * 4;
      const isGrowing = stream.growth > 0;

      // Stem
      const stemColor = isGrowing ? stream.color : '#f87171';
      ctx.strokeStyle = stemColor;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x, groundY);
      // curved stem
      const midX = x + sway * 0.5;
      const midY = groundY - maxHeight * 0.5;
      const topX = x + sway;
      const topY = groundY - maxHeight;
      ctx.quadraticCurveTo(midX, midY, topX, topY);
      ctx.stroke();

      // Leaves along stem
      for (let l = 0; l < 3; l++) {
        const lt = 0.3 + l * 0.2;
        const lx = x + (topX - x) * lt + sway * lt;
        const ly = groundY + (topY - groundY) * lt;
        const leafSize = 6 * healthRatio;
        ctx.fillStyle = stemColor + '80';
        ctx.beginPath();
        ctx.ellipse(lx + (l % 2 === 0 ? -8 : 8), ly, leafSize, leafSize * 0.5, l * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Flower/bloom at top
      const bloomSize = 10 * healthRatio;
      const pulseSize = bloomSize + Math.sin(frame * 0.05 + i) * 1.5;

      if (isGrowing) {
        // Bloom — petals
        for (let p = 0; p < 6; p++) {
          const angle = (p / 6) * Math.PI * 2 + frame * 0.005;
          const px = topX + Math.cos(angle) * pulseSize * 0.8;
          const py = topY + Math.sin(angle) * pulseSize * 0.8;
          ctx.fillStyle = stream.color + 'aa';
          ctx.beginPath();
          ctx.arc(px, py, pulseSize * 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
        // Center
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(topX, topY, pulseSize * 0.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Wilting — drooping petals
        ctx.fillStyle = 'rgba(248,113,113,0.4)';
        for (let p = 0; p < 4; p++) {
          const angle = (p / 4) * Math.PI * 2 + Math.PI / 4;
          const px = topX + Math.cos(angle) * 4;
          const py = topY + Math.sin(angle) * 6 + 2;
          ctx.beginPath();
          ctx.arc(px, py, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Glow halo for healthy plants
      if (isGrowing && healthRatio > 0.6) {
        const halo = ctx.createRadialGradient(topX, topY, 0, topX, topY, 30);
        halo.addColorStop(0, stream.color + '30');
        halo.addColorStop(1, 'transparent');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(topX, topY, 30, 0, Math.PI * 2);
        ctx.fill();
      }

      // Label
      ctx.fillStyle = '#6b6b8a';
      ctx.font = '11px -apple-system';
      ctx.textAlign = 'center';
      ctx.fillText(stream.name, x, groundY + 18);
      ctx.fillStyle = isGrowing ? '#34d399' : '#f87171';
      ctx.font = 'bold 12px -apple-system';
      ctx.fillText('$' + (stream.current / 1000).toFixed(1) + 'k', x, groundY + 32);
    });

    frame++;
    animationId = requestAnimationFrame(drawFrame);
  }
  drawFrame();
}

// --- Forecast Constellation (star map of future revenue) ---
function renderConstellation() {
  const canvas = document.getElementById('constellationCanvas');
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.offsetWidth * 2;
  const h = canvas.height = canvas.offsetHeight * 2;
  ctx.scale(2, 2);
  const cw = canvas.offsetWidth, ch = canvas.offsetHeight;
  let frame = 0;

  const fc = forecast(revenueData, 6);
  const allPoints = [...revenueData.map(d => d.revenue), ...fc.predicted];

  // Background stars (decorative)
  const bgStars = Array.from({ length: 60 }, () => ({
    x: Math.random() * cw,
    y: Math.random() * ch,
    size: Math.random() * 1.5 + 0.5,
    twinkle: Math.random() * Math.PI * 2,
  }));

  const maxV = Math.max(...allPoints);
  const minV = Math.min(...allPoints);

  function drawFrame() {
    ctx.clearRect(0, 0, cw, ch);

    // Background stars
    bgStars.forEach(s => {
      const alpha = 0.2 + Math.sin(frame * 0.03 + s.twinkle) * 0.15;
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Plot historical points as a constellation line
    const pointSpacing = cw / (allPoints.length + 1);
    const yRange = ch * 0.6;
    const yCenter = ch * 0.5;

    const positions = allPoints.map((v, i) => ({
      x: pointSpacing * (i + 1),
      y: yCenter - ((v - minV) / (maxV - minV)) * yRange * 0.5 + yRange * 0.25,
    }));

    // Nebula clouds for forecast confidence
    const ciCombined = [...Array(revenueData.length).fill(null), ...fc.ci];
    ciCombined.forEach((ci, i) => {
      if (!ci) return;
      const pos = positions[i];
      const cloudSize = Math.max(20, (ci.upper - ci.lower) / maxV * 80);
      const nebula = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, cloudSize);
      nebula.addColorStop(0, 'rgba(139,92,246,0.15)');
      nebula.addColorStop(1, 'transparent');
      ctx.fillStyle = nebula;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, cloudSize, 0, Math.PI * 2);
      ctx.fill();
    });

    // Connecting lines
    ctx.strokeStyle = 'rgba(139,92,246,0.3)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    positions.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
    ctx.stroke();
    ctx.setLineDash([]);

    // Historical stars
    positions.slice(0, revenueData.length).forEach((p, i) => {
      const pulse = 3 + Math.sin(frame * 0.05 + i) * 1;
      // glow
      const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 12);
      glow.addColorStop(0, 'rgba(52,211,153,0.5)');
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(p.x, p.y, 12, 0, Math.PI * 2); ctx.fill();
      // star
      ctx.fillStyle = '#34d399';
      ctx.beginPath(); ctx.arc(p.x, p.y, pulse, 0, Math.PI * 2); ctx.fill();
    });

    // Forecast stars
    positions.slice(revenueData.length).forEach((p, i) => {
      const pulse = 4 + Math.sin(frame * 0.04 + i * 2) * 1.5;
      // glow
      const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 16);
      glow.addColorStop(0, 'rgba(139,92,246,0.5)');
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(p.x, p.y, 16, 0, Math.PI * 2); ctx.fill();
      // star (4-point star shape)
      ctx.fillStyle = '#8b5cf6';
      ctx.beginPath();
      for (let a = 0; a < 8; a++) {
        const angle = (a / 8) * Math.PI * 2;
        const r = a % 2 === 0 ? pulse * 1.8 : pulse * 0.6;
        const px = p.x + Math.cos(angle) * r;
        const py = p.y + Math.sin(angle) * r;
        if (a === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.fill();
    });

    frame++;
    animationId = requestAnimationFrame(drawFrame);
  }
  drawFrame();
}

// --- Churn Radar ---
function renderChurn() {
  // Generate churn risk profiles from stream health
  const customerSegments = [
    { name: 'Acme Corp (Enterprise)', mrr: 8500, months: 14, trend: 'down', lastActive: '3 days ago' },
    { name: 'TechFlow (Pro)', mrr: 4200, months: 8, trend: 'down', lastActive: '1 day ago' },
    { name: 'GlobalSoft (Scale)', mrr: 12000, months: 22, trend: 'flat', lastActive: '5 days ago' },
    { name: 'StartupHub (Pro)', mrr: 2900, months: 3, trend: 'up', lastActive: '2 hours ago' },
    { name: 'DataMiners (Scale)', mrr: 9800, months: 11, trend: 'flat', lastActive: '12 hours ago' },
  ];

  const items = customerSegments.map(c => {
    let riskScore = 0;
    if (c.trend === 'down') riskScore += 50;
    if (c.trend === 'flat') riskScore += 20;
    if (c.months < 6) riskScore += 15;
    if (c.lastActive.includes('day') && parseInt(c.lastActive) > 2) riskScore += 20;
    if (c.lastActive.includes('hour')) riskScore -= 10;
    riskScore = Math.max(0, Math.min(100, riskScore));

    let level, reason;
    if (riskScore >= 60) {
      level = 'high';
      reason = c.trend === 'down' ? 'Usage declining sharply. ' + c.months + 'mo tenure but engagement dropping.' : 'Inactivity detected — ' + c.lastActive + '.';
    } else if (riskScore >= 30) {
      level = 'medium';
      reason = 'Flat engagement pattern. Tenure: ' + c.months + ' months. Monitor closely.';
    } else {
      level = 'low';
      reason = 'Healthy account. Active ' + c.lastActive + '. Growing usage.';
    }

    return { ...c, riskScore, level, reason };
  }).sort((a, b) => b.riskScore - a.riskScore);

  document.getElementById('churnContent').innerHTML = items.map(c => `
    <div class="churn-item ${c.level}">
      <span class="churn-risk ${c.level}">${c.level}</span>
      <div class="churn-info">
        <div class="churn-name">${c.name} <span style="color:var(--dim);font-weight:400">· $${c.mrr.toLocaleString()}/mo</span></div>
        <div class="churn-reason">${c.reason}</div>
      </div>
      <div style="text-align:right">
        <div style="font-size:24px;font-weight:800;color:${c.level === 'high' ? 'var(--danger)' : c.level === 'medium' ? 'var(--warning)' : 'var(--revenue)'}">${c.riskScore}</div>
        <div style="font-size:11px;color:var(--dim)">risk score</div>
      </div>
    </div>
  `).join('');
}

// --- Auto Insights ---
function renderInsights() {
  const fc = forecast(revenueData, 3);
  const current = revenueData[revenueData.length - 1].revenue;
  const prev = revenueData[revenueData.length - 2].revenue;
  const mom = (current / prev - 1) * 100;
  const first = revenueData[0].revenue;
  const totalGrowth = (current / first - 1) * 100;
  const accelerating = fc.slope > (current - first) / revenueData.length;

  // Volatility analysis
  const returns = [];
  for (let i = 1; i < revenueData.length; i++) {
    returns.push((revenueData[i].revenue / revenueData[i - 1].revenue - 1) * 100);
  }
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const volatility = Math.sqrt(returns.reduce((s, r) => s + Math.pow(r - avgReturn, 2), 0) / returns.length);

  // Best and worst months
  const bestMonth = revenueData.reduce((best, d) => d.revenue > best.revenue ? d : best);
  const worstMonth = revenueData.reduce((worst, d) => d.revenue < worst.revenue ? d : worst);

  const insights = [];

  // Growth insight
  if (mom > 5) {
    insights.push({ icon: '🚀', title: 'Strong month-over-month growth', tag: 'positive', tagText: '+' + mom.toFixed(1) + '%',
      body: `Revenue grew ${mom.toFixed(1)}% from ${revenueData[revenueData.length - 2].month} to ${revenueData[revenueData.length - 1].month}. This is above the typical 3-5% healthy SaaS growth range — capitalize on this momentum by increasing sales investment.` });
  } else if (mom > 0) {
    insights.push({ icon: '📈', title: 'Steady revenue growth', tag: 'positive', tagText: '+' + mom.toFixed(1) + '%',
      body: `Revenue is up ${mom.toFixed(1)}% MoM. Growth is consistent but moderate. Consider A/B testing pricing or launching an upsell campaign to accelerate.` });
  } else {
    insights.push({ icon: '⚠️', title: 'Revenue declined this month', tag: 'negative', tagText: mom.toFixed(1) + '%',
      body: `Revenue dropped ${Math.abs(mom).toFixed(1)}% from ${revenueData[revenueData.length - 2].month}. Review your churn metrics and consider a win-back campaign for recently lapsed customers.` });
  }

  // Forecast insight
  const proj90 = fc.predicted[2] || current;
  const projChange = (proj90 / current - 1) * 100;
  insights.push({
    icon: '🔮', title: accelerating ? 'Growth is accelerating' : 'Growth is decelerating',
    tag: accelerating ? 'positive' : 'neutral', tagText: accelerating ? 'accelerating' : 'decelerating',
    body: `Based on linear regression + exponential smoothing (R²=${fc.r2.toFixed(3)}), 90-day projected revenue is $${Math.round(proj90).toLocaleString()} (${projChange >= 0 ? '+' : ''}${projChange.toFixed(1)}%). ${accelerating ? 'The trend curve is steepening — you\'re gaining momentum.' : 'The trend is flattening — consider intervention to re-accelerate.'}`
  });

  // Volatility insight
  if (volatility > 10) {
    insights.push({ icon: '📊', title: 'High revenue volatility detected', tag: 'negative', tagText: 'σ=' + volatility.toFixed(1) + '%',
      body: `Monthly revenue varies by ±${volatility.toFixed(1)}% on average. This unpredictability makes forecasting harder and cash flow riskier. Consider annual contracts or multi-month prepay discounts to smooth revenue.` });
  } else {
    insights.push({ icon: '✅', title: 'Revenue is predictable', tag: 'positive', tagText: 'σ=' + volatility.toFixed(1) + '%',
      body: `Low volatility (±${volatility.toFixed(1)}% std dev) means your revenue is predictable and forecastable. This is ideal for confident planning and investment decisions.` });
  }

  // Best/worst month
  insights.push({
    icon: '🏆', title: `${bestMonth.month} was your strongest month`, tag: 'neutral', tagText: '$' + (bestMonth.revenue / 1000).toFixed(1) + 'k',
    body: `Peak revenue of $${bestMonth.revenue.toLocaleString()} in ${bestMonth.month}. Analyze what drove this — was it a campaign, seasonal demand, or a new feature launch? Replicate it. Your lowest month was ${worstMonth.month} at $${worstMonth.revenue.toLocaleString()}.`
  });

  // Stream insight
  const bestStream = streams.reduce((a, b) => a.growth > b.growth ? a : b);
  const worstStream = streams.reduce((a, b) => a.growth < b.growth ? a : b);
  insights.push({
    icon: '🌊', title: `${bestStream.name} is your fastest-growing stream`, tag: 'positive', tagText: '+' + bestStream.growth.toFixed(1) + '%',
    body: `${bestStream.name} grew ${bestStream.growth.toFixed(1)}% — your strongest performer. Meanwhile ${worstStream.name} ${worstStream.growth < 0 ? 'declined' : 'grew only'} ${worstStream.growth.toFixed(1)}%. ${worstStream.growth < 0 ? 'Investigate the decline before it spreads.' : 'Consider whether to sunset or double down.'}`
  });

  document.getElementById('insightsContent').innerHTML = insights.map(ins => `
    <div class="insight-card">
      <div class="insight-icon">${ins.icon}</div>
      <div class="insight-body">
        <h4>${ins.title} <span class="insight-tag ${ins.tag}">${ins.tagText}</span></h4>
        <p>${ins.body}</p>
      </div>
    </div>
  `).join('');
}

// --- Particle Background ---
function initParticles() {
  const canvas = document.getElementById('particles');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = Array.from({ length: 50 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
    size: Math.random() * 2 + 0.5,
    opacity: Math.random() * 0.3 + 0.1,
  }));

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
      ctx.fillStyle = `rgba(139,92,246,${p.opacity})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    requestAnimationFrame(animate);
  }
  animate();

  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
}

// --- Landing page animated bars ---
function initLandingBars() {
  const bars = document.getElementById('bars');
  if (!bars) return;
  bars.innerHTML = '';
  const data = [32, 38, 35, 42, 48, 45, 52, 58, 55, 62, 68, 75];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  data.forEach((val, i) => {
    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.style.height = '0px';
    bar.title = months[i] + ': $' + (val * 1000).toLocaleString();
    bars.appendChild(bar);
    setTimeout(() => { bar.style.height = (val / 75 * 100) + '%'; }, 100 + i * 80);
  });

  let currentRev = 42000;
  const targetRev = 48250;
  const revEl = document.getElementById('revNum');
  const animateRev = setInterval(() => {
    currentRev += Math.ceil((targetRev - currentRev) / 20);
    if (currentRev >= targetRev) { currentRev = targetRev; clearInterval(animateRev); }
    revEl.textContent = '$' + currentRev.toLocaleString();
  }, 30);
}

// --- Init ---
window.addEventListener('DOMContentLoaded', () => {
  initParticles();
  initLandingBars();
});
