import {
  Heading,
  Hr,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';
import { BaseEmail } from './base';

interface CaseRejectedEmailProps {
  customerName: string;
  caseId: string;
  citationNumber?: string;
  rejectionReason: string;
  refundAmount?: number;
  refundNote?: string;
}

export function CaseRejectedEmail({
  customerName,
  caseId,
  citationNumber,
  rejectionReason,
  refundAmount,
  refundNote,
}: CaseRejectedEmailProps) {
  return (
    <BaseEmail previewText="Update on your traffic ticket submission">
      {/* Notice Banner */}
      <Section style={noticeBanner}>
        <Text style={noticeIcon}>📋</Text>
        <Text style={noticeTitle}>Case Update</Text>
      </Section>

      <Heading style={heading}>We&apos;re Unable to Take Your Case</Heading>

      <Text style={text}>Hi {customerName},</Text>

      <Text style={text}>
        Thank you for submitting your case to TaskForce Tickets. After careful review, 
        we&apos;ve determined that we&apos;re unable to represent you for this particular matter.
      </Text>

      {/* Case Details */}
      <Section style={detailsBox}>
        <Text style={detailsTitle}>Submission Details</Text>
        <table width="100%" cellPadding="0" cellSpacing="0">
          <tr>
            <td style={detailsLabel}>Case ID</td>
            <td style={detailsValue}>{caseId}</td>
          </tr>
          {citationNumber && (
            <tr>
              <td style={detailsLabel}>Citation Number</td>
              <td style={detailsValue}>{citationNumber}</td>
            </tr>
          )}
        </table>
      </Section>

      <Hr style={hr} />

      {/* Reason */}
      <Text style={sectionTitle}>Reason</Text>
      <Section style={reasonBox}>
        <Text style={reasonText}>{rejectionReason}</Text>
      </Section>

      <Hr style={hr} />

      {/* Refund Info */}
      {refundAmount && refundAmount > 0 && (
        <>
          <Section style={refundBox}>
            <Text style={refundTitle}>💰 Refund Information</Text>
            <Text style={refundText}>
              A full refund of <strong>${refundAmount.toFixed(2)}</strong> has been 
              initiated to your original payment method. Please allow 5-10 business 
              days for the refund to appear on your statement.
            </Text>
            {refundNote && (
              <Text style={refundNoteStyle}>{refundNote}</Text>
            )}
          </Section>
          <Hr style={hr} />
        </>
      )}

      {/* What You Can Do */}
      <Text style={sectionTitle}>What You Can Do</Text>
      <Text style={text}>
        While we can&apos;t help with this specific case, here are some options:
      </Text>
      <Text style={listText}>
        <strong>• Appear in court yourself:</strong> You can represent yourself on your court 
        date. Arrive early, dress professionally, and be prepared to explain your situation.
      </Text>
      <Text style={listText}>
        <strong>• Hire a local attorney:</strong> For complex cases outside our scope, 
        a full-service traffic attorney may be able to help.
      </Text>
      <Text style={listText}>
        <strong>• Contact the court:</strong> In some cases, you may be able to request 
        a continuance if you need more time to prepare.
      </Text>

      <Hr style={hr} />

      {/* Important Reminder */}
      <Section style={reminderBox}>
        <Text style={reminderTitle}>⚠️ Important Reminder</Text>
        <Text style={reminderText}>
          Do not ignore your court date. Failure to appear can result in additional fines, 
          a warrant for your arrest, and suspension of your driver&apos;s license.
        </Text>
      </Section>

      {/* Contact */}
      <Text style={text}>
        If you have questions about this decision, please reply to this email.
      </Text>

      <Text style={signature}>
        We appreciate you considering TaskForce Tickets,<br />
        <strong>The TaskForce Tickets Team</strong>
      </Text>
    </BaseEmail>
  );
}

// Styles
const noticeBanner = {
  backgroundColor: '#6B7280',
  borderRadius: '8px',
  padding: '16px',
  textAlign: 'center' as const,
  margin: '0 0 24px 0',
};

const noticeIcon = {
  fontSize: '32px',
  margin: '0',
};

const noticeTitle = {
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

const listText = {
  color: '#4A4A4A',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0 0 12px 0',
  paddingLeft: '8px',
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

const reasonBox = {
  backgroundColor: '#FEF2F2',
  border: '1px solid #FCA5A5',
  borderRadius: '8px',
  padding: '16px',
  margin: '12px 0',
};

const reasonText = {
  color: '#991B1B',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0',
};

const refundBox = {
  backgroundColor: '#ECFDF5',
  border: '1px solid #6EE7B7',
  borderRadius: '8px',
  padding: '16px',
  margin: '16px 0',
};

const refundTitle = {
  color: '#065F46',
  fontSize: '14px',
  fontWeight: 'bold' as const,
  margin: '0 0 8px 0',
};

const refundText = {
  color: '#065F46',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0',
};

const refundNoteStyle = {
  color: '#065F46',
  fontSize: '12px',
  lineHeight: '18px',
  margin: '8px 0 0 0',
  fontStyle: 'italic' as const,
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

export default CaseRejectedEmail;
