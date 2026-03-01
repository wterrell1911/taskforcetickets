-- Promo Codes Table
-- Supports percentage discounts, fixed amount discounts, and free submissions

CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed', 'free')),
  discount_value INTEGER DEFAULT 0, -- percentage (0-100) or cents for fixed
  max_uses INTEGER, -- NULL for unlimited
  current_uses INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,
  min_order_cents INTEGER DEFAULT 0, -- minimum order amount for promo to apply
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast code lookups
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(active) WHERE active = true;

-- Track promo code usage per case
CREATE TABLE IF NOT EXISTS promo_code_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
  case_id UUID NOT NULL,
  discount_applied_cents INTEGER NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promo_usage_code ON promo_code_usages(promo_code_id);
CREATE INDEX IF NOT EXISTS idx_promo_usage_case ON promo_code_usages(case_id);

-- Add promo code fields to cases table
ALTER TABLE cases
  ADD COLUMN IF NOT EXISTS promo_code_id UUID REFERENCES promo_codes(id),
  ADD COLUMN IF NOT EXISTS promo_discount_cents INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS final_amount_cents INTEGER;

-- Update final_amount_cents to be amount_charged - promo_discount_cents
-- This will be calculated in application code

-- Insert initial beta test promo code
INSERT INTO promo_codes (code, description, discount_type, discount_value, max_uses, valid_until)
VALUES
  ('BETA2025', 'Beta tester - free submission', 'free', 0, 100, '2025-12-31 23:59:59+00'),
  ('FIRST50', 'First 50 customers - 50% off', 'percentage', 50, 50, '2025-06-30 23:59:59+00'),
  ('MEMPHIS10', 'Memphis resident discount', 'fixed', 1000, NULL, '2025-12-31 23:59:59+00')
ON CONFLICT (code) DO NOTHING;

-- Add eligibility screening fields to cases table
ALTER TABLE cases
  ADD COLUMN IF NOT EXISTS eligibility_status VARCHAR(30) DEFAULT 'pending_screening',
  ADD COLUMN IF NOT EXISTS eligibility_rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS eligibility_rejection_code VARCHAR(50),
  ADD COLUMN IF NOT EXISTS speed_over_limit INTEGER,
  ADD COLUMN IF NOT EXISTS jurisdiction VARCHAR(50),
  ADD COLUMN IF NOT EXISTS court_division VARCHAR(20),
  ADD COLUMN IF NOT EXISTS requires_manual_review BOOLEAN DEFAULT false;

-- Eligibility status can be: 'pending_screening', 'accepted_for_review', 'auto_rejected', 'manually_approved', 'manually_rejected'
