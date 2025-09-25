import Head from 'next/head';

import Layout from '@/components/Layout';

const PricingPage = () => {
  return (
    <Layout>
      <Head>
        <title>Pricing | SignalStack</title>
      </Head>
      <div className="card" style={{ textAlign: 'center', marginBottom: '3rem', background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <span className="text-5xl mb-4">💰</span>
        </div>
        <h2 style={{ marginTop: 0, fontSize: '2.5rem', background: 'linear-gradient(135deg, #22d3ee 0%, #0ea5e9 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Subscription Plans</h2>
        <p style={{ color: '#cbd5e1', fontSize: '1.1rem' }}>All plans start with a 7-day free trial. Cancel anytime from your billing portal.</p>
      </div>
        <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.1) 0%, rgba(15, 23, 42, 0.95) 100%)',
            border: '2px solid rgba(34, 211, 238, 0.3)',
            borderRadius: '16px',
            padding: '2rem',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <span className="text-xl mr-2">⚡</span>
              <h3 style={{ margin: 0, color: '#22d3ee', fontSize: '1.5rem' }}>Pro Trader</h3>
            </div>
            <p style={{ fontSize: '3rem', margin: '1rem 0', color: '#f8fafc', fontWeight: 'bold' }}>$79<span style={{ fontSize: '1rem', color: '#94a3b8' }}>/mo</span></p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '2rem 0' }}>
              <li style={{ padding: '0.5rem 0', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#10b981' }}>✓</span> Hourly BTC, ETH, and altcoin signals
              </li>
              <li style={{ padding: '0.5rem 0', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#10b981' }}>✓</span> Automated watchlists
              </li>
              <li style={{ padding: '0.5rem 0', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#10b981' }}>✓</span> Priority email alerts
              </li>
            </ul>
            <button className="button" style={{ width: '100%', background: '#22d3ee', color: '#0f172a' }}>
              Start Free Trial
            </button>
          </div>
          <div style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(15, 23, 42, 0.95) 100%)',
            border: '2px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '16px',
            padding: '2rem',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ 
              position: 'absolute',
              top: '-10px',
              right: '20px',
              background: '#f59e0b',
              color: '#0f172a',
              padding: '0.5rem 1rem',
              borderRadius: '0 0 8px 8px',
              fontSize: '0.75rem',
              fontWeight: 'bold'
            }}>
              POPULAR
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <span className="text-xl mr-2">🎯</span>
              <h3 style={{ margin: 0, color: '#f59e0b', fontSize: '1.5rem' }}>Institutional</h3>
            </div>
            <p style={{ fontSize: '3rem', margin: '1rem 0', color: '#f8fafc', fontWeight: 'bold' }}>$199<span style={{ fontSize: '1rem', color: '#94a3b8' }}>/mo</span></p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '2rem 0' }}>
              <li style={{ padding: '0.5rem 0', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#10b981' }}>✓</span> Everything in Pro Trader
              </li>
              <li style={{ padding: '0.5rem 0', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#10b981' }}>✓</span> Dedicated success manager
              </li>
              <li style={{ padding: '0.5rem 0', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#10b981' }}>✓</span> Custom market coverage
              </li>
              <li style={{ padding: '0.5rem 0', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#10b981' }}>✓</span> API access & webhooks
              </li>
            </ul>
            <button className="button" style={{ width: '100%', background: '#f59e0b', color: '#0f172a' }}>
              Contact Sales
            </button>
          </div>
        </div>
    </Layout>
  );
};

export default PricingPage;
