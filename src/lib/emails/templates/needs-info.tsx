import {
  Button,
  Heading,
  Hr,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';
import { BaseEmail } from './base';

interface NeedsInfoEmailProps {
  customerName: string;
  caseId: string;
  courtDate: string;
  itemsNeeded: string[];
  deadline: string;
  uploadUrl?: string;
}

export function NeedsInfoEmail({
  customerName,
  caseId,
  courtDate,
  itemsNeeded,
  deadline,
  uploadUrl = 'https://taskforcetickets.com/upload',
}: NeedsInfoEmailProps) {
  return (
    <BaseEmail previewText="Action Required: Additional information needed for your case">
      {/* Alert Banner */}
      <Section style={alertBanner}>
        <Text style={alertIcon}>⚠️</Text>
        <Text style={alertTitle}>Action Required</Text>
      </Section>

      <Heading style={heading}>Additional Information Needed</Heading>

      <Text style={text}>Hi {customerName},</Text>

      <Text style={text}>
        We&apos;re reviewing your case and need some additional information before we can proceed.
        Please provide the following as soon as possible to avoid delays.
      </Text>

      {/* Case Info */}
      <Section style={caseBox}>
        <table width="100%" cellPadding="0" cellSpacing="0">
          <tr>
            <td style={caseLabel}>Case ID</td>
            <td style={caseValue}>{caseId}</td>
          </tr>
          <tr>
            <td style={caseLabel}>Court Date</td>
            <td style={caseValue}>{courtDate}</td>
          </tr>
        </table>
      </Section>

      <Hr style={hr} />

      {/* Items Needed */}
      <Text style={sectionTitle}>We Need the Following:</Text>
      <Section style={itemsBox}>
        {itemsNeeded.map((item, index) => (
          <Text key={index} style={itemText}>
            <span style={itemNumber}>{index + 1}</span>
            {item}
          </Text>
        ))}
      </Section>

      {/* Deadline */}
      <Section style={deadlineBox}>
        <Text style={deadlineTitle}>Deadline to Respond</Text>
        <Text style={deadlineDate}>{deadline}</Text>
        <Text style={deadlineNote}>
          We must receive your response by this date to ensure we have time to review before
          your court date.
        </Text>
      </Section>

      {/* Upload Button */}
      <Section style={uploadSection}>
        <Button href={`${uploadUrl}?caseId=${caseId}`} style={uploadButton}>
          Upload Documents
        </Button>
        <Text style={uploadAlt}>
          Or reply to this email with the requested information attached.
        </Text>
      </Section>

      <Hr style={hr} />

      {/* Warning */}
      <Section style={warningBox}>
        <Text style={warningText}>
          <strong>Important:</strong> Your case cannot proceed without this information.
          If we don&apos;t receive it by the deadline, we may not be able to represent you,
          and you may need to appear at your court date personally.
        </Text>
      </Section>

      {/* Contact */}
      <Text style={text}>
        Have questions? Reply to this email or call us at <strong>(901) 555-0199</strong>.
      </Text>

      <Text style={signature}>
        Thank you,<br />
        <strong>The TaskForce Tickets Team</strong>
      </Text>
    </BaseEmail>
  );
}

// Styles
const alertBanner = {
  backgroundColor: '#FFD100',
  borderRadius: '8px',
  padding: '16px',
  textAlign: 'center' as const,
  margin: '0 0 24px 0',
};

const alertIcon = {
  fontSize: '32px',
  margin: '0',
};

const alertTitle = {
  color: '#1A1A1A',
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

const caseBox = {
  backgroundColor: '#F8F8F8',
  borderRadius: '8px',
  padding: '12px 16px',
  margin: '0 0 24px 0',
};

const caseLabel = {
  color: '#4A4A4A',
  fontSize: '13px',
  padding: '4px 0',
  width: '30%',
};

const caseValue = {
  color: '#1A1A1A',
  fontSize: '13px',
  fontWeight: '600' as const,
  padding: '4px 0',
};

const itemsBox = {
  backgroundColor: '#F8F8F8',
  borderRadius: '8px',
  padding: '16px',
  margin: '0 0 24px 0',
};

const itemText = {
  color: '#1A1A1A',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0 0 12px 0',
  display: 'flex',
  alignItems: 'flex-start',
};

const itemNumber = {
  backgroundColor: '#FFD100',
  color: '#1A1A1A',
  fontSize: '12px',
  fontWeight: 'bold' as const,
  width: '20px',
  height: '20px',
  borderRadius: '50%',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: '12px',
  flexShrink: 0,
};

const deadlineBox = {
  backgroundColor: '#CF2A27',
  borderRadius: '8px',
  padding: '20px',
  textAlign: 'center' as const,
  margin: '0 0 24px 0',
};

const deadlineTitle = {
  color: '#ffffff',
  fontSize: '12px',
  fontWeight: '600' as const,
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  margin: '0 0 8px 0',
  opacity: 0.9,
};

const deadlineDate = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold' as const,
  margin: '0 0 8px 0',
};

const deadlineNote = {
  color: '#ffffff',
  fontSize: '12px',
  lineHeight: '18px',
  margin: '0',
  opacity: 0.9,
};

const uploadSection = {
  textAlign: 'center' as const,
  margin: '24px 0',
};

const uploadButton = {
  backgroundColor: '#1A1A1A',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 'bold' as const,
  padding: '14px 28px',
  textDecoration: 'none',
  display: 'inline-block',
};

const uploadAlt = {
  color: '#666666',
  fontSize: '12px',
  margin: '12px 0 0 0',
};

const warningBox = {
  backgroundColor: '#FFF9E6',
  border: '1px solid #FFD100',
  borderRadius: '8px',
  padding: '12px 16px',
  margin: '24px 0',
};

const warningText = {
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

export default NeedsInfoEmail;
