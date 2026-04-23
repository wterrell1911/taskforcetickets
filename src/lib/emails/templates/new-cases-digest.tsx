import {
  Body,
  Container,
  Head,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

export interface DigestCase {
  id: string;
  clientName: string;
  email: string;
  phone: string | null;
  courtDate: string;
  offenseTier: string;
  priceDollars: number;
  status: string;
  paymentStatus: string | null;
  ocrConfidence: number | null;
  createdAt: string;
}

export interface RefundOwedCase extends DigestCase {
  amountPaidDollars: number;
}

export interface UrgentCase extends DigestCase {
  daysUntilCourt: number;
}

export interface DuplicateFlaggedCase extends DigestCase {
  duplicateOfId: string;
}

export interface DataQualityCase extends DigestCase {
  missingFields: string[];
}

export interface NewCasesDigestEmailProps {
  date: string;
  refundOwed: RefundOwedCase[];
  urgent: UrgentCase[];
  duplicates: DuplicateFlaggedCase[];
  dataQuality: DataQualityCase[];
  newCases: DigestCase[];
  stalePending: DigestCase[];
}

const ADMIN_BASE_URL = 'https://taskforcetickets.com/admin/dashboard/cases';

function caseUrl(id: string): string {
  return `${ADMIN_BASE_URL}/${id}`;
}

function formatDate(iso: string): string {
  // Accepts YYYY-MM-DD or full ISO; returns "Mon DD, YYYY"
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function CaseRow({ c, extra }: { c: DigestCase; extra?: React.ReactNode }) {
  return (
    <Section style={cardSection}>
      <Text style={cardHeader}>
        <Link href={caseUrl(c.id)} style={cardLink}>
          {c.clientName}
        </Link>{' '}
        <span style={cardMeta}>— ${c.priceDollars.toFixed(2)} • {c.offenseTier}</span>
      </Text>
      <Text style={cardMeta}>
        Court: {formatDate(c.courtDate)} &nbsp;|&nbsp; {c.email}
        {c.phone ? <> &nbsp;|&nbsp; {c.phone}</> : null}
      </Text>
      {extra}
    </Section>
  );
}

function SectionHeader({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <Section style={{ ...sectionHeaderBar, backgroundColor: color }}>
      <Text style={sectionHeaderText}>
        {label} ({count})
      </Text>
    </Section>
  );
}

export function NewCasesDigestEmail(props: NewCasesDigestEmailProps) {
  const {
    date,
    refundOwed,
    urgent,
    duplicates,
    dataQuality,
    newCases,
    stalePending,
  } = props;

  const total =
    refundOwed.length +
    urgent.length +
    duplicates.length +
    dataQuality.length +
    newCases.length +
    stalePending.length;

  const previewText = `TFT daily digest: ${refundOwed.length + urgent.length} urgent, ${newCases.length} new (${date})`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Text style={headerTitle}>TaskForce Tickets — Daily Digest</Text>
            <Text style={headerDate}>{formatDate(date)}</Text>
            <Text style={headerSummary}>{total} item{total === 1 ? '' : 's'} across all sections</Text>
          </Section>

          {refundOwed.length > 0 && (
            <>
              <SectionHeader label="REFUND OWED — manual action required" count={refundOwed.length} color="#CF2A27" />
              <Section style={sectionDescSection}>
                <Text style={sectionDesc}>
                  These cases were auto-rejected because their court date had already passed when they reached the top of the queue.
                  The customer paid — please issue a Stripe refund.
                </Text>
              </Section>
              {refundOwed.map((c) => (
                <CaseRow
                  key={c.id}
                  c={c}
                  extra={
                    <Text style={cardEmphasis}>
                      Paid: ${c.amountPaidDollars.toFixed(2)} · Refund pending
                    </Text>
                  }
                />
              ))}
            </>
          )}

          {urgent.length > 0 && (
            <>
              <SectionHeader label="URGENT — court date within 7 days" count={urgent.length} color="#D97706" />
              {urgent.map((c) => (
                <CaseRow
                  key={c.id}
                  c={c}
                  extra={
                    <Text style={cardEmphasis}>
                      {c.daysUntilCourt === 0
                        ? 'Court is TODAY'
                        : c.daysUntilCourt === 1
                          ? 'Court is tomorrow'
                          : `${c.daysUntilCourt} days until court`}
                      {' · '}status: {c.status}
                    </Text>
                  }
                />
              ))}
            </>
          )}

          {duplicates.length > 0 && (
            <>
              <SectionHeader label="POSSIBLE DUPLICATES" count={duplicates.length} color="#7C3AED" />
              <Section style={sectionDescSection}>
                <Text style={sectionDesc}>
                  Same email + citation number as a case submitted in the last 30 days. Verify before accepting.
                </Text>
              </Section>
              {duplicates.map((c) => (
                <CaseRow
                  key={c.id}
                  c={c}
                  extra={
                    c.duplicateOfId ? (
                      <Text style={cardMeta}>
                        Matches earlier case:{' '}
                        <Link href={caseUrl(c.duplicateOfId)} style={cardLink}>
                          {c.duplicateOfId}
                        </Link>
                      </Text>
                    ) : null
                  }
                />
              ))}
            </>
          )}

          {dataQuality.length > 0 && (
            <>
              <SectionHeader label="NEEDS INFO — auto-flagged" count={dataQuality.length} color="#0284C7" />
              <Section style={sectionDescSection}>
                <Text style={sectionDesc}>
                  Auto-transitioned to needs_info because of low OCR confidence or missing fields. No customer email was sent — you decide whether to reach out.
                </Text>
              </Section>
              {dataQuality.map((c) => (
                <CaseRow
                  key={c.id}
                  c={c}
                  extra={
                    c.missingFields.length > 0 ? (
                      <Text style={cardEmphasis}>
                        Issues: {c.missingFields.join(', ')}
                      </Text>
                    ) : null
                  }
                />
              ))}
            </>
          )}

          {newCases.length > 0 && (
            <>
              <SectionHeader label="NEW — last 24 hours" count={newCases.length} color="#1A1A1A" />
              {newCases.map((c) => (
                <CaseRow key={c.id} c={c} />
              ))}
            </>
          )}

          {stalePending.length > 0 && (
            <>
              <SectionHeader label="STALE — pending review > 48h" count={stalePending.length} color="#6B7280" />
              {stalePending.map((c) => (
                <CaseRow
                  key={c.id}
                  c={c}
                  extra={
                    <Text style={cardMeta}>
                      Submitted {formatDate(c.createdAt)}
                    </Text>
                  }
                />
              ))}
            </>
          )}

          <Section style={footer}>
            <Text style={footerText}>
              This is an automated digest from the TaskForce Tickets admin portal.
            </Text>
            <Text style={footerText}>
              <Link href="https://taskforcetickets.com/admin/dashboard/cases" style={footerLink}>
                Open the admin dashboard
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#f4f4f4',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0',
  maxWidth: '680px',
};

const header = {
  backgroundColor: '#1A1A1A',
  padding: '24px',
  borderRadius: '8px 8px 0 0',
};

const headerTitle = {
  color: '#FFD100',
  fontSize: '14px',
  fontWeight: '600' as const,
  letterSpacing: '0.5px',
  textTransform: 'uppercase' as const,
  margin: '0 0 4px 0',
};

const headerDate = {
  color: '#ffffff',
  fontSize: '22px',
  fontWeight: '700' as const,
  margin: '0 0 4px 0',
};

const headerSummary = {
  color: '#cccccc',
  fontSize: '13px',
  margin: '0',
};

const sectionHeaderBar = {
  padding: '10px 16px',
  marginTop: '16px',
};

const sectionHeaderText = {
  color: '#ffffff',
  fontSize: '12px',
  fontWeight: '700' as const,
  letterSpacing: '0.5px',
  textTransform: 'uppercase' as const,
  margin: '0',
};

const sectionDescSection = {
  backgroundColor: '#ffffff',
  padding: '12px 16px 0 16px',
};

const sectionDesc = {
  color: '#4A4A4A',
  fontSize: '13px',
  lineHeight: '18px',
  margin: '0 0 8px 0',
  fontStyle: 'italic' as const,
};

const cardSection = {
  backgroundColor: '#ffffff',
  padding: '12px 16px',
  borderBottom: '1px solid #E5E5E5',
};

const cardHeader = {
  color: '#1A1A1A',
  fontSize: '15px',
  fontWeight: '600' as const,
  margin: '0 0 4px 0',
};

const cardMeta = {
  color: '#4A4A4A',
  fontSize: '13px',
  margin: '0 0 2px 0',
};

const cardEmphasis = {
  color: '#CF2A27',
  fontSize: '13px',
  fontWeight: '600' as const,
  margin: '4px 0 0 0',
};

const cardLink = {
  color: '#1A1A1A',
  textDecoration: 'underline',
};

const footer = {
  backgroundColor: '#1A1A1A',
  padding: '16px',
  borderRadius: '0 0 8px 8px',
};

const footerText = {
  color: '#cccccc',
  fontSize: '12px',
  textAlign: 'center' as const,
  margin: '0 0 4px 0',
};

const footerLink = {
  color: '#FFD100',
  textDecoration: 'none',
};

export default NewCasesDigestEmail;
