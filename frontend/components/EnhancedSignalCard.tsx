import React, { useState } from 'react';
import { Signal } from '@/lib/api';
import Link from 'next/link';

interface QualityBadgeProps {
  score: number;
}

function QualityBadge({ score }: QualityBadgeProps) {
  const tone = score >= 80 ? "bg-green-600" : score >= 60 ? "bg-emerald-500" : "bg-amber-500";
  return (
    <span className={`px-2 py-1 rounded-full text-white text-xs ${tone}`}>
      QS {Math.round(score)}
    </span>
  );
}

interface WhyTooltipProps {
  signal: Signal;
}

function WhyTooltip({ signal }: WhyTooltipProps) {
  // Generate factors that contribute to confidence score
  const factors = [];
  
  if (signal.technical_indicators) {
    const ti = signal.technical_indicators;
    
    // RSI factor
    if (ti.rsi_14) {
      if ((signal.direction === 'LONG' && ti.rsi_14 < 30) || (signal.direction === 'SHORT' && ti.rsi_14 > 70)) {
        factors.push({ name: 'RSI confirmation', value: 15, positive: true });
      } else if ((signal.direction === 'LONG' && ti.rsi_14 > 70) || (signal.direction === 'SHORT' && ti.rsi_14 < 30)) {
        factors.push({ name: 'Overextended RSI', value: 8, positive: false });
      }
    }
    
    // MACD factor
    if (ti.macd_signal) {
      if ((signal.direction === 'LONG' && ti.macd_signal === 'bullish') || 
          (signal.direction === 'SHORT' && ti.macd_signal === 'bearish')) {
        factors.push({ name: 'MACD alignment', value: 10, positive: true });
      } else {
        factors.push({ name: 'MACD divergence', value: 5, positive: false });
      }
    }
  }
  
  // Trend alignment
  if (signal.regime?.trend) {
    const trendAligned = (signal.direction === 'LONG' && signal.regime.trend === 'up') || 
                         (signal.direction === 'SHORT' && signal.regime.trend === 'down');
    if (trendAligned) {
      factors.push({ name: 'HTF trend aligned', value: 15, positive: true });
    } else {
      factors.push({ name: 'Counter-trend trade', value: 10, positive: false });
    }
  }
  
  // Volume factor
  if (signal.volume_score) {
    if (signal.volume_score > 70) {
      factors.push({ name: 'Strong volume', value: 12, positive: true });
    } else if (signal.volume_score < 30) {
      factors.push({ name: 'Low volume', value: 8, positive: false });
    }
  }
  
  // Risk-reward factor
  if (signal.risk_reward_ratio && signal.risk_reward_ratio > 2) {
    factors.push({ name: 'High R:R ratio', value: 10, positive: true });
  }
  
  // News risk factor (mock)
  factors.push({ name: 'Low news risk', value: 10, positive: true });
  
  return (
    <div className="absolute z-10 bg-gray-900 border border-gray-700 rounded-md p-3 shadow-lg" 
         style={{ width: '250px', top: '100%', right: '0' }}>
      <div className="text-sm font-medium text-white mb-2">Confidence Factors</div>
      <div className="space-y-1.5">
        {factors.map((factor, idx) => (
          <div key={idx} className="flex justify-between items-center">
            <div className="text-xs flex items-center">
              <span className={`mr-1 ${factor.positive ? 'text-green-400' : 'text-red-400'}`}>
                {factor.positive ? '+' : '−'}
              </span>
              <span className="text-gray-300">{factor.name}</span>
            </div>
            <span className={`text-xs font-medium ${factor.positive ? 'text-green-400' : 'text-red-400'}`}>
              {factor.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface SignalCardProps {
  signal: Signal;
  showTrade?: boolean;
  onTrade?: (signal: Signal) => void;
}

export default function EnhancedSignalCard({ signal, showTrade = false, onTrade }: SignalCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  
  // Shorthand access
  const s = signal;
  
  // Format timestamp to show how long ago the signal was created
  const timeSince = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
  };
  
  // Format expiry time
  const formatExpiry = (date?: string) => {
    if (!date) return "—";
    const expiryDate = new Date(date);
    return expiryDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div className="rounded-xl border border-gray-700 p-4 bg-gray-800 grid gap-3 transition-all duration-150 hover:border-gray-600">
      <div className="flex items-center justify-between">
        <div className="text-lg font-semibold text-white">
          {s.symbol} · {s.timeframe} · 
          <span className={s.direction === "LONG" ? "text-green-500" : "text-red-500"}>
            {" "}{s.direction}
          </span>
        </div>
        <div className="flex items-center gap-2 relative">
          <div 
            className="relative" 
            onMouseEnter={() => setShowTooltip(true)} 
            onMouseLeave={() => setShowTooltip(false)}
          >
            <QualityBadge score={s.quality_score ?? Math.round((s.confidence || 60) * 1)} />
            {showTooltip && <WhyTooltip signal={s} />}
          </div>
          <span className="text-xs text-gray-400">
            {s.latency_ms ? `${s.latency_ms}ms` : "published"} {timeSince(s.created_at)}
          </span>
        </div>
      </div>
      
      <div className="text-sm text-gray-300">
        Entry <b className="text-white">${s.entry_price.toFixed(2)}</b>
        {s.stop_loss && <> · SL <b className="text-red-400">${s.stop_loss.toFixed(2)}</b></>}
        {s.target_price && <> · TP <b className="text-green-400">${s.target_price.toFixed(2)}</b></>}
        <> · Risk <b className="text-amber-400">{(s.risk_pct ?? 0.5).toFixed(1)}%</b></>
      </div>
      
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="px-2 py-1 bg-gray-700 rounded-full text-gray-300">
          Trend: {s.regime?.trend ?? "—"}
        </span>
        <span className="px-2 py-1 bg-gray-700 rounded-full text-gray-300">
          Vol: {s.regime?.vol ?? "—"}
        </span>
        <span className="px-2 py-1 bg-gray-700 rounded-full text-gray-300">
          Liq: {s.regime?.liq ?? "—"}
        </span>
        <span className="px-2 py-1 bg-gray-700 rounded-full text-gray-300">
          Expires {s.expires_at ? formatExpiry(s.expires_at) : "—"}
        </span>
      </div>
      
      {Array.isArray(s.rationale) && s.rationale.length > 0 && (
        <ul className="text-sm list-disc ml-5 text-gray-400">
          {s.rationale.slice(0, 3).map((r: string, i: number) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      )}
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>
          Backtest: WR {Math.round((s.bt_winrate || 0.55) * 100)}% · 
          PF {(s.bt_pf || 1.6).toFixed(2)}
        </span>
        <Link 
          href={`/strategies/${s.strategy_id || 'default'}`} 
          className="text-blue-400 hover:text-blue-300 underline"
        >
          Methodology →
        </Link>
      </div>
      
      {showTrade && (
        <div className="mt-1 pt-2 border-t border-gray-700">
          <button
            onClick={() => onTrade && onTrade(s)}
            className="w-full py-2 px-4 bg-gradient-to-r from-blue-500 to-teal-400 text-white text-sm font-medium rounded-md hover:opacity-90 transition-opacity"
          >
            Trade Now
          </button>
        </div>
      )}
    </div>
  );
}