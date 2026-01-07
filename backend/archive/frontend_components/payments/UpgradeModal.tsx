'use client';

import { useRouter } from 'next/navigation';
import { X, Zap, Check } from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  currentPlan?: string;
  featureName?: string;
  showPlans?: boolean;
}

export default function UpgradeModal({
  isOpen,
  onClose,
  title = 'Upgrade Required',
  message = 'This feature requires a premium subscription.',
  currentPlan = 'Free',
  featureName,
  showPlans = true
}: UpgradeModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

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
            <div className="w-10 h-10 bg-[#00E5FF]/20 rounded-full flex items-center justify-center">
              <Zap className="w-5 h-5 text-[#00E5FF]" />
            </div>
            <h2 className="text-xl font-bold text-white">{title}</h2>
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
          <p className="text-gray-300 mb-4">{message}</p>
          
          {featureName && (
            <div className="bg-[#000000] border border-[#2A2A2A] rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-400 mb-2">Feature:</p>
              <p className="text-white font-semibold">{featureName}</p>
            </div>
          )}

          {currentPlan && (
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
              <span>Current Plan:</span>
              <span className="text-white font-semibold">{currentPlan}</span>
            </div>
          )}

          {showPlans && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-300 mb-2">Upgrade to unlock:</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Check className="w-4 h-4 text-[#00E5FF] flex-shrink-0" />
                  <span>More interviews per month</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Check className="w-4 h-4 text-[#00E5FF] flex-shrink-0" />
                  <span>Advanced analytics</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Check className="w-4 h-4 text-[#00E5FF] flex-shrink-0" />
                  <span>Priority support</span>
                </div>
                {featureName && (
                  <div className="flex items-center gap-2 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-[#00E5FF] flex-shrink-0" />
                    <span>{featureName}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Maybe Later
          </button>
          <button
            onClick={handleUpgrade}
            className="flex-1 px-4 py-2 bg-[#00E5FF] text-black font-semibold rounded-lg hover:bg-[#00E5FF]/90 transition-colors"
          >
            View Plans
          </button>
        </div>
      </div>
    </div>
  );
}

