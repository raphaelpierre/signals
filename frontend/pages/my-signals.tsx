import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import Layout from '@/components/Layout';
import { UserSignal, fetchMySignals, closeSignal, CloseSignalData, setAuthToken } from '@/lib/api';

interface CloseSignalModalProps {
  userSignal: UserSignal;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CloseSignalData) => void;
  loading: boolean;
}

const CloseSignalModal: React.FC<CloseSignalModalProps> = ({ 
  userSignal, 
  isOpen, 
  onClose, 
  onSubmit, 
  loading 
}) => {
  const [exitPrice, setExitPrice] = useState('');
  const [notes, setNotes] = useState(userSignal.notes || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      exit_price: parseFloat(exitPrice),
      notes: notes || undefined,
      exit_date: new Date().toISOString(),
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Close Position</h3>
        
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <div className="text-sm text-gray-600 space-y-1">
            <div><strong>Entry Price:</strong> ${userSignal.entry_price?.toFixed(4)}</div>
            <div><strong>Quantity:</strong> {userSignal.quantity}</div>
            <div><strong>Taken:</strong> {new Date(userSignal.action_date).toLocaleString()}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Exit Price
            </label>
            <input
              type="number"
              value={exitPrice}
              onChange={(e) => setExitPrice(e.target.value)}
              step="0.00000001"
              className="input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="input"
              placeholder="Any notes about closing this trade..."
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 button"
              disabled={loading}
            >
              {loading ? 'Closing...' : 'Close Position'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const MySignalsPage = () => {
  const router = useRouter();
  const [userSignals, setUserSignals] = useState<UserSignal[]>([]);
  const [selectedUserSignal, setSelectedUserSignal] = useState<UserSignal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [closeLoading, setCloseLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      router.replace('/login');
      return;
    }
    setToken(storedToken);
    setAuthToken(storedToken);
    refreshUserSignals();
  }, []);

  const refreshUserSignals = async () => {
    setLoading(true);
    try {
      setError(null);
      const signals = await fetchMySignals();
      setUserSignals(signals);
    } catch (err) {
      setError('Unable to load your signals. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSignal = (userSignal: UserSignal) => {
    setSelectedUserSignal(userSignal);
    setError(null);
  };

  const handleSubmitCloseSignal = async (data: CloseSignalData) => {
    if (!selectedUserSignal) return;
    
    setCloseLoading(true);
    try {
      await closeSignal(selectedUserSignal.id, data);
      setSelectedUserSignal(null);
      refreshUserSignals();
    } catch (err: any) {
      console.error('Failed to close signal:', err);
      setError(err.response?.data?.detail || 'Failed to close signal');
    } finally {
      setCloseLoading(false);
    }
  };

  const handleCloseModal = () => {
    if (!closeLoading) {
      setSelectedUserSignal(null);
      setError(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setAuthToken(null);
    router.push('/');
  };

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'profit': return 'text-green-600';
      case 'loss': return 'text-red-600';
      case 'breakeven': return 'text-gray-600';
      default: return 'text-blue-600';
    }
  };

  const getOutcomeBadge = (outcome: string) => {
    const baseClass = 'px-2 py-1 text-xs rounded-full font-medium';
    switch (outcome) {
      case 'profit': return `${baseClass} bg-green-100 text-green-800`;
      case 'loss': return `${baseClass} bg-red-100 text-red-800`;
      case 'breakeven': return `${baseClass} bg-gray-100 text-gray-800`;
      default: return `${baseClass} bg-blue-100 text-blue-800`;
    }
  };

  const formatPrice = (price?: number) => {
    if (!price) return 'N/A';
    return price >= 1000 ? price.toFixed(2) : price.toFixed(4);
  };

  const formatPnL = (amount?: number) => {
    if (amount === undefined || amount === null) return 'Pending';
    const sign = amount >= 0 ? '+' : '';
    return `${sign}$${amount.toFixed(2)}`;
  };

  const formatPercentage = (percentage?: number) => {
    if (percentage === undefined || percentage === null) return '';
    const sign = percentage >= 0 ? '+' : '';
    return `(${sign}${percentage.toFixed(2)}%)`;
  };

  return (
    <Layout token={token} onLogout={handleLogout}>
      <Head>
        <title>My Signals | SignalStack</title>
      </Head>
      
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 style={{ marginTop: 0 }}>My Signal History</h2>
          <button className="button" style={{ width: 'auto' }} onClick={refreshUserSignals} disabled={loading}>
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-600">
            {error}
          </div>
        )}

        {userSignals.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            You haven't taken any signals yet. Go to the dashboard to take your first signal!
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Signal ID</th>
                  <th>Entry Price</th>
                  <th>Exit Price</th>
                  <th>Quantity</th>
                  <th>Status</th>
                  <th>P&L</th>
                  <th>Taken</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {userSignals.map((userSignal) => (
                  <tr key={userSignal.id}>
                    <td className="font-medium">#{userSignal.signal_id}</td>
                    <td>${formatPrice(userSignal.entry_price)}</td>
                    <td>${formatPrice(userSignal.exit_price)}</td>
                    <td>{userSignal.quantity}</td>
                    <td>
                      <span className={getOutcomeBadge(userSignal.outcome)}>
                        {userSignal.outcome.charAt(0).toUpperCase() + userSignal.outcome.slice(1)}
                      </span>
                    </td>
                    <td className={getOutcomeColor(userSignal.outcome)}>
                      <div>{formatPnL(userSignal.pnl_amount)}</div>
                      <div className="text-xs">{formatPercentage(userSignal.pnl_percentage)}</div>
                    </td>
                    <td className="text-sm text-gray-600">
                      {new Date(userSignal.action_date).toLocaleString()}
                    </td>
                    <td>
                      {userSignal.outcome === 'pending' ? (
                        <button
                          onClick={() => handleCloseSignal(userSignal)}
                          className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                          disabled={closeLoading}
                        >
                          Close
                        </button>
                      ) : (
                        <span className="text-sm text-gray-400">Closed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedUserSignal && (
        <CloseSignalModal
          userSignal={selectedUserSignal}
          isOpen={true}
          onClose={handleCloseModal}
          onSubmit={handleSubmitCloseSignal}
          loading={closeLoading}
        />
      )}
    </Layout>
  );
};

export default MySignalsPage;