import {
  Heading,
  Hr,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';
import { BaseEmail } from './base';

interface CaseResolvedEmailProps {
  customerName: string;
  caseId: string;
  citationNumber: string;
  courtJurisdiction?: string;
}

export function CaseResolvedEmail({
  customerName,
  caseId,
  citationNumber,
  courtJurisdiction = 'Memphis',
}: CaseResolvedEmailProps) {
  return (
    <BaseEmail previewText="Your traffic ticket case has been resolved">
      {/* Success Banner */}
      <Section style={successBanner}>
        <Text style={successEmoji}>📋</Text>
        <Text style={successTitle}>CASE RESOLVED</Text>
      </Section>

      <Heading style={heading}>Hello {customerName},</Heading>

      <Text style={textLarge}>
        We're pleased to inform you that your traffic ticket case has been <strong>resolved</strong>.
      </Text>

      {/* Case Summary */}
      <Section style={summaryBox}>
        <table width="100%" cellPadding="0" cellSpacing="0">
          <tbody>
            <tr>
              <td style={summaryLabel}>Case ID</td>
              <td style={summaryValue}>{caseId}</td>
            </tr>
            <tr>
              <td style={summaryLabel}>Citation Number</td>
              <td style={summaryValue}>{citationNumber}</td>
            </tr>
            <tr>
              <td style={summaryLabel}>Jurisdiction</td>
              <td style={summaryValue}>{courtJurisdiction}</td>
            </tr>
            <tr>
              <td style={summaryLabel}>Status</td>
              <td style={summaryValueSuccess}>RESOLVED ✓</td>
            </tr>
          </tbody>
        </table>
      </Section>

      <Hr style={divider} />

      {/* Disposition Document */}
      <Text style={sectionTitle}>Your Disposition Document</Text>
      <Text style={text}>
        Attached to this email is your official disposition document. This serves as proof that your case has been resolved. 
        <strong> Please save this document for your records.</strong>
      </Text>

      {/* What This Means */}
      <Section style={infoBox}>
        <Text style={infoTitle}>What This Means</Text>
        <Text style={text}>
          ✓ Your case has been fully processed<br />
          ✓ No further action is required from you regarding this citation<br />
          ✓ Keep the attached disposition for your records
        </Text>
      </Section>

      <Hr style={divider} />

      {/* Court Costs Reminder */}
      <Section style={warningBox}>
        <Text style={warningTitle}>⚠️ Important: Court Costs</Text>
        <Text style={text}>
          If your case was dismissed, you may still owe court costs to {courtJurisdiction} Court. 
          These are separate from our service fee and must be paid directly to the court to avoid additional penalties.
        </Text>
      </Section>

      {/* Contact */}
      <Text style={text}>
        If you have any questions about your case or this disposition, please reply to this email or 
        call us at <strong>(901) 554-5068</strong>.
      </Text>

      <Text style={signoff}>
        Thank you for choosing TaskForce Tickets!
      </Text>
    </BaseEmail>
  );
}

// Styles
const successBanner = {
  backgroundColor: '#10B981',
  padding: '24px',
  textAlign: 'center' as const,
  borderRadius: '8px 8px 0 0',
};

const successEmoji = {
  fontSize: '48px',
  margin: '0',
  lineHeight: '1',
};

const successTitle = {
  color: '#FFFFFF',
  fontSize: '24px',
  fontWeight: '700',
  margin: '12px 0 0 0',
  letterSpacing: '2px',
};

const heading = {
  color: '#1A1A1A',
  fontSize: '24px',
  fontWeight: '600',
  margin: '32px 0 16px 0',
};

const textLarge = {
  color: '#4A4A4A',
  fontSize: '18px',
  lineHeight: '28px',
  margin: '0 0 24px 0',
};

const text = {
  color: '#4A4A4A',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px 0',
};

const summaryBox = {
  backgroundColor: '#F8F8F8',
  padding: '20px',
  borderRadius: '8px',
  margin: '24px 0',
};

const summaryLabel = {
  color: '#6B7280',
  fontSize: '14px',
  padding: '8px 0',
  borderBottom: '1px solid #E5E7EB',
};

const summaryValue = {
  color: '#1A1A1A',
  fontSize: '14px',
  fontWeight: '600',
  textAlign: 'right' as const,
  padding: '8px 0',
  borderBottom: '1px solid #E5E7EB',
};

const summaryValueSuccess = {
  color: '#10B981',
  fontSize: '14px',
  fontWeight: '700',
  textAlign: 'right' as const,
  padding: '8px 0',
};

const sectionTitle = {
  color: '#1A1A1A',
  fontSize: '18px',
  fontWeight: '600',
  margin: '24px 0 12px 0',
};

const divider = {
  borderColor: '#E5E5E5',
  margin: '24px 0',
};

const infoBox = {
  backgroundColor: '#EFF6FF',
  borderLeft: '4px solid #3B82F6',
  padding: '16px 20px',
  borderRadius: '0 8px 8px 0',
  margin: '24px 0',
};

const infoTitle = {
  color: '#1E40AF',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 8px 0',
};

const warningBox = {
  backgroundColor: '#FEF3C7',
  borderLeft: '4px solid #F59E0B',
  padding: '16px 20px',
  borderRadius: '0 8px 8px 0',
  margin: '24px 0',
};

const warningTitle = {
  color: '#92400E',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 8px 0',
};

const signoff = {
  color: '#1A1A1A',
  fontSize: '16px',
  fontWeight: '600',
  margin: '32px 0 0 0',
};

export default CaseResolvedEmail;
