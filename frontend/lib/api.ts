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
  created_at: string;
}

export const fetchSignals = async (): Promise<Signal[]> => {
  const response = await apiClient.get<Signal[]>('/signals/latest');
  return response.data;
};
