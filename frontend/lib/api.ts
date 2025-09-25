import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const setAuthToken = (token: string | null) => {
  if (token) {
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common.Authorization;
  }
};

export interface Signal {
  id: number;
  symbol: string;
  timeframe: string;
  direction: string;
  entry_price: number;
  target_price: number;
  stop_loss: number;
  strategy?: string;
  strategy_id?: string;
  confidence?: number;
  quality_score?: number;
  risk_reward_ratio?: number;
  volume_score?: number;
  technical_indicators?: any;
  rationale?: string[];
  regime?: {
    trend?: string;
    vol?: string;
    liq?: string;
  };
  market_conditions?: string;
  latency_ms?: number;
  bt_winrate?: number;
  bt_pf?: number;
  risk_pct?: number;
  is_active?: boolean;
  expires_at?: string;
  created_at: string;
}

export interface SignalAnalytics {
  total_signals: number;
  active_signals: number;
  long_signals: number;
  short_signals: number;
  avg_confidence: number;
  avg_risk_reward: number;
  top_performing_pairs: Array<{
    symbol: string;
    signal_count: number;
    avg_confidence: number;
  }>;
}

export interface UserSignal {
  id: number;
  user_id: number;
  signal_id: number;
  action_type: 'taken' | 'ignored' | 'closed';
  entry_price?: number;
  exit_price?: number;
  quantity?: number;
  outcome: 'profit' | 'loss' | 'breakeven' | 'pending';
  pnl_amount?: number;
  pnl_percentage?: number;
  notes?: string;
  action_date: string;
  exit_date?: string;
  created_at: string;
  updated_at: string;
}

export interface SignalStats {
  total_signals_given: number;
  signals_taken: number;
  signals_closed: number;
  total_pnl: number;
  avg_pnl_percentage: number;
  win_rate: number;
  profitable_trades: number;
  losing_trades: number;
}

export interface TakeSignalData {
  signal_id: number;
  entry_price: number;
  quantity: number;
  notes?: string;
}

export interface CloseSignalData {
  exit_price: number;
  notes?: string;
  exit_date?: string;
}

export const fetchSignals = async (): Promise<Signal[]> => {
  const response = await apiClient.get<Signal[]>('/signals/latest');
  return response.data;
};

export const fetchSignalAnalytics = async (days: number = 7): Promise<SignalAnalytics> => {
  const response = await apiClient.get<SignalAnalytics>(`/signals/analytics?days=${days}`);
  return response.data;
};

export const fetchHighConfidenceSignals = async (minConfidence: number = 80): Promise<Signal[]> => {
  const response = await apiClient.get<Signal[]>(`/signals/high-confidence?min_confidence=${minConfidence}`);
  return response.data;
};

export const takeSignal = async (data: TakeSignalData): Promise<UserSignal> => {
  const response = await apiClient.post<UserSignal>('/user-signals/take', data);
  return response.data;
};

export const closeSignal = async (userSignalId: number, data: CloseSignalData): Promise<UserSignal> => {
  const response = await apiClient.put<UserSignal>(`/user-signals/${userSignalId}/close`, data);
  return response.data;
};

export const fetchMySignals = async (limit: number = 50): Promise<UserSignal[]> => {
  const response = await apiClient.get<UserSignal[]>(`/user-signals/my-signals?limit=${limit}`);
  return response.data;
};

export const fetchSignalStats = async (): Promise<SignalStats> => {
  const response = await apiClient.get<SignalStats>('/user-signals/stats');
  return response.data;
};

// Public historic signals endpoints (no authentication required)
export interface HistoricSignal {
  id: number;
  symbol: string;
  direction: string;
  entry_price: number;
  target_price: number;
  stop_loss: number;
  confidence?: number;
  risk_reward_ratio?: number;
  created_at: string;
  strategy?: string;
}

export interface PerformanceShowcase {
  period_days: number;
  total_signals: number;
  avg_confidence: number;
  avg_risk_reward: number;
  high_confidence_signals: number;
  high_confidence_percentage: number;
  direction_distribution: {
    long: number;
    short: number;
    long_percentage: number;
    short_percentage: number;
  };
  confidence_distribution: {
    high: number;
    medium: number;
    low: number;
  };
  top_symbols: Array<{
    symbol: string;
    signal_count: number;
    avg_confidence: number;
  }>;
}

export const fetchHistoricSignals = async (days: number = 30, limit: number = 50): Promise<HistoricSignal[]> => {
  const response = await apiClient.get<HistoricSignal[]>(`/signals/historic?days=${days}&limit=${limit}`);
  return response.data;
};

export const fetchDemoSignals = async (): Promise<HistoricSignal[]> => {
  const response = await apiClient.get<HistoricSignal[]>('/signals/demo');
  return response.data;
};

export const fetchPerformanceShowcase = async (days: number = 30): Promise<PerformanceShowcase> => {
  const response = await apiClient.get<PerformanceShowcase>(`/signals/performance-showcase?days=${days}`);
  return response.data;
};

