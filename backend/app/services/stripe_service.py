from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

import stripe
from fastapi import HTTPException

from app.core.config import settings
from app.models.subscription import Subscription
from app.models.user import User

# Only set API key if it's provided
if settings.stripe_api_key:
    stripe.api_key = settings.stripe_api_key


class StripeService:
    @staticmethod
    def is_configured() -> bool:
        """Check if Stripe is properly configured"""
        return bool(
            settings.stripe_api_key and 
            settings.stripe_price_id and 
            settings.stripe_api_key.startswith(('sk_test_', 'sk_live_')) and
            len(settings.stripe_api_key) > 20
        )
    
    @staticmethod
    def ensure_customer(user: User) -> str:
        if not StripeService.is_configured():
            raise HTTPException(status_code=503, detail="Stripe is not configured for this environment")
            
        if user.stripe_customer_id:
            return user.stripe_customer_id
        customer = stripe.Customer.create(email=user.email)
        user.stripe_customer_id = customer["id"]
        return user.stripe_customer_id

    @staticmethod
    def create_checkout_session(user: User) -> str:
        if not StripeService.is_configured():
            raise HTTPException(status_code=503, detail="Stripe is not configured. Please contact support to enable payments.")
            
        customer_id = StripeService.ensure_customer(user)
        session = stripe.checkout.Session.create(
            customer=customer_id,
            mode="subscription",
            line_items=[{"price": settings.stripe_price_id, "quantity": 1}],
            success_url=f"http://localhost:3000/dashboard?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url="http://localhost:3000/pricing",
            automatic_tax={"enabled": False},  # Disable for development
        )
        return session["url"]

    @staticmethod
    def create_billing_portal(user: User) -> str:
        if not StripeService.is_configured():
            raise HTTPException(status_code=503, detail="Stripe is not configured for this environment")
            
        if not user.stripe_customer_id:
            raise ValueError("User is not a Stripe customer")
        portal_session = stripe.billing_portal.Session.create(
            customer=user.stripe_customer_id,
            return_url="http://localhost:3000/dashboard",
        )
        return portal_session["url"]

    @staticmethod
    def sync_subscription(subscription: Subscription, event: stripe.Event) -> None:
        data: dict[str, Any] = event["data"]["object"]
        subscription.stripe_subscription_id = data.get("id")
        subscription.status = data.get("status", subscription.status)
        current_period_end = data.get("current_period_end")
        if current_period_end:
            subscription.current_period_end = datetime.fromtimestamp(
                current_period_end, tz=timezone.utc
            )
