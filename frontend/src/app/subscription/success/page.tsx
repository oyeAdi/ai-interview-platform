'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, Loader2 } from 'lucide-react';

export default function SubscriptionSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Wait a moment for webhook to process
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#00E5FF] mx-auto mb-4" />
          <p className="text-gray-400">Processing your subscription...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <CheckCircle className="w-20 h-20 text-[#00E5FF] mx-auto" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Payment Successful!</h1>
        <p className="text-gray-400 mb-8">
          Your subscription has been activated. You can now access all premium features.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => router.push('/select-org')}
            className="px-6 py-3 bg-[#00E5FF] text-black font-semibold rounded-lg hover:bg-[#00E5FF]/90"
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => router.push('/subscription')}
            className="px-6 py-3 bg-gray-800 text-white font-semibold rounded-lg hover:bg-gray-700"
          >
            Manage Subscription
          </button>
        </div>
      </div>
    </div>
  );
}

