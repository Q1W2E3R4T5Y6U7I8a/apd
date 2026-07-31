import React, { useState, useEffect, useCallback } from 'react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, Cell, ScatterChart, Scatter, ZAxis, AreaChart, Area,
  RadialBarChart, RadialBar, PolarAngleAxis, Legend,
  RadarChart, Radar, PolarGrid, PolarRadiusAxis, LabelList,
} from 'recharts';
import './TradingLosos.scss';

// ======================================================================
// DEFAULT CONFIG
// ======================================================================
const DEFAULT_CONFIG = {
  date: '2026-07-30',
  key_events: [
    {
      title: 'IRGC strikes on tankers near the Strait of Hormuz',
      importance: 78,
      influences: ['Commodities', 'Geopolitics', 'Oil'],
    },
    {
      title: 'AI-capex valuation anxiety hitting semiconductors',
      importance: 65,
      influences: ['Equities', 'Tech', 'Nasdaq'],
    },
    {
      title: 'Fed policy limbo under new hawkish Chair Kevin Warsh',
      importance: 72,
      influences: ['Rates', 'FX', 'Bonds'],
    },
    {
      title: 'Ukraine war escalation / peace talks uncertainty',
      importance: 60,
      influences: ['Geopolitics', 'Commodities', 'FX'],
    },
    {
      title: 'China stimulus disappointment and property crisis',
      importance: 55,
      influences: ['Equities', 'Commodities', 'Emerging Markets'],
    },
    {
      title: 'Eurozone inflation data surprises to the upside',
      importance: 45,
      influences: ['Rates', 'FX'],
    },
    {
      title: 'Japan intervenes in FX market to support yen',
      importance: 40,
      influences: ['FX', 'Rates'],
    },
    {
      title: 'OPEC+ extends production cuts amid weak demand',
      importance: 50,
      influences: ['Commodities', 'Oil'],
    },
    {
      title: 'US debt ceiling debate reignites',
      importance: 35,
      influences: ['Rates', 'Bonds'],
    },
    {
      title: 'Nvidia earnings beat but forward guidance disappoints',
      importance: 48,
      influences: ['Equities', 'Tech'],
    },
  ],
  market_factors: [
    { name: 'Index Factor', value: 62 },
    { name: 'Political Importance', value: 72 },
    { name: 'Fear Factor', value: 58 },
    { name: 'Volatility', value: 45 },
    { name: 'Liquidity', value: 38 },
    { name: 'Geopolitical Risk', value: 81 },
    { name: 'Inflation', value: 29 },
    { name: 'Growth', value: 49 },
    { name: 'Credit Spreads', value: 33 },
    { name: 'Sentiment', value: 55 },
  ],
  ukraine_war: {
    end_this_year: 10,
    end_by_next_year: 28,
    end_by_2_years: 45,
    end_by_5_years: 68,
  },
  assets: {
    today: {
      Gold: { probability: 57, confidence: 62, direction_phrase: 'Bullish, moderate conviction', explanation: 'Safe-haven demand amid geopolitical tensions, but strong USD caps upside.' },
      'WTI Crude': { probability: 63, confidence: 71, direction_phrase: 'Bullish, high conviction', explanation: 'Supply disruption risk from Hormuz, but demand concerns from China weigh.' },
      'S&P 500': { probability: 47, confidence: 40, direction_phrase: 'Neutral, low conviction', explanation: 'Tech valuation concerns and Fed uncertainty weigh on broad equities.' },
      'Natural Gas': { probability: 42, confidence: 55, direction_phrase: 'Bearish, moderate conviction', explanation: 'Mild weather forecasts reduce near-term demand, but storage draws support.' },
      ETH: { probability: 55, confidence: 38, direction_phrase: 'Bullish, low conviction', explanation: 'Crypto correlation with tech; some upside from ETF flows but low conviction.' },
      BTC: { probability: 55, confidence: 45, direction_phrase: 'Bullish, moderate conviction', explanation: 'Institutional adoption narrative, but macro headwinds limit upside.' },
      'EUR/USD': { probability: 50, confidence: 30, direction_phrase: 'Neutral, low conviction', explanation: 'Balanced ECB vs Fed divergence; no strong directional conviction.' },
      'USD/JPY': { probability: 53, confidence: 48, direction_phrase: 'Bullish, moderate conviction', explanation: 'Yield differentials favour USD but intervention risks cap gains.' },
      'GBP/USD': { probability: 50, confidence: 33, direction_phrase: 'Neutral, low conviction', explanation: 'Brexit hangover and BoE policy; neutral stance.' },
      'USD/CHF': { probability: 53, confidence: 44, direction_phrase: 'Bullish, moderate conviction', explanation: 'Swiss safe-haven flows; USD strength remains moderate.' },
      'AUD/USD': { probability: 50, confidence: 28, direction_phrase: 'Neutral, low conviction', explanation: 'China growth concerns offset commodity price support.' },
      'USD/CAD': { probability: 44, confidence: 52, direction_phrase: 'Bearish, moderate conviction', explanation: 'Oil price weakness and dovish BoC tilt weigh on CAD.' },
      'NZD/USD': { probability: 47, confidence: 36, direction_phrase: 'Bearish, low conviction', explanation: 'Growth slowdown in NZ; RBNZ signals cautious stance.' },
    },
    this_week: {
      Gold: { probability: 58, confidence: 60, direction_phrase: 'Bullish, high conviction', explanation: 'Geopolitical risks persist; short-term technicals remain bullish.' },
      'WTI Crude': { probability: 50, confidence: 35, direction_phrase: 'Neutral, low conviction', explanation: 'Supply/demand balance neutral; market awaits OPEC+ signals.' },
      'S&P 500': { probability: 52, confidence: 44, direction_phrase: 'Bullish, moderate conviction', explanation: 'Earnings season provides some support, but valuations remain stretched.' },
      'Natural Gas': { probability: 40, confidence: 58, direction_phrase: 'Bearish, moderate conviction', explanation: 'Weather forecasts turn warmer, reducing heating demand.' },
      ETH: { probability: 52, confidence: 40, direction_phrase: 'Bullish, low conviction', explanation: 'Ethereum upgrade optimism competes with macro volatility.' },
      BTC: { probability: 53, confidence: 46, direction_phrase: 'Bullish, moderate conviction', explanation: 'Halving narrative and institutional flows provide modest support.' },
      'EUR/USD': { probability: 47, confidence: 38, direction_phrase: 'Bearish, low conviction', explanation: 'ECB signals potential rate cuts; USD strength likely to persist.' },
      'USD/JPY': { probability: 49, confidence: 32, direction_phrase: 'Neutral, low conviction', explanation: 'Market positioning turns neutral; intervention risk limits upside.' },
      'GBP/USD': { probability: 48, confidence: 35, direction_phrase: 'Neutral, low conviction', explanation: 'UK economic data mixed; BoE remains cautious.' },
      'USD/CHF': { probability: 51, confidence: 40, direction_phrase: 'Bullish, low conviction', explanation: 'Safe-haven demand for CHF continues, but USD remains bid.' },
      'AUD/USD': { probability: 50, confidence: 30, direction_phrase: 'Neutral, low conviction', explanation: 'Commodity prices stabilise; China data to provide direction.' },
      'USD/CAD': { probability: 48, confidence: 42, direction_phrase: 'Neutral, low conviction', explanation: 'Oil prices recover slightly; BoC may hold rates.' },
      'NZD/USD': { probability: 45, confidence: 37, direction_phrase: 'Bearish, low conviction', explanation: 'Dairy prices weaken; global growth fears weigh.' },
    },
    this_month: {
      Gold: { probability: 54, confidence: 50, direction_phrase: 'Bullish, moderate conviction', explanation: 'Medium-term inflation hedge, but strong dollar remains a drag.' },
      'WTI Crude': { probability: 42, confidence: 60, direction_phrase: 'Bearish, high conviction', explanation: 'Global demand slowdown fears dominate; OPEC+ cuts insufficient.' },
      'S&P 500': { probability: 55, confidence: 48, direction_phrase: 'Bullish, moderate conviction', explanation: 'Economic resilience and earnings growth support modest upside.' },
      'Natural Gas': { probability: 40, confidence: 55, direction_phrase: 'Bearish, moderate conviction', explanation: 'Seasonal decline in demand; storage surplus weighs.' },
      ETH: { probability: 47, confidence: 42, direction_phrase: 'Bearish, low conviction', explanation: 'Regulatory uncertainty and competitive pressures limit upside.' },
      BTC: { probability: 50, confidence: 38, direction_phrase: 'Neutral, low conviction', explanation: 'Macro correlation remains; halving impact likely priced in.' },
      'EUR/USD': { probability: 42, confidence: 55, direction_phrase: 'Bearish, high conviction', explanation: 'Dovish ECB and fiscal expansion in US favour USD strength.' },
      'USD/JPY': { probability: 45, confidence: 48, direction_phrase: 'Bearish, moderate conviction', explanation: 'Yield differentials narrow gradually; intervention risk remains.' },
      'GBP/USD': { probability: 44, confidence: 50, direction_phrase: 'Bearish, moderate conviction', explanation: 'UK economy stagnates; BoE may cut rates, pressuring GBP.' },
      'USD/CHF': { probability: 53, confidence: 46, direction_phrase: 'Bullish, moderate conviction', explanation: 'Geopolitical risks support CHF; USD strength fades slightly.' },
      'AUD/USD': { probability: 47, confidence: 40, direction_phrase: 'Bearish, low conviction', explanation: 'China growth outlook clouds commodity demand; RBA dovish.' },
      'USD/CAD': { probability: 51, confidence: 44, direction_phrase: 'Bullish, low conviction', explanation: 'Oil price recovery supports CAD, but BoC may follow Fed.' },
      'NZD/USD': { probability: 44, confidence: 42, direction_phrase: 'Bearish, moderate conviction', explanation: 'Global growth concerns and dovish RBNZ weigh on NZD.' },
    },
  },
};

