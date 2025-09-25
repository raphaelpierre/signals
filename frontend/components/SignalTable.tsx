import { useState } from 'react';
import { Signal } from '@/lib/api';
import LiveTrading from '@/components/LiveTrading';

interface SignalTableProps {
  signals: Signal[];
  showLiveTrading?: boolean;
}

export const SignalTable = ({ signals, showLiveTrading = false }: SignalTableProps) => {
  const [expandedSignal, setExpandedSignal] = useState<number | null>(null);

  if (!signals.length) {
    return <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>
      No signals available yet. Trigger a refresh to generate new signals.
    </p>;
  }

  const toggleExpanded = (signalId: number) => {
    setExpandedSignal(expandedSignal === signalId ? null : signalId);
  };

  return (
    <div>
      <div className="table-container" style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Pair</th>
              <th>Direction</th>
              <th>Entry</th>
              <th>Target</th>
              <th>Stop Loss</th>
              <th>Confidence</th>
              <th>R:R</th>
              <th>Generated</th>
              {showLiveTrading && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {signals.map((signal) => (
              <>
                <tr key={signal.id} style={{ 
                  borderBottom: expandedSignal === signal.id ? 'none' : undefined 
                }}>
                  <td style={{ fontWeight: 'bold', color: '#f8fafc' }}>
                    {signal.symbol}
                  </td>
                  <td>
                    <span style={{ 
                      color: signal.direction === 'LONG' ? '#10b981' : '#ef4444',
                      fontWeight: 'bold',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      background: signal.direction === 'LONG' 
                        ? 'rgba(16, 185, 129, 0.1)' 
                        : 'rgba(239, 68, 68, 0.1)',
                      fontSize: '0.8rem'
                    }}>
                      {signal.direction}
                    </span>
                  </td>
                  <td style={{ color: '#22d3ee', fontWeight: 'bold' }}>
                    ${signal.entry_price.toFixed(6)}
                  </td>
                  <td style={{ color: '#10b981' }}>
                    ${signal.target_price.toFixed(6)}
                  </td>
                  <td style={{ color: '#ef4444' }}>
                    ${signal.stop_loss.toFixed(6)}
                  </td>
                  <td>
                    {signal.confidence ? (
                      <span style={{
                        color: signal.confidence >= 80 ? '#10b981' : 
                              signal.confidence >= 60 ? '#f59e0b' : '#ef4444',
                        fontWeight: 'bold'
                      }}>
                        {signal.confidence.toFixed(1)}%
                      </span>
                    ) : '-'}
                  </td>
                  <td>
                    {signal.risk_reward_ratio ? (
                      <span style={{ 
                        color: signal.risk_reward_ratio >= 2 ? '#10b981' : '#f8fafc'
                      }}>
                        1:{signal.risk_reward_ratio.toFixed(1)}
                      </span>
                    ) : '-'}
                  </td>
                  <td style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                    {new Date(signal.created_at).toLocaleDateString()}
                    <br />
                    {new Date(signal.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  {showLiveTrading && (
                    <td>
                      <button
                        className="button"
                        onClick={() => toggleExpanded(signal.id)}
                        style={{
                          background: expandedSignal === signal.id ? '#6b7280' : '#22d3ee',
                          fontSize: '0.8rem',
                          padding: '0.5rem 1rem'
                        }}
                      >
                        {expandedSignal === signal.id ? '🔼 Hide' : '⚡ Trade Live'}
                      </button>
                    </td>
                  )}
                </tr>
                
                {/* Expanded Live Trading Row */}
                {showLiveTrading && expandedSignal === signal.id && (
                  <tr>
                    <td colSpan={9} style={{ 
                      padding: 0, 
                      border: 'none',
                      background: 'rgba(15, 23, 42, 0.3)'
                    }}>
                      <div style={{ padding: '1rem' }}>
                        <LiveTrading 
                          signal={signal} 
                          onTradePlaced={() => setExpandedSignal(null)}
                        />
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile-friendly cards for smaller screens */}
      <style jsx>{`
        @media (max-width: 768px) {
          .table-container {
            display: none;
          }
        }
        
        @media (min-width: 769px) {
          .mobile-cards {
            display: none;
          }
        }
      `}</style>

      <div className="mobile-cards">
        {signals.map((signal) => (
          <div key={`mobile-${signal.id}`} style={{
            background: 'rgba(148,163,184,0.1)',
            border: '1px solid rgba(148,163,184,0.2)',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <h4 style={{ margin: 0, color: '#f8fafc' }}>{signal.symbol}</h4>
              <span style={{ 
                color: signal.direction === 'LONG' ? '#10b981' : '#ef4444',
                fontWeight: 'bold',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                background: signal.direction === 'LONG' 
                  ? 'rgba(16, 185, 129, 0.1)' 
                  : 'rgba(239, 68, 68, 0.1)',
                fontSize: '0.8rem'
              }}>
                {signal.direction}
              </span>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', fontSize: '0.9rem' }}>
              <div>
                <span style={{ color: '#94a3b8' }}>Entry:</span>
                <div style={{ color: '#22d3ee', fontWeight: 'bold' }}>
                  ${signal.entry_price.toFixed(6)}
                </div>
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>Target:</span>
                <div style={{ color: '#10b981', fontWeight: 'bold' }}>
                  ${signal.target_price.toFixed(6)}
                </div>
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>Stop Loss:</span>
                <div style={{ color: '#ef4444', fontWeight: 'bold' }}>
                  ${signal.stop_loss.toFixed(6)}
                </div>
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>Confidence:</span>
                <div style={{
                  color: signal.confidence ? (
                    signal.confidence >= 80 ? '#10b981' : 
                    signal.confidence >= 60 ? '#f59e0b' : '#ef4444'
                  ) : '#94a3b8',
                  fontWeight: 'bold'
                }}>
                  {signal.confidence ? `${signal.confidence.toFixed(1)}%` : '-'}
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#94a3b8' }}>
              Generated: {new Date(signal.created_at).toLocaleDateString()} at{' '}
              {new Date(signal.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>

            {showLiveTrading && (
              <>
                <button
                  className="button"
                  onClick={() => toggleExpanded(signal.id)}
                  style={{
                    background: expandedSignal === signal.id ? '#6b7280' : '#22d3ee',
                    fontSize: '0.9rem',
                    padding: '0.75rem 1.5rem',
                    width: '100%',
                    marginTop: '1rem'
                  }}
                >
                  {expandedSignal === signal.id ? '🔼 Hide Trading' : '⚡ Trade Live'}
                </button>

                {expandedSignal === signal.id && (
                  <div style={{ marginTop: '1rem' }}>
                    <LiveTrading 
                      signal={signal} 
                      onTradePlaced={() => setExpandedSignal(null)}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SignalTable;
