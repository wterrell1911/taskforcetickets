import {
  Body,
  Container,
  Head,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Hr,
} from '@react-email/components';
import * as React from 'react';

interface WeeklyDigestProps {
  period: {
    start: string;
    end: string;
  };
  kpis: {
    leads: { value: number; change: number };
    calls: { value: number; change: number };
    formSubmissions: { value: number; change: number };
    sessions: { value: number; change: number };
  };
  topKeywords: Array<{
    keyword: string;
    impressions: number;
    clicks: number;
    position: number;
  }>;
  leadSources: Array<{ source: string; count: number }>;
  actionItems: string[];
}

function formatChange(change: number): string {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}%`;
}

function getChangeColor(change: number): string {
  return change >= 0 ? '#22c55e' : '#ef4444';
}

export function WeeklyDigestEmail({
  period,
  kpis,
  topKeywords,
  leadSources,
  actionItems,
}: WeeklyDigestProps) {
  return (
    <Html>
      <Head />
      <Preview>
        TaskForce Tickets Weekly Report: {String(kpis.leads.value)} leads, {String(kpis.calls.value)} calls
      </Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <table width="100%" cellPadding="0" cellSpacing="0">
              <tr>
                <td>
                  <div style={logoContainer}>
                    <div style={logoBox}>
                      <Text style={logoText}>TF</Text>
                    </div>
                    <Text style={brandText}>TaskForce Tickets</Text>
                  </div>
                </td>
              </tr>
            </table>
          </Section>

          {/* Content */}
          <Section style={content}>
            <Text style={title}>Weekly Performance Report</Text>
            <Text style={subtitle}>
              {period.start} - {period.end}
            </Text>

            {/* KPI Cards */}
            <table width="100%" cellPadding="0" cellSpacing="0" style={{ marginBottom: '24px' }}>
              <tr>
                <td style={kpiCard}>
                  <Text style={kpiLabel}>Total Leads</Text>
                  <Text style={kpiValue}>{kpis.leads.value}</Text>
                  <Text style={{ ...kpiChange, color: getChangeColor(kpis.leads.change) }}>
                    {formatChange(kpis.leads.change)} vs last week
                  </Text>
                </td>
                <td style={kpiCard}>
                  <Text style={kpiLabel}>Phone Calls</Text>
                  <Text style={kpiValue}>{kpis.calls.value}</Text>
                  <Text style={{ ...kpiChange, color: getChangeColor(kpis.calls.change) }}>
                    {formatChange(kpis.calls.change)} vs last week
                  </Text>
                </td>
              </tr>
              <tr>
                <td style={kpiCard}>
                  <Text style={kpiLabel}>Form Submissions</Text>
                  <Text style={kpiValue}>{kpis.formSubmissions.value}</Text>
                  <Text style={{ ...kpiChange, color: getChangeColor(kpis.formSubmissions.change) }}>
                    {formatChange(kpis.formSubmissions.change)} vs last week
                  </Text>
                </td>
                <td style={kpiCard}>
                  <Text style={kpiLabel}>Website Sessions</Text>
                  <Text style={kpiValue}>{kpis.sessions.value.toLocaleString()}</Text>
                  <Text style={{ ...kpiChange, color: getChangeColor(kpis.sessions.change) }}>
                    {formatChange(kpis.sessions.change)} vs last week
                  </Text>
                </td>
              </tr>
            </table>

            <Hr style={divider} />

            {/* Top Keywords */}
            {topKeywords.length > 0 && (
              <>
                <Text style={sectionTitle}>Top 5 Keywords</Text>
                <table width="100%" cellPadding="0" cellSpacing="0" style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={tableHeader}>Keyword</th>
                      <th style={{ ...tableHeader, textAlign: 'right' }}>Clicks</th>
                      <th style={{ ...tableHeader, textAlign: 'right' }}>Position</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topKeywords.slice(0, 5).map((kw, i) => (
                      <tr key={i}>
                        <td style={tableCell}>{kw.keyword}</td>
                        <td style={{ ...tableCell, textAlign: 'right' }}>{kw.clicks}</td>
                        <td style={{ ...tableCell, textAlign: 'right' }}>{kw.position.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Hr style={divider} />
              </>
            )}

            {/* Lead Sources */}
            {leadSources.length > 0 && (
              <>
                <Text style={sectionTitle}>Lead Source Breakdown</Text>
                {leadSources.map((source, i) => (
                  <Text key={i} style={listItem}>
                    • {source.source}: {source.count}
                  </Text>
                ))}
                <Hr style={divider} />
              </>
            )}

            {/* Action Items */}
            {actionItems.length > 0 && (
              <>
                <Text style={sectionTitle}>💡 Action Items</Text>
                {actionItems.map((item, i) => (
                  <Text key={i} style={actionItem}>
                    → {item}
                  </Text>
                ))}
              </>
            )}
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              <Link href="https://taskforcetickets.com/dashboard" style={footerLink}>
                View Full Dashboard
              </Link>
            </Text>
            <Text style={footerBrand}>
              Powered by{' '}
              <Link href="https://302digitaladvisory.com" style={footerLink}>
                302 Digital Advisory
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
  backgroundColor: '#f8f8f8',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0',
  maxWidth: '600px',
};

const header = {
  backgroundColor: '#1A1A1A',
  padding: '24px',
  borderRadius: '12px 12px 0 0',
};

const logoContainer = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
};

const logoBox = {
  width: '40px',
  height: '40px',
  backgroundColor: '#FFD100',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const logoText = {
  color: '#1A1A1A',
  fontSize: '18px',
  fontWeight: 'bold' as const,
  margin: '0',
  lineHeight: '40px',
  textAlign: 'center' as const,
};

const brandText = {
  color: '#ffffff',
  fontSize: '18px',
  fontWeight: '600' as const,
  margin: '0',
};

const content = {
  backgroundColor: '#ffffff',
  padding: '32px 24px',
};

const title = {
  fontSize: '24px',
  fontWeight: 'bold' as const,
  color: '#1A1A1A',
  margin: '0 0 4px 0',
};

const subtitle = {
  fontSize: '14px',
  color: '#666666',
  margin: '0 0 24px 0',
};

const kpiCard = {
  padding: '16px',
  backgroundColor: '#f8f8f8',
  borderRadius: '8px',
  margin: '4px',
  textAlign: 'center' as const,
};

const kpiLabel = {
  fontSize: '12px',
  color: '#666666',
  margin: '0 0 4px 0',
};

const kpiValue = {
  fontSize: '28px',
  fontWeight: 'bold' as const,
  color: '#1A1A1A',
  margin: '0',
};

const kpiChange = {
  fontSize: '12px',
  margin: '4px 0 0 0',
};

const divider = {
  borderColor: '#eeeeee',
  margin: '24px 0',
};

const sectionTitle = {
  fontSize: '16px',
  fontWeight: 'bold' as const,
  color: '#1A1A1A',
  margin: '0 0 16px 0',
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse' as const,
};

const tableHeader = {
  fontSize: '12px',
  color: '#666666',
  fontWeight: '600' as const,
  padding: '8px 0',
  borderBottom: '1px solid #eeeeee',
  textAlign: 'left' as const,
};

const tableCell = {
  fontSize: '14px',
  color: '#1A1A1A',
  padding: '8px 0',
  borderBottom: '1px solid #f8f8f8',
};

const listItem = {
  fontSize: '14px',
  color: '#1A1A1A',
  margin: '0 0 8px 0',
};

const actionItem = {
  fontSize: '14px',
  color: '#1A1A1A',
  margin: '0 0 8px 0',
  backgroundColor: '#FFF9E6',
  padding: '12px',
  borderRadius: '6px',
  borderLeft: '4px solid #FFD100',
};

const footer = {
  backgroundColor: '#1A1A1A',
  padding: '24px',
  borderRadius: '0 0 12px 12px',
  textAlign: 'center' as const,
};

const footerText = {
  margin: '0 0 12px 0',
};

const footerLink = {
  color: '#FFD100',
  textDecoration: 'none',
};

const footerBrand = {
  color: '#666666',
  fontSize: '12px',
  margin: '0',
};

export default WeeklyDigestEmail;
