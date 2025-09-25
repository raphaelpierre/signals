import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchPerformanceShowcase, PerformanceShowcase } from '@/lib/api';

const PerformanceShowcaseWidget = () => {
  const [performance, setPerformance] = useState<PerformanceShowcase | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPerformance();
  }, []);

  const loadPerformance = async () => {
    try {
      const data = await fetchPerformanceShowcase(30);
      setPerformance(data);
    } catch (error) {
      console.error('Failed to load performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <h3>📊 Performance Showcase</h3>
        <p>Loading performance data...</p>
      </div>
    );
  }

  if (!performance) {
    return (
      <div className="card">
        <h3>📊 Performance Showcase</h3>
        <p>Performance data temporarily unavailable</p>
      </div>
    );
  }

  return (
    <div className="card" style={{
      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1))',
      border: '1px solid rgba(59, 130, 246, 0.2)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: 0 }}>📊 30-Day Performance</h3>
        <Link 
          href="/historic-signals" 
          style={{ 
            color: '#3b82f6', 
            textDecoration: 'none',
            fontSize: '0.875rem',
            fontWeight: 500
          }}
        >
          View All Historic Signals →
        </Link>
      </div>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
        gap: '1rem',
        marginBottom: '1rem'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>
            {performance.total_signals}
          </div>
          <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>Total Signals</div>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
            {performance.avg_confidence.toFixed(0)}%
          </div>
          <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>Avg Confidence</div>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
            {performance.avg_risk_reward.toFixed(1)}
          </div>
          <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>Risk/Reward</div>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#8b5cf6' }}>
            {performance.high_confidence_percentage.toFixed(0)}%
          </div>
          <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>High Quality</div>
        </div>
      </div>

      {performance.top_symbols.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <div style={{ fontSize: '0.875rem', opacity: 0.8, marginBottom: '0.5rem' }}>
            🏆 Most Active Pairs: {performance.top_symbols.slice(0, 3).map(s => s.symbol).join(', ')}
          </div>
        </div>
      )}

      <div style={{ 
        marginTop: '1rem', 
        padding: '0.75rem',
        background: 'rgba(59, 130, 246, 0.1)',
        borderRadius: '6px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
          <strong>Signal Distribution:</strong> {performance.direction_distribution.long_percentage.toFixed(0)}% Long • {performance.direction_distribution.short_percentage.toFixed(0)}% Short
        </div>
        <Link 
          href="/historic-signals"
          style={{
            display: 'inline-block',
            padding: '0.5rem 1rem',
            background: '#3b82f6',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}
        >
          Explore Full History
        </Link>
      </div>
    </div>
  );
};

export default PerformanceShowcaseWidget;