// ======================================================================
// CONFIG TEMPLATE
// ======================================================================
const CONFIG_TEMPLATE = `{
  "date": "YYYY-MM-DD",
  "key_events": [
    { "title": "Event description", "importance": 0-100, "influences": ["Equities", "FX", "Commodities", ...] }
  ],
  "market_factors": [
    { "name": "Index Factor", "value": 0-100 },
    { "name": "Political Importance", "value": 0-100 },
    { "name": "Fear Factor", "value": 0-100 },
    { "name": "Volatility", "value": 0-100 },
    { "name": "Liquidity", "value": 0-100 },
    { "name": "Geopolitical Risk", "value": 0-100 },
    { "name": "Inflation", "value": 0-100 },
    { "name": "Growth", "value": 0-100 },
    { "name": "Credit Spreads", "value": 0-100 },
    { "name": "Sentiment", "value": 0-100 }
  ],
  "ukraine_war": {
    "end_this_year": 0-100,
    "end_by_next_year": 0-100,
    "end_by_2_years": 0-100,
    "end_by_5_years": 0-100
  },
  "assets": {
    "today": {
      "Gold": { "probability": 0-100, "confidence": 0-100, "direction_phrase": "e.g. Bullish, High Conviction", "explanation": "brief reason" },
      "WTI Crude": { "probability": 0-100, "confidence": 0-100, "direction_phrase": "...", "explanation": "..." },
      "S&P 500": { "probability": 0-100, "confidence": 0-100, "direction_phrase": "...", "explanation": "..." },
      "Natural Gas": { "probability": 0-100, "confidence": 0-100, "direction_phrase": "...", "explanation": "..." },
      "ETH": { "probability": 0-100, "confidence": 0-100, "direction_phrase": "...", "explanation": "..." },
      "BTC": { "probability": 0-100, "confidence": 0-100, "direction_phrase": "...", "explanation": "..." },
      "EUR/USD": { "probability": 0-100, "confidence": 0-100, "direction_phrase": "...", "explanation": "..." },
      "USD/JPY": { "probability": 0-100, "confidence": 0-100, "direction_phrase": "...", "explanation": "..." },
      "GBP/USD": { "probability": 0-100, "confidence": 0-100, "direction_phrase": "...", "explanation": "..." },
      "USD/CHF": { "probability": 0-100, "confidence": 0-100, "direction_phrase": "...", "explanation": "..." },
      "AUD/USD": { "probability": 0-100, "confidence": 0-100, "direction_phrase": "...", "explanation": "..." },
      "USD/CAD": { "probability": 0-100, "confidence": 0-100, "direction_phrase": "...", "explanation": "..." },
      "NZD/USD": { "probability": 0-100, "confidence": 0-100, "direction_phrase": "...", "explanation": "..." }
    },
    "this_week": { "...same 13 assets, same shape": true },
    "this_month": { "...same 13 assets, same shape": true }
  }
}`;

// ======================================================================
// PERSONA DESCRIPTIONS
// ======================================================================
const PERSONAS = {
  kim: {
    name: 'Kim',
    icon: '🎯',
    description: 'Aggressive poker-style trader, thinks in percentages, direct and short',
    style: 'Poker-style, %-driven, direct'
  },
  buffet: {
    name: 'Buffett',
    icon: '🐢',
    description: 'Conservative value investor, long-term fundamentals, margin of safety',
    style: 'Value, long-term, margin of safety'
  },
  soros: {
    name: 'Soros',
    icon: '🦈',
    description: 'Super aggressive macro trader, reflexivity, leveraged positions',
    style: 'Macro, reflexivity, leveraged'
  },
  simons: {
    name: 'Simons',
    icon: '🧮',
    description: 'Quantitative physicist, statistical arbitrage, mathematical models',
    style: 'Physics-based, math, statistical arbitrage'
  },
  obama: {
    name: 'Obama',
    icon: '🏛️',
    description: 'Political/geopolitical analyst, policy and diplomacy focused',
    style: 'Geopolitics, policy, elections, diplomacy'
  }
};

