import React, { useState, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
  ChartOptions,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface CandlestickData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface PriceChartProps {
  symbol?: string;
  interval?: string;
  className?: string;
  height?: number;
}

const PriceChart: React.FC<PriceChartProps> = ({
  symbol = 'BTCUSDT',
  interval = '1h',
  className = '',
  height = 400
}) => {
  const [chartData, setChartData] = useState<CandlestickData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInterval, setSelectedInterval] = useState(interval);
  const [chartType, setChartType] = useState<'line' | 'candlestick'>('line');

  const fetchChartData = async () => {
    try {
      setError(null);
      setLoading(true);
      
      // Fetch kline data from Binance API
      const response = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${selectedInterval}&limit=100`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch chart data');
      }
      
      const data = await response.json();
      
      const candlestickData: CandlestickData[] = data.map((item: any[]) => ({
        time: item[0], // Open time
        open: parseFloat(item[1]),
        high: parseFloat(item[2]),
        low: parseFloat(item[3]),
        close: parseFloat(item[4]),
        volume: parseFloat(item[5])
      }));
      
      setChartData(candlestickData);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch chart data');
      setLoading(false);
      console.error('Chart data fetch error:', err);
    }
  };

  useEffect(() => {
    fetchChartData();
    const interval = setInterval(fetchChartData, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [symbol, selectedInterval]);

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return price.toFixed(2);
    } else if (price >= 1) {
      return price.toFixed(4);
    } else {
      return price.toFixed(6);
    }
  };

  const getLineChartData = () => {
    return {
      labels: chartData.map(item => new Date(item.time)),
      datasets: [
        {
          label: `${symbol.replace('USDT', '')} Price`,
          data: chartData.map(item => item.close),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.1,
          pointRadius: 0,
          pointHoverRadius: 6,
        }
      ]
    };
  };

  const getCandlestickChartData = () => {
    // For candlestick, we'll create separate datasets for high, low bars
    return {
      labels: chartData.map(item => new Date(item.time)),
      datasets: [
        {
          label: 'High-Low Range',
          data: chartData.map(item => item.high - item.low),
          backgroundColor: chartData.map(item => 
            item.close >= item.open 
              ? 'rgba(34, 197, 94, 0.6)' // Green for bullish
              : 'rgba(239, 68, 68, 0.6)'  // Red for bearish
          ),
          borderColor: chartData.map(item => 
            item.close >= item.open 
              ? 'rgb(34, 197, 94)' 
              : 'rgb(239, 68, 68)'
          ),
          borderWidth: 1,
        }
      ]
    };
  };

  const chartOptions: ChartOptions<'line' | 'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index',
    },
    plugins: {
      title: {
        display: true,
        text: `${symbol.replace('USDT', '')}/USDT ${selectedInterval.toUpperCase()} Chart`,
        font: {
          size: 16,
          weight: 'bold',
        },
      },
      legend: {
        display: true,
        position: 'top',
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(59, 130, 246, 0.5)',
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            const dataIndex = context.dataIndex;
            const data = chartData[dataIndex];
            if (chartType === 'candlestick' && data) {
              return [
                `Open: $${formatPrice(data.open)}`,
                `High: $${formatPrice(data.high)}`,
                `Low: $${formatPrice(data.low)}`,
                `Close: $${formatPrice(data.close)}`,
                `Volume: ${data.volume.toLocaleString()}`
              ];
            } else {
              return `${context.dataset.label}: $${formatPrice(context.parsed.y)}`;
            }
          }
        }
      }
    },
    scales: {
      x: {
        type: 'time',
        time: {
          displayFormats: {
            minute: 'HH:mm',
            hour: 'MMM dd HH:mm',
            day: 'MMM dd',
          }
        },
        grid: {
          display: false,
        },
      },
      y: {
        position: 'right',
        grid: {
          color: 'rgba(156, 163, 175, 0.2)',
        },
        ticks: {
          callback: function(value) {
            return '$' + formatPrice(Number(value));
          }
        }
      }
    },
  };

  const intervals = [
    { value: '5m', label: '5m' },
    { value: '15m', label: '15m' },
    { value: '1h', label: '1h' },
    { value: '4h', label: '4h' },
    { value: '1d', label: '1d' },
  ];

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Price Chart</h3>
        </div>
        <div 
          className="flex items-center justify-center bg-gray-100 rounded animate-pulse"
          style={{ height: `${height}px` }}
        >
          <span className="text-gray-500">Loading chart...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Price Chart</h3>
        </div>
        <div 
          className="flex flex-col items-center justify-center bg-red-50 rounded border border-red-200"
          style={{ height: `${height}px` }}
        >
          <span className="text-red-600 mb-2">{error}</span>
          <button 
            onClick={fetchChartData}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
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
        <h3 className="text-lg font-semibold text-gray-800">
          {symbol.replace('USDT', '')}/USDT Chart
        </h3>
        <div className="flex items-center space-x-2">
          <div className="flex bg-gray-100 rounded p-1">
            <button
              onClick={() => setChartType('line')}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                chartType === 'line'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Line
            </button>
            <button
              onClick={() => setChartType('candlestick')}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                chartType === 'candlestick'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              OHLC
            </button>
          </div>
          <div className="flex bg-gray-100 rounded p-1">
            {intervals.map((int) => (
              <button
                key={int.value}
                onClick={() => setSelectedInterval(int.value)}
                className={`px-3 py-1 text-sm rounded transition-colors ${
                  selectedInterval === int.value
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {int.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div style={{ height: `${height}px`, position: 'relative' }}>
        {chartType === 'line' ? (
          <Line data={getLineChartData()} options={chartOptions as ChartOptions<'line'>} />
        ) : (
          <Bar data={getCandlestickChartData()} options={chartOptions as ChartOptions<'bar'>} />
        )}
      </div>
      
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="flex justify-between text-sm text-gray-500">
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
          <span>Data from Binance • Updates every minute</span>
        </div>
      </div>
    </div>
  );
};

export default PriceChart;