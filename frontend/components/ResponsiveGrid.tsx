import React, { ReactNode, CSSProperties } from 'react';

interface ResponsiveGridProps {
  children: ReactNode;
  columns?: {
    default: string;
    tablet?: string;
    mobile?: string;
  };
  gap?: string;
  className?: string;
  style?: CSSProperties;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  columns = { default: '1fr' },
  gap = '2rem',
  className = '',
  style = {}
}) => {
  const gridStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: columns.default,
    gap,
    ...style
  };

  // Add responsive classes
  const responsiveClasses = [
    className,
    columns.tablet ? 'responsive-grid-tablet' : '',
    columns.mobile ? 'responsive-grid-mobile' : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={responsiveClasses} style={gridStyle}>
      {children}
      <style jsx>{`
        @media (max-width: 1024px) {
          .responsive-grid-tablet {
            grid-template-columns: ${columns.tablet || '1fr'} !important;
          }
        }
        
        @media (max-width: 768px) {
          .responsive-grid-mobile {
            grid-template-columns: ${columns.mobile || '1fr'} !important;
            gap: 1.5rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ResponsiveGrid;