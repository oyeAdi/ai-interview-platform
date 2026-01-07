'use client'

import { useState } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import { Check, ArrowRight, Sparkles } from 'lucide-react'

// Mock pricing data
const pricingPlans = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: '/month',
    description: 'Perfect for trying out the platform',
    features: [
      'Up to 5 interactions per month',
      'Basic agent features',
      'Community support',
      'Email reports'
    ],
    cta: 'Get Started',
    popular: false
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 99,
    period: '/month',
    description: 'For small teams and individual users',
    features: [
      'Up to 50 interactions per month',
      'All agent features',
      'Email support',
      'Custom templates',
      'Advanced analytics'
    ],
    cta: 'Start Free Trial',
    popular: true
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 299,
    period: '/month',
    description: 'For growing companies',
    features: [
      'Unlimited interactions',
      'Advanced analytics',
      'Priority support',
      'Multi-tenant support',
      'Custom integrations',
      'API access'
    ],
    cta: 'Start Free Trial',
    popular: false
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: null,
    priceLabel: 'Custom',
    description: 'For large organizations',
    features: [
      'Everything in Pro',
      'Dedicated support',
      'SLA guarantees',
      'Custom deployment',
      'On-premise options',
      'Training & onboarding'
    ],
    cta: 'Contact Sales',
    popular: false
  }
]

export default function SubscriptionPage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [showCheckout, setShowCheckout] = useState(false)

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId)
    if (planId === 'free') {
      // Free plan - direct signup
      window.location.href = '/signup'
    } else if (planId === 'enterprise') {
      // Enterprise - contact sales
      window.location.href = '/contact'
    } else {
      // Show checkout modal
      setShowCheckout(true)
    }
  }

  const selectedPlanData = pricingPlans.find(p => p.id === selectedPlan)

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-purple-50">
        {/* Hero Section */}
        <section className="pt-32 pb-12 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-gray-900">
              Choose Your <span className="text-brand-primary">Perfect Plan</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Start with a 14-day free trial. No credit card required. Cancel anytime.
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 mb-12">
              <span className={`text-lg font-semibold ${billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-400'}`}>
                Monthly
              </span>
              <button
                onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                className="relative w-16 h-8 bg-gray-300 rounded-full transition-colors hover:bg-gray-400"
              >
                <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${billingCycle === 'yearly' ? 'translate-x-8' : ''}`} />
              </button>
              <span className={`text-lg font-semibold ${billingCycle === 'yearly' ? 'text-gray-900' : 'text-gray-400'}`}>
                Yearly
              </span>
              <span className="ml-2 px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full">
                Save 20%
              </span>
            </div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="pb-20 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {pricingPlans.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative p-8 rounded-2xl border-2 transition-all ${plan.popular
                      ? 'bg-black text-white border-brand-primary shadow-2xl scale-105'
                      : 'bg-white border-gray-200 hover:border-brand-primary hover:shadow-lg'
                    }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-brand-primary text-white text-sm font-bold rounded-full flex items-center gap-1">
                      <Sparkles className="w-4 h-4" />
                      MOST POPULAR
                    </div>
                  )}

                  <h3 className={`text-2xl font-bold mb-2 ${plan.popular ? 'text-white' : 'text-gray-900'}`}>
                    {plan.name}
                  </h3>
                  <p className={`text-sm mb-6 ${plan.popular ? 'text-gray-300' : 'text-gray-600'}`}>
                    {plan.description}
                  </p>

                  <div className="mb-6">
                    {plan.price !== null ? (
                      <>
                        <span className="text-4xl font-bold">
                          ${billingCycle === 'yearly' ? Math.floor(plan.price * 0.8) : plan.price}
                        </span>
                        <span className={plan.popular ? 'text-gray-300' : 'text-gray-600'}>
                          {plan.period}
                        </span>
                      </>
                    ) : (
                      <span className="text-4xl font-bold">{plan.priceLabel}</span>
                    )}
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${plan.popular ? 'text-brand-primary' : 'text-green-500'}`} />
                        <span className={`text-sm ${plan.popular ? 'text-gray-200' : 'text-gray-700'}`}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleSelectPlan(plan.id)}
                    className={`w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${plan.popular
                        ? 'bg-brand-primary text-white hover:bg-orange-600'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                      }`}
                  >
                    {plan.cta}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mock Checkout Modal */}
        {showCheckout && selectedPlanData && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
              <h2 className="text-2xl font-bold mb-4 text-gray-900">Complete Your Purchase</h2>

              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-gray-900">{selectedPlanData.name} Plan</span>
                  <span className="text-lg font-bold text-gray-900">
                    ${billingCycle === 'yearly' && selectedPlanData.price ? Math.floor(selectedPlanData.price * 0.8) : selectedPlanData.price}/{billingCycle === 'yearly' ? 'year' : 'month'}
                  </span>
                </div>
                <p className="text-sm text-gray-600">14-day free trial included</p>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
                  <input
                    type="text"
                    placeholder="4242 4242 4242 4242"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Expiry</label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">CVC</label>
                    <input
                      type="text"
                      placeholder="123"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCheckout(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    alert('This is a demo! In production, this would process your payment via Stripe/Razorpay.')
                    setShowCheckout(false)
                  }}
                  className="flex-1 px-6 py-3 bg-brand-primary text-white font-semibold rounded-lg hover:bg-orange-600 transition-all"
                >
                  Subscribe
                </button>
              </div>

              <p className="mt-4 text-xs text-gray-500 text-center">
                🔒 Secure payment powered by Stripe. Your card won't be charged during the trial.
              </p>
            </div>
          </div>
        )}

        {/* FAQ Section */}
        <section className="py-20 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              <div className="p-6 bg-gray-50 rounded-lg">
                <h3 className="font-bold text-lg mb-2 text-gray-900">Can I change plans later?</h3>
                <p className="text-gray-600">Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
              </div>
              <div className="p-6 bg-gray-50 rounded-lg">
                <h3 className="font-bold text-lg mb-2 text-gray-900">What payment methods do you accept?</h3>
                <p className="text-gray-600">We accept all major credit cards, debit cards, and support international payments via Stripe and Razorpay.</p>
              </div>
              <div className="p-6 bg-gray-50 rounded-lg">
                <h3 className="font-bold text-lg mb-2 text-gray-900">Is there a free trial?</h3>
                <p className="text-gray-600">Yes! All paid plans include a 14-day free trial. No credit card required to start.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
