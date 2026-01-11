-- Email logging and tracking for case communications
-- Created: 2026-01-02

-- Email logs table for tracking all emails sent
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
  email_type VARCHAR(50) NOT NULL,
  recipient_email VARCHAR(255) NOT NULL,
  subject VARCHAR(500),
  resend_message_id VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  error_message TEXT,
  sent_at TIMESTAMP DEFAULT NOW(),
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_email_logs_case_id ON email_logs(case_id);
CREATE INDEX idx_email_logs_email_type ON email_logs(email_type);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_sent_at ON email_logs(sent_at);
CREATE INDEX idx_email_logs_resend_message_id ON email_logs(resend_message_id);

-- Add email timestamp columns to cases table if they don't exist
DO $$
BEGIN
  -- Confirmation email sent timestamp
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'cases' AND column_name = 'confirmation_email_sent_at'
  ) THEN
    ALTER TABLE cases ADD COLUMN confirmation_email_sent_at TIMESTAMP;
  END IF;

  -- Acceptance email sent timestamp
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'cases' AND column_name = 'acceptance_email_sent_at'
  ) THEN
    ALTER TABLE cases ADD COLUMN acceptance_email_sent_at TIMESTAMP;
  END IF;

  -- Needs info email sent timestamp
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'cases' AND column_name = 'needs_info_email_sent_at'
  ) THEN
    ALTER TABLE cases ADD COLUMN needs_info_email_sent_at TIMESTAMP;
  END IF;

  -- Dismissed email sent timestamp
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'cases' AND column_name = 'dismissed_email_sent_at'
  ) THEN
    ALTER TABLE cases ADD COLUMN dismissed_email_sent_at TIMESTAMP;
  END IF;

  -- Not dismissed email sent timestamp
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'cases' AND column_name = 'not_dismissed_email_sent_at'
  ) THEN
    ALTER TABLE cases ADD COLUMN not_dismissed_email_sent_at TIMESTAMP;
  END IF;

  -- Court costs payment reminder sent timestamp
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'cases' AND column_name = 'court_costs_reminder_sent_at'
  ) THEN
    ALTER TABLE cases ADD COLUMN court_costs_reminder_sent_at TIMESTAMP;
  END IF;

  -- Review request email sent timestamp
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'cases' AND column_name = 'review_requested_at'
  ) THEN
    ALTER TABLE cases ADD COLUMN review_requested_at TIMESTAMP;
  END IF;

  -- Court payment link key (for lookup in config)
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'cases' AND column_name = 'court_payment_key'
  ) THEN
    ALTER TABLE cases ADD COLUMN court_payment_key VARCHAR(100);
  END IF;

  -- Court costs amount
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'cases' AND column_name = 'court_costs_amount'
  ) THEN
    ALTER TABLE cases ADD COLUMN court_costs_amount DECIMAL(10, 2);
  END IF;

  -- Court costs due date
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'cases' AND column_name = 'court_costs_due_date'
  ) THEN
    ALTER TABLE cases ADD COLUMN court_costs_due_date DATE;
  END IF;

  -- Fine amount (if not dismissed)
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'cases' AND column_name = 'fine_amount'
  ) THEN
    ALTER TABLE cases ADD COLUMN fine_amount DECIMAL(10, 2);
  END IF;

  -- Fine due date
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_name = 'cases' AND column_name = 'fine_due_date'
  ) THEN
    ALTER TABLE cases ADD COLUMN fine_due_date DATE;
  END IF;
END $$;

-- Case status history table for auditing
CREATE TABLE IF NOT EXISTS case_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  changed_by VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_case_status_history_case_id ON case_status_history(case_id);
CREATE INDEX idx_case_status_history_created_at ON case_status_history(created_at);

-- Comments/notes for security
COMMENT ON TABLE email_logs IS 'Tracks all transactional emails sent to customers';
COMMENT ON COLUMN email_logs.resend_message_id IS 'Resend API message ID for tracking delivery';
COMMENT ON TABLE case_status_history IS 'Audit log of all status changes for cases';
