import {
  Heading,
  Hr,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';
import { BaseEmail } from './base';

interface CaseAcceptedEmailProps {
  customerName: string;
  caseId: string;
  citationNumber: string;
  courtDate: string;
  courtTime?: string;
  courtLocation: string;
}

export function CaseAcceptedEmail({
  customerName,
  caseId,
  citationNumber,
  courtDate,
  courtTime,
  courtLocation,
}: CaseAcceptedEmailProps) {
  return (
    <BaseEmail previewText="Great news! Your case has been accepted - we're on it">
      {/* Success Banner */}
      <Section style={successBanner}>
        <Text style={successIcon}>✓</Text>
        <Text style={successTitle}>Case Accepted</Text>
      </Section>

      <Heading style={heading}>You Are Now a Client</Heading>

      <Text style={text}>Hi {customerName},</Text>

      <Text style={text}>
        Great news! We&apos;ve reviewed your submission and <strong>accepted your case</strong>.
        The attorney-client relationship is now established, and we will represent you for
        this traffic citation.
      </Text>

      {/* Case Details */}
      <Section style={detailsBox}>
        <Text style={detailsTitle}>Your Case Details</Text>
        <table width="100%" cellPadding="0" cellSpacing="0">
          <tr>
            <td style={detailsLabel}>Case ID</td>
            <td style={detailsValue}>{caseId}</td>
          </tr>
          <tr>
            <td style={detailsLabel}>Citation Number</td>
            <td style={detailsValue}>{citationNumber}</td>
          </tr>
          <tr>
            <td style={detailsLabel}>Court Date</td>
            <td style={detailsValue}>{courtDate}{courtTime ? ` at ${courtTime}` : ''}</td>
          </tr>
          <tr>
            <td style={detailsLabel}>Court Location</td>
            <td style={detailsValue}>{courtLocation}</td>
          </tr>
        </table>
      </Section>

      <Hr style={hr} />

      {/* What We Do */}
      <Text style={sectionTitle}>What We Will Do</Text>
      <Text style={text}>
        <strong>✓ Appear in court on your behalf</strong><br />
        You do not need to attend. Our attorney will represent you.
      </Text>
      <Text style={text}>
        <strong>✓ Seek dismissal of your citation</strong><br />
        We will work to have your ticket dismissed with no points on your record.
      </Text>
      <Text style={text}>
        <strong>✓ Keep you informed</strong><br />
        You&apos;ll receive an email after your court date with the outcome.
      </Text>

      <Hr style={hr} />

      {/* What You Do */}
      <Text style={sectionTitle}>What You Need to Do</Text>
      <Section style={highlightBox}>
        <Text style={highlightText}>
          <strong>Nothing!</strong> Unless we contact you requesting additional information,
          you don&apos;t need to do anything. We&apos;ve got it from here.
        </Text>
      </Section>

      <Hr style={hr} />

      {/* Court Costs Reminder */}
      <Section style={reminderBox}>
        <Text style={reminderTitle}>Important Reminder</Text>
        <Text style={reminderText}>
          Court costs and any fines assessed by the court are <strong>not included</strong> in
          our service fee and are your responsibility. Court costs in Shelby County typically
          range from $50-$150. We will inform you of any amounts due after your case is resolved.
        </Text>
      </Section>

      {/* Contact */}
      <Text style={text}>
        Questions? Reply to this email or call us at <strong>(901) 555-0199</strong>.
      </Text>

      <Text style={signature}>
        Thank you for trusting TaskForce Tickets,<br />
        <strong>The TaskForce Tickets Team</strong>
      </Text>
    </BaseEmail>
  );
}

// Styles
const successBanner = {
  backgroundColor: '#10B981',
  borderRadius: '8px',
  padding: '16px',
  textAlign: 'center' as const,
  margin: '0 0 24px 0',
};

const successIcon = {
  color: '#ffffff',
  fontSize: '32px',
  margin: '0',
};

const successTitle = {
  color: '#ffffff',
  fontSize: '18px',
  fontWeight: 'bold' as const,
  margin: '8px 0 0 0',
};

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

const detailsBox = {
  backgroundColor: '#F8F8F8',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
};

const detailsTitle = {
  color: '#1A1A1A',
  fontSize: '14px',
  fontWeight: 'bold' as const,
  margin: '0 0 12px 0',
};

const detailsLabel = {
  color: '#4A4A4A',
  fontSize: '13px',
  padding: '4px 0',
  width: '40%',
};

const detailsValue = {
  color: '#1A1A1A',
  fontSize: '13px',
  fontWeight: '600' as const,
  padding: '4px 0',
};

const highlightBox = {
  backgroundColor: '#10B981',
  borderRadius: '8px',
  padding: '16px',
  margin: '16px 0',
};

const highlightText = {
  color: '#ffffff',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0',
};

const reminderBox = {
  backgroundColor: '#FFF9E6',
  border: '1px solid #FFD100',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
};

const reminderTitle = {
  color: '#1A1A1A',
  fontSize: '14px',
  fontWeight: 'bold' as const,
  margin: '0 0 8px 0',
};

const reminderText = {
  color: '#4A4A4A',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '0',
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

export default CaseAcceptedEmail;
