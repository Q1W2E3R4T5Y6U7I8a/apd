import React, { useMemo, useState } from 'react';

const TradingLososPolymarket = () => {
  const [copied, setCopied] = useState('');

  const today = new Date();
  const effectiveDate = useMemo(() => {
    const d = new Date();
    if (d.getDate() >= 27) d.setMonth(d.getMonth() + 1);
    return d;
  }, []);

  const month = effectiveDate.toLocaleString('en-US', { month: 'long' }).toLowerCase();
  const year = effectiveDate.getFullYear();

  const copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
    } catch {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopied(label);
      } catch {
        setCopied('Copy failed');
      }
    } finally {
      setTimeout(() => setCopied(''), 1200);
    }
  };

  const makeSrc = (item) => {
    const value = typeof item.value === 'function' ? item.value() : item.value;
    const key = item.type === 'event' ? 'event' : 'market';
    const rotate = item.type === 'event' ? '&rotate=true' : '';
    const buttons = item.buttons === false ? '' : '&buttons=true';
    return `https://embed.polymarket.com/market?${key}=${encodeURIComponent(
      value
    )}${rotate}&theme=dark&liveactivity=true${buttons}&border=true&height=300`;
  };

  const makeVisibleLink = (item) => {
    const value = typeof item.value === 'function' ? item.value() : item.value;
    const key = item.type === 'event' ? 'event' : 'market';
    return `https://embed.polymarket.com/market?${key}=${encodeURIComponent(value)}`;
  };

  const roundtablePrompt = (link) => `You are the moderator of a high-level investment roundtable. You have gathered 5 of the world's greatest financial minds to discuss the current market situation.

RIGHT NOW U DISCUSS ${link}

THE ROUNDTABLE MEMBERS (in speaking order):
1. Simons (Quantitative physicist, statistical arbitrage, mathematical models)
2. Buffett (Conservative value investor, long-term fundamentals, margin of safety)
3. Obama (Political/geopolitical analyst, policy and diplomacy focused)
4. Kim (Aggressive poker-style trader, thinks in percentages, direct and short)
5. Soros (Super aggressive macro trader, reflexivity, leveraged positions)

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
- The final synthesis should reflect the collective wisdom, weighted by default:
  simons: 100% weight, buffet: 80% weight, obama: 60% weight, kim: 40% weight, soros: 20% weight. BUT IN CASES WHERE POLYTICS IS MORE IMPORTANT, OBVIOUSLY WEIGHT OF OBAMA CHANGES AND FOR EXAMPLE IF WE TALK CRYPTO, WE LISTEN BUFFET LAST ETC.

THE SYNTHESIS SHOULD INCLUDE:
1. The most important market insight (consensus view)
2. Where members agree and where they disagree
3. The most compelling trade (with specific entry, SL, TP)
4. The biggest risk to the consensus view
5. What market % sd shd be, at what point description

CRITICAL: This is a conversation. Show each member speaking, their arguments, their counter-arguments, and then your synthesis. Be specific. Use numbers. Name names.
You must not look to the link itself and bias your concusion based on seeing real data from polymarket, u decide as if u can get data from everywhere EXCEPT polymarket and similar platforms`;

  const markets = {
    globalPolitics: [
      { type: 'market', value: 'us-iran-60-day-negotiation-period-extended-20260624044855448' },
      { type: 'market', value: 'will-the-us-invade-iran-before-2027' },
      { type: 'market', value: 'will-china-invade-taiwan-by-december-31-2027' },
      { type: 'market', value: 'netanyahu-out-before-2027-684-719-226-657' },
    ],
    rawCommodities: [
      { bg: '#1e1e1e', type: 'event', value: () => `what-price-will-wti-hit-in-${month}-${year}` },
      { bg: '#1d3a1d', type: 'event', value: () => `what-price-will-ng-hit-in-${month}-${year}` },
      { bg: '#b8860b', type: 'event', value: () => `what-price-will-xauusd-hit-in-${month}-${year}` },
      { bg: '#8a8f9a', type: 'event', value: () => `what-price-will-xagusd-hit-in-${month}-${year}` },
    ],
    economic: [
      { type: 'market', value: 'will-there-be-no-change-in-fed-interest-rates-after-the-september-2026-meeting-615' },
      { type: 'market', value: 'will-the-fed-increase-interest-rates-by-25-bps-after-the-september-2026-meeting-649' },
      { type: 'event', value: () => `what-price-will-spy-hit-in-${month}-${year}` },
      { type: 'event', value: () => `ecb-interest-rates-${month}-${year}` },
    ],
    ukrainian: [
      { type: 'market', value: 'yevhen-khmara-appointed-as-ukrainian-minister-of-defence-by-august-31' },
      { type: 'market', value: 'mykhailo-fedorov-reinstated-as-ukrainian-defense-minister-by-august-31-2026-20260722051644333' },
      { type: 'market', value: 'russia-x-ukraine-ceasefire-agreement-by-december-31-2026' },
      { type: 'event', value: 'putin-out-before-2027' },
    ],
    crypto: [
      { type: 'event', value: () => `what-price-will-bitcoin-hit-in-${month}-${year}` },
      { type: 'event', value: () => `what-price-will-ethereum-hit-in-${month}-${year}` },
    ],
  };

  const Card = ({ item, bg }) => {
    const src = makeSrc(item);
    return (
      <div
        style={{
          background: bg || 'transparent',
          borderRadius: '16px',
          padding: '8px',
          flex: '1 1 320px',
          minWidth: '320px',
          maxWidth: '400px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginBottom: '8px' }}>
          <button
            type="button"
            onClick={() => copyToClipboard(makeVisibleLink(item), 'Market link copied')}
            title="Copy market link"
            style={iconBtnStyle}
          >
            🔗
          </button>
          <button
            type="button"
            onClick={() => copyToClipboard(roundtablePrompt(makeVisibleLink(item)), 'Prompt copied')}
            title="Copy roundtable prompt"
            style={iconBtnStyle}
          >
            🧠
          </button>
        </div>

        <iframe
          title="polymarket-market-iframe"
          src={src}
          width="100%"
          height="300"
          frameBorder="0"
          style={{ borderRadius: '12px', display: 'block' }}
        />
      </div>
    );
  };

  const wrap = {
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
    border: '1px solid rgba(255,255,255,0.04)',
  };

  const sectionStyle = { width: '100%', marginBottom: '10px' };
  const rowStyle = {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: '20px',
    justifyContent: 'center',
    overflowX: 'auto',
    width: '100%',
    paddingBottom: '6px',
  };

  const iconBtnStyle = {
    width: '34px',
    height: '34px',
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.06)',
    color: 'white',
    cursor: 'pointer',
    fontSize: '16px',
    lineHeight: '1',
  };

  return (
    <div style={wrap}>
      {copied ? (
        <div style={{ width: '100%', color: 'white', textAlign: 'center', opacity: 0.85 }}>
          {copied}
        </div>
      ) : null}

      <div style={sectionStyle}>
        <h3 style={headingStyle}>🌍 GLOBAL POLITICS</h3>
        <div style={rowStyle}>
          {markets.globalPolitics.map((item, i) => (
            <Card key={i} item={item} />
          ))}
        </div>
      </div>

      <div style={sectionStyle}>
        <h3 style={headingStyle}>🛢️ RAW COMMODITIES</h3>
        <div style={rowStyle}>
          {markets.rawCommodities.map((item, i) => (
            <Card key={i} item={item} bg={item.bg} />
          ))}
        </div>
      </div>

      <div style={sectionStyle}>
        <h3 style={headingStyle}>📊 ECONOMIC FACTORS</h3>
        <div style={rowStyle}>
          {markets.economic.map((item, i) => (
            <Card key={i} item={item} />
          ))}
        </div>
      </div>

      <div style={sectionStyle}>
        <h3 style={headingStyle}>🇺🇦 UKRAINIAN POLITICS & WAR</h3>
        <div style={rowStyle}>
          {markets.ukrainian.map((item, i) => (
            <Card key={i} item={item} />
          ))}
        </div>
      </div>

      <div style={sectionStyle}>
        <h3 style={headingStyle}>₿ CRYPTO</h3>
        <div style={rowStyle}>
          {markets.crypto.map((item, i) => (
            <Card key={i} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
};

const headingStyle = {
  color: 'rgba(255,255,255,0.6)',
  fontSize: '14px',
  fontWeight: '500',
  letterSpacing: '0.5px',
  textTransform: 'uppercase',
  marginBottom: '16px',
  paddingLeft: '6px',
};

export default TradingLososPolymarket;
