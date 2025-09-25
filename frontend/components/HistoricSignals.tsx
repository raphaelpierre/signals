import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';

interface HistoricSignal {
  id: number;
  symbol: string;
  direction: string;
  entry_price: number;
  target_price: number;
  stop_loss: number;
  confidence?: number;
  risk_reward_ratio?: number;
  created_at: string;
  strategy?: string;
}

interface PerformanceShowcase {
  period_days: number;
  total_signals: number;
  avg_confidence: number;
  avg_risk_reward: number;
  high_confidence_signals: number;
  high_confidence_percentage: number;
  direction_distribution: {
    long: number;
    short: number;
    long_percentage: number;
    short_percentage: number;
  };
  confidence_distribution: {
    high: number;
    medium: number;
    low: number;
  };
  top_symbols: Array<{
    symbol: string;
    signal_count: number;
    avg_confidence: number;
  }>;
}

interface HistoricSignalsProps {
  showTitle?: boolean;
  maxSignals?: number;
  days?: number;
  demoMode?: boolean;
}

export const HistoricSignals = ({ 
  showTitle = true, 
  maxSignals = 20,
  days = 30,
  demoMode = false 
}) => {
  const [signals, setSignals] = useState<HistoricSignal[]>([]);
  const [performance, setPerformance] = useState<PerformanceShowcase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistoricData();
  }, [days, maxSignals, demoMode]);

  const loadHistoricData = async () => {
    setLoading(true);
    try {
      const [signalsResponse, performanceResponse] = await Promise.all([
        demoMode 
          ? apiClient.get<HistoricSignal[]>('/signals/demo')
          : apiClient.get<HistoricSignal[]>(`/signals/historic?days=${days}&limit=${maxSignals}`),
        apiClient.get<PerformanceShowcase>(`/signals/performance-showcase?days=${days}`)
      ]);
      
      setSignals(signalsResponse.data);
      setPerformance(performanceResponse.data);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load historic signals:', err);
      setError('Unable to load historic signals data');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return price >= 1000 ? price.toFixed(2) : price.toFixed(4);
  };

  const getConfidenceColor = (confidence: number | undefined) => {
    if (!confidence) return '#94a3b8';
    if (confidence >= 80) return '#10b981';
    if (confidence >= 70) return '#f59e0b';
    return '#ef4444';
  };

  const getRiskRewardColor = (ratio: number | undefined) => {
    if (!ratio) return '#94a3b8';
    if (ratio >= 2) return '#10b981';
    if (ratio >= 1.5) return '#f59e0b';
    return '#ef4444';
  };

  const calculatePotentialReturn = (signal: HistoricSignal) => {
    const entry = signal.entry_price;
    const target = signal.target_price;
    const percentage = signal.direction === 'LONG' 
      ? ((target - entry) / entry) * 100
      : ((entry - target) / entry) * 100;
    return percentage;
  };

  if (loading) {
    return (
      <div className="card">
        {showTitle && <h2 style={{ marginTop: 0 }}>📊 Historic Signal Performance</h2>}
        <p>Loading historic signals data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        {showTitle && <h2 style={{ marginTop: 0 }}>📊 Historic Signal Performance</h2>}
        <p style={{ color: '#ef4444' }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Performance Overview */}
      {performance && (
        <div className="card">
          {showTitle && (
            <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>
              {demoMode ? '🎯 Signal Showcase' : '📊 Historic Performance'} 
              <span style={{ fontSize: '1rem', fontWeight: 'normal', opacity: 0.7, marginLeft: '0.5rem' }}>
                ({demoMode ? 'Best Signals' : `Last ${performance.period_days} days`})
              </span>
            </h2>
          )}
          
          {/* Key Metrics */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>
                {performance.total_signals}
              </div>
              <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>Total Signals</div>
            </div>
            
            <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
                {performance.avg_confidence.toFixed(1)}%
              </div>
              <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>Avg Confidence</div>
            </div>
            
            <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
                {performance.avg_risk_reward.toFixed(2)}
              </div>
              <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>Risk/Reward</div>
            </div>
            
            <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '8px' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#8b5cf6' }}>
                {performance.high_confidence_percentage.toFixed(1)}%
              </div>
              <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>High Confidence</div>
            </div>
          </div>

          {/* Direction Distribution */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>Signal Direction Distribution</h4>
            <div style={{ display: 'flex', gap: '2rem' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.875rem' }}>LONG ({performance.direction_distribution.long_percentage}%)</span>
                  <span style={{ fontSize: '0.875rem', color: '#16a34a' }}>{performance.direction_distribution.long}</span>
                </div>
                <div style={{ 
                  height: '8px', 
                  background: 'rgba(255,255,255,0.1)', 
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${performance.direction_distribution.long_percentage}%`,
                    background: '#16a34a',
                    borderRadius: '4px'
                  }} />
                </div>
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.875rem' }}>SHORT ({performance.direction_distribution.short_percentage}%)</span>
                  <span style={{ fontSize: '0.875rem', color: '#dc2626' }}>{performance.direction_distribution.short}</span>
                </div>
                <div style={{ 
                  height: '8px', 
                  background: 'rgba(255,255,255,0.1)', 
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${performance.direction_distribution.short_percentage}%`,
                    background: '#dc2626',
                    borderRadius: '4px'
                  }} />
                </div>
              </div>
            </div>
          </div>

          {/* Top Performing Symbols */}
          {performance.top_symbols.length > 0 && (
            <div>
              <h4 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>🏆 Most Active Trading Pairs</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.5rem' }}>
                {performance.top_symbols.slice(0, 5).map((symbol, index) => (
                  <div key={symbol.symbol} style={{ 
                    padding: '0.75rem',
                    background: index === 0 ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '4px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>{symbol.symbol}</div>
                    <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>
                      {symbol.signal_count} signals • {symbol.avg_confidence.toFixed(0)}% conf
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Historic Signals Table */}
      <div className="card">
        <h3 style={{ marginTop: 0, marginBottom: '1rem' }}>
          {demoMode ? '🎯 Demo Signals - High Quality Examples' : '📈 Recent Historic Signals'}
        </h3>
        <p style={{ marginBottom: '1.5rem', opacity: 0.8 }}>
          {demoMode 
            ? 'Curated selection of our highest confidence signals from recent weeks. These demonstrate the quality and precision of our trading algorithm.'
            : `Past signals from the last ${days} days. All signals shown are at least 24 hours old to demonstrate real-world performance.`
          }
        </p>
        
        {signals.length === 0 ? (
          <p>No historic signals available for the selected period.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Pair</th>
                  <th>Direction</th>
                  <th>Entry</th>
                  <th>Target</th>
                  <th>Stop Loss</th>
                  <th>Potential Return</th>
                  <th>R/R</th>
                  <th>Confidence</th>
                  <th>Generated</th>
                </tr>
              </thead>
              <tbody>
                {signals.map((signal) => {
                  const potentialReturn = calculatePotentialReturn(signal);
                  return (
                    <tr key={signal.id}>
                      <td style={{ fontWeight: 500 }}>{signal.symbol}</td>
                      <td style={{
                        fontWeight: 500,
                        color: signal.direction === 'LONG' ? '#16a34a' : '#dc2626'
                      }}>
                        {signal.direction}
                      </td>
                      <td>${formatPrice(signal.entry_price)}</td>
                      <td>${formatPrice(signal.target_price)}</td>
                      <td>${formatPrice(signal.stop_loss)}</td>
                      <td style={{ 
                        fontWeight: 500,
                        color: potentialReturn > 0 ? '#16a34a' : '#dc2626' 
                      }}>
                        +{potentialReturn.toFixed(2)}%
                      </td>
                      <td style={{ 
                        color: getRiskRewardColor(signal.risk_reward_ratio),
                        fontWeight: 500 
                      }}>
                        {signal.risk_reward_ratio ? signal.risk_reward_ratio.toFixed(2) : 'N/A'}
                      </td>
                      <td style={{ 
                        color: getConfidenceColor(signal.confidence),
                        fontWeight: 500 
                      }}>
                        {signal.confidence ? `${signal.confidence.toFixed(0)}%` : 'N/A'}
                      </td>
                      <td style={{ fontSize: '0.875rem', color: '#4b5563' }}>
                        {new Date(signal.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoricSignals;