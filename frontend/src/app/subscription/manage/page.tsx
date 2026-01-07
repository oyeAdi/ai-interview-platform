'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Subscription, Payment } from '@/types/payment';
import { Loader2, Calendar, CreditCard, XCircle } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function ManageSubscriptionPage() {
  const router = useRouter();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);

  useEffect(() => {
    const storedTenantId = localStorage.getItem('tenant_id') || 'global';
    setTenantId(storedTenantId);
    fetchSubscription();
    fetchPayments();
  }, []);

  const fetchSubscription = async () => {
    try {
      if (!tenantId) return;
      const response = await fetch(`${API_BASE_URL}/api/subscriptions/current?tenant_id=${tenantId}`);
      const data = await response.json();
      setSubscription(data.subscription);
    } catch (err) {
      console.error('Failed to fetch subscription:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayments = async () => {
    try {
      if (!tenantId) return;
      const response = await fetch(`${API_BASE_URL}/api/payments/history?tenant_id=${tenantId}&limit=10`);
      const data = await response.json();
      setPayments(data.payments || []);
    } catch (err) {
      console.error('Failed to fetch payments:', err);
    }
  };

  const handleCancelSubscription = async () => {
    if (!tenantId || !confirm('Are you sure you want to cancel your subscription?')) {
      return;
    }

    setCanceling(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/subscriptions/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenant_id: tenantId,
          cancel_at_period_end: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      await fetchSubscription();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel subscription');
    } finally {
      setCanceling(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    const symbol = currency === 'usd' ? '$' : currency === 'inr' ? '₹' : '€';
    return `${symbol}${(amount / 100).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#00E5FF]" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Manage Subscription</h1>
          <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg p-8 text-center">
            <p className="text-gray-400 mb-6">You don't have an active subscription.</p>
            <button
              onClick={() => router.push('/subscription')}
              className="px-6 py-3 bg-[#00E5FF] text-black font-semibold rounded-lg hover:bg-[#00E5FF]/90"
            >
              View Plans
            </button>
          </div>
        </div>
      </div>
    );
  }

  const plan = subscription.subscription_plans;

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Manage Subscription</h1>

        {/* Current Subscription Card */}
        <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg p-6 mb-6 overflow-hidden">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold mb-2">{plan?.name || 'Subscription'}</h2>
              <p className="text-gray-400">{plan?.description}</p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold ${
                subscription.status === 'active'
                  ? 'bg-green-900/30 text-green-400'
                  : subscription.status === 'canceled'
                  ? 'bg-red-900/30 text-red-400'
                  : 'bg-yellow-900/30 text-yellow-400'
              }`}
            >
              {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="flex items-center gap-2 text-gray-400">
              <Calendar className="w-5 h-5" />
              <div>
                <p className="text-xs">Current Period</p>
                <p className="text-white">
                  {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <CreditCard className="w-5 h-5" />
              <div>
                <p className="text-xs">Payment Provider</p>
                <p className="text-white capitalize">{subscription.payment_provider || 'N/A'}</p>
              </div>
            </div>
          </div>

          {subscription.cancel_at_period_end && (
            <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-4 mb-4">
              <p className="text-yellow-400">
                Your subscription will be canceled on {formatDate(subscription.current_period_end)}.
              </p>
            </div>
          )}

          {subscription.status === 'active' && !subscription.cancel_at_period_end && (
            <button
              onClick={handleCancelSubscription}
              disabled={canceling}
              className="px-4 py-2 bg-red-900/20 border border-red-500 text-red-400 rounded-lg hover:bg-red-900/30 disabled:opacity-50 flex items-center gap-2"
            >
              {canceling && <Loader2 className="w-4 h-4 animate-spin" />}
              <XCircle className="w-4 h-4" />
              Cancel Subscription
            </button>
          )}
        </div>

        {/* Payment History */}
        <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg p-6 overflow-hidden">
          <h2 className="text-xl font-bold mb-4">Payment History</h2>
          {payments.length === 0 ? (
            <p className="text-gray-400">No payment history available.</p>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-4 bg-[#000000] rounded-lg border border-[#2A2A2A]"
                >
                  <div>
                    <p className="font-semibold">
                      {formatCurrency(payment.amount, payment.currency)}
                    </p>
                    <p className="text-sm text-gray-400">
                      {formatDate(payment.created_at)}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      payment.status === 'succeeded'
                        ? 'bg-green-900/30 text-green-400'
                        : payment.status === 'failed'
                        ? 'bg-red-900/30 text-red-400'
                        : 'bg-yellow-900/30 text-yellow-400'
                    }`}
                  >
                    {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

