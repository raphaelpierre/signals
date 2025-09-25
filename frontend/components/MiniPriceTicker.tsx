import React, { useState, useEffect } from 'react';

interface MiniPriceTickerProps {
  symbol?: string;
  className?: string;
}

const MiniPriceTicker: React.FC<MiniPriceTickerProps> = ({ 
  symbol = 'BTCUSDT', 
  className = '' 
}) => {
  const [price, setPrice] = useState<number | null>(null);
  const [change, setChange] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const [tickerResponse, priceResponse] = await Promise.all([
          fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`),
          fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`)
        ]);
        
        const tickerData = await tickerResponse.json();
        const priceData = await priceResponse.json();
        
        setPrice(parseFloat(priceData.price));
        setChange(parseFloat(tickerData.priceChangePercent));
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch price:', err);
        setLoading(false);
      }
    };

    fetchPrice();
    const interval = setInterval(fetchPrice, 30000);
    
    return () => clearInterval(interval);
  }, [symbol]);

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else if (price >= 1) {
      return `$${price.toFixed(4)}`;
    } else {
      return `$${price.toFixed(6)}`;
    }
  };

  if (loading || price === null) {
    return (
      <div className={`inline-flex items-center space-x-2 ${className}`}>
        <div className="w-12 h-4 bg-gray-200 rounded animate-pulse"></div>
        <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center space-x-2 ${className}`}>
      <span className="font-medium text-gray-800">
        {symbol.replace('USDT', '')}
      </span>
      <span className="font-semibold text-gray-900">
        {formatPrice(price)}
      </span>
      <span 
        className={`text-sm font-medium ${
          change >= 0 ? 'text-green-600' : 'text-red-600'
        }`}
      >
        {change >= 0 ? '+' : ''}{change.toFixed(2)}%
      </span>
    </div>
  );
};

export default MiniPriceTicker;