import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import Layout from '@/components/Layout';
import EnhancedSignalTable from '@/components/EnhancedSignalTable';
import SignalsWidget from '@/components/SignalsWidget';
import SignalAnalytics from '@/components/SignalAnalytics';
import DashboardStats from '@/components/DashboardStats';
import CoinPriceWidget from '@/components/CoinPriceWidget';
import PriceChart from '@/components/PriceChart';
import VolumeChart from '@/components/VolumeChart';
import SubscriptionStatus from '@/components/SubscriptionStatus';
import { 
  Signal, 
  SignalAnalytics as SignalAnalyticsType,
  apiClient, 
  fetchSignals, 
  fetchSignalAnalytics,
  fetchHighConfidenceSignals,
  setAuthToken 
} from '@/lib/api';

const DashboardPage = () => {
  const router = useRouter();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [highConfidenceSignals, setHighConfidenceSignals] = useState<Signal[]>([]);
  const [analytics, setAnalytics] = useState<SignalAnalyticsType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      router.replace('/login');
      return;
    }
    setToken(storedToken);
    setAuthToken(storedToken);
    refreshSignals();
    loadAnalytics();
  }, []);

  const refreshSignals = async () => {
    setLoading(true);
    try {
      setError(null);
      const [latestSignals, highConfSignals] = await Promise.all([
        fetchSignals(),
        fetchHighConfidenceSignals(75)
      ]);
      setSignals(latestSignals);
      setHighConfidenceSignals(highConfSignals);
    } catch (err) {
      setError('Unable to load signals. Ensure your subscription is active.');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const analyticsData = await fetchSignalAnalytics(7);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const triggerBackgroundJob = async () => {
    try {
      await apiClient.post('/signals/refresh');
      setTimeout(() => {
        refreshSignals();
        loadAnalytics();
      }, 2000); // Wait 2 seconds for job to process
    } catch (err) {
      setError('Unable to queue signal refresh.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setAuthToken(null);
    router.push('/');
  };

  return (
    <Layout token={token} onLogout={handleLogout}>
      <Head>
        <title>Dashboard | SignalStack</title>
      </Head>
      
      {/* Hero Section with Key Stats */}
      <div className="animate-fadeIn" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 700, background: 'linear-gradient(135deg, #22d3ee, #0ea5e9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Trading Dashboard
            </h1>
            <p style={{ margin: '0.5rem 0 0 0', color: '#94a3b8', fontSize: '1.1rem' }}>
              Monitor live signals and market opportunities
            </p>
          </div>
          <SubscriptionStatus />
        </div>
        
        {/* Key Performance Stats */}
        <DashboardStats
          totalSignals={signals.length}
          activeSignals={analytics?.active_signals || 0}
          successRate={analytics?.avg_confidence || 0}
          avgConfidence={analytics?.avg_confidence || 0}
        />
      </div>

      {/* High Confidence Signals - Top Priority */}
      {highConfidenceSignals.length > 0 && (
        <div className="animate-slideInFromLeft" style={{ marginBottom: '2rem' }}>
          <div className="card" style={{ 
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(15, 23, 42, 0.95) 100%)', 
            border: '2px solid rgba(16, 185, 129, 0.4)',
            boxShadow: '0 20px 60px rgba(16, 185, 129, 0.1)' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ 
                background: 'linear-gradient(135deg, #10b981, #059669)', 
                borderRadius: '50%', 
                padding: '0.75rem', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                width: '3rem', 
                height: '3rem',
                boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)'
              }}>
                <span style={{ fontSize: '1.5rem' }}>⭐</span>
              </div>
              <div>
                <h2 style={{ margin: 0, color: '#10b981', fontSize: '1.8rem', fontWeight: 700 }}>
                  High Confidence Signals
                </h2>
                <p style={{ margin: '0.25rem 0 0 0', color: '#94a3b8', fontSize: '0.95rem' }}>
                  Premium signals with confidence scores above 75%
                </p>
              </div>
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto', marginTop: '1rem' }}>
              <EnhancedSignalTable 
                signals={highConfidenceSignals} 
                onSignalTaken={() => {
                  refreshSignals();
                  loadAnalytics();
                }} 
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', 
        gap: '2rem', 
        marginBottom: '2rem'
      }}>
        {/* Left Column - Analytics & Signals */}
        <div className="animate-slideInFromLeft">
          {/* Analytics Overview */}
          <SignalAnalytics analytics={analytics} loading={analyticsLoading} />
          
          {/* Live Signals */}
          <div className="card" style={{ marginTop: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ 
                  background: 'linear-gradient(135deg, #22d3ee, #0ea5e9)', 
                  borderRadius: '50%', 
                  padding: '0.75rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  width: '3rem', 
                  height: '3rem' 
                }}>
                  <span style={{ fontSize: '1.5rem' }}>📊</span>
                </div>
                <div>
                  <h2 style={{ margin: 0, color: '#22d3ee', fontSize: '1.6rem' }}>Live Signals</h2>
                  <p style={{ margin: '0.25rem 0 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
                    Real-time algorithmic trading signals
                  </p>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button 
                  className="button" 
                  style={{ 
                    width: 'auto', 
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    background: loading ? 'rgba(148, 163, 184, 0.3)' : 'linear-gradient(135deg, #22d3ee, #0ea5e9)'
                  }} 
                  onClick={refreshSignals} 
                  disabled={loading}
                >
                  {loading ? 'Refreshing…' : '🔄 Refresh'}
                </button>
                <button
                  className="button"
                  style={{ 
                    width: 'auto', 
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
                  }}
                  onClick={triggerBackgroundJob}
                  disabled={loading}
                >
                  ⚡ Generate
                </button>
              </div>
            </div>
            
            {error && (
              <div style={{ 
                background: 'rgba(239, 68, 68, 0.1)', 
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1rem',
                color: '#f87171'
              }}>
                {error}
              </div>
            )}
            
            <EnhancedSignalTable 
              signals={signals} 
              onSignalTaken={() => {
                refreshSignals();
                loadAnalytics();
              }} 
            />
          </div>
        </div>
        
        {/* Right Column - Widgets & Quick Actions */}
        <div className="animate-slideInFromRight" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Quick Widgets */}
          <SignalsWidget />
          <CoinPriceWidget />
          
          {/* Live Trading CTA */}
          <div className="card" style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(15, 23, 42, 0.95) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            textAlign: 'center'
          }}>
            <div style={{ 
              background: 'linear-gradient(135deg, #10b981, #059669)', 
              borderRadius: '50%', 
              padding: '1rem', 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              width: '4rem', 
              height: '4rem',
              marginBottom: '1rem'
            }}>
              <span style={{ fontSize: '2rem' }}>⚡</span>
            </div>
            <h3 style={{ color: '#10b981', margin: '0 0 1rem 0', fontSize: '1.4rem' }}>
              Ready for Live Trading?
            </h3>
            <p style={{ color: '#cbd5e1', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
              Connect your exchange accounts to execute signals automatically with real money.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                className="button"
                onClick={() => router.push('/live-trading')}
                style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#ffffff' }}
              >
                📊 Manage Exchanges
              </button>
              <button
                className="button"
                onClick={() => router.push('/live-trading')}
                style={{ background: 'linear-gradient(135deg, #22d3ee, #0ea5e9)', color: '#0f172a' }}
              >
                📈 View Positions
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="animate-fadeIn" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', 
        gap: '2rem'
      }}>
        <div className="card">
          <h3 style={{ margin: '0 0 1.5rem 0', color: '#f8fafc', fontSize: '1.4rem', display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '0.5rem' }}>₿</span>
            Bitcoin Analysis
          </h3>
          <PriceChart symbol="BTCUSDT" height={350} />
          <div style={{ marginTop: '1rem' }}>
            <VolumeChart symbol="BTCUSDT" height={120} />
          </div>
        </div>
        
        <div className="card">
          <h3 style={{ margin: '0 0 1.5rem 0', color: '#f8fafc', fontSize: '1.4rem', display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '0.5rem' }}>Ξ</span>
            Ethereum Analysis
          </h3>
          <PriceChart symbol="ETHUSDT" height={350} />
        </div>
      </div>
    </Layout>
  );
};

export default DashboardPage;
