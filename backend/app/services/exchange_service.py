import json
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
from cryptography.fernet import Fernet
import ccxt

from app.core.config import settings
from app.schemas.exchange import ExchangeBalanceResponse, TradingGuide

logger = logging.getLogger(__name__)


class ExchangeService:
    def __init__(self):
        # In production, this should come from environment variables
        # For now, we'll generate a key (this means data won't persist across restarts)
        if not hasattr(settings, 'encryption_key') or not settings.encryption_key:
            self.fernet = Fernet(Fernet.generate_key())
        else:
            self.fernet = Fernet(settings.encryption_key.encode())

    def encrypt_api_credentials(self, api_key: str, api_secret: str, api_passphrase: Optional[str] = None) -> tuple[str, str, Optional[str]]:
        """Encrypt API credentials for secure storage"""
        encrypted_key = self.fernet.encrypt(api_key.encode()).decode()
        encrypted_secret = self.fernet.encrypt(api_secret.encode()).decode()
        encrypted_passphrase = None
        if api_passphrase:
            encrypted_passphrase = self.fernet.encrypt(api_passphrase.encode()).decode()
        return encrypted_key, encrypted_secret, encrypted_passphrase

    def decrypt_api_credentials(self, encrypted_key: str, encrypted_secret: str, encrypted_passphrase: Optional[str] = None) -> tuple[str, str, Optional[str]]:
        """Decrypt API credentials for use"""
        api_key = self.fernet.decrypt(encrypted_key.encode()).decode()
        api_secret = self.fernet.decrypt(encrypted_secret.encode()).decode()
        api_passphrase = None
        if encrypted_passphrase:
            api_passphrase = self.fernet.decrypt(encrypted_passphrase.encode()).decode()
        return api_key, api_secret, api_passphrase

    def mask_api_key(self, api_key: str) -> str:
        """Mask API key for display purposes"""
        if len(api_key) <= 8:
            return "***"
        return f"{api_key[:4]}...{api_key[-4:]}"

    def get_sandbox_config(self, exchange_name: str, sandbox: bool = True) -> Dict[str, Any]:
        """Get sandbox-specific configuration for exchanges"""
        if not sandbox:
            return {}
        
        sandbox_configs = {
            'binance': {
                'urls': {
                    'api': {
                        'public': 'https://testnet.binance.vision/api/v3',
                        'private': 'https://testnet.binance.vision/api/v3',
                    }
                }
            },
            'coinbase': {
                'urls': {
                    'api': 'https://api-public.sandbox.pro.coinbase.com'
                }
            },
            'kucoin': {
                'urls': {
                    'api': {
                        'public': 'https://openapi-sandbox.kucoin.com',
                        'private': 'https://openapi-sandbox.kucoin.com'
                    }
                }
            },
            'bybit': {
                'urls': {
                    'api': {
                        'public': 'https://api-testnet.bybit.com',
                        'private': 'https://api-testnet.bybit.com'
                    }
                }
            }
        }
        
        return sandbox_configs.get(exchange_name.lower(), {})

    def create_exchange_instance(self, exchange_name: str, api_key: str, api_secret: str, api_passphrase: Optional[str] = None, sandbox: bool = True) -> ccxt.Exchange:
        """Create a CCXT exchange instance with API credentials"""
        try:
            exchange_class = getattr(ccxt, exchange_name.lower())
            config = {
                'apiKey': api_key,
                'secret': api_secret,
                'enableRateLimit': True,
                'sandbox': sandbox,
            }
            
            # Some exchanges require additional configuration
            if api_passphrase and exchange_name.lower() in ['coinbasepro', 'coinbase', 'kucoin', 'okx']:
                config['password'] = api_passphrase
            
            # Apply sandbox-specific configuration
            sandbox_config = self.get_sandbox_config(exchange_name, sandbox)
            config.update(sandbox_config)
            
            exchange = exchange_class(config)
            
            # Additional sandbox setup if needed
            if sandbox:
                logger.info(f"Created {exchange_name} instance in sandbox mode")
            else:
                logger.info(f"Created {exchange_name} instance in live mode")
            
            return exchange
        except AttributeError:
            raise ValueError(f"Unsupported exchange: {exchange_name}")
        except Exception as e:
            logger.error(f"Failed to create exchange instance for {exchange_name}: {e}")
            raise

    async def test_connection(self, exchange: ccxt.Exchange) -> Dict[str, Any]:
        """Test the exchange connection and return basic info"""
        try:
            # Determine if this is sandbox mode
            is_sandbox = getattr(exchange, 'sandbox', False)
            
            # Test connection by fetching balance
            balance = exchange.fetch_balance()
            
            # Load markets to get available pairs
            try:
                exchange.load_markets()
                available_pairs = len(exchange.symbols)
            except:
                available_pairs = 0
            
            # Get account info if available
            account_info = {}
            try:
                if hasattr(exchange, 'fetch_account_info'):
                    account_info = exchange.fetch_account_info()
            except:
                pass  # Not all exchanges support this
            
            # Check if we have any test balances in sandbox mode
            test_balances = {}
            if is_sandbox and balance:
                for currency, bal in balance.items():
                    if isinstance(bal, dict) and bal.get('total', 0) > 0:
                        test_balances[currency] = bal
            
            return {
                "success": True,
                "sandbox_mode": is_sandbox,
                "account_info": account_info,
                "available_pairs": available_pairs,
                "test_balances": test_balances if is_sandbox else None,
                "timestamp": datetime.utcnow().isoformat(),
                "message": f"Successfully connected to {exchange.id} {'sandbox' if is_sandbox else 'live'} environment"
            }
        except ccxt.AuthenticationError as e:
            return {
                "success": False,
                "error": "Authentication failed. Please check your API credentials.",
                "details": str(e),
                "suggestion": "Verify your API key and secret are correct. In sandbox mode, ensure you're using testnet credentials."
            }
        except ccxt.PermissionDenied as e:
            return {
                "success": False,
                "error": "Insufficient API permissions. Please ensure your API key has trading permissions.",
                "details": str(e),
                "suggestion": "Check that your API key has the required permissions enabled."
            }
        except ccxt.NetworkError as e:
            return {
                "success": False,
                "error": "Network error. Please check your connection.",
                "details": str(e),
                "suggestion": "This might be a temporary connectivity issue. Try again in a few moments."
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Connection test failed: {str(e)}",
                "details": str(e)
            }

    async def fetch_balances(self, exchange: ccxt.Exchange) -> ExchangeBalanceResponse:
        """Fetch account balances from exchange"""
        try:
            balance_data = exchange.fetch_balance()
            
            # Filter out zero balances and format
            balances = {}
            for currency, balance in balance_data.items():
                if isinstance(balance, dict) and balance.get('total', 0) > 0:
                    balances[currency] = balance
            
            return ExchangeBalanceResponse(
                exchange_name=exchange.id,
                balances=balances,
                timestamp=datetime.utcnow()
            )
        except Exception as e:
            logger.error(f"Failed to fetch balances: {e}")
            raise

    def get_supported_exchanges(self) -> List[str]:
        """Get list of supported exchanges"""
        return [
            'binance',
            'coinbase',  # coinbasepro
            'kraken',
            'kucoin',
            'bybit',
            'okx',
            'huobi',
            'bitfinex'
        ]

    def get_trading_guide(self, exchange_name: str) -> TradingGuide:
        """Get step-by-step guide for setting up API keys"""
        guides = {
            'binance': TradingGuide(
                exchange_name='Binance',
                steps=[
                    "1. Log in to your Binance account",
                    "2. Go to Account → API Management",
                    "3. Click 'Create API' and choose 'System generated'",
                    "4. Enter a label for your API (e.g., 'SignalStack Trading')",
                    "5. Complete security verification (SMS/Email)",
                    "6. Copy your API Key and Secret Key",
                    "7. Enable 'Spot & Margin Trading' permission",
                    "8. Optionally restrict to your IP address for security"
                ],
                api_permissions=[
                    "Read account information",
                    "Spot & Margin Trading",
                    "Enable Futures (if trading futures)"
                ],
                security_notes=[
                    "Never share your API keys",
                    "Use IP restrictions when possible",
                    "Start with Testnet to verify functionality",
                    "Regularly rotate your API keys"
                ],
                sandbox_instructions="1. Create a separate testnet account at testnet.binance.vision\n2. Generate testnet API keys (different from main account)\n3. Testnet provides virtual funds for testing\n4. All trades are simulated - no real money involved"
            ),
            'coinbase': TradingGuide(
                exchange_name='Coinbase Pro/Advanced Trade',
                steps=[
                    "1. Log in to Coinbase Pro/Advanced",
                    "2. Go to Portfolio → API",
                    "3. Click '+ New API Key'",
                    "4. Select permissions: View + Trade",
                    "5. Add your IP address (recommended)",
                    "6. Enter your 2FA code",
                    "7. Copy API Key, Secret, and Passphrase",
                    "8. Store all three credentials securely"
                ],
                api_permissions=[
                    "View account information",
                    "Trade (buy/sell)",
                    "Transfer (if needed)"
                ],
                security_notes=[
                    "Passphrase is required for Coinbase Pro",
                    "IP whitelisting is highly recommended",
                    "Use sandbox for testing first"
                ],
                sandbox_instructions="1. Visit https://public.sandbox.pro.coinbase.com\n2. Create a separate sandbox account\n3. Generate sandbox API keys (different from production)\n4. Sandbox provides $100,000 in virtual funds\n5. All trades are simulated for testing"
            ),
            'kraken': TradingGuide(
                exchange_name='Kraken',
                steps=[
                    "1. Log in to your Kraken account",
                    "2. Go to Settings → API",
                    "3. Click 'Generate New Key'",
                    "4. Set Key Description (e.g., 'SignalStack')",
                    "5. Select permissions: Query Funds, Query Open Orders, Query Closed Orders, Query Trades History, Trade",
                    "6. Copy your API Key and Private Key",
                    "7. Verify 2FA if prompted"
                ],
                api_permissions=[
                    "Query Funds",
                    "Query Open/Closed Orders",
                    "Trade"
                ],
                security_notes=[
                    "Kraken uses RSA key pairs",
                    "Private key acts as the secret",
                    "No IP restrictions available"
                ],
                sandbox_instructions="1. Kraken doesn't have a public sandbox\n2. Consider using very small amounts for testing\n3. Start with limit orders to control execution\n4. Monitor trades closely when testing"
            )
        }
        
        return guides.get(exchange_name.lower(), TradingGuide(
            exchange_name=exchange_name.title(),
            steps=[
                "1. Log in to your exchange account",
                "2. Navigate to API/Developer settings",
                "3. Create new API key with trading permissions",
                "4. Copy API key and secret",
                "5. Configure IP restrictions if available"
            ],
            api_permissions=[
                "Read account information",
                "Trading permissions"
            ],
            security_notes=[
                "Never share API credentials",
                "Use IP restrictions when possible",
                "Test with small amounts first"
            ]
        ))


exchange_service = ExchangeService()