import React from 'react';

interface SignalAnalyticsData {
  total_signals: number;
  active_signals: number;
  long_signals: number;
  short_signals: number;
  avg_confidence: number;
  avg_risk_reward: number;
  top_performing_pairs: Array<{
    symbol: string;
    signal_count: number;
    avg_confidence: number;
  }>;
}

interface SignalAnalyticsProps {
  analytics: SignalAnalyticsData | null;
  loading: boolean;
}

export const SignalAnalytics: React.FC<SignalAnalyticsProps> = ({ analytics, loading }) => {
  if (loading) {
    return (
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Signal Analytics</h3>
        <p>Loading analytics...</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Signal Analytics</h3>
        <p>Analytics data unavailable</p>
      </div>
    );
  }

  const longPercentage = analytics.total_signals > 0 
    ? (analytics.long_signals / analytics.total_signals * 100).toFixed(1)
    : "0";
  
  const shortPercentage = analytics.total_signals > 0
    ? (analytics.short_signals / analytics.total_signals * 100).toFixed(1)
    : "0";

  return (
    <div className="card">
      <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>📊 Signal Analytics (7 Days)</h3>
      
      {/* Key Metrics Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
        gap: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>
            {analytics.total_signals}
          </div>
          <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>Total Signals</div>
        </div>
        
        <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
            {analytics.active_signals}
          </div>
          <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>Active</div>
        </div>
        
        <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
            {analytics.avg_confidence.toFixed(1)}%
          </div>
          <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>Avg Confidence</div>
        </div>
        
        <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '8px' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#8b5cf6' }}>
            {analytics.avg_risk_reward.toFixed(2)}
          </div>
          <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>Risk/Reward</div>
        </div>
      </div>

      {/* Long vs Short Distribution */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h4 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>Signal Direction Distribution</h4>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.875rem' }}>LONG ({longPercentage}%)</span>
              <span style={{ fontSize: '0.875rem', color: '#16a34a' }}>{analytics.long_signals}</span>
            </div>
            <div style={{ 
              height: '8px', 
              background: 'rgba(255,255,255,0.1)', 
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{ 
                height: '100%', 
                width: `${longPercentage}%`,
                background: '#16a34a',
                borderRadius: '4px'
              }} />
            </div>
          </div>
          
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '0.875rem' }}>SHORT ({shortPercentage}%)</span>
              <span style={{ fontSize: '0.875rem', color: '#dc2626' }}>{analytics.short_signals}</span>
            </div>
            <div style={{ 
              height: '8px', 
              background: 'rgba(255,255,255,0.1)', 
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{ 
                height: '100%', 
                width: `${shortPercentage}%`,
                background: '#dc2626',
                borderRadius: '4px'
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* Top Performing Pairs */}
      {analytics.top_performing_pairs.length > 0 && (
        <div>
          <h4 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>🏆 Most Active Pairs</h4>
          <div style={{ fontSize: '0.875rem' }}>
            {analytics.top_performing_pairs.map((pair, index) => (
              <div key={pair.symbol} style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.5rem',
                marginBottom: '0.25rem',
                background: index === 0 ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                borderRadius: '4px'
              }}>
                <span style={{ fontWeight: index === 0 ? 'bold' : 'normal' }}>
                  {index + 1}. {pair.symbol}
                </span>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <span style={{ color: '#10b981' }}>{pair.signal_count} signals</span>
                  <span style={{ color: '#f59e0b' }}>{pair.avg_confidence.toFixed(1)}% conf</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SignalAnalytics;