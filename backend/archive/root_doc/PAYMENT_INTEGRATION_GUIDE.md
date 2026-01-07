# Payment Integration Guide - Stripe & Razorpay

## Overview
This guide explains how to integrate payment systems (Stripe and Razorpay) for subscription-based billing in your AI Interview Platform.

## Architecture Decision: Stripe vs Razorpay

### **Stripe** (Recommended for Global)
- ✅ Best for: International customers, global reach
- ✅ Excellent documentation and developer experience
- ✅ Built-in subscription management
- ✅ Webhook support for payment events
- ✅ Supports 135+ currencies
- ✅ Strong fraud protection

**Payment Methods Supported:**
- ✅ **Credit/Debit Cards**: Visa, Mastercard, American Express, Discover, Diners Club, JCB (Global)
- ✅ **UPI**: Supported in India
- ✅ **Digital Wallets**: Apple Pay, Google Pay, Alipay, WeChat Pay
- ✅ **Bank Transfers**: ACH (US), SEPA (EU), Direct Debits (various countries)
- ✅ **Buy Now Pay Later**: Klarna, Afterpay, Affirm (region-dependent)
- ⚠️ **Note**: Stripe in India requires U.S. entity setup (Stripe Atlas) for full functionality

### **Razorpay** (Recommended for India)
- ✅ Best for: Indian market, UPI payments
- ✅ Supports UPI, Net Banking, Wallets (Paytm, PhonePe)
- ✅ Lower transaction fees for Indian payments
- ✅ Good documentation
- ✅ Webhook support

**Payment Methods Supported:**
- ✅ **Credit/Debit Cards**: Visa, Mastercard, RuPay, Maestro, American Express, Diners Club
- ✅ **UPI**: PhonePe, Google Pay, Paytm, Amazon Pay, BHIM, and all UPI apps
- ✅ **Credit Cards on UPI**: Industry-first support for credit cards via UPI
- ✅ **Digital Wallets**: Paytm, PhonePe, Amazon Pay, FreeCharge, MobiKwik, PayZapp
- ✅ **Net Banking**: 58+ banks (ICICI, HDFC, SBI, Axis, Kotak, etc.)
- ✅ **EMI**: Credit card EMI, Debit card EMI, Cardless EMI
- ✅ **PayLater**: Razorpay PayLater, LazyPay, Simpl
- ✅ **International Cards**: Accepts international cards for Indian merchants
- ✅ **Multi-currency**: Supports 100+ currencies for international payments

**Recommendation**: 
- **For India-focused business**: Use Razorpay (best UPI/wallet support)
- **For Global business**: Use Stripe (better international coverage)
- **For Both**: Use Razorpay for India + Stripe for rest of world (dual integration)

---

## Payment Flow Architecture

```
┌─────────────┐
│   Frontend  │
│  (Next.js)  │
└──────┬──────┘
       │ 1. User selects plan
       │ 2. Create checkout session
       ▼
┌─────────────┐
│   Backend   │
│  (FastAPI)  │
└──────┬──────┘
       │ 3. Create payment intent/subscription
       │ 4. Return payment URL
       ▼
┌─────────────┐
│   Stripe/   │
│  Razorpay   │
└──────┬──────┘
       │ 5. User completes payment
       │ 6. Webhook notification
       ▼
┌─────────────┐
│   Backend   │
│  (Webhook)  │
└──────┬──────┘
       │ 7. Update subscription status
       │ 8. Activate tenant features
       ▼
┌─────────────┐
│  Supabase   │
│  Database   │
└─────────────┘
```

---

## Step-by-Step Implementation

### Phase 1: Database Setup

1. **Create subscriptions table** - Store subscription details
2. **Create payments table** - Track payment transactions
3. **Update tenants table** - Link to subscriptions

### Phase 2: Backend Integration

1. **Install payment SDKs**
   ```bash
   pip install stripe
   pip install razorpay
   ```

2. **Create payment service**
   - Handle subscription creation
   - Process webhooks
   - Manage subscription lifecycle

3. **Create API endpoints**
   - `POST /api/payments/create-checkout` - Create checkout session
   - `POST /api/payments/webhook` - Handle payment webhooks
   - `GET /api/subscriptions/current` - Get current subscription
   - `POST /api/subscriptions/cancel` - Cancel subscription

### Phase 3: Frontend Integration

1. **Install payment SDKs**
   ```bash
   npm install @stripe/stripe-js @stripe/react-stripe-js
   npm install razorpay
   ```

2. **Create payment components**
   - Subscription plan selector
   - Checkout page
   - Payment success/failure pages
   - Subscription management dashboard

---

## Subscription Plans Structure

```typescript
interface SubscriptionPlan {
  id: string;
  name: string;
  price: number; // in cents/paise
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  stripe_price_id?: string;
  razorpay_plan_id?: string;
}
```

**Example Plans:**
- **Free**: $0/month - 5 interviews/month
- **Starter**: $29/month - 50 interviews/month
- **Professional**: $99/month - 200 interviews/month
- **Enterprise**: Custom pricing - Unlimited

---

## Environment Variables

### Stripe
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Razorpay
```env
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
```

---

## Security Best Practices

1. **Never expose secret keys** - Only use publishable keys in frontend
2. **Verify webhooks** - Always verify webhook signatures
3. **Use HTTPS** - Required for payment processing
4. **Validate on backend** - Never trust frontend payment data
5. **Store minimal data** - Don't store full card details

---

## Testing

### Stripe Test Cards
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

### Razorpay Test Cards
- Success: `4111 1111 1111 1111`
- Failure: `4000 0000 0000 0002`

---

## Next Steps

1. Choose your payment provider (Stripe recommended)
2. Create accounts and get API keys
3. Run database migrations
4. Implement backend endpoints
5. Build frontend components
6. Test with test cards
7. Set up webhooks
8. Deploy and test in production

---

## Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Subscriptions](https://stripe.com/docs/billing/subscriptions/overview)
- [Razorpay Documentation](https://razorpay.com/docs/)
- [Razorpay Subscriptions](https://razorpay.com/docs/subscriptions/)

---

## Support

For questions or issues:
1. Check payment provider documentation
2. Review webhook logs
3. Check backend logs for errors
4. Verify environment variables are set correctly

