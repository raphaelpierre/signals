import Link from 'next/link';
import { ReactNode } from 'react';
import MiniPriceTicker from '@/components/MiniPriceTicker';

interface LayoutProps {
  children: ReactNode;
  token?: string | null;
  onLogout?: () => void;
}

export const Layout = ({ children, token, onLogout }: LayoutProps) => {
  return (
    <div className="container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ 
                width: '2.5rem', 
                height: '2.5rem', 
                borderRadius: '50%', 
                background: 'linear-gradient(135deg, #22d3ee, #0ea5e9)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center' 
              }}>
                <span style={{ fontSize: '1.2rem' }}>📈</span>
              </div>
              <span style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f8fafc' }}>SignalStack</span>
            </div>
          </Link>
          {token && (
            <div style={{ display: 'flex', gap: '1rem' }}>
              <MiniPriceTicker symbol="BTCUSDT" />
              <MiniPriceTicker symbol="ETHUSDT" />
            </div>
          )}
        </div>
        <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {!token && (
            <>
              <Link href="/what-are-signals" style={{ color: '#e2e8f0', textDecoration: 'none' }}>What are Signals?</Link>
              <Link href="/strategy" style={{ color: '#e2e8f0', textDecoration: 'none' }}>Strategy</Link>
              <Link href="/historic-signals" style={{ color: '#e2e8f0', textDecoration: 'none' }}>Performance</Link>
              <Link href="/about" style={{ color: '#e2e8f0', textDecoration: 'none' }}>About</Link>
              <Link href="/pricing" style={{ color: '#e2e8f0', textDecoration: 'none' }}>Pricing</Link>
            </>
          )}
          {token ? (
            <>
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/live-trading" style={{ color: '#22d3ee', textDecoration: 'none' }}>⚡ Live Trading</Link>
              <Link href="/charts">Charts</Link>
              <Link href="/my-signals">My Signals</Link>
              <button className="button" style={{ width: 'auto', padding: '0.5rem 1rem' }} onClick={onLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login">Login</Link>
              <Link href="/register">Register</Link>
            </>
          )}
        </nav>
      </header>
      {children}
    </div>
  );
};

export default Layout;
