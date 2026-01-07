"""
Stubbed Payment Endpoints with Static Data
For frontend development and testing without actual payment providers
"""
from fastapi import HTTPException
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import uuid

# Static subscription plans
STATIC_PLANS = [
    {
        "id": "plan_free",
        "name": "Free",
        "slug": "free",
        "description": "Perfect for trying out the platform",
        "price_monthly": 0,
        "price_yearly": 0,
        "currency": "usd",
        "interval": "month",
        "stripe_price_id_monthly": None,
        "stripe_price_id_yearly": None,
        "razorpay_plan_id_monthly": None,
        "razorpay_plan_id_yearly": None,
        "max_interviews_per_month": 5,
        "max_users": 1,
        "features": ["Basic interviews", "Email support"],
        "is_active": True,
        "display_order": 0
    },
    {
        "id": "plan_starter",
        "name": "Starter",
        "slug": "starter",
        "description": "For small teams",
        "price_monthly": 2900,
        "price_yearly": 29000,
        "currency": "usd",
        "interval": "month",
        "stripe_price_id_monthly": "price_starter_monthly",
        "stripe_price_id_yearly": "price_starter_yearly",
        "razorpay_plan_id_monthly": "plan_starter_monthly",
        "razorpay_plan_id_yearly": "plan_starter_yearly",
        "max_interviews_per_month": 50,
        "max_users": 5,
        "features": ["50 interviews/month", "5 team members", "Email support", "Basic analytics"],
        "is_active": True,
        "display_order": 1
    },
    {
        "id": "plan_professional",
        "name": "Professional",
        "slug": "professional",
        "description": "For growing companies",
        "price_monthly": 9900,
        "price_yearly": 99000,
        "currency": "usd",
        "interval": "month",
        "stripe_price_id_monthly": "price_professional_monthly",
        "stripe_price_id_yearly": "price_professional_yearly",
        "razorpay_plan_id_monthly": "plan_professional_monthly",
        "razorpay_plan_id_yearly": "plan_professional_yearly",
        "max_interviews_per_month": 200,
        "max_users": 20,
        "features": ["200 interviews/month", "20 team members", "Priority support", "Advanced analytics", "Custom branding"],
        "is_active": True,
        "display_order": 2
    },
    {
        "id": "plan_enterprise",
        "name": "Enterprise",
        "slug": "enterprise",
        "description": "Custom solutions",
        "price_monthly": 0,
        "price_yearly": 0,
        "currency": "usd",
        "interval": "month",
        "stripe_price_id_monthly": None,
        "stripe_price_id_yearly": None,
        "razorpay_plan_id_monthly": None,
        "razorpay_plan_id_yearly": None,
        "max_interviews_per_month": None,
        "max_users": None,
        "features": ["Unlimited interviews", "Unlimited users", "Dedicated support", "Custom integrations", "SLA guarantee"],
        "is_active": True,
        "display_order": 3
    }
]

# Static subscription data (simulating a free plan user)
STATIC_SUBSCRIPTION = {
    "id": "sub_free_user",
    "tenant_id": "global",
    "plan_id": "plan_free",
    "stripe_subscription_id": None,
    "razorpay_subscription_id": None,
    "status": "active",
    "current_period_start": (datetime.now() - timedelta(days=15)).isoformat(),
    "current_period_end": (datetime.now() + timedelta(days=15)).isoformat(),
    "cancel_at_period_end": False,
    "canceled_at": None,
    "payment_provider": None,
    "subscription_plans": STATIC_PLANS[0]  # Free plan
}

# Static payment history
STATIC_PAYMENTS = [
    {
        "id": "pay_1",
        "subscription_id": None,
        "tenant_id": "global",
        "stripe_payment_intent_id": None,
        "razorpay_payment_id": None,
        "amount": 0,
        "currency": "usd",
        "status": "succeeded",
        "payment_method": None,
        "customer_email": "user@example.com",
        "created_at": (datetime.now() - timedelta(days=15)).isoformat()
    }
]

# In-memory usage tracking (for demo)
usage_tracker = {
    "global": {
        "interviews_this_month": 3,
        "month_start": datetime.now().replace(day=1).isoformat()
    }
}


def get_subscription_plans_stub() -> list:
    """Return static subscription plans"""
    return STATIC_PLANS


def get_tenant_subscription_stub(tenant_id: str) -> Optional[Dict[str, Any]]:
    """Return static subscription for tenant"""
    # Return free plan subscription by default
    return STATIC_SUBSCRIPTION


def get_payment_history_stub(tenant_id: str, limit: int = 10) -> list:
    """Return static payment history"""
    return STATIC_PAYMENTS[:limit]


def create_checkout_session_stub(
    tenant_id: str,
    plan_id: str,
    provider: str,
    success_url: str,
    cancel_url: str
) -> Dict[str, Any]:
    """Create a stubbed checkout session"""
    # Find the plan
    plan = next((p for p in STATIC_PLANS if p["id"] == plan_id), None)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    
    # Generate a fake session ID
    session_id = f"checkout_session_{uuid.uuid4().hex[:12]}"
    
    # For demo: redirect to success page immediately (simulating payment)
    # In real implementation, this would redirect to Stripe/Razorpay
    if provider == "stripe":
        return {
            "session_id": session_id,
            "url": f"{success_url.replace('{CHECKOUT_SESSION_ID}', session_id)}",
            "provider": "stripe"
        }
    else:  # razorpay
        return {
            "subscription_id": f"sub_{uuid.uuid4().hex[:12]}",
            "short_url": f"{success_url.replace('{CHECKOUT_SESSION_ID}', session_id)}",
            "provider": "razorpay"
        }


def get_usage_stub(tenant_id: str) -> Dict[str, Any]:
    """Get usage statistics for tenant"""
    tenant_usage = usage_tracker.get(tenant_id, {
        "interviews_this_month": 0,
        "month_start": datetime.now().replace(day=1).isoformat()
    })
    
    subscription = get_tenant_subscription_stub(tenant_id)
    max_interviews = subscription.get("subscription_plans", {}).get("max_interviews_per_month", 5) if subscription else 5
    
    return {
        "current": tenant_usage["interviews_this_month"],
        "max": max_interviews,
        "allowed": tenant_usage["interviews_this_month"] < max_interviews
    }

