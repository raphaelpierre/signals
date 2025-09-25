import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { ShieldIcon, CryptoCoinIcon } from './Icons';

interface SubscriptionStatusProps {
  onCheckoutRedirect?: (url: string) => void;
}

interface SubscriptionData {
  status: string;
  stripe_subscription_id?: string;
  current_period_end?: string;
}

export const SubscriptionStatus = ({ onCheckoutRedirect }: SubscriptionStatusProps) => {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await apiClient.get('/auth/me');
      // Note: The subscription data might be nested in the user object
      setSubscription({
        status: 'trialing', // Default for development
        current_period_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });
    } catch (err) {
      setError('Failed to fetch subscription status');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    setCheckoutLoading(true);
    setError(null);
    try {
      const response = await apiClient.post('/stripe/checkout-session');
      const { checkout_url } = response.data;
      if (onCheckoutRedirect) {
        onCheckoutRedirect(checkout_url);
      } else {
        window.location.href = checkout_url;
      }
    } catch (err: any) {
      console.error('Stripe checkout error:', err);
      if (err.response?.status === 503) {
        setError('💳 Payment processing is not configured in this development environment. This is a demo system.');
      } else {
        setError('Failed to create checkout session. Please try again or contact support.');
      }
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(15, 23, 42, 0.9) 100%)',
        border: '1px solid rgba(139, 92, 246, 0.2)',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '1rem'
      }}>
        <p style={{ color: '#cbd5e1' }}>Loading subscription status...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        background: 'rgba(239, 68, 68, 0.05)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '1rem'
      }}>
        <p style={{ color: '#f87171' }}>⚠️ {error}</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'trialing': return '#f59e0b';
      case 'incomplete': return '#f87171';
      case 'canceled': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'active': return 'Your subscription is active';
      case 'trialing': return 'You\'re on a free trial';
      case 'incomplete': return 'Please complete your subscription setup';
      case 'canceled': return 'Your subscription has been canceled';
      default: return 'Subscription status unknown';
    }
  };

  const getStatusGradient = (status: string) => {
    switch (status) {
      case 'active': 
        return 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(15, 23, 42, 0.9) 100%)';
      case 'trialing': 
        return 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(15, 23, 42, 0.9) 100%)';
      case 'incomplete': 
        return 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(15, 23, 42, 0.9) 100%)';
      default: 
        return 'linear-gradient(135deg, rgba(107, 114, 128, 0.1) 0%, rgba(15, 23, 42, 0.9) 100%)';
    }
  };

  const status = subscription?.status || 'unknown';

  return (
    <div style={{ 
      background: getStatusGradient(status),
      border: `1px solid ${getStatusColor(status)}33`,
      borderRadius: '12px',
      padding: '1.5rem',
      marginBottom: '1rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            background: `${getStatusColor(status)}20`,
            borderRadius: '50%',
            padding: '0.75rem',
            display: 'flex'
          }}>
            {status === 'trialing' ? (
              <CryptoCoinIcon size={24} color={getStatusColor(status)} />
            ) : (
              <ShieldIcon size={24} color={getStatusColor(status)} />
            )}
          </div>
          <div>
            <p style={{ 
              margin: '0 0 0.25rem 0', 
              color: getStatusColor(status),
              fontSize: '1.1rem',
              fontWeight: 600
            }}>
              {getStatusMessage(status)}
            </p>
            {subscription?.current_period_end && (
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#9ca3af' }}>
                {subscription.status === 'trialing' ? 'Trial ends: ' : 'Next billing: '}
                {new Date(subscription.current_period_end).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
        
        {(status === 'incomplete' || status === 'trialing') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
            <button
              className="button"
              style={{ 
                width: 'auto', 
                background: getStatusColor(status), 
                color: status === 'trialing' ? '#0f172a' : '#ffffff',
                border: 'none',
                fontWeight: 600
              }}
              onClick={handleUpgrade}
              disabled={checkoutLoading}
            >
              {checkoutLoading ? 'Loading...' : status === 'trialing' ? 'Upgrade Now' : 'Complete Setup'}
            </button>
            <p style={{ 
              margin: 0, 
              fontSize: '0.75rem', 
              color: '#6b7280',
              textAlign: 'right'
            }}>
              Demo environment - payments disabled
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionStatus;