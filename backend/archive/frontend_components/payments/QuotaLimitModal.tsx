'use client';

import { useRouter } from 'next/navigation';
import { X, AlertCircle, TrendingUp } from 'lucide-react';

interface QuotaLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUsage: number;
  maxUsage: number;
  resourceType?: string; // 'interviews', 'users', etc.
}

export default function QuotaLimitModal({
  isOpen,
  onClose,
  currentUsage,
  maxUsage,
  resourceType = 'interviews'
}: QuotaLimitModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const usagePercentage = (currentUsage / maxUsage) * 100;
  const remaining = maxUsage - currentUsage;

  const handleUpgrade = () => {
    onClose();
    router.push('/subscription');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg p-6 max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-900/20 rounded-full flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-yellow-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Limit Reached</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-gray-300 mb-4">
            You've used all {maxUsage} {resourceType} available in your current plan.
          </p>

          {/* Usage Bar */}
          <div className="bg-[#000000] border border-[#2A2A2A] rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Usage This Month</span>
              <span className="text-sm font-semibold text-white">
                {currentUsage} / {maxUsage}
              </span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2 mb-2">
              <div
                className="bg-[#00E5FF] h-2 rounded-full transition-all"
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">
              {remaining === 0 ? 'No remaining' : `${remaining} remaining`}
            </p>
          </div>

          {/* Upgrade Benefits */}
          <div className="bg-[#000000] border border-[#2A2A2A] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-[#00E5FF]" />
              <p className="text-sm font-semibold text-white">Upgrade to get more:</p>
            </div>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-[#00E5FF]">•</span>
                <span>50+ {resourceType} per month (Starter plan)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#00E5FF]">•</span>
                <span>200+ {resourceType} per month (Professional plan)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#00E5FF]">•</span>
                <span>Unlimited {resourceType} (Enterprise plan)</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleUpgrade}
            className="flex-1 px-4 py-2 bg-[#00E5FF] text-black font-semibold rounded-lg hover:bg-[#00E5FF]/90 transition-colors"
          >
            Upgrade Plan
          </button>
        </div>
      </div>
    </div>
  );
}

