-- SQL script to insert sample historic signals for demonstration
-- This populates the signals table with realistic historic data

-- First, let's see what tables we have
\d

-- Insert sample signals with realistic data
INSERT INTO signals (symbol, timeframe, direction, entry_price, target_price, stop_loss, strategy, confidence, risk_reward_ratio, volume_score, technical_indicators, market_conditions, is_active, expires_at, created_at) VALUES
-- Recent high-quality signals (last 7 days)
('BTCUSDT', '4h', 'LONG', 42500.00, 44500.00, 41000.00, 'RSI Oversold + Volume Spike', 85.2, 1.33, 88.5, '{"rsi_14": 28.5, "macd_signal": "bullish", "bb_position": "lower_band", "volume_sma_ratio": 1.8}', 'trending_up', true, NOW() + INTERVAL '24 hours', NOW() - INTERVAL '2 days'),
('ETHUSDT', '1h', 'SHORT', 2650.00, 2580.00, 2720.00, 'Bollinger Band Squeeze Breakout', 78.9, 1.75, 82.1, '{"rsi_14": 72.1, "macd_signal": "bearish", "bb_position": "upper_band", "volume_sma_ratio": 2.2}', 'volatile', true, NOW() + INTERVAL '12 hours', NOW() - INTERVAL '1 day'),
('BNBUSDT', '4h', 'LONG', 315.50, 330.00, 305.00, 'MACD Golden Cross', 92.1, 1.38, 91.8, '{"rsi_14": 42.8, "macd_signal": "bullish", "bb_position": "middle", "volume_sma_ratio": 1.5}', 'trending_up', true, NOW() + INTERVAL '18 hours', NOW() - INTERVAL '3 days'),
('SOLUSDT', '1h', 'LONG', 88.50, 95.20, 83.00, 'Support/Resistance Bounce', 81.7, 1.23, 86.4, '{"rsi_14": 35.2, "macd_signal": "bullish", "bb_position": "lower_band", "volume_sma_ratio": 1.9}', 'consolidating', true, NOW() + INTERVAL '6 hours', NOW() - INTERVAL '4 days'),
('ADAUSDT', '4h', 'SHORT', 0.4800, 0.4600, 0.4950, 'Volume Profile Reversal', 88.4, 1.33, 85.9, '{"rsi_14": 68.7, "macd_signal": "bearish", "bb_position": "upper_band", "volume_sma_ratio": 2.1}', 'high_volume', false, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '5 days'),

-- Medium-term historic signals (8-30 days ago)
('LINKUSDT', '1d', 'LONG', 13.80, 16.50, 12.20, 'Multi-Timeframe Confluence', 89.6, 1.69, 92.3, '{"rsi_14": 31.4, "macd_signal": "bullish", "bb_position": "lower_band", "volume_sma_ratio": 2.3}', 'trending_up', false, NOW() - INTERVAL '5 days', NOW() - INTERVAL '8 days'),
('MATICUSDT', '4h', 'SHORT', 0.9200, 0.8500, 0.9750, 'Mean Reversion Signal', 84.2, 1.28, 87.1, '{"rsi_14": 78.9, "macd_signal": "bearish", "bb_position": "upper_band", "volume_sma_ratio": 1.7}', 'sideways', false, NOW() - INTERVAL '8 days', NOW() - INTERVAL '12 days'),
('DOTUSDT', '4h', 'LONG', 7.20, 8.10, 6.70, 'Momentum Breakout', 91.8, 1.80, 89.7, '{"rsi_14": 38.6, "macd_signal": "bullish", "bb_position": "middle", "volume_sma_ratio": 2.0}', 'trending_up', false, NOW() - INTERVAL '10 days', NOW() - INTERVAL '15 days'),
('AVAXUSDT', '1h', 'LONG', 26.50, 29.80, 24.50, 'RSI Oversold + Volume Spike', 86.3, 1.65, 88.9, '{"rsi_14": 25.8, "macd_signal": "bullish", "bb_position": "lower_band", "volume_sma_ratio": 2.4}', 'volatile', false, NOW() - INTERVAL '12 days', NOW() - INTERVAL '18 days'),
('UNIUSDT', '4h', 'SHORT', 6.80, 6.20, 7.25, 'Bollinger Band Squeeze Breakout', 83.7, 1.33, 81.5, '{"rsi_14": 71.3, "macd_signal": "bearish", "bb_position": "upper_band", "volume_sma_ratio": 1.6}', 'high_volume', false, NOW() - INTERVAL '15 days', NOW() - INTERVAL '22 days'),

