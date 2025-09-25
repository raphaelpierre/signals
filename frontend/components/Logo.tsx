import React from 'react';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'full' | 'icon' | 'horizontal';
  className?: string;
  clickable?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ 
  size = 'medium', 
  variant = 'full',
  className = '',
  clickable = false
}) => {
  const dimensions = {
    small: { 
      icon: 'w-8 h-8', 
      full: 'w-32 h-8',
      horizontal: 'w-40 h-8'
    },
    medium: { 
      icon: 'w-12 h-12', 
      full: 'w-48 h-12',
      horizontal: 'w-56 h-10'
    },
    large: { 
      icon: 'w-16 h-16', 
      full: 'w-64 h-16',
      horizontal: 'w-72 h-12'
    }
  };

  const textSize = {
    small: 'text-lg',
    medium: 'text-xl',
    large: 'text-2xl'
  };

  // Chart icon component matching your image
  const ChartIcon = ({ iconSize }: { iconSize: string }) => (
    <div className={`${iconSize} flex items-end justify-center gap-1 p-1`}>
      {/* Orange bar */}
      <div className="w-2 h-4 bg-orange-400 rounded-sm"></div>
      {/* Teal bar */}
      <div className="w-2 h-6 bg-cyan-400 rounded-sm"></div>
      {/* Orange bar */}
      <div className="w-2 h-3 bg-orange-400 rounded-sm"></div>
      {/* Teal bar with arrow */}
      <div className="relative">
        <div className="w-2 h-5 bg-cyan-400 rounded-sm"></div>
        {/* Arrow */}
        <div className="absolute -top-1 -right-1">
          <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
            <path d="M1 7 L7 1 M7 1 L7 4 M7 1 L4 1" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </div>
  );

  if (variant === 'icon') {
    return (
      <div className={`${dimensions[size].icon} ${className} ${clickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}>
        <ChartIcon iconSize="w-full h-full" />
      </div>
    );
  }

  if (variant === 'horizontal') {
    return (
      <div className={`${dimensions[size].horizontal} ${className} ${clickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''} flex items-center gap-2`}>
        <ChartIcon iconSize={size === 'small' ? 'w-6 h-6' : size === 'medium' ? 'w-8 h-8' : 'w-10 h-10'} />
        <span className={`font-bold text-white ${textSize[size]} tracking-tight`}>
          SignalStack
        </span>
      </div>
    );
  }

  // Full variant - stacked logo and text
  return (
    <div className={`${dimensions[size].full} ${className} ${clickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''} flex flex-col items-center justify-center gap-2`}>
      <ChartIcon iconSize={size === 'small' ? 'w-8 h-8' : size === 'medium' ? 'w-12 h-12' : 'w-16 h-16'} />
      <span className={`font-bold text-white ${textSize[size]} tracking-tight`}>
        SignalStack
      </span>
    </div>
  );
};

export default Logo;