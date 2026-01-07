-- Migration: 012_payment_subscriptions.sql
-- Description: Add payment and subscription tables for Stripe/Razorpay integration
-- Run this in Supabase SQL Editor

-- ============================================================================
-- 1. SUBSCRIPTION PLANS TABLE (Predefined plans)
-- ============================================================================
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- "Starter", "Professional", "Enterprise"
  slug TEXT UNIQUE NOT NULL, -- "starter", "professional", "enterprise"
  description TEXT,
  price_monthly INTEGER NOT NULL, -- Price in cents/paise (e.g., 2900 = $29.00)
  price_yearly INTEGER, -- Optional yearly pricing
  currency TEXT DEFAULT 'usd' CHECK (currency IN ('usd', 'inr', 'eur')),
  interval TEXT DEFAULT 'month' CHECK (interval IN ('month', 'year')),
  
  -- Payment provider IDs
  stripe_price_id_monthly TEXT, -- Stripe Price ID for monthly
  stripe_price_id_yearly TEXT, -- Stripe Price ID for yearly
  razorpay_plan_id_monthly TEXT, -- Razorpay Plan ID for monthly
  razorpay_plan_id_yearly TEXT, -- Razorpay Plan ID for yearly
  
  -- Features
  max_interviews_per_month INTEGER,
  max_users INTEGER,
  features JSONB DEFAULT '[]', -- ["feature1", "feature2"]
  
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_plans_slug ON subscription_plans(slug);
CREATE INDEX idx_plans_active ON subscription_plans(is_active);

-- Seed default plans
INSERT INTO subscription_plans (name, slug, description, price_monthly, price_yearly, currency, max_interviews_per_month, max_users, features) VALUES
  ('Free', 'free', 'Perfect for trying out the platform', 0, 0, 'usd', 5, 1, '["Basic interviews", "Email support"]'),
  ('Starter', 'starter', 'For small teams', 2900, 29000, 'usd', 50, 5, '["50 interviews/month", "5 team members", "Email support", "Basic analytics"]'),
  ('Professional', 'professional', 'For growing companies', 9900, 99000, 'usd', 200, 20, '["200 interviews/month", "20 team members", "Priority support", "Advanced analytics", "Custom branding"]'),
  ('Enterprise', 'enterprise', 'Custom solutions', 0, 0, 'usd', NULL, NULL, '["Unlimited interviews", "Unlimited users", "Dedicated support", "Custom integrations", "SLA guarantee"]');

-- ============================================================================
-- 2. SUBSCRIPTIONS TABLE (Active subscriptions per tenant)
-- ============================================================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id),
  
  -- Payment provider IDs
  stripe_subscription_id TEXT UNIQUE, -- Stripe Subscription ID
  razorpay_subscription_id TEXT UNIQUE, -- Razorpay Subscription ID
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'unpaid', 'trialing')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,
  
  -- Payment method
  payment_provider TEXT CHECK (payment_provider IN ('stripe', 'razorpay')),
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_tenant ON subscriptions(tenant_id);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
CREATE INDEX idx_subscriptions_razorpay ON subscriptions(razorpay_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- ============================================================================
-- 3. PAYMENTS TABLE (Payment transactions)
-- ============================================================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  tenant_id TEXT REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Payment provider IDs
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_charge_id TEXT,
  razorpay_payment_id TEXT UNIQUE,
  razorpay_order_id TEXT,
  
  -- Amount
  amount INTEGER NOT NULL, -- Amount in cents/paise
  currency TEXT DEFAULT 'usd',
  
  -- Status
  status TEXT NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  payment_method TEXT, -- "card", "upi", "netbanking", etc.
  
  -- Customer info
  customer_email TEXT,
  customer_name TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  failure_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payments_subscription ON payments(subscription_id);
CREATE INDEX idx_payments_tenant ON payments(tenant_id);
CREATE INDEX idx_payments_stripe ON payments(stripe_payment_intent_id);
CREATE INDEX idx_payments_razorpay ON payments(razorpay_payment_id);
CREATE INDEX idx_payments_status ON payments(status);

-- ============================================================================
-- 4. UPDATE TENANTS TABLE (Add subscription reference)
-- ============================================================================
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS current_subscription_id UUID REFERENCES subscriptions(id),
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free' CHECK (subscription_status IN ('free', 'active', 'canceled', 'past_due', 'trial'));

CREATE INDEX idx_tenants_subscription ON tenants(current_subscription_id);

-- ============================================================================
-- 5. RLS POLICIES
-- ============================================================================
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Subscriptions: Tenants can view their own subscriptions
CREATE POLICY "Tenants can view own subscriptions"
  ON subscriptions FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_memberships 
      WHERE profile_id = auth.uid()
    )
  );

-- Payments: Tenants can view their own payments
CREATE POLICY "Tenants can view own payments"
  ON payments FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM tenant_memberships 
      WHERE profile_id = auth.uid()
    )
  );

-- Subscription plans: Everyone can view active plans
CREATE POLICY "Everyone can view active plans"
  ON subscription_plans FOR SELECT
  USING (is_active = TRUE);

-- ============================================================================
-- 6. HELPER FUNCTIONS
-- ============================================================================

-- Function to get current subscription for a tenant
CREATE OR REPLACE FUNCTION get_tenant_subscription(p_tenant_id TEXT)
RETURNS TABLE (
  subscription_id UUID,
  plan_name TEXT,
  plan_slug TEXT,
  status TEXT,
  current_period_end TIMESTAMPTZ,
  max_interviews INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    sp.name,
    sp.slug,
    s.status,
    s.current_period_end,
    sp.max_interviews_per_month
  FROM subscriptions s
  JOIN subscription_plans sp ON s.plan_id = sp.id
  WHERE s.tenant_id = p_tenant_id
    AND s.status = 'active'
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if tenant has available interviews
CREATE OR REPLACE FUNCTION check_interview_quota(p_tenant_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_max_interviews INTEGER;
  v_used_interviews INTEGER;
BEGIN
  -- Get max interviews from subscription
  SELECT max_interviews_per_month INTO v_max_interviews
  FROM subscriptions s
  JOIN subscription_plans sp ON s.plan_id = sp.id
  WHERE s.tenant_id = p_tenant_id
    AND s.status = 'active'
  LIMIT 1;
  
  -- If no subscription or unlimited, allow
  IF v_max_interviews IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- Count interviews this month (you'll need to implement this based on your interview tracking)
  -- For now, return true
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

