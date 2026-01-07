'use client';

import { useRouter } from 'next/navigation';
import { CreditCard, Calendar, Zap, ArrowRight } from 'lucide-react';
import { Subscription } from '@/types/payment';

interface SubscriptionStatusCardProps {
  subscription: Subscription | null;
  currentUsage?: number;
  maxUsage?: number;
  resourceType?: string;
  loading?: boolean;
}

export default function SubscriptionStatusCard({
  subscription,
  currentUsage = 0,
  maxUsage = 5,
  resourceType = 'interviews',
  loading = false
}: SubscriptionStatusCardProps) {
  const router = useRouter();

  const planName = subscription?.subscription_plans?.name || 'Free';
  const planSlug = subscription?.subscription_plans?.slug || 'free';
  const status = subscription?.status || 'free';
  const periodEnd = subscription?.current_period_end;

  const usagePercentage = maxUsage > 0 ? (currentUsage / maxUsage) * 100 : 0;
  const isNearLimit = usagePercentage >= 80;
  const isAtLimit = currentUsage >= maxUsage;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = () => {
    if (status === 'active') return 'bg-green-900/30 text-green-400';
    if (status === 'canceled' || status === 'past_due') return 'bg-red-900/30 text-red-400';
    if (status === 'trialing') return 'bg-blue-900/30 text-blue-400';
    return 'bg-gray-900/30 text-gray-400';
  };

  if (loading) {
    return (
      <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg p-6 overflow-hidden">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-800 rounded w-1/3 mb-4"></div>
          <div className="h-8 bg-gray-800 rounded w-1/2 mb-4"></div>
          <div className="h-2 bg-gray-800 rounded w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg p-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#00E5FF]/20 rounded-full flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-[#00E5FF]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Subscription</h3>
            <p className="text-sm text-gray-400">Current plan and usage</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor()}`}>
          {status === 'free' ? 'Free' : status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>

      {/* Plan Info */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-2xl font-bold text-white">{planName}</span>
          {planSlug !== 'free' && (
            <span className="text-sm text-gray-400">Plan</span>
          )}
        </div>
        {periodEnd && status === 'active' && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>Renews on {formatDate(periodEnd)}</span>
          </div>
        )}
        {status === 'canceled' && periodEnd && (
          <div className="flex items-center gap-2 text-sm text-yellow-400">
            <Calendar className="w-4 h-4" />
            <span>Expires on {formatDate(periodEnd)}</span>
          </div>
        )}
      </div>

      {/* Usage Bar */}
      {maxUsage > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">
              {resourceType.charAt(0).toUpperCase() + resourceType.slice(1)} this month
            </span>
            <span className={`text-sm font-semibold ${
              isAtLimit ? 'text-red-400' : isNearLimit ? 'text-yellow-400' : 'text-white'
            }`}>
              {currentUsage} / {maxUsage === Infinity ? '∞' : maxUsage}
            </span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-yellow-500' : 'bg-[#00E5FF]'
              }`}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>
          {isNearLimit && !isAtLimit && (
            <p className="text-xs text-yellow-400 mt-1">
              You're running low on {resourceType}
            </p>
          )}
          {isAtLimit && (
            <p className="text-xs text-red-400 mt-1">
              You've reached your limit. Upgrade to continue.
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        {planSlug === 'free' || isAtLimit ? (
          <button
            onClick={() => router.push('/subscription')}
            className="flex-1 px-4 py-2 bg-[#00E5FF] text-black font-semibold rounded-lg hover:bg-[#00E5FF]/90 transition-colors flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4" />
            {planSlug === 'free' ? 'Upgrade Plan' : 'Upgrade Now'}
          </button>
        ) : (
          <button
            onClick={() => router.push('/subscription/manage')}
            className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
          >
            Manage Subscription
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

