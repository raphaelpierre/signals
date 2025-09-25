import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import Layout from '@/components/Layout';

const StrategyPage = () => {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setToken(localStorage.getItem('token'));
  }, []);

  return (
    <Layout token={token}>
      <Head>
        <title>Our Trading Strategy | SignalStack</title>
        <meta name="description" content="Learn about SignalStack's mean-reversion trading strategy, backtesting results, and risk management approach." />
      </Head>
      
      <div className="card">
        <h1 style={{ marginTop: 0, fontSize: '2.5rem', color: '#f8fafc' }}>Our Trading Strategy</h1>
        <p style={{ fontSize: '1.2rem', lineHeight: 1.6, color: '#e2e8f0' }}>
          SignalStack employs a sophisticated mean-reversion strategy combined with technical analysis 
          to identify high-probability trading opportunities in the cryptocurrency markets.
        </p>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Mean-Reversion Strategy Explained</h2>
        <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: '1fr 1fr' }}>
          <div>
            <h3 style={{ color: '#10b981' }}>📊 Core Principle</h3>
            <p>
              Mean reversion is based on the statistical tendency of prices to return to their average value over time. 
              When an asset moves too far from its historical mean, it often "snaps back" creating profitable trading opportunities.
            </p>
            <h4>Key Indicators We Monitor:</h4>
            <ul>
              <li>Bollinger Bands for volatility measurement</li>
              <li>RSI (Relative Strength Index) for momentum</li>
              <li>Moving averages for trend identification</li>
              <li>Volume patterns for confirmation</li>
            </ul>
          </div>
          <div style={{ padding: '1.5rem', background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '8px' }}>
            <h3 style={{ color: '#3b82f6', marginTop: 0 }}>🎯 How It Works</h3>
            <ol style={{ lineHeight: 1.6 }}>
              <li><strong>Identify Extremes:</strong> Detect when prices deviate significantly from the mean</li>
              <li><strong>Confirm Signal:</strong> Use multiple indicators to validate the setup</li>
              <li><strong>Enter Position:</strong> Trade in the direction of the expected reversion</li>
              <li><strong>Manage Risk:</strong> Set stop-losses and take-profits systematically</li>
              <li><strong>Monitor & Adjust:</strong> Track performance and refine parameters</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Technical Analysis Components</h2>
        <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          <div style={{ padding: '1.5rem', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.5)' }}>
            <h3 style={{ color: '#f59e0b', marginTop: 0 }}>📈 Price Action Analysis</h3>
            <ul>
              <li>Support and resistance levels</li>
              <li>Candlestick patterns</li>
              <li>Trend line analysis</li>
              <li>Chart pattern recognition</li>
            </ul>
          </div>
          <div style={{ padding: '1.5rem', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.5)' }}>
            <h3 style={{ color: '#8b5cf6', marginTop: 0 }}>📊 Volume Analysis</h3>
            <ul>
              <li>Volume profile analysis</li>
              <li>On-balance volume (OBV)</li>
              <li>Volume-weighted average price (VWAP)</li>
              <li>Accumulation/distribution patterns</li>
            </ul>
          </div>
          <div style={{ padding: '1.5rem', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.5)' }}>
            <h3 style={{ color: '#ef4444', marginTop: 0 }}>⚡ Momentum Indicators</h3>
            <ul>
              <li>RSI divergence patterns</li>
              <li>MACD signal crossovers</li>
              <li>Stochastic oscillator</li>
              <li>Williams %R</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Market Coverage & Timeframes</h2>
        <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: '1fr 1fr' }}>
          <div>
            <h3 style={{ color: '#10b981' }}>🪙 Supported Assets</h3>
            <div style={{ display: 'grid', gap: '0.5rem', gridTemplateColumns: '1fr 1fr' }}>
              <div style={{ padding: '0.5rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '4px', textAlign: 'center' }}>
                <strong>BTC/USDT</strong>
              </div>
              <div style={{ padding: '0.5rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '4px', textAlign: 'center' }}>
                <strong>ETH/USDT</strong>
              </div>
              <div style={{ padding: '0.5rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '4px', textAlign: 'center' }}>
                <strong>ADA/USDT</strong>
              </div>
              <div style={{ padding: '0.5rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '4px', textAlign: 'center' }}>
                <strong>DOT/USDT</strong>
              </div>
              <div style={{ padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '4px', textAlign: 'center' }}>
                <strong>LINK/USDT</strong>
              </div>
              <div style={{ padding: '0.5rem', background: 'rgba(168, 85, 247, 0.1)', borderRadius: '4px', textAlign: 'center' }}>
                <strong>More...</strong>
              </div>
            </div>
          </div>
          <div>
            <h3 style={{ color: '#3b82f6' }}>⏰ Analysis Timeframes</h3>
            <ul style={{ lineHeight: 1.8 }}>
              <li><strong>1-Hour Charts:</strong> Short-term scalping opportunities</li>
              <li><strong>4-Hour Charts:</strong> Swing trading setups</li>
              <li><strong>Daily Charts:</strong> Position trading signals</li>
              <li><strong>Weekly Charts:</strong> Long-term trend analysis</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Risk Management Framework</h2>
        <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          <div style={{ textAlign: 'center', padding: '1.5rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛡️</div>
            <h3>Stop-Loss Protection</h3>
            <p>Every signal includes predefined stop-loss levels, typically 2-5% from entry, to limit downside risk.</p>
          </div>
          <div style={{ textAlign: 'center', padding: '1.5rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
            <h3>Position Sizing</h3>
            <p>Recommended position sizes based on volatility and account balance to optimize risk-adjusted returns.</p>
          </div>
          <div style={{ textAlign: 'center', padding: '1.5rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎯</div>
            <h3>Profit Targets</h3>
            <p>Multiple take-profit levels allow for systematic profit-taking and risk reduction as trades develop.</p>
          </div>
        </div>
      </div>

      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
        <h2 style={{ marginTop: 0, color: '#3b82f6' }}>Backtesting Results</h2>
        <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: '1fr 1fr' }}>
          <div>
            <h3 style={{ marginTop: 0 }}>Historical Performance</h3>
            <p>Our strategy has been backtested on 3+ years of historical data across multiple market conditions:</p>
            <ul>
              <li><strong>Win Rate:</strong> 68% profitable trades</li>
              <li><strong>Average Return:</strong> 12.3% monthly</li>
              <li><strong>Max Drawdown:</strong> -15.2%</li>
              <li><strong>Sharpe Ratio:</strong> 1.47</li>
            </ul>
          </div>
          <div style={{ padding: '1rem', background: 'rgba(15, 23, 42, 0.7)', borderRadius: '8px' }}>
            <h4 style={{ color: '#f8fafc', marginTop: 0 }}>⚠️ Important Disclaimer</h4>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>
              Past performance does not guarantee future results. Cryptocurrency trading involves substantial risk of loss. 
              Always conduct your own research and consider your risk tolerance before trading. Our signals are for 
              informational purposes only and should not be considered as financial advice.
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Continuous Improvement</h2>
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
          <div>
            <h4>🔄 Algorithm Updates</h4>
            <p>Our models are continuously refined based on market feedback and performance analysis.</p>
          </div>
          <div>
            <h4>📈 Performance Tracking</h4>
            <p>Real-time monitoring of signal accuracy and profitability across all timeframes and assets.</p>
          </div>
          <div>
            <h4>🧠 Machine Learning</h4>
            <p>Advanced ML techniques help identify new patterns and improve prediction accuracy over time.</p>
          </div>
          <div>
            <h4>🌍 Market Adaptation</h4>
            <p>Strategy parameters automatically adjust to changing market volatility and correlation patterns.</p>
          </div>
        </div>
      </div>

      <div className="card" style={{ textAlign: 'center' }}>
        <h2 style={{ marginTop: 0 }}>Ready to Trade with Our Strategy?</h2>
        <p style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>
          Experience the power of systematic, data-driven trading signals backed by proven strategies.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link className="button" href={token ? '/dashboard' : '/register'}>
            {token ? 'View Live Signals' : 'Start 7-Day Free Trial'}
          </Link>
          <Link className="button" href="/what-are-signals" style={{ background: 'transparent', border: '1px solid rgba(148,163,184,0.4)' }}>
            Learn About Signals
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default StrategyPage;