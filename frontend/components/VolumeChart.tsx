import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface VolumeData {
  time: number;
  volume: number;
  close: number;
  open: number;
}

interface VolumeChartProps {
  symbol?: string;
  interval?: string;
  className?: string;
  height?: number;
}

const VolumeChart: React.FC<VolumeChartProps> = ({
  symbol = 'BTCUSDT',
  interval = '1h',
  className = '',
  height = 200
}) => {
  const [volumeData, setVolumeData] = useState<VolumeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVolumeData = async () => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=50`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch volume data');
      }
      
      const data = await response.json();
      
      const volumeData: VolumeData[] = data.map((item: any[]) => ({
        time: item[0],
        volume: parseFloat(item[5]),
        open: parseFloat(item[1]),
        close: parseFloat(item[4])
      }));
      
      setVolumeData(volumeData);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch volume data');
      setLoading(false);
      console.error('Volume data fetch error:', err);
    }
  };

  useEffect(() => {
    fetchVolumeData();
    const interval = setInterval(fetchVolumeData, 60000);
    
    return () => clearInterval(interval);
  }, [symbol, interval]);

  const formatVolume = (volume: number) => {
    if (volume >= 1e9) {
      return (volume / 1e9).toFixed(2) + 'B';
    } else if (volume >= 1e6) {
      return (volume / 1e6).toFixed(2) + 'M';
    } else if (volume >= 1e3) {
      return (volume / 1e3).toFixed(2) + 'K';
    }
    return volume.toFixed(2);
  };

  const chartData = {
    labels: volumeData.map(item => new Date(item.time)),
    datasets: [
      {
        label: 'Volume',
        data: volumeData.map(item => item.volume),
        backgroundColor: volumeData.map(item => 
          item.close >= item.open 
            ? 'rgba(34, 197, 94, 0.6)' // Green for bullish
            : 'rgba(239, 68, 68, 0.6)'  // Red for bearish
        ),
        borderColor: volumeData.map(item => 
          item.close >= item.open 
            ? 'rgb(34, 197, 94)' 
            : 'rgb(239, 68, 68)'
        ),
        borderWidth: 1,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: `${symbol.replace('USDT', '')} Volume`,
        font: {
          size: 14,
          weight: 'bold' as const,
        },
      },
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        callbacks: {
          label: function(context: any) {
            return `Volume: ${formatVolume(context.parsed.y)}`;
          }
        }
      }
    },
    scales: {
      x: {
        type: 'time' as const,
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
        grid: {
          color: 'rgba(156, 163, 175, 0.2)',
        },
        ticks: {
          callback: function(value: any) {
            return formatVolume(Number(value));
          }
        }
      }
    },
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
        <div 
          className="flex items-center justify-center bg-gray-100 rounded animate-pulse"
          style={{ height: `${height}px` }}
        >
          <span className="text-gray-500">Loading volume...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
        <div 
          className="flex flex-col items-center justify-center bg-red-50 rounded border border-red-200"
          style={{ height: `${height}px` }}
        >
          <span className="text-red-600 mb-2">{error}</span>
          <button 
            onClick={fetchVolumeData}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-4 ${className}`}>
      <div style={{ height: `${height}px`, position: 'relative' }}>
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
};

export default VolumeChart;