import React from 'react';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'full' | 'icon';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ 
  size = 'medium', 
  variant = 'full',
  className = '' 
}) => {
  const dimensions = {
    small: variant === 'icon' ? 'h-8 w-8' : 'h-8',
    medium: variant === 'icon' ? 'h-12 w-12' : 'h-12',
    large: variant === 'icon' ? 'h-16 w-16' : 'h-16'
  };

  const textSize = {
    small: 'text-lg',
    medium: 'text-xl',
    large: 'text-3xl'
  };

  if (variant === 'icon') {
    return (
      <div className={`${dimensions[size]} ${className} flex items-center justify-center`}>
        <svg 
          viewBox="0 0 100 100" 
          className="w-full h-full"
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background circle with gradient */}
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#0ea5e9" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="45" fill="url(#logoGradient)" />
          
          {/* Signal waves */}
          <path 
            d="M20 50 L30 35 L40 65 L50 25 L60 55 L70 40 L80 50" 
            stroke="white" 
            strokeWidth="3" 
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Upward arrow/trend */}
          <path 
            d="M65 45 L75 35 L70 35 L70 30 L80 30 L80 40 L75 40" 
            fill="white"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={dimensions[size]}>
        <svg 
          viewBox="0 0 100 100" 
          className="w-full h-full"
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#0ea5e9" />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="45" fill="url(#logoGradient)" />
          <path 
            d="M20 50 L30 35 L40 65 L50 25 L60 55 L70 40 L80 50" 
            stroke="white" 
            strokeWidth="3" 
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path 
            d="M65 45 L75 35 L70 35 L70 30 L80 30 L80 40 L75 40" 
            fill="white"
          />
        </svg>
      </div>
      <span className={`font-bold text-white ${textSize[size]}`}>
        SignalStack
      </span>
    </div>
  );
};

export default Logo;