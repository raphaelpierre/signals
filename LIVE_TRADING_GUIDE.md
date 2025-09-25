# Live Trading Setup Guide

Your Signals application now includes live trading capabilities through CCXT exchange integration! Here's how to get started:

## 🚀 Getting Started

1. **Access Live Trading**: Visit [http://localhost:3000/live-trading](http://localhost:3000/live-trading)
2. **Log in** to your account if you haven't already
3. **Navigate to the Exchange Management tab** to connect your first exchange

## 🔐 Security Features

- **API Key Encryption**: All API credentials are encrypted using Fernet encryption
- **Sandbox Mode**: Start with testnet/sandbox accounts for safe testing
- **No Private Key Storage**: Only API keys are stored, never private wallet keys
- **Secure Validation**: Connection testing before saving credentials

## 📋 Supported Exchanges

- Binance (binance)
- Coinbase Pro (coinbase) 
- Kraken (kraken)
- KuCoin (kucoin)
- Bybit (bybit)
- OKX (okx)
- Huobi (huobi)
- Bitfinex (bitfinex)

## 🔧 How to Add Exchange API Keys

### For Binance:
1. Go to Binance → Account → API Management
2. Create a new API key
3. **Enable "Spot & Margin Trading"**
4. **Disable "Enable Withdrawals"** (for security)
5. Add your server IP to restricted IPs (optional but recommended)

### For Coinbase Pro:
1. Go to Coinbase Pro → Profile → API
2. Create a new API key
3. **Enable "View" and "Trade"** permissions
4. **Disable "Transfer"** permission (for security)

### For Kraken:
1. Go to Kraken → Settings → API
2. Create a new API key
3. **Enable "Query Funds" and "Create & Modify Orders"**
4. **Disable "Withdraw Funds"** (for security)

## ⚠️ Important Security Warnings

- **Start with sandbox/testnet accounts** to practice safely
- **Never enable withdrawal permissions** on API keys used for trading signals
- **Use IP restrictions** when possible to limit API key usage
- **Monitor your accounts regularly** for unauthorized activity
- **Start with small position sizes** to test the system

## 📊 Live Trading Workflow

1. **Connect Exchange**: Add your exchange API credentials
2. **Test Connection**: Verify your credentials work and fetch account balance  
3. **Enable Live Trading**: Toggle from sandbox to live mode when ready
4. **Set Position Sizes**: Configure how much to trade per signal
5. **Monitor Positions**: Track your active trades in the Trading Positions tab

## 🛠️ API Endpoints

The system includes these new endpoints:
- `GET /api/v1/exchanges/supported` - List supported exchanges
- `POST /api/v1/exchanges/connections` - Add exchange connection
- `GET /api/v1/exchanges/connections` - List your connections
- `POST /api/v1/exchanges/test-connection` - Test connection
- `POST /api/v1/exchanges/execute-trade` - Execute live trade
- `GET /api/v1/exchanges/positions` - Get trading positions

## 📈 Features Included

- ✅ Secure API credential storage with encryption
- ✅ Multi-exchange support with standardized interface
- ✅ Sandbox/testnet mode for safe testing  
- ✅ Real-time balance fetching and validation
- ✅ Position tracking and P&L monitoring
- ✅ One-click trading from signal alerts
- ✅ Comprehensive setup guides for each exchange
- ✅ Security best practices and warnings

## 🔄 Next Steps

1. **Create a testnet account** on your preferred exchange
2. **Generate API keys** with appropriate permissions
3. **Add the exchange** in sandbox mode first
4. **Test with small amounts** before going live
5. **Monitor and adjust** position sizes based on performance

## 🆘 Support

If you encounter any issues:
1. Check the connection status in Exchange Management
2. Verify your API key permissions on the exchange
3. Ensure you're in the correct mode (sandbox vs live)
4. Check the error messages in the browser developer console

Happy trading! 🚀