// Exchange Connection Types
export interface ExchangeConnection {
  id: number;
  user_id: number;
  exchange_name: string;
  sandbox_mode: boolean;
  is_active: boolean;
  last_connected?: string;
  balance_cache?: any;
  created_at: string;
  updated_at: string;
  api_key_preview: string;
}

export interface ExchangeConnectionCreate {
  exchange_name: string;
  api_key: string;
  api_secret: string;
  api_passphrase?: string;
  sandbox_mode?: boolean;
}

export interface TradingGuide {
  exchange_name: string;
  steps: string[];
  api_permissions: string[];
  security_notes: string[];
  sandbox_instructions?: string;
}

export interface ExchangeBalance {
  exchange_name: string;
  balances: { [key: string]: { free: number; used: number; total: number } };
  timestamp: string;
}

export interface TradingPosition {
  id: number;
  user_id: number;
  exchange_connection_id: number;
  signal_id: number;
  symbol: string;
  side: string;
  quantity: string;
  entry_price?: string;
  current_price?: string;
  order_id?: string;
  order_status: string;
  order_type: string;
  unrealized_pnl?: string;
  realized_pnl?: string;
  status: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
  closed_at?: string;
}

// Exchange API Functions
export const testExchangeConnection = async (data: ExchangeConnectionCreate): Promise<{ success: boolean; error?: string; sandbox_mode?: boolean; message?: string }> => {
  const response = await apiClient.post('/exchanges/test-connection', data);
  return response.data;
};

export const fetchSupportedExchanges = async (): Promise<string[]> => {
  const response = await apiClient.get<string[]>('/exchanges/supported');
  return response.data;
};

export const fetchTradingGuide = async (exchangeName: string): Promise<TradingGuide> => {
  const response = await apiClient.get<TradingGuide>(`/exchanges/guide/${exchangeName}`);
  return response.data;
};

export const fetchExchangeConnections = async (): Promise<ExchangeConnection[]> => {
  const response = await apiClient.get<ExchangeConnection[]>('/exchanges/connections');
  return response.data;
};

export const createExchangeConnection = async (data: ExchangeConnectionCreate): Promise<ExchangeConnection> => {
  const response = await apiClient.post<ExchangeConnection>('/exchanges/connections', data);
  return response.data;
};

export const updateExchangeConnection = async (connectionId: number, data: { is_active?: boolean; sandbox_mode?: boolean }): Promise<ExchangeConnection> => {
  const response = await apiClient.put<ExchangeConnection>(`/exchanges/connections/${connectionId}`, data);
  return response.data;
};

export const deleteExchangeConnection = async (connectionId: number): Promise<void> => {
  await apiClient.delete(`/exchanges/connections/${connectionId}`);
};

export const fetchExchangeBalances = async (connectionId: number): Promise<ExchangeBalance> => {
  const response = await apiClient.get<ExchangeBalance>(`/exchanges/connections/${connectionId}/balances`);
  return response.data;
};

export const executeLiveTrade = async (data: { signal_id: number; exchange_connection_id: number; position_size_percent?: number; order_type?: string }): Promise<TradingPosition> => {
  const response = await apiClient.post<TradingPosition>('/exchanges/trade', data);
  return response.data;
};

export const fetchTradingPositions = async (): Promise<TradingPosition[]> => {
  const response = await apiClient.get<TradingPosition[]>('/exchanges/positions');
  return response.data;
};

// Auto Trading Types
export interface AutoTradingConfig {
  id: number;
  user_id: number;
  exchange_connection_id: number;
  is_enabled: boolean;
  trading_mode: string;
  max_position_size_percent: number;
  max_daily_trades: number;
  max_open_positions: number;
  stop_loss_enabled: boolean;
  take_profit_enabled: boolean;
  min_confidence_score: number;
  allowed_symbols?: string[];
  blocked_symbols?: string[];
  allowed_strategies?: string[];
  follow_portfolio_allocation: boolean;
  rebalance_frequency: string;
  target_allocations?: Record<string, number>;
  created_at: string;
  updated_at: string;
  last_trade_at?: string;
}

export interface AutoTradingConfigCreate {
  exchange_connection_id: number;
  is_enabled?: boolean;
  trading_mode?: string;
  max_position_size_percent?: number;
  max_daily_trades?: number;
  max_open_positions?: number;
  stop_loss_enabled?: boolean;
  take_profit_enabled?: boolean;
  min_confidence_score?: number;
  allowed_symbols?: string[];
  blocked_symbols?: string[];
  allowed_strategies?: string[];
  follow_portfolio_allocation?: boolean;
  rebalance_frequency?: string;
  target_allocations?: Record<string, number>;
}

export interface AutoTrade {
  id: number;
  config_id: number;
  signal_id: number;
  trading_position_id?: number;
  symbol: string;
  action: string;
  trigger_reason: string;
  executed: boolean;
  execution_price?: string;
  quantity: string;
  error_message?: string;
  created_at: string;
  executed_at?: string;
}

