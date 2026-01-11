-- TaskForce Tickets Database Schema
-- Run this in your Supabase SQL editor to set up the database

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Cases table - main table for tracking all submitted cases
CREATE TABLE IF NOT EXISTS cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Status tracking
  status VARCHAR(50) DEFAULT 'pending_review' NOT NULL,
  -- Valid values: pending_review, accepted, needs_info, in_progress, dismissed, not_dismissed, rejected, refunded

  -- Customer info
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20),
  customer_address_encrypted TEXT,

  -- License info (encrypted sensitive data)
  license_number_encrypted TEXT,
  license_number_masked VARCHAR(20),
  license_expiration DATE,
  date_of_birth_encrypted TEXT,

  -- Citation info
  citation_number VARCHAR(100),
  court_date DATE NOT NULL,
  court_time TIME,
  court_location VARCHAR(255),
  violation_codes TEXT[] DEFAULT '{}',
  violation_description TEXT,
  violation_location VARCHAR(255),
  violation_datetime TIMESTAMP,
  officer_name VARCHAR(255),
  officer_badge VARCHAR(50),

  -- Pricing
  offense_tier VARCHAR(50) NOT NULL,
  amount_charged INTEGER NOT NULL, -- in cents

  -- Documents (Supabase Storage paths)
  ticket_document_path TEXT,
  license_document_path TEXT,
  supporting_document_path TEXT,
  documents_deleted BOOLEAN DEFAULT FALSE,
  documents_deleted_at TIMESTAMP,

  -- OCR data
  ocr_raw_text TEXT,
  ocr_confidence FLOAT,
  ocr_extraction_warnings TEXT[] DEFAULT '{}',

  -- Legal agreement tracking
  terms_accepted_at TIMESTAMP NOT NULL,
  terms_version VARCHAR(20) NOT NULL,
  privacy_accepted_at TIMESTAMP NOT NULL,
  deadline_acknowledged BOOLEAN NOT NULL DEFAULT FALSE,

  -- Payment (Stripe)
  stripe_payment_intent_id VARCHAR(255),
  payment_status VARCHAR(50) DEFAULT 'pending',
  -- Valid values: pending, succeeded, failed, refunded

  -- Timeline
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  accepted_at TIMESTAMP,
  disposed_at TIMESTAMP,
  disposition_type VARCHAR(50), -- dismissed, not_dismissed
  refund_issued_at TIMESTAMP,

  -- Admin
  assigned_attorney VARCHAR(255),
  internal_notes TEXT,

  -- Analytics (de-identified data kept after document deletion)
  violation_zip_code VARCHAR(10),
  violation_ward VARCHAR(50),

  -- Review incentive
  review_requested_at TIMESTAMP,
  review_submitted_at TIMESTAMP,
  review_incentive_paid BOOLEAN DEFAULT FALSE,
  review_incentive_paid_at TIMESTAMP
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_court_date ON cases(court_date);
CREATE INDEX IF NOT EXISTS idx_cases_created_at ON cases(created_at);
CREATE INDEX IF NOT EXISTS idx_cases_customer_email ON cases(customer_email);
CREATE INDEX IF NOT EXISTS idx_cases_payment_status ON cases(payment_status);
CREATE INDEX IF NOT EXISTS idx_cases_documents_deleted ON cases(documents_deleted);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_cases_updated_at
  BEFORE UPDATE ON cases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Case status history table for audit trail
CREATE TABLE IF NOT EXISTS case_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  changed_by VARCHAR(255), -- admin email or 'system'
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_case_status_history_case_id ON case_status_history(case_id);

-- Email log table for tracking sent emails
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
  email_type VARCHAR(100) NOT NULL,
  -- Types: submission_received, case_accepted, needs_info, case_dismissed, case_not_dismissed, rejection
  recipient_email VARCHAR(255) NOT NULL,
  subject VARCHAR(500),
  resend_message_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'sent',
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_logs_case_id ON email_logs(case_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_email_type ON email_logs(email_type);

-- Document cleanup log for auditing
CREATE TABLE IF NOT EXISTS document_cleanup_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL,
  documents_deleted TEXT[] NOT NULL, -- array of storage paths deleted
  deleted_at TIMESTAMP DEFAULT NOW(),
  retention_days INTEGER NOT NULL -- how many days after disposition
);

-- Row Level Security (RLS) policies

-- Enable RLS on all tables
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_cleanup_logs ENABLE ROW LEVEL SECURITY;

-- Admin policies (authenticated users with admin role can access all)
-- Note: You'll need to set up admin role in Supabase Auth

-- For now, create policies that allow service role access (server-side only)
CREATE POLICY "Service role can manage cases"
  ON cases FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage case_status_history"
  ON case_status_history FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage email_logs"
  ON email_logs FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage document_cleanup_logs"
  ON document_cleanup_logs FOR ALL
  USING (auth.role() = 'service_role');

-- Storage buckets setup (run these separately or via Supabase dashboard)
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES
--   ('intake-documents', 'intake-documents', false),
--   ('processed-thumbnails', 'processed-thumbnails', false);

-- Storage policies (documents are private, accessible only via signed URLs)
-- CREATE POLICY "Authenticated users can upload to intake-documents"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'intake-documents' AND auth.role() = 'authenticated');

-- CREATE POLICY "Service role can manage all storage"
--   ON storage.objects FOR ALL
--   USING (auth.role() = 'service_role');

-- View for case summaries (used in admin dashboard)
CREATE OR REPLACE VIEW case_summaries AS
SELECT
  id,
  customer_name,
  customer_email,
  court_date,
  offense_tier,
  amount_charged,
  status,
  created_at,
  ocr_raw_text IS NOT NULL AS has_ocr_data,
  ocr_confidence
FROM cases
ORDER BY created_at DESC;

-- Function to get cases needing document cleanup
CREATE OR REPLACE FUNCTION get_cases_for_document_cleanup(retention_days INTEGER DEFAULT 30)
RETURNS TABLE (
  id UUID,
  ticket_document_path TEXT,
  license_document_path TEXT,
  supporting_document_path TEXT,
  disposed_at TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.ticket_document_path,
    c.license_document_path,
    c.supporting_document_path,
    c.disposed_at
  FROM cases c
  WHERE
    c.disposed_at IS NOT NULL
    AND c.disposed_at < NOW() - (retention_days || ' days')::INTERVAL
    AND c.documents_deleted = FALSE
    AND (
      c.ticket_document_path IS NOT NULL
      OR c.license_document_path IS NOT NULL
      OR c.supporting_document_path IS NOT NULL
    );
END;
$$ LANGUAGE plpgsql;

-- Function to mark documents as deleted
CREATE OR REPLACE FUNCTION mark_documents_deleted(case_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE cases
  SET
    documents_deleted = TRUE,
    documents_deleted_at = NOW(),
    ticket_document_path = NULL,
    license_document_path = NULL,
    supporting_document_path = NULL
  WHERE id = case_id;
END;
$$ LANGUAGE plpgsql;
