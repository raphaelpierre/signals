import React, { useState, useEffect } from 'react';
import { fetchSignalStats, SignalStats } from '@/lib/api';

interface SignalsWidgetProps {
  className?: string;
}

const SignalsWidget: React.FC<SignalsWidgetProps> = ({ className = '' }) => {
  const [stats, setStats] = useState<SignalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setError(null);
      setLoading(true);
      const statsData = await fetchSignalStats();
      setStats(statsData);
    } catch (err: any) {
      console.error('Failed to fetch signal stats:', err);
      setError('Failed to load signal statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    const sign = percentage >= 0 ? '+' : '';
    return `${sign}${percentage.toFixed(2)}%`;
  };

  const getPnlColor = (amount: number) => {
    if (amount > 0) return '#16a34a'; // green-600
    if (amount < 0) return '#dc2626'; // red-600
    return '#4b5563'; // gray-600
  };

  if (loading) {
    return (
      <div className={`card ${className}`}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1f2937', marginBottom: '1rem' }}>
          Signal Performance
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {[...Array(6)].map((_, index) => (
            <div key={index} className="bg-gray-100 animate-pulse" style={{ borderRadius: '0.5rem', padding: '1rem' }}>
              <div style={{ height: '1rem', backgroundColor: '#e5e7eb', borderRadius: '0.25rem', width: '5rem', marginBottom: '0.5rem' }}></div>
              <div style={{ height: '1.5rem', backgroundColor: '#e5e7eb', borderRadius: '0.25rem', width: '4rem' }}></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`card ${className}`}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1f2937', marginBottom: '1rem' }}>
          Signal Performance
        </h3>
        <div style={{ textAlign: 'center', padding: '1rem', color: '#dc2626' }}>
          <p>{error}</p>
          <button 
            onClick={fetchStats}
            className="button"
            style={{ width: 'auto', marginTop: '0.5rem', padding: '0.5rem 1rem' }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className={`card ${className}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1f2937', margin: 0 }}>
          Signal Performance
        </h3>
        <button 
          onClick={fetchStats}
          style={{ fontSize: '0.875rem', color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Refresh
        </button>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        {/* Signals Given */}
        <div className="bg-blue-50" style={{ borderRadius: '0.5rem', padding: '1rem' }}>
          <div style={{ fontSize: '0.875rem', color: '#2563eb', fontWeight: 500, marginBottom: '0.25rem' }}>
            Signals Given
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e40af' }}>
            {stats.total_signals_given.toLocaleString()}
          </div>
        </div>

        {/* Signals Taken */}
        <div className="bg-green-50" style={{ borderRadius: '0.5rem', padding: '1rem' }}>
          <div style={{ fontSize: '0.875rem', color: '#16a34a', fontWeight: 500, marginBottom: '0.25rem' }}>
            Signals Taken
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#166534' }}>
            {stats.signals_taken.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#16a34a' }}>
            {stats.total_signals_given > 0 
              ? `${((stats.signals_taken / stats.total_signals_given) * 100).toFixed(1)}% of total`
              : 'N/A'
            }
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        {/* Total P&L */}
        <div className="bg-gray-50" style={{ borderRadius: '0.5rem', padding: '1rem' }}>
          <div style={{ fontSize: '0.875rem', color: '#4b5563', fontWeight: 500, marginBottom: '0.25rem' }}>
            Total P&L
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: getPnlColor(stats.total_pnl) }}>
            {formatCurrency(stats.total_pnl)}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
            Avg: {formatPercentage(stats.avg_pnl_percentage)}
          </div>
        </div>

        {/* Win Rate */}
        <div className="bg-purple-50" style={{ borderRadius: '0.5rem', padding: '1rem' }}>
          <div style={{ fontSize: '0.875rem', color: '#9333ea', fontWeight: 500, marginBottom: '0.25rem' }}>
            Win Rate
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#6b21a8' }}>
            {stats.win_rate.toFixed(1)}%
          </div>
          <div style={{ fontSize: '0.75rem', color: '#9333ea' }}>
            {stats.signals_closed} trades closed
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        {/* Profitable Trades */}
        <div className="bg-green-50" style={{ borderRadius: '0.5rem', padding: '1rem' }}>
          <div style={{ fontSize: '0.875rem', color: '#16a34a', fontWeight: 500, marginBottom: '0.25rem' }}>
            Wins
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#166534' }}>
            {stats.profitable_trades}
          </div>
        </div>

        {/* Losing Trades */}
        <div className="bg-red-50" style={{ borderRadius: '0.5rem', padding: '1rem' }}>
          <div style={{ fontSize: '0.875rem', color: '#dc2626', fontWeight: 500, marginBottom: '0.25rem' }}>
            Losses
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#991b1b' }}>
            {stats.losing_trades}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(148, 163, 184, 0.2)' }}>
        <p style={{ fontSize: '0.75rem', color: '#6b7280', textAlign: 'center', margin: 0 }}>
          Performance data based on tracked signals • Updates in real-time
        </p>
      </div>
    </div>
  );
};

export default SignalsWidget;