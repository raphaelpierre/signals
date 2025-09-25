import React, { useState, useEffect } from 'react';

interface CoinPrice {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  changePercent24h: number;
}

interface CoinPriceWidgetProps {
  symbols?: string[];
  className?: string;
}

const CoinPriceWidget: React.FC<CoinPriceWidgetProps> = ({ 
  symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT'], 
  className = '' 
}) => {
  const [prices, setPrices] = useState<CoinPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = async () => {
    try {
      setError(null);
      
      // Using Binance API for real-time prices
      const responses = await Promise.all(
        symbols.map(async (symbol) => {
          const [tickerResponse, priceResponse] = await Promise.all([
            fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`),
            fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`)
          ]);
          
          const tickerData = await tickerResponse.json();
          const priceData = await priceResponse.json();
          
          return {
            symbol: symbol,
            name: symbol.replace('USDT', ''),
            price: parseFloat(priceData.price),
            change24h: parseFloat(tickerData.priceChange),
            changePercent24h: parseFloat(tickerData.priceChangePercent)
          };
        })
      );
      
      setPrices(responses);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch price data');
      setLoading(false);
      console.error('Price fetch error:', err);
    }
  };

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, [symbols]);

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(price);
    } else if (price >= 1) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 4,
        maximumFractionDigits: 4
      }).format(price);
    } else {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 6,
        maximumFractionDigits: 6
      }).format(price);
    }
  };

  const formatChange = (change: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Live Prices</h3>
        <div className="space-y-3">
          {symbols.map((symbol, index) => (
            <div key={index} className="flex justify-between items-center animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-16"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Live Prices</h3>
        <div className="text-red-600 text-center py-4">
          <p>{error}</p>
          <button 
            onClick={fetchPrices}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Live Prices</h3>
        <div className="flex items-center text-sm text-gray-500">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
          Live
        </div>
      </div>
      
      <div className="space-y-3">
        {prices.map((coin) => (
          <div key={coin.symbol} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
            <div className="flex flex-col">
              <span className="font-medium text-gray-900">{coin.name}</span>
              <span className="text-xs text-gray-500">{coin.symbol}</span>
            </div>
            
            <div className="flex flex-col items-end">
              <span className="font-semibold text-gray-900">
                {formatPrice(coin.price)}
              </span>
              <span 
                className={`text-sm font-medium ${
                  coin.changePercent24h >= 0 
                    ? 'text-green-600' 
                    : 'text-red-600'
                }`}
              >
                {formatChange(coin.changePercent24h)}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Updates every 30 seconds • Data from Binance
        </p>
      </div>
    </div>
  );
};

export default CoinPriceWidget;