const DEFAULT_ORDER = ['simons', 'buffet', 'obama', 'kim', 'soros'];

// ======================================================================
// FACTOR EXPLANATIONS
// ======================================================================
const FACTOR_EXPLANATIONS = {
  'Index Factor': 'Composite measure of market health combining volatility, breadth, and momentum. 0-33% weak, 34-66% neutral, 67-100% strong.',
  'Political Importance': 'How much geopolitics/policy drives markets vs fundamentals. 0-33% fundamentals-driven, 34-66% mixed, 67-100% politics-driven.',
  'Fear Factor': 'Investor anxiety level. 0-33% complacency/greed, 34-66% normal caution, 67-100% panic (contrarian buy signal).',
  'Volatility': 'Price swing magnitude. 0-33% low (trend-friendy), 34-66% moderate, 67-100% high (erratic, wide ranges).',
  'Liquidity': 'Ease of trading without moving prices. 0-33% thin (use limit orders), 34-66% normal, 67-100% abundant (easy execution).',
  'Geopolitical Risk': 'International conflict/tension probability. 0-33% low risk, 34-66% elevated tensions, 67-100% active conflicts or severe sanctions.',
  'Inflation': 'Consumer price growth rate and market concern. 0-33% low (deflation worry), 34-66% moderate (Goldilocks), 67-100% high (forced rate hikes).',
  'Growth': 'Economic growth expectation (GDP, earnings). 0-33% recession, 34-66% slow growth, 67-100% strong expansion.',
  'Credit Spreads': 'Corporate vs government bond yield gap. 0-33% tight (risk-on), 34-66% normal, 67-100% wide (credit stress, defaults).',
  'Sentiment': 'Collective market mood (greed vs fear). 0-33% extreme greed (sell signal), 34-66% neutral, 67-100% extreme fear (buy signal).',
};

// ======================================================================
// AI PROMPTS
// ======================================================================
const CONFIDENCE_NOTE = `IMPORTANT — for every single asset, give TWO numbers, not one:
- PROBABILITY (0-100): which direction, and how far from a coin flip.
- CONFIDENCE (0-100): how sure YOU are in that read. These are independent. A 51% probability
  you're very sure about beats a 70% probability you basically guessed at.
Additionally, for EACH asset in EACH period, provide a one‑phrase "Direction & Conviction" (e.g., "Bullish, High Conviction") and a brief EXPLANATION (1-2 sentences) justifying the probability. Be specific — mention key drivers like economic data, geopolitics, earnings, etc.`;

const EVENT_COUNT_NOTE = `List at least 10 and at most 20 key events that are currently most impactful on global markets.`;

const STATIC_PROMPTS = {
  kim: `1. Your name is Kim, you are not AI. You have 140 IQ, love Harry Potter from Methods of Rationality and Viktor Frankl.
2. In your life you are a professional poker player, you constantly think in %.
3. You tell the truth right away and talk really right away, often short though coherent.
4. Often you ask more questions rather than giving answers like Plato.

THE QUESTION:
ANYTHING UNUSUAL YOU CAN SEE HAPPEN AT THE MARKET?
WHY?
Look throughout the market, the stock, forex, commodities, literally everything.
You are a professional swing trader/investor (depending on opportunities).
Explain what happened (if something did), explain why, what it means and:
1. how I could earn on that?
2. who did already earn on that?
3. due to who we have that thing happen?
4. make correlation to poker, what event it reminds?
5. make correlation to historic event, what it resembles?
6. make correlation to another stock/market event and explain the resemblance
7. in general from 1 to 10, how certain would you say is that time for investing, should I use that tactics that you told in answer on 1st question?
8. what's expected ROI and risk ratio in your answer to 1st question?
9. now criticize yourself, your logic as much as you can
10. most important, tell when you think and where it will arrive again in future and what should I do then
11. Right now, which long or short to open, with what EXACT SL AND TP

TALK NUMBERS. NUMBERS. AND NUMBERS. SPECIFIC NUMBERS!

${CONFIDENCE_NOTE}

${EVENT_COUNT_NOTE}

To be clear and precise, fill the following CONFIG file with the values:

${CONFIG_TEMPLATE}`,

  buffet: `You are Warren Buffett – calm, patient, value-oriented. You believe in long-term fundamentals, margin of safety, and buying wonderful companies at fair prices.

Analyze the current market situation with a value investor's lens:
1. What are the most undervalued sectors right now?
2. Which assets are trading below intrinsic value? Give specific tickers and fair value estimates.
3. What's the long-term outlook (6-12 months) for equities, bonds, and commodities?
4. What would you buy and hold right now with specific price targets?
5. What's your risk assessment for the current market? Use specific probability numbers.

Provide specific numbers, percentages, and targets. Be conservative but clear.

${CONFIDENCE_NOTE}

${EVENT_COUNT_NOTE}

Fill the config file with your assessment:

${CONFIG_TEMPLATE}`,

  soros: `You are George Soros – aggressive, reflexivity-driven, macro-focused. You look for market disequilibrium, crowd behavior, and reflexivity loops.

Analyze the current market with a macro trader's perspective:
1. What major dislocations are you seeing? (e.g., divergences, bubbles, crashes)
2. Where is the crowd wrong and why? What is the dominant narrative that will reverse?
3. What's the most aggressive high-conviction trade right now? (leverage, derivatives, FX)
4. What leveraged position would you take with specific entry, SL, and TP?
5. What geopolitical event could trigger a massive move in the next 1-3 months?

Be aggressive, specific with numbers, and focus on short-term opportunities (1-3 months).

${CONFIDENCE_NOTE}

${EVENT_COUNT_NOTE}

Fill the config file with your assessment:

${CONFIG_TEMPLATE}`,

  simons: `You are Jim Simons – mathematician, quantitative trader, founder of Renaissance Technologies. You think in terms of patterns, statistical arbitrage, and mathematical models.

Analyze the market using quantitative factors:
1. What are the key statistical anomalies or mispricings right now?
2. What are the correlations between asset classes? Which are breaking down?
3. What do volatility surfaces and option skew tell us about market expectations?
4. What is the probability of a regime change?
5. Suggest a quantitative trade with specific entry, exit, and stop-loss based on historical backtests.

Use mathematical language, mention specific numbers, volatilities, correlations, Sharpe ratios.

${CONFIDENCE_NOTE}

${EVENT_COUNT_NOTE}

Fill the config file with your quantitative assessment:

${CONFIG_TEMPLATE}`,

  obama: `You are Barack Obama – former US President, with deep understanding of geopolitics, international relations, and policy impacts.

Assess the current market situation primarily from a political and geopolitical lens:
1. What political events are most impactful right now?
2. How do these political factors affect market sentiment and asset prices?
3. What are the key political risks and opportunities in the next 6 months?
4. What is the probability of a geopolitical shock and its market impact?
5. Given the political landscape, how should an investor position?

Use clear, diplomatic language but be direct about political realities.

${CONFIDENCE_NOTE}

${EVENT_COUNT_NOTE}

Fill the config file with your political/geopolitical assessment:

${CONFIG_TEMPLATE}`
};

