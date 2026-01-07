# Payment Components Integration Examples

## How to Use Payment Components in Your App

### Example 1: Add Subscription Status Card to Dashboard

```tsx
// In your dashboard page (e.g., frontend/src/app/dashboard/page.tsx)
import SubscriptionStatusCard from '@/components/payments/SubscriptionStatusCard';
import { useSubscription } from '@/hooks/useSubscription';

export default function DashboardPage() {
  const { subscription, loading } = useSubscription();
  
  return (
    <div>
      {/* Other dashboard content */}
      
      {/* Add subscription card */}
      <SubscriptionStatusCard
        subscription={subscription}
        currentUsage={5} // Get from your API
        maxUsage={subscription?.subscription_plans?.max_interviews_per_month || 5}
        resourceType="interviews"
        loading={loading}
      />
    </div>
  );
}
```

### Example 2: Check Quota Before Starting Interview

```tsx
// In your interview start component
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import QuotaLimitModal from '@/components/payments/QuotaLimitModal';
import { useSubscription } from '@/hooks/useSubscription';

export default function StartInterviewButton() {
  const router = useRouter();
  const { subscription, checkQuota } = useSubscription();
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [quotaInfo, setQuotaInfo] = useState({ current: 0, max: 5 });

  const handleStartInterview = async () => {
    // Check quota before starting
    const quota = await checkQuota('interviews');
    
    if (!quota.allowed) {
      setQuotaInfo({ current: quota.current, max: quota.max });
      setShowQuotaModal(true);
      return;
    }

    // Proceed with interview start
    router.push('/interview');
  };

  return (
    <>
      <button onClick={handleStartInterview}>
        Start Interview
      </button>

      <QuotaLimitModal
        isOpen={showQuotaModal}
        onClose={() => setShowQuotaModal(false)}
        currentUsage={quotaInfo.current}
        maxUsage={quotaInfo.max}
        resourceType="interviews"
      />
    </>
  );
}
```

### Example 3: Lock Premium Features

```tsx
// In your premium feature component
'use client';

import { useState } from 'react';
import UpgradeModal from '@/components/payments/UpgradeModal';
import { useSubscription } from '@/hooks/useSubscription';

export default function AdvancedAnalyticsButton() {
  const { subscription } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  const isPremium = subscription?.subscription_plans?.slug !== 'free';

  const handleClick = () => {
    if (!isPremium) {
      setShowUpgradeModal(true);
      return;
    }

    // Access premium feature
    // router.push('/analytics');
  };

  return (
    <>
      <button onClick={handleClick}>
        Advanced Analytics
      </button>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        title="Premium Feature"
        message="Advanced Analytics is available in Professional and Enterprise plans."
        currentPlan={subscription?.subscription_plans?.name || 'Free'}
        featureName="Advanced Analytics"
      />
    </>
  );
}
```

### Example 4: Add Navigation Link

```tsx
// In your Header/Navigation component
import Link from 'next/link';

export default function Navigation() {
  return (
    <nav>
      <Link href="/subscription">Pricing</Link>
      <Link href="/subscription/manage">Subscription</Link>
    </nav>
  );
}
```

### Example 5: Show Upgrade Banner on Dashboard

```tsx
// Add to dashboard when user is on free plan
import { useRouter } from 'next/navigation';
import { useSubscription } from '@/hooks/useSubscription';

export default function UpgradeBanner() {
  const router = useRouter();
  const { subscription } = useSubscription();
  
  const isFree = !subscription || subscription.subscription_plans?.slug === 'free';
  
  if (!isFree) return null;

  return (
    <div className="bg-gradient-to-r from-[#00E5FF]/20 to-[#00E5FF]/10 border border-[#00E5FF]/30 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">
            Unlock More Features
          </h3>
          <p className="text-sm text-gray-400">
            Upgrade to get more interviews, advanced analytics, and priority support.
          </p>
        </div>
        <button
          onClick={() => router.push('/subscription')}
          className="px-4 py-2 bg-[#00E5FF] text-black font-semibold rounded-lg hover:bg-[#00E5FF]/90"
        >
          Upgrade Now
        </button>
      </div>
    </div>
  );
}
```

### Example 6: Usage Warning (80% Quota)

```tsx
// Show warning when approaching limit
import { useSubscription } from '@/hooks/useSubscription';

export default function UsageWarning() {
  const { subscription } = useSubscription();
  const currentUsage = 40; // Get from API
  const maxUsage = subscription?.subscription_plans?.max_interviews_per_month || 50;
  const usagePercentage = (currentUsage / maxUsage) * 100;

  if (usagePercentage < 80) return null;

  return (
    <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-4 mb-4">
      <p className="text-yellow-400 text-sm">
        ⚠️ You've used {currentUsage} of {maxUsage} interviews this month. 
        Consider upgrading to avoid interruptions.
      </p>
    </div>
  );
}
```

## Complete Integration Checklist

- [ ] Add subscription status card to dashboard
- [ ] Add quota check before starting interviews
- [ ] Add upgrade modals for premium features
- [ ] Add "Pricing" link to navigation
- [ ] Add "Subscription" to user menu
- [ ] Add upgrade banner for free users
- [ ] Add usage warnings at 80% quota
- [ ] Test complete payment flow
- [ ] Test quota limit blocking
- [ ] Test premium feature locking

