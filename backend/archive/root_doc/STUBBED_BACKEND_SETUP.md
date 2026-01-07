# Stubbed Backend Setup for Frontend Development

## ✅ What Was Done

### 1. Created Payment Stubs (`backend/app/payment_stubs.py`)
- Static subscription plans (Free, Starter, Professional, Enterprise)
- Static subscription data (simulating free plan user)
- Static payment history
- Usage tracking (in-memory)

### 2. Updated Backend Endpoints (`backend/app/main.py`)
- All payment endpoints now use stubs when payment service is unavailable
- Automatically falls back to stubs if payment service import fails
- Added `/api/subscriptions/usage` endpoint for quota checking

### 3. Updated Frontend Hook (`frontend/src/hooks/useSubscription.ts`)
- Now fetches actual usage from `/api/subscriptions/usage` endpoint
- Falls back gracefully if API fails

## 🚀 Server Status

Both servers should now be running:
- **Backend**: http://localhost:8000
- **Frontend**: http://localhost:3000

## 📋 Available Stubbed Endpoints

### 1. Get Subscription Plans
```
GET /api/payments/plans
```
Returns: 4 static plans (Free, Starter, Professional, Enterprise)

### 2. Get Current Subscription
```
GET /api/subscriptions/current?tenant_id=global
```
Returns: Free plan subscription with 3/5 interviews used

### 3. Get Usage Statistics
```
GET /api/subscriptions/usage?tenant_id=global
```
Returns: `{ "current": 3, "max": 5, "allowed": true }`

### 4. Create Checkout Session
```
POST /api/payments/create-checkout
Body: {
  "tenant_id": "global",
  "plan_id": "plan_starter",
  "provider": "stripe",
  "success_url": "...",
  "cancel_url": "..."
}
```
Returns: Checkout session that redirects to success page (simulating payment)

### 5. Get Payment History
```
GET /api/payments/history?tenant_id=global&limit=10
```
Returns: Static payment history

### 6. Cancel Subscription
```
POST /api/subscriptions/cancel
Body: {
  "tenant_id": "global",
  "cancel_at_period_end": true
}
```
Returns: Success message (stub)

## 🎯 Static Data

### Subscription Plans
- **Free**: $0/month, 5 interviews/month
- **Starter**: $29/month, 50 interviews/month
- **Professional**: $99/month, 200 interviews/month
- **Enterprise**: Custom pricing, Unlimited

### Current User (Stub)
- Plan: Free
- Usage: 3/5 interviews used
- Status: Active
- Period: Started 15 days ago, ends in 15 days

## 🧪 Testing the Flow

### 1. View Subscription Page
Navigate to: http://localhost:3000/subscription
- Should show 4 plans
- Can select plans
- "Subscribe Now" button works

### 2. Test Checkout Flow
1. Select a plan on `/subscription`
2. Click "Subscribe Now"
3. Should redirect to `/subscription/success` (simulating payment)
4. Success page shows confirmation

### 3. View Subscription Status
Navigate to: http://localhost:3000/subscription/manage
- Shows current Free plan
- Shows usage: 3/5 interviews
- Shows payment history

### 4. Test Quota Check
- Current usage: 3/5 interviews
- Can start interviews (3 remaining)
- When limit reached, quota modal should appear

## 🔄 How Stubs Work

### Automatic Fallback
```python
try:
    from services.payment_service import payment_service
    USE_PAYMENT_STUBS = False
except ImportError:
    USE_PAYMENT_STUBS = True
    # Use stubs
```

### Checkout Flow (Stub)
When user clicks "Subscribe Now":
1. Creates fake checkout session ID
2. Immediately redirects to success URL
3. No actual payment processing
4. Perfect for frontend testing!

## 📝 Usage Tracking

Usage is tracked in-memory in `payment_stubs.py`:
```python
usage_tracker = {
    "global": {
        "interviews_this_month": 3,
        "month_start": "2024-01-01T00:00:00"
    }
}
```

To reset usage (for testing), restart the backend server.

## 🎨 Frontend Components Ready

All frontend components work with stubbed backend:
- ✅ SubscriptionStatusCard
- ✅ QuotaLimitModal
- ✅ UpgradeModal
- ✅ Subscription page
- ✅ Manage subscription page
- ✅ Success page

## 🚀 Next Steps

1. **Test the complete flow**:
   - Visit `/subscription`
   - Select a plan
   - Complete checkout (stub)
   - View success page

2. **Add to Dashboard**:
   - Add SubscriptionStatusCard component
   - Test quota warnings

3. **Add Quota Checks**:
   - Before starting interviews
   - Show QuotaLimitModal when limit reached

4. **Add Navigation Links**:
   - "Pricing" link in header
   - "Subscription" in user menu

## 🔧 Switching to Real Payment Providers

When ready to use real payments:
1. Set up Stripe/Razorpay accounts
2. Add API keys to `.env`
3. Install payment service dependencies
4. Remove stubs (backend will auto-detect real service)

The code automatically switches from stubs to real payment service when available!