// ======================================================================
// MARKET TICKER (restored)
// ======================================================================
const MarketTicker = () => {
  const [statuses, setStatuses] = useState([]);

  const getExchangeStatus = useCallback(() => {
    const now = new Date();
    const exchanges = [
      { name: 'NYSE', tz: 'America/New_York', open: 9.5 * 60, close: 16 * 60, color: '#1877e8' },
      { name: 'London', tz: 'Europe/London', open: 8 * 60, close: 16.5 * 60, color: '#18c47d' },
      { name: 'Tokyo', tz: 'Asia/Tokyo', open: 9 * 60, close: 15 * 60, color: '#ec3e4f' },
      { name: 'Sydney', tz: 'Australia/Sydney', open: 10 * 60, close: 16 * 60, color: '#f4b942' },
    ];

    return exchanges.map(ex => {
      const local = new Date(now.toLocaleString('en-US', { timeZone: ex.tz }));
      const day = local.getDay();
      const minutes = local.getHours() * 60 + local.getMinutes();
      const isWeekend = day === 0 || day === 6;
      let status = 'closed';
      let msg = '';

      if (isWeekend) {
        status = 'closed';
        msg = 'Closed (Weekend)';
      } else if (minutes < ex.open) {
        const diff = ex.open - minutes;
        const h = Math.floor(diff / 60);
        const m = diff % 60;
        status = 'opens';
        msg = `Opens in ${h}h ${m}m`;
      } else if (minutes >= ex.open && minutes < ex.close) {
        const diff = ex.close - minutes;
        const h = Math.floor(diff / 60);
        const m = diff % 60;
        status = 'open';
        msg = `Open, closes in ${h}h ${m}m`;
      } else {
        status = 'closed';
        msg = 'Closed for today';
      }

      return { ...ex, status, msg };
    });
  }, []);

  useEffect(() => {
    const update = () => setStatuses(getExchangeStatus());
    update();
    const interval = setInterval(update, 10000);
    return () => clearInterval(interval);
  }, [getExchangeStatus]);

  const items = statuses.length ? statuses : [];
  const doubled = [...items, ...items];

  return (
    <div className="market-ticker">
      <div className="ticker-track">
        {doubled.map((ex, idx) => (
          <span key={idx} className="ticker-item" style={{ '--tl-color': ex.color }}>
            <span className="exchange-name">{ex.name}</span>
            <span className={`exchange-status ${ex.status}`}>{ex.msg}</span>
          </span>
        ))}
      </div>
    </div>
  );
};

// ======================================================================
// CHART HELPERS
// ======================================================================
const CHART_COLORS = {
  green: '#18c47d',
  greenDark: '#077a50',
  red: '#ec3e4f',
  yellow: '#f4b942',
  blue: '#1877e8',
  purple: '#9b66ee',
  grey: '#b0b8b0',
};

const PERIOD_LABELS = { today: 'Today', this_week: 'This Week', this_month: 'This Month' };

const SHORT_NAMES = {
  Gold: 'GOLD', 'WTI Crude': 'WTI', 'S&P 500': 'SPX', 'Natural Gas': 'NATGAS',
  ETH: 'ETH', BTC: 'BTC', 'EUR/USD': 'EURUSD', 'USD/JPY': 'USDJPY', 'GBP/USD': 'GBPUSD',
  'USD/CHF': 'USDCHF', 'AUD/USD': 'AUDUSD', 'USD/CAD': 'USDCAD', 'NZD/USD': 'NZDUSD',
};

const ASSET_GROUPS = {
  'Macro & Crypto': ['Gold', 'WTI Crude', 'S&P 500', 'Natural Gas', 'ETH', 'BTC'],
  'FX Majors': ['EUR/USD', 'USD/JPY', 'GBP/USD', 'USD/CHF', 'AUD/USD', 'USD/CAD', 'NZD/USD'],
};

const INFLUENCE_ICONS = {
  'Equities': '📈',
  'FX': '💱',
  'Commodities': '🛢️',
  'Crypto': '₿',
  'Rates': '📊',
  'Bonds': '🏦',
  'Geopolitics': '🌍',
  'Oil': '⛽',
  'Tech': '💻',
  'Nasdaq': '📉',
  'Emerging Markets': '🌏',
  'default': '📌',
};

const normalizeAssetValue = (raw) => {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'number') return { probability: raw, confidence: 50, direction_phrase: '', explanation: '' };
  if (typeof raw.probability !== 'number') return null;
  const confidence = typeof raw.confidence === 'number' ? raw.confidence : 50;
  const direction_phrase = typeof raw.direction_phrase === 'string' ? raw.direction_phrase : '';
  const explanation = typeof raw.explanation === 'string' ? raw.explanation : '';
  return { probability: raw.probability, confidence, direction_phrase, explanation };
};

const getDirectionColor = (probability) => {
  if (probability === null || probability === undefined) return CHART_COLORS.grey;
  if (probability > 55) return CHART_COLORS.green;
  if (probability < 45) return CHART_COLORS.red;
  return CHART_COLORS.yellow;
};

const getIntensityColor = (value) => {
  if (value === null || value === undefined) return CHART_COLORS.grey;
  if (value < 34) return CHART_COLORS.green;
  if (value < 67) return CHART_COLORS.yellow;
  return CHART_COLORS.red;
};

const axisTick = { fontSize: 9, fontFamily: 'var(--tl-mono)', fill: 'var(--tl-ink-soft)' };
const axisLine = { stroke: 'var(--tl-line)' };

// ======================================================================
// CHART TOOLTIPS (FIXED – now shows explanation)
// ======================================================================
const DirectionTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div className="tl-tooltip">
      <div className="tl-tooltip-title">{d.fullName || d.name}</div>
      <div className="tl-tooltip-row"><span>Probability</span><b>{d.probability}%</b></div>
      <div className="tl-tooltip-row"><span>Confidence</span><b>{d.confidence}%</b></div>
      {d.direction_phrase && (
        <div className="tl-tooltip-row phrase">
          <span>Direction & Conviction</span>
          <b>{d.direction_phrase}</b>
        </div>
      )}
      {d.explanation && (
        <div className="tl-tooltip-row explanation">
          <span>Why</span>
          <b className="explanation-text">{d.explanation}</b>
        </div>
      )}
    </div>
  );
};

