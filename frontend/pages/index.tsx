import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import Layout from '@/components/Layout';

const HomePage = () => {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setToken(localStorage.getItem('token'));
  }, []);

  return (
    <Layout token={token}>
      <Head>
        <title>SignalStack | Crypto Trading Signals</title>
      </Head>
      <div className="card">
        <h1 style={{ marginTop: 0, fontSize: '2.5rem' }}>Build confidence in your crypto trades.</h1>
        <p style={{ fontSize: '1.1rem', lineHeight: 1.6 }}>
          SignalStack delivers actionable, backtested signals sourced from institutional-grade market data. Stay ahead of
          the market with automated alerts, portfolio monitoring, and simple risk controls.
        </p>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link className="button" style={{ textAlign: 'center' }} href={token ? '/dashboard' : '/register'}>
            {token ? 'Go to dashboard' : 'Start free trial'}
          </Link>
          <Link
            className="button"
            style={{ textAlign: 'center', background: 'transparent', border: '1px solid rgba(148,163,184,0.4)', color: '#f8fafc' }}
            href="/pricing"
          >
            View pricing
          </Link>
        </div>
      </div>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Why traders choose SignalStack</h2>
        <ul style={{ lineHeight: 1.8 }}>
          <li>Market coverage across BTC, ETH, and top altcoins with automated watchlists.</li>
          <li>FastAPI backend secured by Stripe subscriptions and JWT authentication.</li>
          <li>High-frequency signal generation powered by Redis workers and CCXT market data.</li>
        </ul>
      </div>
    </Layout>
  );
};

export default HomePage;