-- Older historic signals (31-90 days ago) - High quality for demo
('BTCUSDT', '1d', 'LONG', 38500.00, 42800.00, 36200.00, 'Multi-Timeframe Confluence', 94.5, 1.87, 93.8, '{"rsi_14": 28.9, "macd_signal": "bullish", "bb_position": "lower_band", "volume_sma_ratio": 2.8}', 'trending_up', false, NOW() - INTERVAL '28 days', NOW() - INTERVAL '35 days'),
('ETHUSDT', '4h', 'LONG', 2180.00, 2450.00, 2050.00, 'Support/Resistance Bounce', 92.1, 2.08, 91.4, '{"rsi_14": 32.1, "macd_signal": "bullish", "bb_position": "lower_band", "volume_sma_ratio": 2.5}', 'consolidating', false, NOW() - INTERVAL '35 days', NOW() - INTERVAL '42 days'),
('BNBUSDT', '1h', 'SHORT', 340.00, 315.00, 358.00, 'Volume Profile Reversal', 87.9, 1.39, 86.2, '{"rsi_14": 76.4, "macd_signal": "bearish", "bb_position": "upper_band", "volume_sma_ratio": 2.1}', 'trending_down', false, NOW() - INTERVAL '40 days', NOW() - INTERVAL '48 days'),
('SOLUSDT', '4h', 'LONG', 78.50, 87.20, 73.00, 'MACD Golden Cross', 90.6, 1.58, 89.3, '{"rsi_14": 35.7, "macd_signal": "bullish", "bb_position": "middle", "volume_sma_ratio": 2.0}', 'trending_up', false, NOW() - INTERVAL '48 days', NOW() - INTERVAL '55 days'),
('ADAUSDT', '1d', 'LONG', 0.3800, 0.4550, 0.3450, 'Mean Reversion Signal', 88.2, 2.14, 87.6, '{"rsi_14": 29.8, "macd_signal": "bullish", "bb_position": "lower_band", "volume_sma_ratio": 2.6}', 'sideways', false, NOW() - INTERVAL '55 days', NOW() - INTERVAL '62 days'),

-- Additional variety signals
('LINKUSDT', '4h', 'SHORT', 15.80, 14.20, 16.90, 'Momentum Breakout', 85.4, 1.45, 84.8, '{"rsi_14": 69.2, "macd_signal": "bearish", "bb_position": "upper_band", "volume_sma_ratio": 1.8}', 'volatile', false, NOW() - INTERVAL '60 days', NOW() - INTERVAL '68 days'),
('MATICUSDT', '1h', 'LONG', 0.7500, 0.8650, 0.6950, 'RSI Oversold + Volume Spike', 91.3, 2.09, 90.7, '{"rsi_14": 26.4, "macd_signal": "bullish", "bb_position": "lower_band", "volume_sma_ratio": 2.7}', 'trending_up', false, NOW() - INTERVAL '68 days', NOW() - INTERVAL '75 days'),
('DOTUSDT', '1d', 'SHORT', 8.90, 7.80, 9.70, 'Bollinger Band Squeeze Breakout', 89.7, 1.38, 88.1, '{"rsi_14": 73.8, "macd_signal": "bearish", "bb_position": "upper_band", "volume_sma_ratio": 1.9}', 'high_volume', false, NOW() - INTERVAL '75 days', NOW() - INTERVAL '82 days'),
('AVAXUSDT', '4h', 'LONG', 22.80, 26.90, 20.50, 'Support/Resistance Bounce', 93.8, 1.78, 92.5, '{"rsi_14": 31.2, "macd_signal": "bullish", "bb_position": "lower_band", "volume_sma_ratio": 2.4}', 'consolidating', false, NOW() - INTERVAL '80 days', NOW() - INTERVAL '88 days'),
('UNIUSDT', '1h', 'LONG', 5.90, 6.85, 5.40, 'Multi-Timeframe Confluence', 87.6, 1.90, 86.9, '{"rsi_14": 33.5, "macd_signal": "bullish", "bb_position": "middle", "volume_sma_ratio": 2.2}', 'trending_up', false, NOW() - INTERVAL '85 days', NOW() - INTERVAL '92 days');

-- Check what we inserted
SELECT COUNT(*) as total_signals FROM signals;
SELECT direction, COUNT(*) as count FROM signals GROUP BY direction;
SELECT symbol, COUNT(*) as count FROM signals GROUP BY symbol ORDER BY symbol;
SELECT AVG(confidence) as avg_confidence, AVG(risk_reward_ratio) as avg_risk_reward FROM signals;