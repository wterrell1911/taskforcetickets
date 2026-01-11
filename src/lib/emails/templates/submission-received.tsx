import {
  Button,
  Heading,
  Hr,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';
import { BaseEmail } from './base';

interface SubmissionReceivedEmailProps {
  customerName: string;
  caseId: string;
  courtDate: string;
  offenseType: string;
  amountCharged: number;
}

export function SubmissionReceivedEmail({
  customerName,
  caseId,
  courtDate,
  offenseType,
  amountCharged,
}: SubmissionReceivedEmailProps) {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amountCharged / 100);

  return (
    <BaseEmail previewText="We've received your traffic ticket submission - review in progress">
      <Heading style={heading}>Submission Received</Heading>

      <Text style={text}>Hi {customerName},</Text>

      <Text style={text}>
        Thank you for submitting your traffic ticket case to TaskForce Tickets. We&apos;ve received
        your submission and our team is reviewing it now.
      </Text>

      {/* Important Notice */}
      <Section style={warningBox}>
        <Text style={warningTitle}>IMPORTANT: You Are Not Yet a Client</Text>
        <Text style={warningText}>
          This submission is currently under review. <strong>You are NOT yet a client of TaskForce
          Tickets.</strong> You will receive an acceptance email within 24-48 hours if your case
          is approved. Until then, please ensure you are prepared to appear at your court date if needed.
        </Text>
      </Section>

      {/* Case Summary */}
      <Section style={summaryBox}>
        <Text style={summaryTitle}>Submission Summary</Text>
        <table width="100%" cellPadding="0" cellSpacing="0">
          <tr>
            <td style={summaryLabel}>Case ID</td>
            <td style={summaryValue}>{caseId}</td>
          </tr>
          <tr>
            <td style={summaryLabel}>Court Date</td>
            <td style={summaryValue}>{courtDate}</td>
          </tr>
          <tr>
            <td style={summaryLabel}>Offense Type</td>
            <td style={summaryValue}>{offenseType}</td>
          </tr>
          <tr>
            <td style={summaryLabel}>Service Fee</td>
            <td style={summaryValue}>{formattedAmount}</td>
          </tr>
        </table>
      </Section>

      <Hr style={hr} />

      {/* What Happens Next */}
      <Text style={sectionTitle}>What Happens Next?</Text>
      <Text style={text}>
        <strong>1. Case Review (24-48 hours)</strong><br />
        Our team will review your submitted documents and citation details.
      </Text>
      <Text style={text}>
        <strong>2. Acceptance Email</strong><br />
        If your case is approved, you&apos;ll receive an acceptance email confirming we are
        representing you. This is when the attorney-client relationship begins.
      </Text>
      <Text style={text}>
        <strong>3. Court Appearance</strong><br />
        Once accepted, we handle everything. You don&apos;t need to appear in court - we&apos;ll go
        for you.
      </Text>

      <Hr style={hr} />

      {/* Contact */}
      <Text style={text}>
        Have questions? Reply to this email or call us at <strong>(901) 555-0199</strong>.
      </Text>

      <Text style={signature}>
        Thank you for choosing TaskForce Tickets,<br />
        <strong>The TaskForce Tickets Team</strong>
      </Text>
    </BaseEmail>
  );
}

// Styles
const heading = {
  color: '#1A1A1A',
  fontSize: '24px',
  fontWeight: 'bold' as const,
  margin: '0 0 24px 0',
};

const text = {
  color: '#4A4A4A',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '0 0 16px 0',
};

const sectionTitle = {
  color: '#1A1A1A',
  fontSize: '16px',
  fontWeight: 'bold' as const,
  margin: '0 0 12px 0',
};

const warningBox = {
  backgroundColor: '#FFF9E6',
  border: '2px solid #FFD100',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
};

const warningTitle = {
  color: '#1A1A1A',
  fontSize: '14px',
  fontWeight: 'bold' as const,
  margin: '0 0 8px 0',
};

const warningText = {
  color: '#4A4A4A',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '0',
};

const summaryBox = {
  backgroundColor: '#F8F8F8',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
};

const summaryTitle = {
  color: '#1A1A1A',
  fontSize: '14px',
  fontWeight: 'bold' as const,
  margin: '0 0 12px 0',
};

const summaryLabel = {
  color: '#4A4A4A',
  fontSize: '13px',
  padding: '4px 0',
  width: '40%',
};

const summaryValue = {
  color: '#1A1A1A',
  fontSize: '13px',
  fontWeight: '600' as const,
  padding: '4px 0',
};

const hr = {
  borderColor: '#E5E5E5',
  margin: '24px 0',
};

const signature = {
  color: '#4A4A4A',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '24px 0 0 0',
};

export default SubmissionReceivedEmail;
