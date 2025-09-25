import Head from 'next/head';

import Layout from '@/components/Layout';

const PricingPage = () => {
  return (
    <Layout>
      <Head>
        <title>Pricing | SignalStack</title>
      </Head>
      <div className="card">
        <h2 style={{ marginTop: 0 }}>Subscription plans</h2>
        <p>All plans start with a 7-day free trial. Cancel anytime from your billing portal.</p>
        <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
          <div className="card">
            <h3>Pro Trader</h3>
            <p style={{ fontSize: '2rem', margin: '0.5rem 0' }}>$79/mo</p>
            <ul>
              <li>Hourly BTC, ETH, and altcoin signals</li>
              <li>Automated watchlists</li>
              <li>Priority email alerts</li>
            </ul>
          </div>
          <div className="card">
            <h3>Institutional</h3>
            <p style={{ fontSize: '2rem', margin: '0.5rem 0' }}>$199/mo</p>
            <ul>
              <li>Everything in Pro Trader</li>
              <li>Dedicated success manager</li>
              <li>Custom market coverage</li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PricingPage;
