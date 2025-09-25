import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  color = '#22d3ee',
  className = '' 
}) => {
  const sizeMap = {
    small: '1rem',
    medium: '1.5rem', 
    large: '2rem'
  };

  return (
    <div 
      className={`loading-spinner ${className}`}
      style={{
        width: sizeMap[size],
        height: sizeMap[size],
        border: `2px solid transparent`,
        borderTop: `2px solid ${color}`,
        borderRadius: '50%',
        display: 'inline-block'
      }}
    >
      <style jsx>{`
        .loading-spinner {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

interface LoadingCardProps {
  title: string;
  description?: string;
}

export const LoadingCard: React.FC<LoadingCardProps> = ({ title, description }) => {
  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
        <LoadingSpinner size="medium" />
        <div>
          <h3 style={{ margin: 0, color: '#f8fafc' }}>{title}</h3>
          {description && (
            <p style={{ margin: '0.25rem 0 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>
              {description}
            </p>
          )}
        </div>
      </div>
      <div style={{ 
        background: 'rgba(148, 163, 184, 0.1)', 
        height: '6px', 
        borderRadius: '3px',
        overflow: 'hidden'
      }}>
        <div style={{
          background: 'linear-gradient(90deg, #22d3ee, #0ea5e9, #22d3ee)',
          height: '100%',
          borderRadius: '3px',
          animation: 'loading-bar 2s ease-in-out infinite'
        }} />
      </div>
      <style jsx>{`
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;