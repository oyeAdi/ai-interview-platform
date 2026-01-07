export interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number | null;
  currency: string;
  interval: 'month' | 'year';
  stripe_price_id_monthly: string | null;
  stripe_price_id_yearly: string | null;
  razorpay_plan_id_monthly: string | null;
  razorpay_plan_id_yearly: string | null;
  max_interviews_per_month: number | null;
  max_users: number | null;
  features: string[];
  is_active: boolean;
  display_order: number;
}

export interface Subscription {
  id: string;
  tenant_id: string;
  plan_id: string;
  stripe_subscription_id: string | null;
  razorpay_subscription_id: string | null;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  payment_provider: 'stripe' | 'razorpay' | null;
  subscription_plans?: SubscriptionPlan;
}

export interface Payment {
  id: string;
  subscription_id: string | null;
  tenant_id: string;
  stripe_payment_intent_id: string | null;
  razorpay_payment_id: string | null;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  payment_method: string | null;
  customer_email: string | null;
  created_at: string;
}

export interface CheckoutSession {
  session_id?: string;
  subscription_id?: string;
  url?: string;
  short_url?: string;
  provider: 'stripe' | 'razorpay';
}

