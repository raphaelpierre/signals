import React from 'react';

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

// Trading Chart Icon
export const TradingChartIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor',
  className = '' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M3 3v18h18M7 14l4-4 4 4 4-4" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <circle cx="7" cy="14" r="2" fill={color} />
    <circle cx="11" cy="10" r="2" fill={color} />
    <circle cx="15" cy="14" r="2" fill={color} />
    <circle cx="19" cy="10" r="2" fill={color} />
  </svg>
);

// Signal Wave Icon
export const SignalWaveIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor',
  className = '' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M3 12h2l2-6 4 12 4-6 2 3h4" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

// Analytics Icon
export const AnalyticsIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor',
  className = '' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth="2"/>
    <rect x="7" y="8" width="2" height="8" fill={color}/>
    <rect x="11" y="5" width="2" height="11" fill={color}/>
    <rect x="15" y="11" width="2" height="5" fill={color}/>
  </svg>
);

// Crypto Coin Icon
export const CryptoCoinIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor',
  className = '' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2"/>
    <path 
      d="M8 12h8M12 8v8" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round"
    />
  </svg>
);

// Shield Security Icon
export const ShieldIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor',
  className = '' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M12 2l8 3v7c0 5.55-3.84 10.74-9 12-5.16-1.26-9-6.45-9-12V5l8-3z" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
    <path 
      d="M9 12l2 2 4-4" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

// Lightning Speed Icon
export const LightningIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor',
  className = '' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path 
      d="M13 2L3 14h8l-2 8 10-12h-8l2-8z" 
      fill={color}
    />
  </svg>
);

// Target Icon
export const TargetIcon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor',
  className = '' 
}) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2"/>
    <circle cx="12" cy="12" r="6" stroke={color} strokeWidth="2"/>
    <circle cx="12" cy="12" r="2" fill={color}/>
  </svg>
);

export default {
  TradingChartIcon,
  SignalWaveIcon,
  AnalyticsIcon,
  CryptoCoinIcon,
  ShieldIcon,
  LightningIcon,
  TargetIcon
};