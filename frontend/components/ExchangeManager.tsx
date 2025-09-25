import { useState, useEffect } from 'react';
import { 
  ExchangeConnection, 
  ExchangeConnectionCreate, 
  TradingGuide, 
  fetchExchangeConnections, 
  fetchSupportedExchanges,
  fetchTradingGuide,
  createExchangeConnection,
  updateExchangeConnection,
  deleteExchangeConnection,
  fetchExchangeBalances,
  testExchangeConnection
} from '@/lib/api';

interface ExchangeManagerProps {
  onConnectionChange?: () => void;
}

export const ExchangeManager = ({ onConnectionChange }: ExchangeManagerProps) => {
  const [connections, setConnections] = useState<ExchangeConnection[]>([]);
  const [supportedExchanges, setSupportedExchanges] = useState<string[]>([]);
  const [selectedExchange, setSelectedExchange] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guide, setGuide] = useState<TradingGuide | null>(null);
  const [showGuide, setShowGuide] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Form state
  const [formData, setFormData] = useState<ExchangeConnectionCreate>({
    exchange_name: '',
    api_key: '',
    api_secret: '',
    api_passphrase: '',
    sandbox_mode: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [connectionsData, exchangesData] = await Promise.all([
        fetchExchangeConnections(),
        fetchSupportedExchanges()
      ]);
      setConnections(connectionsData);
      setSupportedExchanges(exchangesData);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleShowGuide = async (exchangeName: string) => {
    try {
      const guideData = await fetchTradingGuide(exchangeName);
      setGuide(guideData);
      setShowGuide(true);
    } catch (err: any) {
      setError(`Failed to load guide: ${err.message}`);
    }
  };

  const handleTestNewConnection = async () => {
    if (!formData.exchange_name || !formData.api_key || !formData.api_secret) {
      setError('Please fill in exchange name, API key, and API secret');
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    setError(null);

    try {
      const result = await testExchangeConnection(formData);
      setTestResult(result);
      if (!result.success) {
        setError(result.error || 'Connection test failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to test connection');
      setTestResult({ success: false, error: err.message });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await createExchangeConnection(formData);
      setShowAddForm(false);
      setFormData({
        exchange_name: '',
        api_key: '',
        api_secret: '',
        api_passphrase: '',
        sandbox_mode: true
      });
      await loadData();
      onConnectionChange?.();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (connectionId: number, isActive: boolean) => {
    try {
      await updateExchangeConnection(connectionId, { is_active: !isActive });
      await loadData();
      onConnectionChange?.();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (connectionId: number) => {
    if (!confirm('Are you sure you want to delete this exchange connection?')) {
      return;
    }

    try {
      await deleteExchangeConnection(connectionId);
      await loadData();
      onConnectionChange?.();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message);
    }
  };

  const handleTestConnection = async (connectionId: number) => {
    try {
      setLoading(true);
      await fetchExchangeBalances(connectionId);
      alert('Connection test successful!');
    } catch (err: any) {
      setError(`Connection test failed: ${err.response?.data?.detail || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ margin: 0, color: '#f8fafc' }}>📊 Exchange Connections</h2>
        <button 
          className="button"
          onClick={() => setShowAddForm(true)}
          style={{ background: '#22d3ee' }}
        >
          + Add Exchange
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

      {/* Existing Connections */}
      {connections.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ color: '#e2e8f0', marginBottom: '1rem' }}>Your Connections</h3>
          {connections.map((connection) => (
            <div key={connection.id} style={{ 
              background: 'rgba(148,163,184,0.1)',
              border: '1px solid rgba(148,163,184,0.2)',
              borderRadius: '8px',
              padding: '1.5rem',
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#f8fafc', textTransform: 'capitalize' }}>
                    {connection.exchange_name}
                    {connection.sandbox_mode && <span style={{ color: '#fbbf24', fontSize: '0.8rem', marginLeft: '0.5rem' }}>(Sandbox)</span>}
                  </h4>
                  <p style={{ margin: '0 0 0.5rem 0', color: '#cbd5e1', fontSize: '0.9rem' }}>
                    API Key: {connection.api_key_preview}
                  </p>
                  <p style={{ margin: '0', color: '#94a3b8', fontSize: '0.8rem' }}>
                    {connection.is_active ? '🟢 Active' : '🔴 Inactive'} • 
                    Last connected: {connection.last_connected ? new Date(connection.last_connected).toLocaleDateString() : 'Never'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="button"
                    onClick={() => handleTestConnection(connection.id)}
                    style={{ background: '#10b981', fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                  >
                    Test
                  </button>
                  <button
                    className="button"
                    onClick={() => handleToggleActive(connection.id, connection.is_active)}
                    style={{ 
                      background: connection.is_active ? '#ef4444' : '#22d3ee', 
                      fontSize: '0.8rem',
                      padding: '0.5rem 1rem'
                    }}
                  >
                    {connection.is_active ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    className="button"
                    onClick={() => handleDelete(connection.id)}
                    style={{ background: '#ef4444', fontSize: '0.8rem', padding: '0.5rem 1rem' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add New Connection Form */}
      {showAddForm && (
        <div style={{ 
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(148,163,184,0.3)',
          borderRadius: '12px',
          padding: '2rem',
          marginBottom: '2rem'
        }}>
          <h3 style={{ color: '#f8fafc', marginBottom: '1.5rem' }}>Add Exchange Connection</h3>
          
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', color: '#e2e8f0', marginBottom: '0.5rem' }}>
                Exchange
              </label>
              <select
                className="input"
                value={formData.exchange_name}
                onChange={(e) => {
                  setFormData({ ...formData, exchange_name: e.target.value });
                  setSelectedExchange(e.target.value);
                }}
                required
              >
                <option value="">Select an exchange</option>
                {supportedExchanges.map(exchange => (
                  <option key={exchange} value={exchange}>
                    {exchange.charAt(0).toUpperCase() + exchange.slice(1)}
                  </option>
                ))}
              </select>
              {selectedExchange && (
                <button
                  type="button"
                  onClick={() => handleShowGuide(selectedExchange)}
                  style={{ 
                    marginTop: '0.5rem',
                    background: 'transparent',
                    color: '#22d3ee',
                    border: 'none',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  📖 How to get API keys for {selectedExchange}
                </button>
              )}
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: '#e2e8f0', marginBottom: '0.5rem' }}>
                API Key
              </label>
              <input
                type="text"
                className="input"
                value={formData.api_key}
                onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                placeholder="Enter your API key"
                required
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', color: '#e2e8f0', marginBottom: '0.5rem' }}>
                API Secret
              </label>
              <input
                type="password"
                className="input"
                value={formData.api_secret}
                onChange={(e) => setFormData({ ...formData, api_secret: e.target.value })}
                placeholder="Enter your API secret"
                required
              />
            </div>

            {selectedExchange === 'coinbase' && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', color: '#e2e8f0', marginBottom: '0.5rem' }}>
                  API Passphrase (required for Coinbase)
                </label>
                <input
                  type="password"
                  className="input"
                  value={formData.api_passphrase || ''}
                  onChange={(e) => setFormData({ ...formData, api_passphrase: e.target.value })}
                  placeholder="Enter your API passphrase"
                  required
                />
              </div>
            )}

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', color: '#e2e8f0', cursor: 'pointer', marginBottom: '1rem' }}>
                <input
                  type="checkbox"
                  checked={formData.sandbox_mode}
                  onChange={(e) => setFormData({ ...formData, sandbox_mode: e.target.checked })}
                  style={{ marginRight: '0.5rem' }}
                />
                Use Sandbox/Testnet Mode (Recommended for testing)
              </label>
              
              {formData.sandbox_mode && (
                <div style={{ 
                  background: 'rgba(34, 211, 238, 0.1)', 
                  border: '1px solid rgba(34, 211, 238, 0.3)', 
                  borderRadius: '8px', 
                  padding: '1rem',
                  marginTop: '0.5rem'
                }}>
                  <p style={{ color: '#22d3ee', fontSize: '0.9rem', margin: 0 }}>
                    🏖️ <strong>Sandbox Mode:</strong> Perfect for testing! Uses virtual funds, no real money involved. 
                    Most exchanges require separate testnet accounts and API keys.
                  </p>
                </div>
              )}
              
              {!formData.sandbox_mode && (
                <div style={{ 
                  background: 'rgba(239, 68, 68, 0.1)', 
                  border: '1px solid rgba(239, 68, 68, 0.3)', 
                  borderRadius: '8px', 
                  padding: '1rem',
                  marginTop: '0.5rem'
                }}>
                  <p style={{ color: '#ef4444', fontSize: '0.9rem', margin: 0 }}>
                    ⚠️ <strong>Live Mode:</strong> This will use real funds! Start with small amounts and test thoroughly first.
                  </p>
                </div>
              )}
            </div>

            {/* Test Connection Button */}
            {formData.exchange_name && formData.api_key && formData.api_secret && (
              <div style={{ marginBottom: '1.5rem' }}>
                <button
                  type="button"
                  onClick={handleTestNewConnection}
                  disabled={isTesting}
                  className="button"
                  style={{ 
                    background: isTesting ? '#6b7280' : '#10b981', 
                    width: '100%',
                    marginBottom: '1rem'
                  }}
                >
                  {isTesting ? 'Testing Connection...' : '🔗 Test Connection'}
                </button>
                
                {testResult && (
                  <div style={{
                    background: testResult.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    border: `1px solid ${testResult.success ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    borderRadius: '8px',
                    padding: '1rem'
                  }}>
                    <p style={{ 
                      color: testResult.success ? '#10b981' : '#ef4444', 
                      fontSize: '0.9rem', 
                      margin: 0,
                      fontWeight: 'bold'
                    }}>
                      {testResult.success ? '✅ Connection Successful!' : '❌ Connection Failed'}
                    </p>
                    {testResult.message && (
                      <p style={{ color: '#e2e8f0', fontSize: '0.85rem', margin: '0.5rem 0 0 0' }}>
                        {testResult.message}
                      </p>
                    )}
                    {testResult.sandbox_mode !== undefined && (
                      <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '0.25rem 0 0 0' }}>
                        Mode: {testResult.sandbox_mode ? 'Sandbox/Testnet' : 'Live Trading'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                type="submit"
                className="button"
                disabled={loading}
                style={{ background: '#22d3ee', flex: 1 }}
              >
                {loading ? 'Adding...' : 'Add Connection'}
              </button>
              <button
                type="button"
                className="button"
                onClick={() => {
                  setShowAddForm(false);
                  setError(null);
                }}
                style={{ background: '#6b7280' }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Trading Guide Modal */}
      {showGuide && guide && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '2rem'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.95) 100%)',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflow: 'auto',
            border: '1px solid rgba(148,163,184,0.3)'
          }}>
            <h3 style={{ color: '#f8fafc', marginBottom: '1.5rem' }}>
              📖 How to setup {guide.exchange_name} API Keys
            </h3>

            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ color: '#22d3ee', marginBottom: '0.5rem' }}>Steps:</h4>
              <ol style={{ color: '#cbd5e1', paddingLeft: '1.5rem' }}>
                {guide.steps.map((step, index) => (
                  <li key={index} style={{ marginBottom: '0.5rem' }}>{step}</li>
                ))}
              </ol>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ color: '#22d3ee', marginBottom: '0.5rem' }}>Required API Permissions:</h4>
              <ul style={{ color: '#cbd5e1', paddingLeft: '1.5rem' }}>
                {guide.api_permissions.map((permission, index) => (
                  <li key={index} style={{ marginBottom: '0.25rem' }}>✓ {permission}</li>
                ))}
              </ul>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ color: '#f59e0b', marginBottom: '0.5rem' }}>🔒 Security Notes:</h4>
              <ul style={{ color: '#fbbf24', paddingLeft: '1.5rem' }}>
                {guide.security_notes.map((note, index) => (
                  <li key={index} style={{ marginBottom: '0.25rem' }}>⚠️ {note}</li>
                ))}
              </ul>
            </div>

            {guide.sandbox_instructions && (
              <div style={{ 
                background: 'rgba(34, 211, 238, 0.1)',
                border: '1px solid rgba(34, 211, 238, 0.3)',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1.5rem'
              }}>
                <h4 style={{ color: '#22d3ee', marginBottom: '0.5rem' }}>🧪 Sandbox/Testnet:</h4>
                <p style={{ color: '#cbd5e1', margin: 0 }}>{guide.sandbox_instructions}</p>
              </div>
            )}

            <button
              className="button"
              onClick={() => setShowGuide(false)}
              style={{ background: '#6b7280', width: '100%' }}
            >
              Close Guide
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExchangeManager;