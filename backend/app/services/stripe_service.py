from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

import stripe

from app.core.config import settings
from app.models.subscription import Subscription
from app.models.user import User

stripe.api_key = settings.stripe_api_key


class StripeService:
    @staticmethod
    def ensure_customer(user: User) -> str:
        if user.stripe_customer_id:
            return user.stripe_customer_id
        customer = stripe.Customer.create(email=user.email)
        user.stripe_customer_id = customer["id"]
        return user.stripe_customer_id

    @staticmethod
    def create_checkout_session(user: User) -> str:
        customer_id = StripeService.ensure_customer(user)
        success_url = (
            f"{settings.frontend_base_url}/dashboard?session_id={{CHECKOUT_SESSION_ID}}"
        )
        cancel_url = f"{settings.frontend_base_url}/pricing"
        session = stripe.checkout.Session.create(
            customer=customer_id,
            mode="subscription",
            line_items=[{"price": settings.stripe_price_id, "quantity": 1}],
            success_url=success_url,
            cancel_url=cancel_url,
            automatic_tax={"enabled": True},
        )
        return session["url"]

    @staticmethod
    def create_billing_portal(user: User) -> str:
        if not user.stripe_customer_id:
            raise ValueError("User is not a Stripe customer")
        portal_session = stripe.billing_portal.Session.create(
            customer=user.stripe_customer_id,
            return_url=f"{settings.frontend_base_url}/dashboard",
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
