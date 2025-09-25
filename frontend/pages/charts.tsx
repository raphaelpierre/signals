import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import Layout from '@/components/Layout';
import PriceChart from '@/components/PriceChart';
import VolumeChart from '@/components/VolumeChart';
import { setAuthToken } from '@/lib/api';

const ChartsPage = () => {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT');

  const symbols = [
    { value: 'BTCUSDT', label: 'Bitcoin (BTC/USDT)' },
    { value: 'ETHUSDT', label: 'Ethereum (ETH/USDT)' },
    { value: 'BNBUSDT', label: 'Binance Coin (BNB/USDT)' },
    { value: 'ADAUSDT', label: 'Cardano (ADA/USDT)' },
    { value: 'DOTUSDT', label: 'Polkadot (DOT/USDT)' },
    { value: 'LINKUSDT', label: 'Chainlink (LINK/USDT)' },
    { value: 'LTCUSDT', label: 'Litecoin (LTC/USDT)' },
    { value: 'XRPUSDT', label: 'Ripple (XRP/USDT)' },
  ];

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      router.replace('/login');
      return;
    }
    setToken(storedToken);
    setAuthToken(storedToken);
  }, []);

  const handleLogout = () => {
    console.log('Logout function called from charts');
    try {
      localStorage.removeItem('token');
      setAuthToken(null);
      setToken(null);
      console.log('Token cleared, redirecting to home');
      router.push('/');
    } catch (error) {
      console.error('Error during logout:', error);
      router.push('/');
    }
  };

  return (
    <Layout token={token} onLogout={handleLogout}>
      <Head>
        <title>Charts | SignalStack</title>
      </Head>
      
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Price Charts</h1>
        <p className="text-gray-600">
          Real-time cryptocurrency price charts with technical analysis tools
        </p>
      </div>

      {/* Symbol Selector */}
      <div className="mb-6">
        <label htmlFor="symbol-select" className="block text-sm font-medium text-gray-700 mb-2">
          Select Cryptocurrency:
        </label>
        <select
          id="symbol-select"
          value={selectedSymbol}
          onChange={(e) => setSelectedSymbol(e.target.value)}
          className="block w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          {symbols.map((symbol) => (
            <option key={symbol.value} value={symbol.value}>
              {symbol.label}
            </option>
          ))}
        </select>
      </div>

      {/* Main Chart */}
      <div className="grid grid-cols-1 gap-6 mb-6">
        <PriceChart symbol={selectedSymbol} height={500} />
      </div>

      {/* Volume Chart */}
      <div className="grid grid-cols-1 gap-6 mb-6">
        <VolumeChart symbol={selectedSymbol} height={200} />
      </div>

      {/* Multiple Timeframe Charts */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Multiple Timeframes</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PriceChart symbol={selectedSymbol} interval="15m" height={300} />
          <PriceChart symbol={selectedSymbol} interval="1h" height={300} />
          <PriceChart symbol={selectedSymbol} interval="4h" height={300} />
          <PriceChart symbol={selectedSymbol} interval="1d" height={300} />
        </div>
      </div>

      {/* Popular Pairs Overview */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Popular Trading Pairs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <PriceChart symbol="BTCUSDT" height={250} />
          <PriceChart symbol="ETHUSDT" height={250} />
          <PriceChart symbol="BNBUSDT" height={250} />
        </div>
      </div>
    </Layout>
  );
};

export default ChartsPage;