-- LawPay Payment Integration
-- Created: 2026-01-02

-- Add LawPay payment fields to cases table
DO $$
BEGIN
  -- LawPay payment request ID (for hosted page / Pay Later)
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'cases' AND column_name = 'lawpay_payment_request_id'
  ) THEN
    ALTER TABLE cases ADD COLUMN lawpay_payment_request_id VARCHAR(255);
  END IF;

  -- LawPay charge ID
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'cases' AND column_name = 'lawpay_charge_id'
  ) THEN
    ALTER TABLE cases ADD COLUMN lawpay_charge_id VARCHAR(255);
  END IF;

  -- LawPay refund ID
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'cases' AND column_name = 'lawpay_refund_id'
  ) THEN
    ALTER TABLE cases ADD COLUMN lawpay_refund_id VARCHAR(255);
  END IF;

  -- Payment method used (card, echeck, pay_later)
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'cases' AND column_name = 'lawpay_payment_method'
  ) THEN
    ALTER TABLE cases ADD COLUMN lawpay_payment_method VARCHAR(50);
  END IF;

  -- Payment failure reason
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'cases' AND column_name = 'payment_failure_reason'
  ) THEN
    ALTER TABLE cases ADD COLUMN payment_failure_reason TEXT;
  END IF;

  -- Payment completion timestamp
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'cases' AND column_name = 'paid_at'
  ) THEN
    ALTER TABLE cases ADD COLUMN paid_at TIMESTAMP;
  END IF;

  -- Money-back guarantee eligibility
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'cases' AND column_name = 'money_back_eligible'
  ) THEN
    ALTER TABLE cases ADD COLUMN money_back_eligible BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Create index for LawPay IDs
CREATE INDEX IF NOT EXISTS idx_cases_lawpay_charge_id ON cases(lawpay_charge_id);
CREATE INDEX IF NOT EXISTS idx_cases_lawpay_payment_request_id ON cases(lawpay_payment_request_id);
CREATE INDEX IF NOT EXISTS idx_cases_payment_status ON cases(payment_status);

-- Payment events log for tracking webhooks
CREATE TABLE IF NOT EXISTS payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
  event_type VARCHAR(100) NOT NULL,
  lawpay_event_id VARCHAR(255),
  amount_cents INTEGER,
  payment_method VARCHAR(50),
  status VARCHAR(50),
  raw_data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_events_case_id ON payment_events(case_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_event_type ON payment_events(event_type);
CREATE INDEX IF NOT EXISTS idx_payment_events_created_at ON payment_events(created_at);

COMMENT ON TABLE payment_events IS 'Log of LawPay webhook events for payment tracking and debugging';
COMMENT ON COLUMN cases.lawpay_payment_method IS 'Payment method: card, echeck, or pay_later';
COMMENT ON COLUMN cases.money_back_eligible IS 'Whether this case qualifies for money-back guarantee if not dismissed';
