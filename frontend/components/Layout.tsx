import Link from 'next/link';
import { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  token?: string | null;
  onLogout?: () => void;
}

export const Layout = ({ children, token, onLogout }: LayoutProps) => {
  return (
    <div className="container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <Link href="/">
          <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>SignalStack</span>
        </Link>
        <nav style={{ display: 'flex', gap: '1rem' }}>
          {token ? (
            <>
              <Link href="/dashboard">Dashboard</Link>
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