export interface PortfolioAllocation {
  id: number;
  user_id: number;
  symbol: string;
  target_percentage: number;
  current_percentage?: number;
  min_investment_amount: number;
  auto_rebalance: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_rebalanced_at?: string;
}

export interface PortfolioAllocationCreate {
  symbol: string;
  target_percentage: number;
  min_investment_amount?: number;
  auto_rebalance?: boolean;
}

export interface CryptoWatchlist {
  id: number;
  user_id: number;
  symbol: string;
  priority: number;
  auto_trade_enabled: boolean;
  price_alerts_enabled: boolean;
  price_alert_above?: number;
  price_alert_below?: number;
  volume_alert_enabled: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CryptoWatchlistCreate {
  symbol: string;
  priority?: number;
  auto_trade_enabled?: boolean;
  price_alerts_enabled?: boolean;
  price_alert_above?: number;
  price_alert_below?: number;
  volume_alert_enabled?: boolean;
}

export interface PortfolioAnalytics {
  total_value_usd: number;
  total_allocated_percentage: number;
  unallocated_percentage: number;
  rebalance_needed: boolean;
  next_rebalance_date?: string;
  allocations: PortfolioAllocation[];
  performance_24h: number;
  performance_7d: number;
  performance_30d: number;
}

export interface InvestmentRecommendation {
  symbol: string;
  action: string;
  recommended_percentage: number;
  current_percentage: number;
  reason: string;
  confidence: number;
  risk_level: string;
}

// Auto Trading API Functions
export const createAutoTradingConfig = async (data: AutoTradingConfigCreate): Promise<AutoTradingConfig> => {
  const response = await apiClient.post<AutoTradingConfig>('/auto-trading/config', data);
  return response.data;
};

export const fetchAutoTradingConfigs = async (): Promise<AutoTradingConfig[]> => {
  const response = await apiClient.get<AutoTradingConfig[]>('/auto-trading/config');
  return response.data;
};

export const updateAutoTradingConfig = async (configId: number, data: Partial<AutoTradingConfig>): Promise<AutoTradingConfig> => {
  const response = await apiClient.put<AutoTradingConfig>(`/auto-trading/config/${configId}`, data);
  return response.data;
};

export const deleteAutoTradingConfig = async (configId: number): Promise<void> => {
  await apiClient.delete(`/auto-trading/config/${configId}`);
};

export const fetchAutoTrades = async (configId?: number): Promise<AutoTrade[]> => {
  const params = configId ? { config_id: configId } : {};
  const response = await apiClient.get<AutoTrade[]>('/auto-trading/trades', { params });
  return response.data;
};

export const createPortfolioAllocation = async (data: PortfolioAllocationCreate): Promise<PortfolioAllocation> => {
  const response = await apiClient.post<PortfolioAllocation>('/auto-trading/portfolio', data);
  return response.data;
};

export const fetchPortfolioAllocations = async (): Promise<PortfolioAllocation[]> => {
  const response = await apiClient.get<PortfolioAllocation[]>('/auto-trading/portfolio');
  return response.data;
};

export const updatePortfolioAllocation = async (allocationId: number, data: Partial<PortfolioAllocation>): Promise<PortfolioAllocation> => {
  const response = await apiClient.put<PortfolioAllocation>(`/auto-trading/portfolio/${allocationId}`, data);
  return response.data;
};

export const deletePortfolioAllocation = async (allocationId: number): Promise<void> => {
  await apiClient.delete(`/auto-trading/portfolio/${allocationId}`);
};

export const fetchPortfolioAnalytics = async (): Promise<PortfolioAnalytics> => {
  const response = await apiClient.get<PortfolioAnalytics>('/auto-trading/portfolio/analytics');
  return response.data;
};

export const addToWatchlist = async (data: CryptoWatchlistCreate): Promise<CryptoWatchlist> => {
  const response = await apiClient.post<CryptoWatchlist>('/auto-trading/watchlist', data);
  return response.data;
};

export const fetchWatchlist = async (): Promise<CryptoWatchlist[]> => {
  const response = await apiClient.get<CryptoWatchlist[]>('/auto-trading/watchlist');
  return response.data;
};

export const updateWatchlistItem = async (itemId: number, data: Partial<CryptoWatchlist>): Promise<CryptoWatchlist> => {
  const response = await apiClient.put<CryptoWatchlist>(`/auto-trading/watchlist/${itemId}`, data);
  return response.data;
};

export const removeFromWatchlist = async (itemId: number): Promise<void> => {
  await apiClient.delete(`/auto-trading/watchlist/${itemId}`);
};

export const fetchInvestmentRecommendations = async (): Promise<InvestmentRecommendation[]> => {
  const response = await apiClient.get<InvestmentRecommendation[]>('/auto-trading/recommendations');
  return response.data;
};
