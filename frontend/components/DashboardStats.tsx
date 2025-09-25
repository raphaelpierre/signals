import React from 'react';
import { TradingChartIcon, AnalyticsIcon, TargetIcon, SignalWaveIcon } from './Icons';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  gradient: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, change, changeType, icon, gradient }) => {
  const changeColor = {
    positive: '#10b981',
    negative: '#ef4444',
    neutral: '#6b7280'
  };

  return (
    <div style={{
      background: gradient,
      border: '1px solid rgba(148,163,184,0.2)',
      borderRadius: '12px',
      padding: '1.5rem',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.875rem', fontWeight: 500 }}>{title}</p>
          <p style={{ margin: '0.5rem 0 0 0', color: '#f8fafc', fontSize: '2rem', fontWeight: 700, lineHeight: 1 }}>
            {value}
          </p>
          {change && (
            <p style={{ margin: '0.5rem 0 0 0', color: changeColor[changeType || 'neutral'], fontSize: '0.875rem', fontWeight: 500 }}>
              {changeType === 'positive' && '↗'} 
              {changeType === 'negative' && '↘'} 
              {change}
            </p>
          )}
        </div>
        <div style={{ opacity: 0.7 }}>
          {icon}
        </div>
      </div>
    </div>
  );
};

interface DashboardStatsProps {
  totalSignals?: number;
  activeSignals?: number;
  successRate?: number;
  avgConfidence?: number;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  totalSignals = 0,
  activeSignals = 0,
  successRate = 0,
  avgConfidence = 0
}) => {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1.5rem',
      marginBottom: '2rem'
    }}>
      <StatCard
        title="Total Signals"
        value={totalSignals}
        change="+12 this week"
        changeType="positive"
        icon={<SignalWaveIcon size={32} color="#22d3ee" />}
        gradient="linear-gradient(135deg, rgba(34, 211, 238, 0.1) 0%, rgba(15, 23, 42, 0.9) 100%)"
      />
      
      <StatCard
        title="Active Signals"
        value={activeSignals}
        change="Live now"
        changeType="neutral"
        icon={<TradingChartIcon size={32} color="#10b981" />}
        gradient="linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(15, 23, 42, 0.9) 100%)"
      />
      
      <StatCard
        title="Success Rate"
        value={`${successRate.toFixed(1)}%`}
        change="+2.4% vs last month"
        changeType="positive"
        icon={<TargetIcon size={32} color="#f59e0b" />}
        gradient="linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(15, 23, 42, 0.9) 100%)"
      />
      
      <StatCard
        title="Avg Confidence"
        value={`${avgConfidence.toFixed(1)}%`}
        change="High precision"
        changeType="positive"
        icon={<AnalyticsIcon size={32} color="#8b5cf6" />}
        gradient="linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(15, 23, 42, 0.9) 100%)"
      />
    </div>
  );
};

export default DashboardStats;