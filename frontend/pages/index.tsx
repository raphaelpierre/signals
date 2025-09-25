import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import Layout from '@/components/Layout';
import Logo from '@/components/Logo';
import PerformanceShowcaseWidget from '@/components/PerformanceShowcaseWidget';

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
      <div className="card" style={{ textAlign: 'center', background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)', border: '1px solid rgba(148,163,184,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <Logo variant="icon" size="large" />
        </div>
        <h1 style={{ marginTop: 0, fontSize: '2.5rem', background: 'linear-gradient(135deg, #22d3ee 0%, #0ea5e9 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Build confidence in your crypto trades.
        </h1>
        <p style={{ fontSize: '1.1rem', lineHeight: 1.6, color: '#cbd5e1', maxWidth: '600px', margin: '0 auto 2rem' }}>
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
            href="/what-are-signals"
          >
            Learn about signals
          </Link>
        </div>
      </div>
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '2rem' }}>📊</span>
          <h2 style={{ marginTop: 0 }}>Why traders choose SignalStack</h2>
        </div>
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{ color: '#10b981', fontSize: '1.5rem' }}>📊</div>
            <div>
              <strong style={{ color: '#f8fafc' }}>Market coverage</strong> across BTC, ETH, and top altcoins with automated watchlists.
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{ color: '#22d3ee', fontSize: '1.5rem' }}>🔒</div>
            <div>
              <strong style={{ color: '#f8fafc' }}>FastAPI backend</strong> secured by Stripe subscriptions and JWT authentication.
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{ color: '#f59e0b', fontSize: '1.5rem' }}>⚡</div>
            <div>
              <strong style={{ color: '#f8fafc' }}>High-frequency signals</strong> powered by Redis workers and CCXT market data.
            </div>
          </div>
        </div>
      </div>
      
      {/* Performance Showcase for non-authenticated users */}
      {!token && <PerformanceShowcaseWidget />}
      
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Learn More</h2>
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
          <Link href="/what-are-signals" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ padding: '1.5rem', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.5)', transition: 'all 0.2s' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📊</div>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#10b981' }}>What are Signals?</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>Learn how trading signals work and why they're essential for successful crypto trading.</p>
            </div>
          </Link>
          <Link href="/strategy" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ padding: '1.5rem', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.5)', transition: 'all 0.2s' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎯</div>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#3b82f6' }}>Our Strategy</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>Discover our mean-reversion approach and the technology behind our trading signals.</p>
            </div>
          </Link>
          <Link href="/about" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div style={{ padding: '1.5rem', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '8px', background: 'rgba(15, 23, 42, 0.5)', transition: 'all 0.2s' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏢</div>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#f59e0b' }}>About Us</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.8 }}>Learn about our mission, technology stack, and what makes SignalStack unique.</p>
            </div>
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default HomePage;
