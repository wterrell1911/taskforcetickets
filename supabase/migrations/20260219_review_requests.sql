-- Review Requests table
-- Tracks review request lifecycle: initial send → followup1 → followup2 → completed

CREATE TABLE IF NOT EXISTS review_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  -- Status values: pending, sent, followup1_sent, followup2_sent, completed, failed
  initial_sent_at TIMESTAMPTZ,
  followup1_sent_at TIMESTAMPTZ,
  followup2_sent_at TIMESTAMPTZ,
  review_received_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate requests for same case
  CONSTRAINT unique_case_review UNIQUE (case_id)
);

-- Index for finding pending follow-ups efficiently
CREATE INDEX idx_review_requests_status ON review_requests(status);
CREATE INDEX idx_review_requests_initial_sent ON review_requests(initial_sent_at) WHERE status = 'sent';
CREATE INDEX idx_review_requests_followup1_sent ON review_requests(followup1_sent_at) WHERE status = 'followup1_sent';

-- Enable RLS
ALTER TABLE review_requests ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (for cron jobs and admin)
CREATE POLICY "Service role has full access" ON review_requests
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Allow authenticated users to read (for admin dashboard)
CREATE POLICY "Authenticated users can read" ON review_requests
  FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON TABLE review_requests IS 'Tracks review request lifecycle for dismissed cases';
COMMENT ON COLUMN review_requests.status IS 'pending → sent → followup1_sent → followup2_sent → completed OR failed';
