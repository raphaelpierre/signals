# 💳 Stripe Payment Configuration Guide

## Development Environment Notice

This signals application is currently running in **development mode** with payments disabled. This is intentional for demo and testing purposes.

## Current Status
- ✅ **Authentication**: Fully functional
- ✅ **Signals**: All trading signals available  
- ✅ **Live Trading**: Complete CCXT integration working
- ✅ **Sandbox Mode**: Full testnet trading capabilities
- ⚠️ **Payments**: Disabled (development environment)

## For Production Setup

If you want to enable payments in your own deployment:

### 1. Get Stripe Account
1. Sign up at [stripe.com](https://stripe.com)
2. Complete business verification
3. Get API keys from Dashboard → Developers → API keys

### 2. Configure Environment Variables
Add to your `.env` file or docker-compose.yml:

```env
STRIPE_API_KEY=sk_test_your_secret_key_here
STRIPE_PRICE_ID=price_your_subscription_price_id
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### 3. Create Subscription Products
1. Go to Stripe Dashboard → Products
2. Create a subscription product (e.g., "Pro Trading Signals")
3. Set pricing (e.g., $79/month)
4. Copy the Price ID to `STRIPE_PRICE_ID`

### 4. Set Up Webhooks
1. Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourapp.com/api/v1/stripe/webhook`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

### 5. Update URLs
In `backend/app/services/stripe_service.py`, update:
```python
success_url=f"https://yourapp.com/dashboard?session_id={{CHECKOUT_SESSION_ID}}"
cancel_url="https://yourapp.com/pricing"
```

## Demo Mode Features

In this development environment, you can still:

- ✅ **Create Account**: Full user registration works
- ✅ **7-Day Trial**: All users get trial access automatically
- ✅ **Access Signals**: View all trading signals and analytics
- ✅ **Live Trading**: Connect exchanges and practice trading
- ✅ **Sandbox Mode**: Test with virtual funds on exchanges
- ✅ **Full Features**: Everything works except actual payments

## User Experience

When users try to upgrade:
- **Clear Message**: "Payment processing is not available in this development environment"
- **No Confusion**: Users understand this is a demo system
- **Full Access**: Trial users can access all features
- **Professional UX**: Error handling is user-friendly

## For Enterprise Deployment

If you're deploying this for production use:

1. **Security Review**: Audit all API keys and secrets
2. **Database Migration**: Ensure subscription tables are created
3. **SSL Certificate**: Use HTTPS for all payment processing
4. **Webhook Testing**: Test all subscription lifecycle events
5. **Error Monitoring**: Set up logging for payment failures
6. **Compliance**: Ensure PCI compliance if handling card data

---

**This demo showcases the complete trading signals platform with all features except live payments. Perfect for evaluation and development!**