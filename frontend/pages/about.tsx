import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import Layout from '@/components/Layout';

const AboutPage = () => {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setToken(localStorage.getItem('token'));
  }, []);

  return (
    <Layout token={token}>
      <Head>
        <title>About SignalStack | Crypto Trading Signals Platform</title>
        <meta name="description" content="Learn about SignalStack's mission, technology, and how we help traders succeed in cryptocurrency markets." />
      </Head>
      
      <div className="card">
        <h1 style={{ marginTop: 0, fontSize: '2.5rem', color: '#f8fafc' }}>About SignalStack</h1>
        <p style={{ fontSize: '1.2rem', lineHeight: 1.6, color: '#e2e8f0' }}>
          SignalStack is a cutting-edge platform that democratizes professional-grade crypto trading insights. 
          We combine advanced algorithms, real-time market data, and proven trading strategies to help both 
          novice and experienced traders navigate the volatile cryptocurrency markets with confidence.
        </p>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Our Mission</h2>
        <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: '1fr 2fr' }}>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎯</div>
            <h3 style={{ color: '#10b981' }}>Empowering Traders</h3>
          </div>
          <div>
            <p style={{ fontSize: '1.1rem', lineHeight: 1.7 }}>
              We believe that sophisticated trading tools shouldn't be exclusive to Wall Street institutions. 
              Our mission is to level the playing field by providing retail traders with the same caliber 
              of analysis and insights that professional fund managers use to generate consistent returns.
            </p>
            <p style={{ fontSize: '1.1rem', lineHeight: 1.7 }}>
              Through cutting-edge technology and transparent methodologies, we're building a community of 
              informed traders who can capitalize on market opportunities while managing risk effectively.
            </p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>What Sets Us Apart</h2>
        <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          <div style={{ padding: '1.5rem', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.05)' }}>
            <h3 style={{ color: '#10b981', marginTop: 0 }}>🏗️ Institutional-Grade Technology</h3>
            <p>Built with FastAPI, PostgreSQL, and Redis for enterprise-level performance and reliability. Our infrastructure scales to handle thousands of concurrent users and real-time market data processing.</p>
          </div>
          <div style={{ padding: '1.5rem', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.05)' }}>
            <h3 style={{ color: '#3b82f6', marginTop: 0 }}>📊 Data-Driven Approach</h3>
            <p>Every signal is generated from rigorous analysis of historical patterns, technical indicators, and market microstructure. We use CCXT for real-time data from major exchanges worldwide.</p>
          </div>
          <div style={{ padding: '1.5rem', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.05)' }}>
            <h3 style={{ color: '#f59e0b', marginTop: 0 }}>🔄 Continuous Innovation</h3>
            <p>Our algorithms continuously learn and adapt to changing market conditions. Regular backtesting and performance analysis ensure our strategies remain effective over time.</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Platform Features</h2>
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚡</div>
            <h4>Real-Time Signals</h4>
            <p>Instant notifications when profitable opportunities arise across major crypto pairs.</p>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📈</div>
            <h4>Interactive Charts</h4>
            <p>Advanced charting tools with technical indicators and signal overlay functionality.</p>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🎯</div>
            <h4>Portfolio Tracking</h4>
            <p>Monitor your trading performance and analyze signal effectiveness over time.</p>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔐</div>
            <h4>Secure Access</h4>
            <p>Enterprise-grade security with JWT authentication and encrypted data transmission.</p>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>💳</div>
            <h4>Flexible Billing</h4>
            <p>Stripe-powered subscriptions with easy upgrades, downgrades, and cancellation.</p>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📱</div>
            <h4>Mobile Optimized</h4>
            <p>Responsive design ensures full functionality across desktop, tablet, and mobile devices.</p>
          </div>
        </div>
      </div>

      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
        <h2 style={{ marginTop: 0, color: '#8b5cf6' }}>Our Technology Stack</h2>
        <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
          <div style={{ textAlign: 'center' }}>
            <h4 style={{ color: '#f8fafc', marginBottom: '0.5rem' }}>Frontend</h4>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
              <div>Next.js 14</div>
              <div>React 18</div>
              <div>TypeScript</div>
              <div>Chart.js</div>
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <h4 style={{ color: '#f8fafc', marginBottom: '0.5rem' }}>Backend</h4>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
              <div>FastAPI</div>
              <div>SQLAlchemy</div>
              <div>Pydantic</div>
              <div>JWT Authentication</div>
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <h4 style={{ color: '#f8fafc', marginBottom: '0.5rem' }}>Database</h4>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
              <div>PostgreSQL 15</div>
              <div>Redis 7</div>
              <div>Connection Pooling</div>
              <div>Query Optimization</div>
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <h4 style={{ color: '#f8fafc', marginBottom: '0.5rem' }}>Infrastructure</h4>
            <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
              <div>Docker Containers</div>
              <div>RQ Worker Queues</div>
              <div>CCXT Market Data</div>
              <div>Stripe Payments</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Security & Reliability</h2>
        <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: '1fr 1fr' }}>
          <div>
            <h3 style={{ color: '#ef4444' }}>🔒 Data Protection</h3>
            <ul style={{ lineHeight: 1.6 }}>
              <li>End-to-end encryption for all sensitive data</li>
              <li>Secure JWT token-based authentication</li>
              <li>Regular security audits and penetration testing</li>
              <li>GDPR-compliant data handling practices</li>
            </ul>
          </div>
          <div>
            <h3 style={{ color: '#10b981' }}>⚡ High Availability</h3>
            <ul style={{ lineHeight: 1.6 }}>
              <li>99.9% uptime SLA with redundant infrastructure</li>
              <li>Real-time monitoring and alerting systems</li>
              <li>Automated backups and disaster recovery</li>
              <li>Load balancing for peak traffic handling</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginTop: 0 }}>Community & Support</h2>
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
          <div style={{ textAlign: 'center', padding: '1.5rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
            <h4>Active Community</h4>
            <p>Join thousands of traders sharing insights, strategies, and market analysis in our community forums.</p>
          </div>
          <div style={{ textAlign: 'center', padding: '1.5rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎓</div>
            <h4>Educational Resources</h4>
            <p>Access comprehensive guides, tutorials, and market analysis to improve your trading skills.</p>
          </div>
          <div style={{ textAlign: 'center', padding: '1.5rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💬</div>
            <h4>24/7 Support</h4>
            <p>Our dedicated support team is available around the clock to help with any questions or issues.</p>
          </div>
        </div>
      </div>

      <div className="card" style={{ textAlign: 'center' }}>
        <h2 style={{ marginTop: 0 }}>Ready to Join the SignalStack Community?</h2>
        <p style={{ fontSize: '1.1rem', marginBottom: '2rem' }}>
          Start your journey towards smarter, data-driven cryptocurrency trading today.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link className="button" href={token ? '/dashboard' : '/register'}>
            {token ? 'Go to Dashboard' : 'Start Free 7-Day Trial'}
          </Link>
          <Link className="button" href="/pricing" style={{ background: 'transparent', border: '1px solid rgba(148,163,184,0.4)' }}>
            View Pricing Plans
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default AboutPage;