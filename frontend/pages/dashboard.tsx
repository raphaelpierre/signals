import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import Layout from '@/components/Layout';
import SignalTable from '@/components/SignalTable';
import { Signal, apiClient, fetchSignals, setAuthToken } from '@/lib/api';

const DashboardPage = () => {
  const router = useRouter();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
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
  }, []);

  const refreshSignals = async () => {
    setLoading(true);
    try {
      setError(null);
      const latestSignals = await fetchSignals();
      setSignals(latestSignals);
    } catch (err) {
      setError('Unable to load signals. Ensure your subscription is active.');
    } finally {
      setLoading(false);
    }
  };

  const triggerBackgroundJob = async () => {
    try {
      await apiClient.post('/signals/refresh');
      await refreshSignals();
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
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Live Signals</h2>
        <p>Monitor algorithmic entries and exits in near real-time. Data updates every hour.</p>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <button className="button" style={{ width: 'auto' }} onClick={refreshSignals} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
          <button
            className="button"
            style={{ width: 'auto', background: '#22d3ee', color: '#0f172a' }}
            onClick={triggerBackgroundJob}
          >
            Generate new signals
          </button>
        </div>
        {error ? <p style={{ color: '#f87171' }}>{error}</p> : null}
        <SignalTable signals={signals} />
      </div>
    </Layout>
  );
};

export default DashboardPage;
