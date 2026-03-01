import {
  Heading,
  Hr,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';
import { BaseEmail } from './base';

interface RejectionCourtReminderEmailProps {
  customerName: string;
  caseId: string;
  citationNumber: string;
  courtDate: string;
  courtTime?: string;
  courtLocation?: string;
  rejectionReason?: string;
}

export function RejectionCourtReminderEmail({
  customerName,
  caseId,
  citationNumber,
  courtDate,
  courtTime,
  courtLocation,
  rejectionReason,
}: RejectionCourtReminderEmailProps) {
  return (
    <BaseEmail previewText={`IMPORTANT: Your court date is ${courtDate} - Action Required`}>
      <Heading style={heading}>Court Date Reminder</Heading>

      <Text style={text}>Hi {customerName},</Text>

      <Section style={alertBox}>
        <Text style={alertTitle}>IMPORTANT REMINDER</Text>
        <Text style={alertText}>
          Your court date is coming up in <strong>7 days</strong>. TaskForce Tickets will{' '}
          <strong>NOT</strong> be handling your case.
        </Text>
      </Section>

      <Text style={text}>
        This is a reminder that your case was not accepted into our program. You are
        responsible for appearing at your scheduled court date or making other arrangements.
      </Text>

      {/* Court Date Details */}
      <Section style={summaryBox}>
        <Text style={summaryTitle}>Your Court Date</Text>
        <table width="100%" cellPadding="0" cellSpacing="0">
          <tr>
            <td style={summaryLabel}>Date</td>
            <td style={summaryValueAlert}>{courtDate}</td>
          </tr>
          {courtTime && (
            <tr>
              <td style={summaryLabel}>Time</td>
              <td style={summaryValue}>{courtTime}</td>
            </tr>
          )}
          {courtLocation && (
            <tr>
              <td style={summaryLabel}>Location</td>
              <td style={summaryValue}>{courtLocation}</td>
            </tr>
          )}
          <tr>
            <td style={summaryLabel}>Citation #</td>
            <td style={summaryValue}>{citationNumber}</td>
          </tr>
          <tr>
            <td style={summaryLabel}>Reference</td>
            <td style={summaryValue}>{caseId}</td>
          </tr>
        </table>
      </Section>

      <Hr style={hr} />

      <Text style={sectionTitle}>What You Need to Do</Text>
      <Text style={text}>
        <strong>1. Do not miss your court date.</strong> Failing to appear can result in
        additional fines, a warrant for your arrest, or suspension of your driver&apos;s license.
      </Text>
      <Text style={text}>
        <strong>2. Consider your options:</strong>
      </Text>
      <ul style={list}>
        <li style={listItem}>Appear in court yourself to contest the citation</li>
        <li style={listItem}>Pay the fine before your court date (check your citation for instructions)</li>
        <li style={listItem}>Consult with a traffic attorney for legal representation</li>
      </ul>

      {rejectionReason && (
        <>
          <Hr style={hr} />
          <Text style={sectionTitle}>Why Your Case Was Not Accepted</Text>
          <Text style={text}>{rejectionReason}</Text>
        </>
      )}

      <Hr style={hr} />

      <Text style={footerText}>
        If you have questions or believe this was sent in error, please contact us at{' '}
        <a href="mailto:info@taskforcetickets.com" style={link}>info@taskforcetickets.com</a>.
      </Text>

      <Text style={footerText}>
        This is an automated reminder. Please do not reply to this email.
      </Text>
    </BaseEmail>
  );
}

// Styles
const heading = {
  fontSize: '24px',
  fontWeight: '700' as const,
  color: '#1A1A1A',
  margin: '0 0 20px 0',
};

const text = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#4A4A4A',
  margin: '0 0 16px 0',
};

const alertBox = {
  backgroundColor: '#FEF2F2',
  border: '2px solid #CF2A27',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
};

const alertTitle = {
  fontSize: '18px',
  fontWeight: '700' as const,
  color: '#CF2A27',
  margin: '0 0 8px 0',
  textTransform: 'uppercase' as const,
};

const alertText = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#991B1B',
  margin: '0',
};

const summaryBox = {
  backgroundColor: '#F8F8F8',
  borderRadius: '8px',
  padding: '20px',
  margin: '20px 0',
};

const summaryTitle = {
  fontSize: '14px',
  fontWeight: '600' as const,
  color: '#1A1A1A',
  margin: '0 0 12px 0',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
};

const summaryLabel = {
  fontSize: '14px',
  color: '#4A4A4A',
  padding: '4px 0',
  width: '120px',
};

const summaryValue = {
  fontSize: '14px',
  fontWeight: '600' as const,
  color: '#1A1A1A',
  padding: '4px 0',
};

const summaryValueAlert = {
  fontSize: '14px',
  fontWeight: '700' as const,
  color: '#CF2A27',
  padding: '4px 0',
};

const sectionTitle = {
  fontSize: '18px',
  fontWeight: '600' as const,
  color: '#1A1A1A',
  margin: '24px 0 12px 0',
};

const hr = {
  borderColor: '#E5E5E5',
  margin: '24px 0',
};

const list = {
  margin: '0 0 16px 0',
  paddingLeft: '20px',
};

const listItem = {
  fontSize: '16px',
  lineHeight: '24px',
  color: '#4A4A4A',
  margin: '8px 0',
};

const footerText = {
  fontSize: '14px',
  lineHeight: '20px',
  color: '#6B7280',
  margin: '0 0 8px 0',
};

const link = {
  color: '#1A1A1A',
  textDecoration: 'underline',
};

export default RejectionCourtReminderEmail;
