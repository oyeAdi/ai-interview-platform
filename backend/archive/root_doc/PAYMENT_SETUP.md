# Payment Integration Setup Guide

## Quick Start

Follow these steps to get payments working in your application.

### Step 1: Database Migration

1. Open your Supabase SQL Editor
2. Run the migration file: `migrations/012_payment_subscriptions.sql`
3. Verify tables were created:
   - `subscription_plans`
   - `subscriptions`
   - `payments`

### Step 2: Install Dependencies

**Backend:**
```bash
cd backend
pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
npm install
```

### Step 3: Set Up Payment Provider Accounts

#### Option A: Stripe (Recommended for Global)

**Payment Methods Supported:**
- ✅ Credit/Debit Cards (Visa, Mastercard, Amex, Discover, etc.)
- ✅ UPI (India)
- ✅ Apple Pay, Google Pay
- ✅ Alipay, WeChat Pay (China)
- ✅ Bank Transfers (ACH, SEPA)
- ✅ Buy Now Pay Later (Klarna, Afterpay)

**Setup Steps:**
1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Create an account or sign in
3. Get your API keys:
   - **Test Mode Keys** (for development):
     - Publishable key: `pk_test_...`
     - Secret key: `sk_test_...`
   - **Webhook Secret**: Set up webhook endpoint first, then copy secret

4. Create Products and Prices:
   - Go to Products → Create Product
   - Create products for each plan (Free, Starter, Professional, Enterprise)
   - Copy the Price IDs (e.g., `price_1234567890`)
   - Update `subscription_plans` table with `stripe_price_id_monthly` and `stripe_price_id_yearly`

**Note**: For full Stripe functionality in India, you may need to set up a U.S. entity via Stripe Atlas.

#### Option B: Razorpay (Recommended for India)

**Payment Methods Supported:**
- ✅ Credit/Debit Cards (Visa, Mastercard, RuPay, Amex)
- ✅ UPI (PhonePe, Google Pay, Paytm, Amazon Pay, BHIM, etc.)
- ✅ Net Banking (58+ banks)
- ✅ Digital Wallets (Paytm, PhonePe, Amazon Pay, FreeCharge, MobiKwik)
- ✅ EMI (Credit/Debit/Cardless)
- ✅ PayLater (Multiple providers)
- ✅ International Cards (for Indian merchants)

**Setup Steps:**
1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Create an account
3. Get your API keys:
   - Key ID: `rzp_test_...`
   - Key Secret: `...`
   - Webhook Secret: Set up webhook endpoint first

4. Create Plans:
   - Go to Subscriptions → Plans → Create Plan
   - Create plans for each subscription tier
   - Copy Plan IDs
   - Update `subscription_plans` table with `razorpay_plan_id_monthly` and `razorpay_plan_id_yearly`

**Note**: Razorpay is optimized for Indian market with comprehensive UPI and wallet support.

### Step 4: Configure Environment Variables

Create/update `.env` files:

**Backend `.env`:**
```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Razorpay (optional)
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...

# Supabase (if not already set)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Frontend `.env.local`:**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### Step 5: Set Up Webhooks

#### Stripe Webhook Setup:

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. URL: `https://your-backend-url.com/api/payments/webhook/stripe`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the webhook signing secret to your `.env`

#### Razorpay Webhook Setup:

1. Go to Razorpay Dashboard → Settings → Webhooks
2. Add webhook URL: `https://your-backend-url.com/api/payments/webhook/razorpay`
3. Select events:
   - `subscription.activated`
   - `subscription.charged`
   - `subscription.cancelled`
   - `payment.captured`
4. Copy the webhook secret to your `.env`

### Step 6: Update Subscription Plans in Database

After creating products/prices in Stripe/Razorpay, update the database:

```sql
-- Example: Update Starter plan with Stripe Price IDs
UPDATE subscription_plans 
SET 
  stripe_price_id_monthly = 'price_1234567890',
  stripe_price_id_yearly = 'price_0987654321'
WHERE slug = 'starter';
```

### Step 7: Test the Integration

1. **Start Backend:**
   ```bash
   cd backend
   python main.py
   ```

2. **Start Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test Flow:**
   - Navigate to `http://localhost:3000/subscription`
   - Select a plan
   - Use test card: `4242 4242 4242 4242` (Stripe) or `4111 1111 1111 1111` (Razorpay)
   - Complete checkout
   - Verify subscription in database

### Step 8: Verify Webhooks (Important!)

1. Check webhook logs in Stripe/Razorpay dashboard
2. Verify subscription status updated in database
3. Check payment records created

## Common Issues

### Issue: "No payment provider configured"
**Solution:** Make sure environment variables are set correctly

### Issue: "Plan not found"
**Solution:** Verify plan IDs exist in `subscription_plans` table

### Issue: Webhook not working
**Solution:** 
- Check webhook URL is accessible
- Verify webhook secret matches
- Check backend logs for errors

### Issue: Import errors in backend
**Solution:** Make sure `services/payment_service.py` is in the correct location relative to `backend/app/main.py`

## Next Steps

1. **Customize Plans:** Update plan features and pricing in database
2. **Add Usage Tracking:** Implement interview quota checking
3. **Add Billing Portal:** Let users update payment methods
4. **Add Email Notifications:** Send receipts and subscription updates
5. **Add Analytics:** Track subscription metrics

## Production Checklist

- [ ] Switch to production API keys
- [ ] Update webhook URLs to production domain
- [ ] Test all payment flows
- [ ] Set up monitoring/alerts
- [ ] Configure proper error handling
- [ ] Add rate limiting to payment endpoints
- [ ] Set up backup payment provider (optional)

## Support

For issues:
1. Check payment provider documentation
2. Review webhook logs
3. Check backend logs
4. Verify database records

