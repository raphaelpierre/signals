import { useEffect, useState } from 'react';
import Head from 'next/head';
import Layout from '@/components/Layout';
import HistoricSignals from '@/components/HistoricSignals';

const HistoricSignalsPage = () => {
  const [viewMode, setViewMode] = useState<'historic' | 'demo'>('demo');
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setToken(localStorage.getItem('token'));
  }, []);

  return (
    <Layout token={token}>
      <Head>
        <title>Historic Signals | SignalStack Performance History</title>
        <meta name="description" content="View SignalStack's historic trading signals and performance metrics. See our track record of high-confidence cryptocurrency trading opportunities." />
      </Head>
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        {/* Header Section */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
            📊 Signal Performance History
          </h1>
          <p style={{ 
            fontSize: '1.125rem', 
            lineHeight: '1.8',
            maxWidth: '800px',
            margin: '0 auto',
            opacity: 0.9
          }}>
            Explore the track record of SignalStack's advanced trading signals. 
            Our algorithm analyzes multiple technical indicators to identify high-probability 
            trading opportunities across major cryptocurrency pairs.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          marginBottom: '2rem',
          gap: '1rem'
        }}>
          <button
            onClick={() => setViewMode('demo')}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: 'none',
              background: viewMode === 'demo' ? '#3b82f6' : 'rgba(255,255,255,0.1)',
              color: viewMode === 'demo' ? 'white' : '#d1d5db',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
          >
            🎯 Demo Signals
          </button>
          <button
            onClick={() => setViewMode('historic')}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: 'none',
              background: viewMode === 'historic' ? '#3b82f6' : 'rgba(255,255,255,0.1)',
              color: viewMode === 'historic' ? 'white' : '#d1d5db',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500',
              transition: 'all 0.2s'
            }}
          >
            📈 All Historic Signals
          </button>
        </div>

        {/* Key Features Highlight */}
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎯</div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>High Confidence Signals</h3>
              <p style={{ opacity: 0.8, lineHeight: '1.6' }}>
                Our algorithm filters for signals with 60%+ confidence, ensuring only 
                high-quality trading opportunities reach our subscribers.
              </p>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚡</div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Multi-Indicator Analysis</h3>
              <p style={{ opacity: 0.8, lineHeight: '1.6' }}>
                Combines RSI, MACD, Bollinger Bands, volume analysis, and ATR-based 
                risk management for comprehensive market assessment.
              </p>
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Risk Management</h3>
              <p style={{ opacity: 0.8, lineHeight: '1.6' }}>
                Every signal includes precise entry, target, and stop-loss levels 
                with minimum 1.2:1 risk-reward ratios.
              </p>
            </div>
          </div>
        </div>

        {/* Historic Signals Component */}
        <HistoricSignals 
          showTitle={false}
          maxSignals={viewMode === 'demo' ? 10 : 30}
          days={viewMode === 'demo' ? 90 : 30}
          demoMode={viewMode === 'demo'}
        />

        {/* Call to Action */}
        <div className="card" style={{ 
          textAlign: 'center', 
          marginTop: '3rem',
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1))',
          border: '1px solid rgba(59, 130, 246, 0.2)'
        }}>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>
            Ready to Start Receiving Live Signals?
          </h2>
          <p style={{ 
            fontSize: '1.125rem', 
            marginBottom: '2rem',
            opacity: 0.9,
            maxWidth: '600px',
            margin: '0 auto 2rem'
          }}>
            Join thousands of traders who rely on SignalStack for profitable crypto trading opportunities. 
            Get real-time signals delivered directly to your dashboard.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a 
              href="/pricing" 
              style={{ 
                display: 'inline-block',
                padding: '1rem 2rem',
                background: '#3b82f6',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '1.1rem',
                transition: 'transform 0.2s'
              }}
              onMouseOver={(e) => {
                const target = e.target as HTMLElement;
                target.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={(e) => {
                const target = e.target as HTMLElement;
                target.style.transform = 'translateY(0)';
              }}
            >
              View Pricing Plans
            </a>
            <a 
              href="/register" 
              style={{ 
                display: 'inline-block',
                padding: '1rem 2rem',
                background: 'rgba(255,255,255,0.1)',
                color: '#d1d5db',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: '500',
                fontSize: '1.1rem',
                border: '1px solid rgba(255,255,255,0.2)',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                const target = e.target as HTMLElement;
                target.style.background = 'rgba(255,255,255,0.2)';
                target.style.color = 'white';
              }}
              onMouseOut={(e) => {
                const target = e.target as HTMLElement;
                target.style.background = 'rgba(255,255,255,0.1)';
                target.style.color = '#d1d5db';
              }}
            >
              Start Free Trial
            </a>
          </div>
        </div>

        {/* Disclaimer */}
        <div style={{ 
          marginTop: '2rem', 
          padding: '1rem',
          background: 'rgba(245, 158, 11, 0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(245, 158, 11, 0.2)'
        }}>
          <p style={{ fontSize: '0.875rem', opacity: 0.8, textAlign: 'center', margin: 0 }}>
            ⚠️ <strong>Risk Disclaimer:</strong> Cryptocurrency trading involves substantial risk and is not suitable for all investors. 
            Past performance does not guarantee future results. Never invest more than you can afford to lose.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default HistoricSignalsPage;