# Payment UX Flow - When Users See Payment Pages

## Overview

This document explains **when** and **how** users encounter the payment/subscription flow in your application.

---

## 🎯 User Journey Scenarios

### Scenario 1: New User (No Subscription)
**When**: User signs up or first logs in  
**Where**: Dashboard or navigation menu  
**Action**: Click "Upgrade" or "View Plans"

```
User Signs Up → Dashboard → Sees "Free Plan" Badge → Clicks "Upgrade" → Subscription Page
```

### Scenario 2: Quota Limit Reached
**When**: User tries to start an interview but has reached their monthly limit  
**Where**: Interview start button or modal  
**Action**: Blocked with upgrade prompt

```
User Clicks "Start Interview" → System Checks Quota → Limit Reached → Upgrade Modal Appears
```

### Scenario 3: Feature Locked
**When**: User tries to access premium feature (e.g., advanced analytics, custom branding)  
**Where**: Feature button or page  
**Action**: Shows upgrade prompt

```
User Clicks "Advanced Analytics" → Feature Locked → Upgrade Modal Appears
```

### Scenario 4: Manual Upgrade
**When**: User wants to upgrade proactively  
**Where**: Settings, Profile Menu, or Dashboard  
**Action**: Navigate to subscription page

```
User Menu → "Subscription" → Subscription Management Page → "Upgrade Plan" Button
```

### Scenario 5: Subscription Expiring Soon
**When**: Subscription expires in 7 days or payment failed  
**Where**: Dashboard banner or notification  
**Action**: Renewal prompt

```
Dashboard → Warning Banner → "Renew Subscription" → Payment Page
```

---

## 📍 Entry Points (Where Users See Payment UI)

### 1. **Navigation Menu**
```
Header/Navbar
├── "Pricing" link → /subscription
└── "Upgrade" button → /subscription
```

### 2. **Dashboard**
```
Dashboard Page
├── Subscription Status Card → Click → /subscription/manage
├── "Upgrade Plan" Banner → Click → /subscription
└── Usage Meter (5/50 interviews) → "Upgrade" button → /subscription
```

### 3. **Interview Start Flow**
```
Start Interview Button
├── Check Quota
├── If Limit Reached → Show Upgrade Modal
└── Modal has "View Plans" → /subscription
```

### 4. **Settings/Profile**
```
User Menu → Settings
└── "Subscription" Tab → /subscription/manage
```

### 5. **Feature Access**
```
Premium Feature Button
├── Check Subscription Tier
├── If Not Premium → Show Upgrade Modal
└── Modal has "Upgrade Now" → /subscription
```

---

## 🎨 UI Components Needed

### 1. **Upgrade Banner** (Dashboard)
- Shows current plan
- Shows usage (e.g., "5/50 interviews used")
- "Upgrade" button

### 2. **Quota Limit Modal** (Interview Start)
- Appears when limit reached
- Shows current usage
- "Upgrade Plan" button
- "View Plans" link

### 3. **Feature Lock Modal** (Premium Features)
- Shows locked feature
- Explains premium benefit
- "Upgrade to Unlock" button

### 4. **Subscription Status Card** (Dashboard)
- Current plan name
- Renewal date
- Usage stats
- "Manage" button

### 5. **Payment Success Page** (After Payment)
- Confirmation message
- "Go to Dashboard" button
- "Manage Subscription" link

---

## 🔄 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USER ENTRY POINTS                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  1. Navigation "Pricing" → /subscription                    │
│  2. Dashboard "Upgrade" Banner → /subscription              │
│  3. Start Interview (Quota Check) → Upgrade Modal           │
│  4. Premium Feature → Lock Modal → /subscription            │
│  5. Settings → Subscription → /subscription/manage         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              SUBSCRIPTION PAGE (/subscription)                │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  • Plan Selection (Free, Starter, Pro, Enterprise)          │
│  • Monthly/Yearly Toggle                                    │
│  • "Subscribe Now" Button                                   │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              CHECKOUT (Stripe/Razorpay)                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  • Payment Method Selection                                 │
│  • Card/UPI/Net Banking/Wallets                              │
│  • Complete Payment                                         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│         SUCCESS PAGE (/subscription/success)                 │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  • "Payment Successful" Message                             │
│  • "Go to Dashboard" Button                                 │
│  • "Manage Subscription" Link                               │
│                                                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              WEBHOOK PROCESSES PAYMENT                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  • Updates Subscription Status                              │
│  • Activates Premium Features                                │
│  • Sends Confirmation Email                                  │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 💡 Implementation Strategy

### Phase 1: Add Entry Points
1. Add "Pricing" link to navigation
2. Add subscription status card to dashboard
3. Add upgrade banner to dashboard

### Phase 2: Add Quota Checks
1. Check quota before starting interview
2. Show upgrade modal if limit reached
3. Block premium features if not subscribed

### Phase 3: Add Upgrade Prompts
1. Create upgrade modal component
2. Create quota limit modal
3. Create feature lock modal

### Phase 4: Add Subscription Management
1. Add "Subscription" to user menu
2. Link to `/subscription/manage`
3. Show current plan and usage

---

## 🎯 Key User Actions

| User Action | Current State | Trigger | Result |
|------------|---------------|---------|--------|
| Click "Start Interview" | Free plan, 5/5 used | Quota check | Upgrade modal |
| Click "Advanced Analytics" | Free plan | Feature check | Lock modal |
| Click "Upgrade" banner | Any plan | User intent | Subscription page |
| Click "Pricing" | Any state | Navigation | Subscription page |
| Click "Manage Subscription" | Has subscription | User menu | Manage page |

---

## 📱 Mobile Considerations

- Upgrade prompts should be mobile-friendly
- Payment flow should work on mobile browsers
- UPI integration works best on mobile (Razorpay)
- Consider in-app payment options

---

## 🔔 Notifications & Reminders

### When to Show:
1. **7 days before expiry** - Renewal reminder banner
2. **Quota at 80%** - Usage warning
3. **Quota reached** - Immediate upgrade prompt
4. **Payment failed** - Payment retry prompt
5. **Trial ending** - Trial expiration warning

### Where to Show:
- Dashboard banner (non-intrusive)
- Email notifications
- In-app notifications
- Modal (for critical actions)

---

## 🚀 Next Steps

1. **Create upgrade prompt components**
2. **Add quota checking logic**
3. **Integrate with interview start flow**
4. **Add navigation links**
5. **Test complete user journey**

See implementation files:
- `components/payments/UpgradeModal.tsx`
- `components/payments/QuotaLimitModal.tsx`
- `components/payments/SubscriptionStatusCard.tsx`
- `hooks/useSubscription.ts`

