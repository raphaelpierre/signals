import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import Layout from '@/components/Layout';
import ExchangeManager from '@/components/ExchangeManager';
import TradingPositions from '@/components/TradingPositions';
import { setAuthToken } from '@/lib/api';

const LiveTradingPage = () => {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'connections' | 'positions'>('connections');

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      router.replace('/login');
      return;
    }
    setToken(storedToken);
    setAuthToken(storedToken);
  }, []);

  const handleConnectionChange = () => {
    // Refresh positions when connections change
    if (activeTab === 'positions') {
      // Force re-render of TradingPositions component
      setActiveTab('connections');
      setTimeout(() => setActiveTab('positions'), 100);
    }
  };

  if (!token) {
    return (
      <Layout>
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ color: '#94a3b8' }}>Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout token={token}>
      <Head>
        <title>Live Trading | SignalStack</title>
        <meta name="description" content="Execute live trades through your exchange connections using SignalStack signals." />
      </Head>

      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        {/* Header */}
        <div className="card" style={{ 
          textAlign: 'center', 
          marginBottom: '2rem',
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <span style={{ fontSize: '3rem' }}>⚡</span>
          </div>
          <h1 style={{ 
            marginTop: 0, 
            fontSize: '2.5rem', 
            background: 'linear-gradient(135deg, #22d3ee 0%, #0ea5e9 100%)', 
            WebkitBackgroundClip: 'text', 
            WebkitTextFillColor: 'transparent' 
          }}>
            Live Trading
          </h1>
          <p style={{ color: '#cbd5e1', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
            Connect your exchange accounts and execute SignalStack signals automatically. 
            Trade with confidence using institutional-grade market analysis.
          </p>
        </div>

        {/* Tab Navigation */}
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          marginBottom: '2rem',
          borderBottom: '1px solid rgba(148,163,184,0.2)'
        }}>
          <button
            onClick={() => setActiveTab('connections')}
            style={{
              background: 'transparent',
              border: 'none',
              color: activeTab === 'connections' ? '#22d3ee' : '#94a3b8',
              fontSize: '1rem',
              fontWeight: activeTab === 'connections' ? 'bold' : 'normal',
              padding: '1rem 2rem',
              cursor: 'pointer',
              borderBottom: activeTab === 'connections' ? '2px solid #22d3ee' : '2px solid transparent',
              transition: 'all 0.2s'
            }}
          >
            📊 Exchange Connections
          </button>
          <button
            onClick={() => setActiveTab('positions')}
            style={{
              background: 'transparent',
              border: 'none',
              color: activeTab === 'positions' ? '#22d3ee' : '#94a3b8',
              fontSize: '1rem',
              fontWeight: activeTab === 'positions' ? 'bold' : 'normal',
              padding: '1rem 2rem',
              cursor: 'pointer',
              borderBottom: activeTab === 'positions' ? '2px solid #22d3ee' : '2px solid transparent',
              transition: 'all 0.2s'
            }}
          >
            📈 Trading Positions
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'connections' && (
          <div>
            <ExchangeManager onConnectionChange={handleConnectionChange} />
            
            {/* Getting Started Guide */}
            <div style={{
              marginTop: '3rem',
              background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.1) 0%, rgba(15, 23, 42, 0.95) 100%)',
              border: '1px solid rgba(34, 211, 238, 0.3)',
              borderRadius: '12px',
              padding: '2rem'
            }}>
              <h3 style={{ color: '#22d3ee', marginBottom: '1rem' }}>🚀 Getting Started with Live Trading</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                <div>
                  <h4 style={{ color: '#f8fafc', marginBottom: '0.5rem' }}>1. Connect Your Exchange</h4>
                  <p style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
                    Add your exchange API credentials using the form above. We support Binance, Coinbase Pro, 
                    Kraken, and more. Start with sandbox mode to test safely.
                  </p>
                </div>
                <div>
                  <h4 style={{ color: '#f8fafc', marginBottom: '0.5rem' }}>2. Review Signals</h4>
                  <p style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
                    Go to your dashboard to view the latest signals. Each signal includes entry price, 
                    target, stop loss, and confidence score to help you decide.
                  </p>
                </div>
                <div>
                  <h4 style={{ color: '#f8fafc', marginBottom: '0.5rem' }}>3. Execute Trades</h4>
                  <p style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>
                    Click the "Trade Live" button on any signal to execute it through your connected exchange. 
                    Set your position size and monitor from the Positions tab.
                  </p>
                </div>
              </div>

              <div style={{
                marginTop: '1.5rem',
                padding: '1rem',
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '8px'
              }}>
                <div style={{ color: '#f59e0b', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  🔒 Security Best Practices
                </div>
                <ul style={{ color: '#fbbf24', fontSize: '0.9rem', margin: 0, paddingLeft: '1.5rem' }}>
                  <li>Always start with sandbox/testnet mode to verify functionality</li>
                  <li>Use API key restrictions (IP whitelisting) when available</li>
                  <li>Never share your API credentials with anyone</li>
                  <li>Start with small position sizes until you're comfortable</li>
                  <li>Regularly review and rotate your API keys</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'positions' && <TradingPositions />}
      </div>
    </Layout>
  );
};

export default LiveTradingPage;