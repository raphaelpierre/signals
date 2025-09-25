import React from 'react';
import { SignalWaveIcon } from './Icons';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  message = 'Loading...' 
}) => {
  const dimensions = {
    small: 24,
    medium: 40,
    large: 64
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      gap: '1rem',
      padding: '2rem' 
    }}>
      <div style={{
        animation: 'spin 1s linear infinite',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <SignalWaveIcon size={dimensions[size]} color="#22d3ee" />
      </div>
      <p style={{ color: '#94a3b8', margin: 0 }}>{message}</p>
      
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action
}) => {
  return (
    <div style={{
      textAlign: 'center',
      padding: '3rem 2rem',
      color: '#94a3b8'
    }}>
      {icon && (
        <div style={{ marginBottom: '1.5rem', opacity: 0.6 }}>
          {icon}
        </div>
      )}
      <h3 style={{ color: '#f8fafc', marginBottom: '0.5rem', fontSize: '1.25rem' }}>
        {title}
      </h3>
      <p style={{ marginBottom: '2rem', lineHeight: 1.6 }}>
        {description}
      </p>
      {action && (
        <button 
          className="button" 
          onClick={action.onClick}
          style={{ width: 'auto' }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

interface ErrorStateProps {
  title?: string;
  message: string;
  retry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  retry
}) => {
  return (
    <div style={{
      textAlign: 'center',
      padding: '2rem',
      border: '1px solid rgba(239, 68, 68, 0.3)',
      borderRadius: '8px',
      background: 'rgba(239, 68, 68, 0.05)'
    }}>
      <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
      <h3 style={{ color: '#f87171', marginBottom: '0.5rem' }}>{title}</h3>
      <p style={{ color: '#fca5a5', marginBottom: '1.5rem' }}>{message}</p>
      {retry && (
        <button 
          className="button" 
          onClick={retry}
          style={{ 
            width: 'auto',
            background: '#ef4444',
            color: 'white'
          }}
        >
          Try Again
        </button>
      )}
    </div>
  );
};

export default {
  LoadingSpinner,
  EmptyState,
  ErrorState
};