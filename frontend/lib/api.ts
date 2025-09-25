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
  confidence?: number;
  risk_reward_ratio?: number;
  volume_score?: number;
  technical_indicators?: any;
  market_conditions?: string;
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
