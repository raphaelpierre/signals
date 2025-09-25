import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import Layout from '@/components/Layout';
import EnhancedSignalTable from '@/components/EnhancedSignalTable';
import SignalsWidget from '@/components/SignalsWidget';
import SignalAnalytics from '@/components/SignalAnalytics';
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
      
      {/* Subscription Status */}
      <SubscriptionStatus />
      
      {/* Analytics and Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem', marginBottom: '2rem' }}>
        <div>
          <SignalAnalytics analytics={analytics} loading={analyticsLoading} />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <SignalsWidget />
          <CoinPriceWidget />
        </div>
      </div>

      {/* High Confidence Signals */}
      {highConfidenceSignals.length > 0 && (
        <div className="card" style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(15, 23, 42, 0.9) 100%)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: '50%', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '2.5rem', height: '2.5rem' }}>
              <span style={{ fontSize: '1.2rem' }}>📈</span>
            </div>
            <h2 style={{ marginTop: 0, color: '#10b981', fontSize: '1.5rem' }}>⭐ High Confidence Signals (75%+)</h2>
          </div>
          <p style={{ color: '#cbd5e1' }}>Premium signals with confidence scores above 75%. These represent the strongest trading opportunities.</p>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <EnhancedSignalTable 
              signals={highConfidenceSignals} 
              onSignalTaken={() => {
                refreshSignals();
                loadAnalytics();
              }} 
            />
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem', marginBottom: '2rem' }}>
        <div>
          <PriceChart symbol="BTCUSDT" height={400} className="mb-4" />
          <VolumeChart symbol="BTCUSDT" height={150} />
        </div>
        
        <div>
          <PriceChart symbol="ETHUSDT" height={300} className="mb-4" />
        </div>
      </div>

      {/* Signals Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem', marginBottom: '2rem' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ background: 'linear-gradient(135deg, #22d3ee, #0ea5e9)', borderRadius: '50%', padding: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '2.5rem', height: '2.5rem' }}>
              <span style={{ fontSize: '1.2rem' }}>📊</span>
            </div>
            <h2 style={{ marginTop: 0, color: '#22d3ee' }}>Live Signals</h2>
          </div>
          <p style={{ color: '#cbd5e1' }}>Monitor algorithmic entries and exits in near real-time. Data updates every hour.</p>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <button className="button" style={{ width: 'auto' }} onClick={refreshSignals} disabled={loading}>
              {loading ? 'Refreshing…' : 'Refresh Signals'}
            </button>
            <button
              className="button"
              style={{ width: 'auto', background: '#22d3ee', color: '#0f172a' }}
              onClick={triggerBackgroundJob}
              disabled={loading}
            >
              Generate New Signals
            </button>
            <button
              className="button"
              style={{ width: 'auto', background: '#8b5cf6', color: '#ffffff' }}
              onClick={loadAnalytics}
              disabled={analyticsLoading}
            >
              {analyticsLoading ? 'Loading Analytics...' : 'Refresh Analytics'}
            </button>
            <button
              className="button"
              style={{ width: 'auto', background: '#10b981', color: '#ffffff' }}
              onClick={() => router.push('/live-trading')}
            >
              ⚡ Live Trading
            </button>
          </div>
          {error ? <p style={{ color: '#f87171' }}>{error}</p> : null}
          <EnhancedSignalTable signals={signals} onSignalTaken={() => {
            refreshSignals();
            loadAnalytics();
          }} />
          
          {/* Quick Live Trading Section */}
          <div style={{
            marginTop: '2rem',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(15, 23, 42, 0.95) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '12px',
            padding: '1.5rem'
          }}>
            <h3 style={{ color: '#10b981', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '0.5rem' }}>⚡</span>
              Ready for Live Trading?
            </h3>
            <p style={{ color: '#cbd5e1', marginBottom: '1rem' }}>
              Connect your exchange accounts to execute these signals automatically with real money.
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                className="button"
                onClick={() => router.push('/live-trading')}
                style={{ background: '#10b981', color: '#ffffff' }}
              >
                📊 Manage Exchanges
              </button>
              <button
                className="button"
                onClick={() => router.push('/live-trading')}
                style={{ background: '#22d3ee', color: '#0f172a' }}
              >
                📈 View Positions
              </button>
            </div>
          </div>
        </div>
        
        <div>
          {/* Additional charts for other symbols */}
          <PriceChart symbol="ETHUSDT" height={300} className="mb-4" />
        </div>
      </div>
    </Layout>
  );
};

export default DashboardPage;
