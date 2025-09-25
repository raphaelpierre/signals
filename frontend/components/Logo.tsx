import React from 'react';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'full' | 'icon' | 'horizontal';
  className?: string;
  clickable?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ 
  size = 'medium', 
  variant = 'horizontal',
  className = '',
  clickable = false
}) => {
  const sizeMap = {
    small: { width: '32px', height: '32px', fontSize: '16px' },
    medium: { width: '40px', height: '40px', fontSize: '20px' },
    large: { width: '48px', height: '48px', fontSize: '24px' }
  };

  const dimensions = sizeMap[size];

  // Simple chart icon using CSS
  const ChartIcon = () => (
    <div style={{ 
      width: dimensions.width, 
      height: dimensions.height, 
      display: 'flex', 
      alignItems: 'flex-end', 
      justifyContent: 'center',
      gap: '2px',
      padding: '4px',
      position: 'relative'
    }}>
      {/* Orange bar */}
      <div style={{ 
        width: '4px', 
        height: '50%', 
        backgroundColor: '#fb923c', 
        borderRadius: '1px' 
      }}></div>
      {/* Teal bar */}
      <div style={{ 
        width: '4px', 
        height: '75%', 
        backgroundColor: '#2dd4bf', 
        borderRadius: '1px' 
      }}></div>
      {/* Orange bar */}
      <div style={{ 
        width: '4px', 
        height: '40%', 
        backgroundColor: '#fb923c', 
        borderRadius: '1px' 
      }}></div>
      {/* Teal bar with arrow */}
      <div style={{ position: 'relative' }}>
        <div style={{ 
          width: '4px', 
          height: '65%', 
          backgroundColor: '#2dd4bf', 
          borderRadius: '1px' 
        }}></div>
        {/* Simple arrow */}
        <div style={{ 
          position: 'absolute', 
          top: '-4px', 
          right: '-4px',
          width: '0',
          height: '0',
          borderLeft: '3px solid transparent',
          borderRight: '3px solid transparent',
          borderBottom: '6px solid #2dd4bf',
          transform: 'rotate(45deg)'
        }}></div>
      </div>
    </div>
  );

  const containerStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: variant === 'horizontal' ? '8px' : '4px',
    cursor: clickable ? 'pointer' : 'default',
    opacity: 1,
    transition: 'opacity 0.2s ease',
    ...(variant === 'full' ? { flexDirection: 'column' as const } : {})
  };

  const hoverStyle = clickable ? {
    ':hover': { opacity: 0.8 }
  } : {};

  if (variant === 'icon') {
    return (
      <div 
        className={className}
        style={{
          ...containerStyle,
          ...hoverStyle
        }}
      >
        <ChartIcon />
      </div>
    );
  }

  return (
    <div 
      className={className}
      style={{
        ...containerStyle,
        ...hoverStyle
      }}
    >
      <ChartIcon />
      <span style={{ 
        fontWeight: 700, 
        color: '#f8fafc', 
        fontSize: dimensions.fontSize,
        letterSpacing: '-0.025em'
      }}>
        SignalStack
      </span>
    </div>
  );
};

export default Logo;