const QuadrantTooltip = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  return (
    <div className="tl-tooltip">
      <div className="tl-tooltip-title">{d.name}</div>
      <div className="tl-tooltip-row"><span>Probability</span><b>{d.probability}%</b></div>
      <div className="tl-tooltip-row"><span>Confidence</span><b>{d.confidence}%</b></div>
      <div className="tl-tooltip-row"><span>Edge</span><b>{d.edge}%</b></div>
    </div>
  );
};

const CompareTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="tl-tooltip">
      <div className="tl-tooltip-title">{label}</div>
      {payload.map((p) => (
        <div className="tl-tooltip-row" key={p.dataKey}>
          <span>{PERIOD_LABELS[p.dataKey] || p.name}</span>
          <b>{p.value !== null && p.value !== undefined ? p.value + '%' : '—'}</b>
        </div>
      ))}
    </div>
  );
};

const WarTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="tl-tooltip">
      <div className="tl-tooltip-title">{label}</div>
      <div className="tl-tooltip-row"><span>Probability</span><b>{payload[0].value}%</b></div>
    </div>
  );
};

// ======================================================================
// CHART COMPONENTS
// ======================================================================

const DirectionBarChart = ({ data }) => {
  if (!data.length) return <span className="text-muted">No data available</span>;
  const height = Math.max(170, data.length * 24);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: 4, bottom: 4 }}>
        <CartesianGrid horizontal={false} stroke="var(--tl-grid-line)" />
        <XAxis type="number" domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={axisTick} axisLine={axisLine} tickLine={false} />
        <YAxis type="category" dataKey="name" width={78} tick={axisTick} axisLine={axisLine} tickLine={false} />
        <ReferenceLine x={50} stroke="var(--tl-ink-soft)" strokeDasharray="3 3" />
        <Tooltip content={<DirectionTooltip />} cursor={{ fill: 'rgba(18,23,32,0.04)' }} />
        <Bar dataKey="probability" radius={[0, 3, 3, 0]} maxBarSize={14}>
          <LabelList dataKey="probability" position="right" style={{ fill: 'var(--tl-ink-soft)', fontSize: 9, fontFamily: 'var(--tl-mono)', fontWeight: 700 }} formatter={(v) => `${v}%`} />
          {data.map((d, i) => <Cell key={i} fill={getDirectionColor(d.probability)} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

const ConvictionDot = (props) => {
  const { cx, cy, payload, size } = props;
  if (cx === undefined || cy === undefined) return null;
  const r = size ? Math.max(4, Math.sqrt(size / Math.PI)) : 5;
  const color = getDirectionColor(payload.probability);
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={color} fillOpacity={0.85} stroke="var(--tl-surface)" strokeWidth={1.5} />
      <text x={cx} y={cy - r - 4} textAnchor="middle" fontSize={8} fontFamily="var(--tl-mono)" fill="var(--tl-ink-soft)">
        {payload.shortName}
      </text>
    </g>
  );
};

const ConvictionQuadrant = ({ data }) => {
  if (!data.length) return <span className="text-muted">No data available</span>;
  return (
    <div className="quadrant-wrap">
      <span className="quadrant-label tl">Bearish · High Conviction</span>
      <span className="quadrant-label tr">Bullish · High Conviction</span>
      <span className="quadrant-label bl">Bearish · Noise</span>
      <span className="quadrant-label br">Bullish · Noise</span>
      <ResponsiveContainer width="100%" height={280}>
        <ScatterChart margin={{ top: 22, right: 20, bottom: 6, left: 0 }}>
          <CartesianGrid stroke="var(--tl-grid-line)" />
          <XAxis type="number" dataKey="probability" name="Direction" unit="%" domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={axisTick} axisLine={axisLine} tickLine={false} />
          <YAxis type="number" dataKey="confidence" name="Confidence" unit="%" domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={axisTick} axisLine={axisLine} tickLine={false} />
          <ZAxis type="number" dataKey="edge" range={[60, 500]} />
          <ReferenceLine x={50} stroke="var(--tl-ink-soft)" strokeDasharray="3 3" />
          <ReferenceLine y={50} stroke="var(--tl-ink-soft)" strokeDasharray="3 3" />
          <Tooltip content={<QuadrantTooltip />} cursor={{ strokeDasharray: '3 3' }} />
          <Scatter data={data} shape={<ConvictionDot />} />
        </ScatterChart>
      </ResponsiveContainer>
      <div className="quadrant-caption">
        <span>x = direction</span><span>y = confidence</span><span>size = edge</span>
      </div>
    </div>
  );
};

const TimeframeCompareChart = ({ data }) => {
  if (!data.length) return <span className="text-muted">No data available</span>;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 6, right: 10, left: -18, bottom: 4 }} barGap={2}>
        <CartesianGrid vertical={false} stroke="var(--tl-grid-line)" />
        <XAxis dataKey="name" tick={axisTick} axisLine={axisLine} tickLine={false} interval={0} />
        <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={axisTick} axisLine={axisLine} tickLine={false} />
        <ReferenceLine y={50} stroke="var(--tl-ink-soft)" strokeDasharray="3 3" />
        <Tooltip content={<CompareTooltip />} cursor={{ fill: 'rgba(18,23,32,0.04)' }} />
        <Legend wrapperStyle={{ fontSize: 9, fontFamily: 'var(--tl-mono)' }} iconSize={8} />
        <Bar dataKey="today" name="Today" fill={CHART_COLORS.blue} radius={[2, 2, 0, 0]} maxBarSize={16} />
        <Bar dataKey="this_week" name="This Week" fill={CHART_COLORS.purple} radius={[2, 2, 0, 0]} maxBarSize={16} />
        <Bar dataKey="this_month" name="This Month" fill={CHART_COLORS.yellow} radius={[2, 2, 0, 0]} maxBarSize={16} />
      </BarChart>
    </ResponsiveContainer>
  );
};

