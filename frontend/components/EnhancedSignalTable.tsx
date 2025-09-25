import React, { useState } from 'react';
import { Signal, takeSignal, TakeSignalData } from '@/lib/api';
import EnhancedSignalCard from '@/components/EnhancedSignalCard';
import LiveTrading from '@/components/LiveTrading';

interface EnhancedSignalTableProps {
  signals: Signal[];
  onSignalTaken?: () => void;
  showLiveTrading?: boolean;
}

interface TakeSignalModalProps {
  signal: Signal;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TakeSignalData) => void;
  loading: boolean;
}

const TakeSignalModal: React.FC<TakeSignalModalProps> = ({ 
  signal, 
  isOpen, 
  onClose, 
  onSubmit, 
  loading 
}) => {
  const [entryPrice, setEntryPrice] = useState(signal.entry_price.toString());
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      signal_id: signal.id,
      entry_price: parseFloat(entryPrice),
      quantity: parseFloat(quantity),
      notes: notes || undefined,
    });
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50
    }}>
      <div style={{
        background: 'white',
        borderRadius: '0.5rem',
        padding: '1.5rem',
        maxWidth: '28rem',
        width: '100%',
        margin: '0 1rem'
      }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#000' }}>
          Take Signal: {signal.symbol}
        </h3>
        
        <div style={{
          marginBottom: '1rem',
          padding: '0.75rem',
          backgroundColor: '#f9fafb',
          borderRadius: '0.375rem'
        }}>
          <div style={{ fontSize: '0.875rem', color: '#4b5563', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div><strong>Direction:</strong> {signal.direction}</div>
            <div><strong>Suggested Entry:</strong> ${signal.entry_price.toFixed(4)}</div>
            <div><strong>Target:</strong> ${signal.target_price.toFixed(4)}</div>
            <div><strong>Stop Loss:</strong> ${signal.stop_loss.toFixed(4)}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#374151',
              marginBottom: '0.25rem'
            }}>
              Actual Entry Price
            </label>
            <input
              type="number"
              value={entryPrice}
              onChange={(e) => setEntryPrice(e.target.value)}
              step="0.00000001"
              className="input"
              style={{ color: '#000' }}
              required
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#374151',
              marginBottom: '0.25rem'
            }}>
              Position Size
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              step="0.00000001"
              placeholder="e.g., 0.1 BTC or 100 USDT"
              className="input"
              style={{ color: '#000' }}
              required
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#374151',
              marginBottom: '0.25rem'
            }}>
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="input"
              style={{ color: '#000', resize: 'vertical' }}
              placeholder="Any notes about this trade..."
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '0.5rem 1rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                color: '#374151',
                backgroundColor: 'white',
                cursor: 'pointer'
              }}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="button"
              style={{ flex: 1 }}
              disabled={loading}
            >
              {loading ? 'Taking Signal...' : 'Take Signal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const EnhancedSignalTable: React.FC<EnhancedSignalTableProps> = ({ 
  signals, 
  onSignalTaken,
  showLiveTrading = false 
}) => {
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);
  const [expandedSignal, setExpandedSignal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTakeSignal = (signal: Signal) => {
    setSelectedSignal(signal);
    setError(null);
  };

  const handleTrade = (signal: Signal) => {
    setExpandedSignal(expandedSignal === signal.id ? null : signal.id);
  };

  const handleSubmitTakeSignal = async (data: TakeSignalData) => {
    setLoading(true);
    try {
      await takeSignal(data);
      setSelectedSignal(null);
      onSignalTaken?.();
    } catch (err: any) {
      console.error('Failed to take signal:', err);
      setError(err.response?.data?.detail || 'Failed to take signal');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    if (!loading) {
      setSelectedSignal(null);
      setError(null);
    }
  };

  if (!signals.length) {
    return <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>
      No signals available yet. Trigger a refresh to generate new signals.
    </p>;
  }

  return (
    <>
      {error && (
        <div style={{
          marginBottom: '1rem',
          padding: '0.75rem',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '0.375rem',
          color: '#dc2626'
        }}>
          {error}
        </div>
      )}

      {/* Enhanced Signal Cards View */}
      <div style={{ marginBottom: '2rem' }}>
        <div className="desktop-view">
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
            gap: '1.5rem' 
          }}>
            {signals.map((signal) => (
              <div key={`card-${signal.id}`}>
                <EnhancedSignalCard 
                  signal={signal} 
                  showTrade={showLiveTrading}
                  onTrade={handleTrade}
                />
                
                {/* Expanded Live Trading for this signal */}
                {showLiveTrading && expandedSignal === signal.id && (
                  <div style={{ 
                    marginTop: '1rem',
                    borderRadius: '12px',
                    overflow: 'hidden'
                  }}>
                    <LiveTrading 
                      signal={signal} 
                      onTradePlaced={() => setExpandedSignal(null)} 
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legacy Table View (togglable in future UI) */}
      <div style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>Pair</th>
              <th>Direction</th>
              <th>Entry</th>
              <th>Target</th>
              <th>Stop Loss</th>
              <th>Quality</th>
              <th>R/R</th>
              <th>Generated</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {signals.map((signal) => (
              <tr key={signal.id}>
                <td style={{ fontWeight: 500 }}>{signal.symbol}</td>
                <td style={{
                  fontWeight: 500,
                  color: signal.direction === 'LONG' ? '#16a34a' : '#dc2626'
                }}>
                  {signal.direction}
                </td>
                <td>${signal.entry_price.toFixed(signal.entry_price < 10 ? 6 : 2)}</td>
                <td>${signal.target_price.toFixed(signal.target_price < 10 ? 6 : 2)}</td>
                <td>${signal.stop_loss.toFixed(signal.stop_loss < 10 ? 6 : 2)}</td>
                <td>
                  <span style={{
                    display: 'inline-block',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: 'white',
                    backgroundColor: (signal.quality_score || (signal.confidence || 0) * 1) >= 80 ? 
                      '#16a34a' : 
                      (signal.quality_score || (signal.confidence || 0) * 1) >= 60 ? 
                        '#65a30d' : 
                        '#f59e0b'
                  }}>
                    {Math.round(signal.quality_score || (signal.confidence || 0) * 1)}
                  </span>
                </td>
                <td>
                  {signal.risk_reward_ratio ? `${signal.risk_reward_ratio.toFixed(1)}:1` : 'N/A'}
                </td>
                <td style={{ fontSize: '0.875rem', color: '#4b5563' }}>
                  {new Date(signal.created_at).toLocaleString()}
                </td>
                <td>
                  <button
                    onClick={() => handleTakeSignal(signal)}
                    style={{
                      padding: '0.25rem 0.75rem',
                      backgroundColor: '#2563eb',
                      color: 'white',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                    disabled={loading}
                  >
                    Take
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedSignal && (
        <TakeSignalModal
          signal={selectedSignal}
          isOpen={true}
          onClose={handleCloseModal}
          onSubmit={handleSubmitTakeSignal}
          loading={loading}
        />
      )}
    </>
  );
};

export default EnhancedSignalTable;