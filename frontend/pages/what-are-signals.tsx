import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import Layout from '@/components/Layout';

const WhatAreSignalsPage = () => {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setToken(localStorage.getItem('token'));
  }, []);

  return (
    <Layout token={token}>
      <Head>
        <title>What are Trading Signals? | SignalStack</title>
        <meta name="description" content="Learn about crypto trading signals, how they work, and how SignalStack helps traders make informed decisions." />
      </Head>
      
      <div className="card">
        <h1 style={{ marginTop: 0, fontSize: '2.5rem', color: '#f8fafc' }}>What are Trading Signals?</h1>
        <p style={{ fontSize: '1.2rem', lineHeight: 1.6, color: '#e2e8f0' }}>
          Trading signals are actionable insights that tell you when to buy, sell, or hold a cryptocurrency. 
          Think of them as your experienced trading partner who never sleeps, constantly monitoring the markets 
          and alerting you to profitable opportunities.
        </p>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>How Trading Signals Work</h2>
        <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          <div style={{ padding: '1.5rem', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.5)' }}>
            <h3 style={{ color: '#10b981', marginTop: 0 }}>📊 Market Analysis</h3>
            <p>Our algorithms analyze price movements, volume patterns, technical indicators, and market sentiment across multiple timeframes to identify trading opportunities.</p>
          </div>
          <div style={{ padding: '1.5rem', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.5)' }}>
            <h3 style={{ color: '#3b82f6', marginTop: 0 }}>⚡ Real-Time Alerts</h3>
            <p>When a profitable setup is detected, you receive instant notifications with clear entry points, price targets, and stop-loss levels.</p>
          </div>
          <div style={{ padding: '1.5rem', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.5)' }}>
            <h3 style={{ color: '#f59e0b', marginTop: 0 }}>🎯 Action Steps</h3>
            <p>Each signal includes specific instructions: which coin to trade, at what price to enter, when to take profits, and where to set your stop-loss.</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>What's Included in Each Signal</h2>
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📈</div>
            <h3>Trading Pair</h3>
            <p>Which cryptocurrency to trade (e.g., BTC/USDT, ETH/USDT)</p>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔄</div>
            <h3>Direction</h3>
            <p>Whether to buy (long) or sell (short) the asset</p>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💰</div>
            <h3>Entry Price</h3>
            <p>The optimal price point to enter the trade</p>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎯</div>
            <h3>Target Price</h3>
            <p>Where to take profits and close the position</p>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🛡️</div>
            <h3>Stop Loss</h3>
            <p>Risk management level to limit potential losses</p>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏰</div>
            <h3>Timeframe</h3>
            <p>Expected duration for the trade to reach targets</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Benefits of Using Trading Signals</h2>
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
          <ul style={{ lineHeight: 1.8, margin: 0 }}>
            <li><strong>Save Time:</strong> No need to analyze charts for hours daily</li>
            <li><strong>Reduce Emotions:</strong> Follow data-driven decisions, not gut feelings</li>
            <li><strong>Learn While Trading:</strong> Understand market patterns over time</li>
            <li><strong>24/7 Monitoring:</strong> Never miss opportunities while you sleep</li>
          </ul>
          <ul style={{ lineHeight: 1.8, margin: 0 }}>
            <li><strong>Risk Management:</strong> Built-in stop-losses protect your capital</li>
            <li><strong>Consistent Strategy:</strong> Systematic approach to trading</li>
            <li><strong>Backtested Results:</strong> Strategies proven on historical data</li>
            <li><strong>Multi-Asset Coverage:</strong> Diversify across top cryptocurrencies</li>
          </ul>
        </div>
      </div>

      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
        <h2 style={{ marginTop: 0, color: '#10b981' }}>Who Should Use Trading Signals?</h2>
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
          <div>
            <h4 style={{ color: '#f8fafc' }}>🚀 New Traders</h4>
            <p>Learn from proven strategies while building your trading skills and confidence.</p>
          </div>
          <div>
            <h4 style={{ color: '#f8fafc' }}>⏰ Busy Professionals</h4>
            <p>Trade effectively without spending hours analyzing charts and market data.</p>
          </div>
          <div>
            <h4 style={{ color: '#f8fafc' }}>📊 Experienced Traders</h4>
            <p>Supplement your analysis with additional insights and market opportunities.</p>
          </div>
          <div>
            <h4 style={{ color: '#f8fafc' }}>💼 Portfolio Managers</h4>
            <p>Scale your decision-making with systematic, data-driven trading signals.</p>
          </div>
        </div>
      </div>

      <div className="card" style={{ textAlign: 'center' }}>
        <h2 style={{ marginTop: 0 }}>Ready to Start Trading with Signals?</h2>
        <p style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>
          Join thousands of traders who use SignalStack to make informed trading decisions and grow their portfolios.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link className="button" href={token ? '/dashboard' : '/register'}>
            {token ? 'View Live Signals' : 'Start Free Trial'}
          </Link>
          <Link className="button" href="/strategy" style={{ background: 'transparent', border: '1px solid rgba(148,163,184,0.4)' }}>
            Learn Our Strategy
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default WhatAreSignalsPage;