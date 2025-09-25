import stripe
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import settings
from app.db.session import get_db
from app.models.user import User
from app.services.stripe_service import StripeService

router = APIRouter(prefix="/stripe", tags=["stripe"])


@router.post("/checkout-session", status_code=status.HTTP_201_CREATED)
def create_checkout_session(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> dict:
    if not settings.stripe_price_id:
        raise HTTPException(status_code=500, detail="Stripe price ID not configured")
    checkout_url = StripeService.create_checkout_session(current_user)
    db.add(current_user)
    db.commit()
    return {"checkout_url": checkout_url}


@router.post("/portal-session")
def create_billing_portal(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> dict:
    if not current_user.stripe_customer_id:
        raise HTTPException(status_code=400, detail="Stripe customer not found")
    portal_url = StripeService.create_billing_portal(current_user)
    db.add(current_user)
    db.commit()
    return {"portal_url": portal_url}


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)) -> dict:
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    if sig_header is None:
        raise HTTPException(status_code=400, detail="Missing Stripe signature header")
    try:
        event = stripe.Webhook.construct_event(
            payload=payload,
            sig_header=sig_header,
            secret=settings.stripe_webhook_secret,
        )
    except (ValueError, stripe.error.SignatureVerificationError) as exc:
        raise HTTPException(status_code=400, detail="Invalid payload") from exc

    if event["type"] in {"customer.subscription.created", "customer.subscription.updated"}:
        data_object = event["data"]["object"]
        user = db.query(User).filter(User.stripe_customer_id == data_object.get("customer")).first()
        if user and user.subscription:
            StripeService.sync_subscription(user.subscription, event)
            db.add(user.subscription)
            db.commit()
    elif event["type"] == "customer.subscription.deleted":
        data_object = event["data"]["object"]
        user = db.query(User).filter(User.stripe_customer_id == data_object.get("customer")).first()
        if user and user.subscription:
            user.subscription.status = "canceled"
            db.add(user.subscription)
            db.commit()

    return {"status": "success"}
