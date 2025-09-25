import React from 'react';
import { TradingChartIcon, SignalWaveIcon, AnalyticsIcon, CryptoCoinIcon, ShieldIcon, LightningIcon, TargetIcon } from './Icons';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient?: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, gradient }) => (
  <div className="card" style={{ 
    background: gradient || 'rgba(15, 23, 42, 0.8)',
    border: '1px solid rgba(148,163,184,0.2)',
    borderRadius: '12px',
    padding: '2rem',
    textAlign: 'center',
    transition: 'all 0.3s ease',
    cursor: 'pointer'
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = 'translateY(-4px)';
    e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.2)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = 'none';
  }}
  >
    <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
      {icon}
    </div>
    <h3 style={{ margin: '0 0 1rem 0', color: '#f8fafc', fontSize: '1.25rem' }}>{title}</h3>
    <p style={{ margin: 0, color: '#cbd5e1', fontSize: '0.95rem', lineHeight: 1.6 }}>
      {description}
    </p>
  </div>
);

export const VisualFeatureShowcase: React.FC = () => {
  return (
    <div style={{ margin: '3rem 0' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '3rem', fontSize: '2.5rem', color: '#f8fafc' }}>
        Why Choose SignalStack?
      </h2>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '2rem',
        marginBottom: '3rem'
      }}>
        <FeatureCard
          icon={<SignalWaveIcon size={48} color="#22d3ee" />}
          title="AI-Powered Signals"
          description="Advanced algorithms analyze market patterns and generate high-confidence trading signals with detailed risk metrics."
          gradient="linear-gradient(135deg, rgba(34, 211, 238, 0.1) 0%, rgba(15, 23, 42, 0.8) 100%)"
        />
        
        <FeatureCard
          icon={<LightningIcon size={48} color="#f59e0b" />}
          title="Real-Time Updates"
          description="Get instant notifications when new signals are generated. Never miss a trading opportunity with our lightning-fast delivery."
          gradient="linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(15, 23, 42, 0.8) 100%)"
        />
        
        <FeatureCard
          icon={<AnalyticsIcon size={48} color="#10b981" />}
          title="Advanced Analytics"
          description="Comprehensive performance tracking with detailed metrics, success rates, and portfolio insights to optimize your strategy."
          gradient="linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(15, 23, 42, 0.8) 100%)"
        />
        
        <FeatureCard
          icon={<ShieldIcon size={48} color="#8b5cf6" />}
          title="Enterprise Security"
          description="Bank-level security with JWT authentication, encrypted data transmission, and secure payment processing via Stripe."
          gradient="linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(15, 23, 42, 0.8) 100%)"
        />
        
        <FeatureCard
          icon={<CryptoCoinIcon size={48} color="#ef4444" />}
          title="Multi-Asset Coverage"
          description="Track Bitcoin, Ethereum, and top altcoins with automated watchlists and customizable trading pair selection."
          gradient="linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(15, 23, 42, 0.8) 100%)"
        />
        
        <FeatureCard
          icon={<TargetIcon size={48} color="#06b6d4" />}
          title="Precision Targeting"
          description="Each signal includes entry points, target prices, and stop-loss levels with calculated risk-reward ratios for informed decisions."
          gradient="linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(15, 23, 42, 0.8) 100%)"
        />
      </div>
    </div>
  );
};

export default VisualFeatureShowcase;