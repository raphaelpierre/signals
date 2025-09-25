import { useState, useEffect } from 'react';
import { 
  Signal, 
  ExchangeConnection, 
  TradingPosition,
  fetchExchangeConnections,
  executeLiveTrade,
  fetchTradingPositions
} from '@/lib/api';

interface LiveTradingProps {
  signal: Signal;
  onTradePlaced?: () => void;
}

export const LiveTrading = ({ signal, onTradePlaced }: LiveTradingProps) => {
  const [connections, setConnections] = useState<ExchangeConnection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<number | null>(null);
  const [positionSize, setPositionSize] = useState(5); // Default 5%
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      const data = await fetchExchangeConnections();
      const activeConnections = data.filter(conn => conn.is_active);
      setConnections(activeConnections);
      if (activeConnections.length === 1) {
        setSelectedConnection(activeConnections[0].id);
      }
    } catch (err: any) {
      setError('Failed to load exchange connections');
    }
  };

  const handleTrade = async () => {
    if (!selectedConnection) {
      setError('Please select an exchange connection');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await executeLiveTrade({
        signal_id: signal.id,
        exchange_connection_id: selectedConnection,
        position_size_percent: positionSize,
        order_type: orderType
      });
      
      setSuccess(`🎉 Trade placed successfully for ${signal.symbol}!`);
      onTradePlaced?.();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedExchange = connections.find(c => c.id === selectedConnection);

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.1) 0%, rgba(15, 23, 42, 0.95) 100%)',
      border: '2px solid rgba(34, 211, 238, 0.3)',
      borderRadius: '12px',
      padding: '1.5rem',
      marginTop: '1rem'
    }}>
      <h3 style={{ color: '#22d3ee', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center' }}>
        <span style={{ marginRight: '0.5rem' }}>⚡</span>
        Live Trading - {signal.symbol}
      </h3>

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

      {success && (
        <div style={{
          background: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1rem',
          color: '#86efac'
        }}>
          {success}
        </div>
      )}

      {connections.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '2rem',
          color: '#94a3b8'
        }}>
          <p>📊 No active exchange connections found.</p>
          <p style={{ fontSize: '0.9rem' }}>
            Add an exchange connection in the Exchange Manager to enable live trading.
          </p>
        </div>
      ) : (
        <div>
          {/* Signal Details */}
          <div style={{
            background: 'rgba(148,163,184,0.1)',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', fontSize: '0.9rem' }}>
              <div>
                <span style={{ color: '#94a3b8' }}>Direction:</span>
                <div style={{ color: signal.direction === 'LONG' ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                  {signal.direction}
                </div>
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>Entry:</span>
                <div style={{ color: '#f8fafc', fontWeight: 'bold' }}>
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
              {signal.confidence && (
                <div>
                  <span style={{ color: '#94a3b8' }}>Confidence:</span>
                  <div style={{ color: '#22d3ee', fontWeight: 'bold' }}>
                    {signal.confidence.toFixed(1)}%
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Trading Form */}
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', color: '#e2e8f0', marginBottom: '0.5rem' }}>
                Exchange
              </label>
              <select
                className="input"
                value={selectedConnection || ''}
                onChange={(e) => setSelectedConnection(Number(e.target.value))}
                required
              >
                <option value="">Select exchange</option>
                {connections.map(conn => (
                  <option key={conn.id} value={conn.id}>
                    {conn.exchange_name.charAt(0).toUpperCase() + conn.exchange_name.slice(1)}
                    {conn.sandbox_mode && ' (Sandbox)'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', color: '#e2e8f0', marginBottom: '0.5rem' }}>
                Position Size (% of available balance)
              </label>
              <input
                type="range"
                min="1"
                max="25"
                value={positionSize}
                onChange={(e) => setPositionSize(Number(e.target.value))}
                style={{ width: '100%' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.8rem' }}>
                <span>1%</span>
                <span style={{ color: '#22d3ee', fontWeight: 'bold' }}>{positionSize}%</span>
                <span>25%</span>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', color: '#e2e8f0', marginBottom: '0.5rem' }}>
                Order Type
              </label>
              <select
                className="input"
                value={orderType}
                onChange={(e) => setOrderType(e.target.value as 'market' | 'limit')}
              >
                <option value="market">Market Order (Execute immediately)</option>
                <option value="limit">Limit Order (At entry price)</option>
              </select>
            </div>

            {/* Risk Warning */}
            <div style={{
              background: 'rgba(245, 158, 11, 0.1)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '8px',
              padding: '1rem'
            }}>
              <div style={{ color: '#f59e0b', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                ⚠️ Risk Warning
              </div>
              <ul style={{ color: '#fbbf24', fontSize: '0.8rem', margin: 0, paddingLeft: '1.5rem' }}>
                <li>Cryptocurrency trading involves substantial risk of loss</li>
                <li>Only trade with funds you can afford to lose</li>
                <li>Past performance does not guarantee future results</li>
                <li>{selectedExchange?.sandbox_mode ? 'This is sandbox mode - no real money is at risk' : 'This is live trading with real money'}</li>
              </ul>
            </div>

            <button
              className="button"
              onClick={handleTrade}
              disabled={loading || !selectedConnection}
              style={{
                background: selectedConnection ? '#22d3ee' : '#6b7280',
                padding: '1rem 2rem',
                fontSize: '1rem',
                fontWeight: 'bold'
              }}
            >
              {loading ? '⏳ Placing Trade...' : `🚀 Execute ${signal.direction} Trade`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveTrading;