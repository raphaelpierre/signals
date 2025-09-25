import { useState, useEffect } from 'react';
import { TradingPosition, fetchTradingPositions } from '@/lib/api';

export const TradingPositions = () => {
  const [positions, setPositions] = useState<TradingPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPositions();
  }, []);

  const loadPositions = async () => {
    try {
      setLoading(true);
      const data = await fetchTradingPositions();
      setPositions(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return '#10b981';
      case 'closed': return '#6b7280';
      case 'failed': return '#ef4444';
      default: return '#94a3b8';
    }
  };

  const getOrderStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'filled': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'cancelled': return '#6b7280';
      case 'failed': return '#ef4444';
      default: return '#94a3b8';
    }
  };

  const calculatePnL = (position: TradingPosition) => {
    if (!position.entry_price || !position.current_price) return null;
    
    const entryPrice = parseFloat(position.entry_price);
    const currentPrice = parseFloat(position.current_price);
    const quantity = parseFloat(position.quantity);
    
    if (isNaN(entryPrice) || isNaN(currentPrice) || isNaN(quantity)) return null;
    
    const pnl = position.side === 'buy' 
      ? (currentPrice - entryPrice) * quantity
      : (entryPrice - currentPrice) * quantity;
    
    return pnl;
  };

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ color: '#94a3b8' }}>Loading positions...</div>
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ margin: 0, color: '#f8fafc' }}>📈 Trading Positions</h2>
        <button 
          className="button"
          onClick={loadPositions}
          style={{ background: '#22d3ee', fontSize: '0.9rem', padding: '0.5rem 1rem' }}
        >
          🔄 Refresh
        </button>
      </div>

      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1rem',
          color: '#fca5a5'
        }}>
          {error}
        </div>
      )}

      {positions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
          <p>📊 No trading positions found.</p>
          <p style={{ fontSize: '0.9rem' }}>
            Your live trades will appear here once you execute signals through an exchange connection.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {positions.map((position) => {
            const pnl = calculatePnL(position);
            return (
              <div 
                key={position.id}
                style={{
                  background: 'rgba(148,163,184,0.1)',
                  border: '1px solid rgba(148,163,184,0.2)',
                  borderRadius: '12px',
                  padding: '1.5rem'
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                  {/* Position Info */}
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#f8fafc' }}>
                      {position.symbol}
                    </h4>
                    <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
                      <div style={{ marginBottom: '0.25rem' }}>
                        <span style={{ color: position.side === 'buy' ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                          {position.side.toUpperCase()}
                        </span>
                        {' '}{position.quantity} @ {position.order_type.toUpperCase()}
                      </div>
                      <div>
                        Order ID: {position.order_id || 'Pending'}
                      </div>
                    </div>
                  </div>

                  {/* Prices */}
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Prices</div>
                    <div style={{ fontSize: '0.9rem' }}>
                      <div style={{ marginBottom: '0.25rem' }}>
                        <span style={{ color: '#cbd5e1' }}>Entry: </span>
                        <span style={{ color: '#f8fafc', fontWeight: 'bold' }}>
                          ${position.entry_price ? parseFloat(position.entry_price).toFixed(6) : 'N/A'}
                        </span>
                      </div>
                      {position.current_price && (
                        <div>
                          <span style={{ color: '#cbd5e1' }}>Current: </span>
                          <span style={{ color: '#f8fafc', fontWeight: 'bold' }}>
                            ${parseFloat(position.current_price).toFixed(6)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Status</div>
                    <div style={{ fontSize: '0.9rem' }}>
                      <div style={{ marginBottom: '0.25rem' }}>
                        <span style={{ color: getStatusColor(position.status), fontWeight: 'bold' }}>
                          ● {position.status.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: getOrderStatusColor(position.order_status), fontSize: '0.8rem' }}>
                          Order: {position.order_status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* PnL */}
                  {pnl !== null && (
                    <div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem' }}>P&L</div>
                      <div style={{ 
                        fontSize: '1rem', 
                        fontWeight: 'bold',
                        color: pnl >= 0 ? '#10b981' : '#ef4444'
                      }}>
                        {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                        <div style={{ fontSize: '0.7rem', fontWeight: 'normal' }}>
                          ({((pnl / (parseFloat(position.entry_price || '0') * parseFloat(position.quantity))) * 100).toFixed(2)}%)
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Timestamps */}
                  <div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Time</div>
                    <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                      <div>Created: {new Date(position.created_at).toLocaleDateString()}</div>
                      <div style={{ color: '#94a3b8' }}>
                        {new Date(position.created_at).toLocaleTimeString()}
                      </div>
                      {position.closed_at && (
                        <div style={{ color: '#ef4444' }}>
                          Closed: {new Date(position.closed_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                {position.error_message && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '0.75rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    color: '#fca5a5'
                  }}>
                    ⚠️ {position.error_message}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Summary Stats */}
      {positions.length > 0 && (
        <div style={{
          marginTop: '2rem',
          padding: '1.5rem',
          background: 'rgba(15, 23, 42, 0.5)',
          borderRadius: '12px',
          border: '1px solid rgba(148,163,184,0.2)'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#e2e8f0' }}>📊 Summary</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f8fafc' }}>
                {positions.length}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Total Positions</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>
                {positions.filter(p => p.status === 'active').length}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Active</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#6b7280' }}>
                {positions.filter(p => p.status === 'closed').length}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Closed</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
                {positions.filter(p => p.order_status === 'pending').length}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Pending Orders</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradingPositions;