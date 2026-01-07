'use client';

import { SubscriptionPlan } from '@/types/payment';
import { Check } from 'lucide-react';

interface SubscriptionPlanCardProps {
  plan: SubscriptionPlan;
  isSelected?: boolean;
  onSelect: (planId: string) => void;
  billingInterval?: 'month' | 'year';
}

export default function SubscriptionPlanCard({
  plan,
  isSelected = false,
  onSelect,
  billingInterval = 'month'
}: SubscriptionPlanCardProps) {
  const price = billingInterval === 'year' && plan.price_yearly 
    ? plan.price_yearly 
    : plan.price_monthly;
  
  const displayPrice = price / 100; // Convert cents to dollars
  const currencySymbol = plan.currency === 'usd' ? '$' : plan.currency === 'inr' ? '₹' : '€';
  
  return (
    <div
      className={`relative p-6 border-2 rounded-lg cursor-pointer transition-all ${
        isSelected
          ? 'border-[#00E5FF] bg-[#00E5FF]/10'
          : 'border-gray-200 dark:border-[#2A2A2A] hover:border-[#00E5FF]/50'
      } overflow-hidden`}
      onClick={() => onSelect(plan.id)}
    >
      {isSelected && (
        <div className="absolute top-4 right-4 w-6 h-6 bg-[#00E5FF] rounded-full flex items-center justify-center">
          <Check className="w-4 h-4 text-black" />
        </div>
      )}
      
      <div className="mb-4">
        <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
        <p className="text-gray-400 text-sm">{plan.description}</p>
      </div>
      
      <div className="mb-6">
        <div className="flex items-baseline">
          <span className="text-4xl font-bold text-white">
            {plan.price_monthly === 0 ? 'Free' : `${currencySymbol}${displayPrice}`}
          </span>
          {plan.price_monthly > 0 && (
            <span className="text-gray-400 ml-2">/{billingInterval === 'month' ? 'mo' : 'yr'}</span>
          )}
        </div>
        {billingInterval === 'year' && plan.price_yearly && plan.price_monthly > 0 && (
          <p className="text-sm text-gray-500 mt-1">
            Save {Math.round((1 - plan.price_yearly / (plan.price_monthly * 12)) * 100)}% annually
          </p>
        )}
      </div>
      
      <ul className="space-y-3 mb-6">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2">
            <Check className="w-5 h-5 text-[#00E5FF] flex-shrink-0 mt-0.5" />
            <span className="text-gray-300 text-sm">{feature}</span>
          </li>
        ))}
        {plan.max_interviews_per_month && (
          <li className="flex items-start gap-2">
            <Check className="w-5 h-5 text-[#00E5FF] flex-shrink-0 mt-0.5" />
            <span className="text-gray-300 text-sm">
              {plan.max_interviews_per_month === null 
                ? 'Unlimited' 
                : `${plan.max_interviews_per_month} interviews/month`}
            </span>
          </li>
        )}
        {plan.max_users && (
          <li className="flex items-start gap-2">
            <Check className="w-5 h-5 text-[#00E5FF] flex-shrink-0 mt-0.5" />
            <span className="text-gray-300 text-sm">
              {plan.max_users === null ? 'Unlimited' : `Up to ${plan.max_users} users`}
            </span>
          </li>
        )}
      </ul>
      
      <button
        className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
          isSelected
            ? 'bg-[#00E5FF] text-black'
            : 'bg-gray-800 dark:bg-[#0A0A0A] text-white hover:bg-gray-700'
        }`}
      >
        {isSelected ? 'Selected' : 'Select Plan'}
      </button>
    </div>
  );
}

