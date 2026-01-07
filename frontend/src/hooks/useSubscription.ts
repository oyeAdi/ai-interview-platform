'use client';

import { useState, useEffect } from 'react';
import { Subscription } from '@/types/payment';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface UseSubscriptionReturn {
  subscription: Subscription | null;
  loading: boolean;
  error: string | null;
  checkQuota: (resourceType: string) => Promise<{ allowed: boolean; current: number; max: number }>;
  refreshSubscription: () => Promise<void>;
}

export function useSubscription(tenantId?: string): UseSubscriptionReturn {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = async () => {
    try {
      const id = tenantId || localStorage.getItem('tenant_id') || 'global';
      const response = await fetch(`${API_BASE_URL}/api/subscriptions/current?tenant_id=${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch subscription');
      }

      const data = await response.json();
      setSubscription(data.subscription);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setSubscription(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [tenantId]);

  const checkQuota = async (resourceType: string = 'interviews'): Promise<{ allowed: boolean; current: number; max: number }> => {
    try {
      const id = tenantId || localStorage.getItem('tenant_id') || 'global';
      
      // Get subscription
      const subResponse = await fetch(`${API_BASE_URL}/api/subscriptions/current?tenant_id=${id}`);
      const subData = await subResponse.json();
      
      if (!subData.subscription) {
        // Free plan - default limits
        return {
          allowed: true, // Allow for now, but you can implement actual quota checking
          current: 0,
          max: 5 // Free plan default
        };
      }

      const plan = subData.subscription.subscription_plans;
      const maxUsage = plan?.max_interviews_per_month || 5;
      
      // Fetch actual usage from API
      try {
        const usageResponse = await fetch(`${API_BASE_URL}/api/subscriptions/usage?tenant_id=${id}`);
        if (usageResponse.ok) {
          const usageData = await usageResponse.json();
          return {
            allowed: usageData.allowed,
            current: usageData.current,
            max: usageData.max
          };
        }
      } catch (err) {
        console.error('Error fetching usage:', err);
      }
      
      // Fallback to subscription plan limits
      return {
        allowed: true, // Default allow, will be checked by backend
        current: 0,
        max: maxUsage
      };
    } catch (err) {
      console.error('Error checking quota:', err);
      return {
        allowed: false,
        current: 0,
        max: 0
      };
    }
  };

  return {
    subscription,
    loading,
    error,
    checkQuota,
    refreshSubscription: fetchSubscription
  };
}