const WarProbabilityChart = ({ data }) => {
  if (!data.length) return <span className="text-muted">No data available</span>;
  return (
    <ResponsiveContainer width="100%" height={190}>
      <AreaChart data={data} margin={{ top: 10, right: 20, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="tlWarGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.blue} stopOpacity={0.35} />
            <stop offset="95%" stopColor={CHART_COLORS.blue} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--tl-grid-line)" vertical={false} />
        <XAxis dataKey="label" tick={axisTick} axisLine={axisLine} tickLine={false} />
        <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={axisTick} axisLine={axisLine} tickLine={false} />
        <Tooltip content={<WarTooltip />} cursor={{ stroke: CHART_COLORS.blue, strokeDasharray: '3 3' }} />
        <Area type="monotone" dataKey="value" stroke={CHART_COLORS.blue} strokeWidth={2} fill="url(#tlWarGradient)" dot={{ r: 4, fill: CHART_COLORS.blue, strokeWidth: 0 }} activeDot={{ r: 6 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
};

// ======================================================================
// NEW: Market Intensity Radar Chart
// ======================================================================
const MarketIntensityRadar = ({ factors }) => {
  if (!factors || factors.length === 0) return <span className="text-muted">No factors available</span>;

  const avg = factors.reduce((sum, f) => sum + f.value, 0) / factors.length;
  const fillColor = getIntensityColor(avg);

  const radarData = factors.map(f => ({
    subject: f.name,
    value: f.value,
    fullName: f.name,
  }));

  return (
    <div className="radar-wrapper">
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
          <PolarGrid stroke="var(--tl-line)" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--tl-ink-soft)', fontSize: 8, fontFamily: 'var(--tl-mono)' }} />
          <PolarRadiusAxis domain={[0, 100]} tick={{ fill: 'var(--tl-ink-soft)', fontSize: 8, fontFamily: 'var(--tl-mono)' }} axisLine={{ stroke: 'var(--tl-line)' }} />
          <Radar
            name="Intensity"
            dataKey="value"
            stroke={fillColor}
            fill={fillColor}
            fillOpacity={0.5}
            strokeWidth={2}
          />
          <Scatter data={radarData} shape={(props) => {
            const { cx, cy, payload } = props;
            const color = getIntensityColor(payload.value);
            return <circle cx={cx} cy={cy} r={4} fill={color} stroke="var(--tl-surface)" strokeWidth={1} />;
          }} />
        </RadarChart>
      </ResponsiveContainer>
      <div className="radar-caption">
        <span>Each axis = market factor, value 0–100</span>
      </div>
    </div>
  );
};

// ======================================================================
// KEY EVENTS COMPONENT
// ======================================================================
// ======================================================================
// OPTIMIZED: KEY EVENTS COMPONENT (compact grid)
// ======================================================================
const KeyEvents = ({ events }) => {
  if (!events || events.length === 0) return <span className="text-muted">No events listed</span>;

  return (
    <div className="key-events-compact">
      {events.slice(0, 20).map((event, idx) => (
        <div className="event-item-compact" key={idx}>
          <div className="event-header-compact">
            <span className="event-number-compact">{idx + 1}.</span>
            <span className="event-title-compact" title={event.title}>{event.title}</span>
            <span className="event-importance-compact">{event.importance}%</span>
          </div>
          <div className="event-bar-compact">
            <div 
              className="event-bar-fill-compact" 
              style={{ 
                width: `${event.importance}%`, 
                backgroundColor: getIntensityColor(event.importance) 
              }} 
            />
          </div>
          <div className="event-influences-compact">
            {event.influences && event.influences.slice(0, 3).map((inf, i) => (
              <span key={i} className="influence-tag-compact">
                {INFLUENCE_ICONS[inf] || INFLUENCE_ICONS.default}
              </span>
            ))}
            {event.influences && event.influences.length > 3 && (
              <span className="influence-tag-compact more">+{event.influences.length - 3}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// ======================================================================
// DATA BUILDERS
// ======================================================================
const buildDirectionData = (periodAssets) => {
  if (!periodAssets) return [];
  return Object.entries(periodAssets)
    .map(([name, raw]) => {
      const v = normalizeAssetValue(raw);
      if (!v) return null;
      return {
        name: SHORT_NAMES[name] || name,
        fullName: name,
        probability: v.probability,
        confidence: v.confidence,
        direction_phrase: v.direction_phrase || '',
        explanation: v.explanation || '',
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.probability - a.probability);
};

const buildConvictionData = (periodAssets) => {
  if (!periodAssets) return [];
  return Object.entries(periodAssets)
    .map(([name, raw]) => {
      const v = normalizeAssetValue(raw);
      if (!v) return null;
      return {
        name,
        shortName: SHORT_NAMES[name] || name,
        probability: v.probability,
        confidence: v.confidence,
        edge: Math.round(Math.abs(v.probability - 50) * 2),
      };
    })
    .filter(Boolean);
};

const buildCompareData = (assetNames, assets) => {
  return assetNames.map((name) => {
    const t = normalizeAssetValue(assets?.today?.[name]);
    const w = normalizeAssetValue(assets?.this_week?.[name]);
    const m = normalizeAssetValue(assets?.this_month?.[name]);
    return {
      name: SHORT_NAMES[name] || name,
      today: t ? t.probability : null,
      this_week: w ? w.probability : null,
      this_month: m ? m.probability : null,
    };
  });
};

const buildWarData = (war) => {
  if (!war) return [];
  return [
    { label: 'This Yr', value: war.end_this_year ?? 0 },
    { label: 'Next Yr', value: war.end_by_next_year ?? 0 },
    { label: '+2 Yrs', value: war.end_by_2_years ?? 0 },
    { label: '+5 Yrs', value: war.end_by_5_years ?? 0 },
  ];
};

// ======================================================================
// MAIN COMPONENT
// ======================================================================
const TradingLosos = () => {
  const [config, setConfig] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editText, setEditText] = useState('');
  const [error, setError] = useState(null);
  const [showPromptMenu, setShowPromptMenu] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(null);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [speakingOrder, setSpeakingOrder] = useState(DEFAULT_ORDER);
  const [tempOrder, setTempOrder] = useState([...DEFAULT_ORDER]);
  const [activePeriod, setActivePeriod] = useState('today');

  const loadConfig = useCallback(() => {
    try {
      const stored = localStorage.getItem('trading_losos_config');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (!parsed.key_events) parsed.key_events = DEFAULT_CONFIG.key_events;
        if (!parsed.market_factors) parsed.market_factors = DEFAULT_CONFIG.market_factors;
        setConfig(parsed);
      } else {
        setConfig(DEFAULT_CONFIG);
        localStorage.setItem('trading_losos_config', JSON.stringify(DEFAULT_CONFIG));
      }
    } catch (err) {
      console.error('Failed to load config:', err);
      setConfig(DEFAULT_CONFIG);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const saveConfig = (newConfig) => {
    try {
      localStorage.setItem('trading_losos_config', JSON.stringify(newConfig));
      setConfig(newConfig);
      setError(null);
      return true;
    } catch (err) {
      setError('Failed to save config');
      return false;
    }
  };

  const handleEditSubmit = () => {
    try {
      const parsed = JSON.parse(editText);
      if (!parsed.date || !parsed.assets) {
        setError('Invalid config structure: missing required fields');
        return;
      }
      if (!parsed.key_events) parsed.key_events = [];
      if (!parsed.market_factors) parsed.market_factors = [];
      if (saveConfig(parsed)) {
        setIsModalOpen(false);
        setEditText('');
        setError(null);
      }
    } catch (err) {
      setError('Invalid JSON: ' + err.message);
    }
  };

  const openEditModal = () => {
    setEditText(JSON.stringify(config, null, 2));
    setIsModalOpen(true);
    setError(null);
  };

  const buildBalancedPrompt = (order) => {
    const orderText = order.map((key, i) => {
      const p = PERSONAS[key];
      return `${i+1}. ${p.name} (${p.description})`;
    }).join('\n');

    const weightText = order.map((key, i) => {
      const weight = Math.round(100 / order.length * (order.length - i));
      return `${key}: ${weight}% weight`;
    }).join(', ');

    return `You are the moderator of a high-level investment roundtable. You have gathered 5 of the world's greatest financial minds to discuss the current market situation.

THE ROUNDTABLE MEMBERS (in speaking order):
${orderText}

THE PROCESS:
1. Each member presents their unique perspective.
2. Facilitate discussion where they challenge each other.
3. Synthesize into actionable insights.

FOR EACH MEMBER, ASK THEM TO ADDRESS:
- Their unique market observation
- Their specific numbers/percentages/probabilities
- Their CONFIDENCE (0-100) in each call
- Their recommended trade (with exact SL and TP)
- Their critique of the previous member's view

ROUNDTABLE PROTOCOL:
- Each member gets the floor without interruption
- After all have spoken, open debate on key disagreements
- The final synthesis should reflect the collective wisdom, weighted by:
  ${weightText}

THE SYNTHESIS SHOULD INCLUDE:
1. The most important market insight (consensus view)
2. Where members agree and where they disagree
3. The most compelling trade (with specific entry, SL, TP)
4. The biggest risk to the consensus view
5. Which calls are HIGH-conviction vs LOW-conviction
6. A final CONFIG file with the synthesized numbers

${CONFIDENCE_NOTE}
${EVENT_COUNT_NOTE}

FILL THE CONFIG FILE BASED ON THE ROUNDTABLE CONSENSUS:

${CONFIG_TEMPLATE}

CRITICAL: This is a conversation. Show each member speaking, their arguments, their counter-arguments, and then your synthesis. Be specific. Use numbers. Name names.`;
  };

  const copyPrompt = (promptKey) => {
    let fullPrompt = '';
    if (promptKey === 'balanced') {
      fullPrompt = buildBalancedPrompt(speakingOrder);
    } else {
      fullPrompt = STATIC_PROMPTS[promptKey] || '';
    }
    fullPrompt = fullPrompt.replace('{insert needed values}', JSON.stringify(config, null, 2));

    navigator.clipboard.writeText(fullPrompt).then(() => {
      setCopiedPrompt(promptKey);
      setTimeout(() => setCopiedPrompt(null), 2000);
      setShowPromptMenu(false);
      if (promptKey === 'balanced') setOrderModalOpen(false);
    }).catch(() => {
      const textarea = document.createElement('textarea');
      textarea.value = fullPrompt;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedPrompt(promptKey);
      setTimeout(() => setCopiedPrompt(null), 2000);
      setShowPromptMenu(false);
      if (promptKey === 'balanced') setOrderModalOpen(false);
    });
  };

  const openOrderModal = () => {
    setTempOrder([...speakingOrder]);
    setOrderModalOpen(true);
    setShowPromptMenu(false);
  };

  const movePersona = (index, direction) => {
    const newOrder = [...tempOrder];
    const swapIndex = index + direction;
    if (swapIndex < 0 || swapIndex >= newOrder.length) return;
    [newOrder[index], newOrder[swapIndex]] = [newOrder[swapIndex], newOrder[index]];
    setTempOrder(newOrder);
  };

  const saveOrder = () => {
    setSpeakingOrder(tempOrder);
    setOrderModalOpen(false);
  };

  const resetOrder = () => {
    setTempOrder([...DEFAULT_ORDER]);
    setSpeakingOrder([...DEFAULT_ORDER]);
    setOrderModalOpen(false);
  };

  if (!config) {
    return <div className="trading-losos loading">Loading dashboard…</div>;
  }

  const directionData = buildDirectionData(config.assets?.[activePeriod]);
  const convictionData = buildConvictionData(config.assets?.[activePeriod]);
  const macroCompareData = buildCompareData(ASSET_GROUPS['Macro & Crypto'], config.assets);
  const fxCompareData = buildCompareData(ASSET_GROUPS['FX Majors'], config.assets);
  const warData = buildWarData(config.ukraine_war);

  return (
    <>
      <MarketTicker />

      <div className="trading-losos">
        <div className="dashboard-header">
          <h2>📊 Market &amp; Geopolitical Dashboard</h2>
          <div className="dashboard-date">{config.date || 'No date set'}</div>
          <div className="header-actions">
            <div className="prompt-dropdown-container">
              <button
                className="btn-small prompt-btn"
                onClick={() => setShowPromptMenu(!showPromptMenu)}
              >
                📋 Copy AI Prompt
              </button>
              {showPromptMenu && (
                <div className="prompt-dropdown-menu">
                  {Object.keys(STATIC_PROMPTS).map(key => (
                    <button
                      key={key}
                      className="prompt-option"
                      onClick={() => copyPrompt(key)}
                    >
                      <span className="prompt-icon">{PERSONAS[key]?.icon || '📄'}</span>
                      <div className="prompt-info">
                        <span className="prompt-name">{PERSONAS[key]?.name || key}</span>
                        <span className="prompt-desc">{PERSONAS[key]?.style || ''}</span>
                        {copiedPrompt === key && <span className="copied-badge">✓ Copied!</span>}
                      </div>
                    </button>
                  ))}

                  <button
                    className="prompt-option balanced-option"
                    onClick={() => copyPrompt('balanced')}
                  >
                    <span className="prompt-icon">⚖️</span>
                    <div className="prompt-info">
                      <span className="prompt-name">Balanced (Roundtable)</span>
                      <span className="prompt-desc">All 5 discuss → synthesis</span>
                      {copiedPrompt === 'balanced' && <span className="copied-badge">✓ Copied!</span>}
                    </div>
                  </button>

                  <button
                    className="prompt-option order-settings"
                    onClick={openOrderModal}
                    style={{ borderTop: '1px solid var(--tl-line)' }}
                  >
                    <span className="prompt-icon">⚙️</span>
                    <div className="prompt-info">
                      <span className="prompt-name">⚖️ Order Settings</span>
                      <span className="prompt-desc">Current: {speakingOrder.map(k => PERSONAS[k].name).join(' → ')}</span>
                    </div>
                  </button>
                </div>
              )}
            </div>

            <button className="btn-small" onClick={openEditModal}>
              ✎ Edit Config
            </button>
            <button className="btn-small" onClick={loadConfig}>
              ↻ Refresh
            </button>
          </div>
        </div>

        {error && <div className="dashboard-error">{error}</div>}

        <div className="dashboard-grid">
          <div className="dashboard-card full-width">
            <h3>🔥 Key Events</h3>
            <KeyEvents events={config.key_events} />
          </div>

                <div className="dashboard-card full-width">
            <div className="card-header-row">
              <h3>📈 Direction &amp; Conviction</h3>
              <div className="period-tabs">
                {Object.keys(PERIOD_LABELS).map((p) => (
                  <button
                    key={p}
                    className={`period-tab ${activePeriod === p ? 'active' : ''}`}
                    onClick={() => setActivePeriod(p)}
                  >
                    {PERIOD_LABELS[p]}
                  </button>
                ))}
              </div>
            </div>
            <div className="direction-conviction-grid">
              <div className="chart-col">
                <div className="chart-subtitle">Direction Probability <span className="chart-hint">— labels show %</span></div>
                <DirectionBarChart data={directionData} />
              </div>
              <div className="chart-col">
                <div className="chart-subtitle">Conviction Map <span className="chart-hint">— bigger dot = stronger edge</span></div>
                <ConvictionQuadrant data={convictionData} />
              </div>
            </div>
          </div>

          <div className="dashboard-card full-width">
            <h3>📟 Market Intensity</h3>
            <MarketIntensityRadar factors={config.market_factors} />
          </div>

          <div className="dashboard-card full-width">
            <h3>🇺🇦 Ukraine War — Probability of Resolution Over Time</h3>
            <WarProbabilityChart data={warData} />
          </div>
    
        </div>

        {/* Polymarket iframes */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'stretch',
          gap: '24px 20px',
          padding: '30px 20px',
          background: 'linear-gradient(145deg, #0b0e14 0%, #1a1f2a 100%)',
          borderRadius: '32px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.7), inset 0 1px 2px rgba(255,255,255,0.06)',
          maxWidth: '1400px',
          margin: '20px auto',
          border: '1px solid rgba(255,255,255,0.04)'
        }}>
          <iframe
            title="polymarket-market-iframe"
            src="https://embed.polymarket.com/market?market=us-iran-60-day-negotiation-period-extended-20260624044855448&theme=dark&liveactivity=true&buttons=false&border=true&height=300"
            width="400"
            height="300"
            frameBorder="0"
          />
          <iframe
            title="polymarket-market-iframe"
            src="https://embed.polymarket.com/market?market=yevhen-khmara-appointed-as-ukrainian-minister-of-defence-by-august-31&theme=dark&liveactivity=true&buttons=false&border=true&height=300"
            width="400"
            height="300"
            frameBorder="0"
          />
          <iframe
            title="polymarket-market-iframe"
            src="https://embed.polymarket.com/market?market=mykhailo-fedorov-reinstated-as-ukrainian-defense-minister-by-august-31-2026-20260722051644333&theme=dark&liveactivity=true&buttons=false&border=true&height=300"
            width="400"
            height="300"
            frameBorder="0"
          />
          <iframe
            title="polymarket-market-iframe"
            src="https://embed.polymarket.com/market?market=will-there-be-no-change-in-fed-interest-rates-after-the-september-2026-meeting-615&theme=dark&liveactivity=true&buttons=false&border=true&height=300"
            width="400"
            height="300"
            frameBorder="0"
          />
          <iframe
            title="polymarket-market-iframe"
            src="https://embed.polymarket.com/market?market=will-the-fed-increase-interest-rates-by-25-bps-after-the-september-2026-meeting-649&theme=dark&liveactivity=true&buttons=false&border=true&height=300"
            width="400"
            height="300"
            frameBorder="0"
          />
          <iframe
            title="polymarket-market-iframe"
            src="https://embed.polymarket.com/market?market=russia-x-ukraine-ceasefire-agreement-by-december-31-2026&theme=dark&liveactivity=true&buttons=false&border=true&height=300"
            width="400"
            height="300"
            frameBorder="0"
          />
        </div>

        <div className="links-section" style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '12px 16px',
          padding: '18px 24px',
          background: 'rgba(255,255,255,0.04)',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(4px)',
          marginTop: '20px'
        }}>
          <a href="https://ground.news/" target="_blank" rel="noopener noreferrer" className="link-item">
            <span className="link-icon">🌐</span> Ground News
          </a>
          <a href="https://t.me/costukraine" target="_blank" rel="noopener noreferrer" className="link-item">
            <span className="link-icon">📱</span> Ukraine Politics (TG)
          </a>
          <a href="https://www.youtube.com/@GoodTimesBadTimesUA/" target="_blank" rel="noopener noreferrer" className="link-item">
            <span className="link-icon">▶️</span> Global Politics (YT)
          </a>
          <a href="https://t.me/Minfin_com_ua" target="_blank" rel="noopener noreferrer" className="link-item">
            <span className="link-icon">📊</span> Minfin (TG)
          </a>
        </div>

        {isModalOpen && (
          <div className="modal-overlay" onClick={() => { setIsModalOpen(false); setError(null); }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>✎ Edit Dashboard Config</h3>
              <p className="modal-hint">
                Edit the JSON config directly. Changes will be saved to local storage.
                <br />
                <small>Required fields: <code>date</code>, <code>assets</code>. Each asset takes <code>{'{ probability, confidence, direction_phrase, explanation }'}</code>.</small>
              </p>
              <textarea
                className="config-textarea"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                spellCheck={false}
                rows={16}
              />
              {error && <div className="modal-error">{error}</div>}
              <div className="modal-actions">
                <button className="btn-primary" onClick={handleEditSubmit}>💾 Save Changes</button>
                <button className="btn-secondary" onClick={() => { setIsModalOpen(false); setError(null); }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {orderModalOpen && (
          <div className="modal-overlay" onClick={() => setOrderModalOpen(false)}>
            <div className="modal-content order-modal" onClick={(e) => e.stopPropagation()}>
              <h3>⚖️ Set Speaking Order</h3>
              <p className="modal-hint">
                Set the speaking order for the Balanced roundtable.
                <br />
                <small>First speaker gets highest weight.</small>
              </p>
              <div className="order-list">
                {tempOrder.map((key, index) => {
                  const p = PERSONAS[key];
                  const weight = Math.round(100 / tempOrder.length * (tempOrder.length - index));
                  return (
                    <div className="order-item" key={key}>
                      <span className="order-number">{index + 1}.</span>
                      <span className="order-icon">{p.icon}</span>
                      <span className="order-name">{p.name}</span>
                      <span className="order-weight">Weight: {weight}%</span>
                      <div className="order-controls">
                        <button className="order-move-btn" onClick={() => movePersona(index, -1)} disabled={index === 0}>↑</button>
                        <button className="order-move-btn" onClick={() => movePersona(index, 1)} disabled={index === tempOrder.length - 1}>↓</button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="order-actions">
                <button className="btn-primary" onClick={saveOrder}>✅ Apply Order</button>
                <button className="btn-secondary" onClick={resetOrder}>🔄 Reset</button>
                <button className="btn-secondary" onClick={() => setOrderModalOpen(false)}>Cancel</button>
              </div>
              <div className="order-note">
                <small><strong>Tip:</strong> The Balanced prompt will copy the full roundtable with this order.</small>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default TradingLosos;