import {
  Button,
  Heading,
  Hr,
  Link,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';
import { BaseEmail } from './base';
import { COURT_PAYMENT_LINKS } from '../config';

interface CaseNotDismissedEmailProps {
  customerName: string;
  caseId: string;
  citationNumber: string;
  outcomeDetails?: string;
  refundAmount: number;
  fineAmount?: number;
  paymentDueDate?: string;
  courtKey?: string;
}

export function CaseNotDismissedEmail({
  customerName,
  caseId,
  citationNumber,
  outcomeDetails,
  refundAmount,
  fineAmount,
  paymentDueDate,
  courtKey,
}: CaseNotDismissedEmailProps) {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  const formattedRefund = formatCurrency(refundAmount / 100);
  const paymentInfo = courtKey ? COURT_PAYMENT_LINKS[courtKey] : COURT_PAYMENT_LINKS['default'];

  return (
    <BaseEmail previewText="Your case update - refund processing">
      <Heading style={heading}>Case Update</Heading>

      <Text style={text}>Hi {customerName},</Text>

      <Text style={text}>
        We want to update you on the outcome of your traffic citation case. Unfortunately,
        we were unable to obtain a dismissal for this citation.
      </Text>

      {/* Case Summary */}
      <Section style={summaryBox}>
        <Text style={summaryTitle}>Case Summary</Text>
        <table width="100%" cellPadding="0" cellSpacing="0">
          <tr>
            <td style={summaryLabel}>Case ID</td>
            <td style={summaryValue}>{caseId}</td>
          </tr>
          <tr>
            <td style={summaryLabel}>Citation Number</td>
            <td style={summaryValue}>{citationNumber}</td>
          </tr>
          <tr>
            <td style={summaryLabel}>Outcome</td>
            <td style={summaryValueAlert}>Not Dismissed</td>
          </tr>
        </table>
      </Section>

      {outcomeDetails && (
        <>
          <Text style={sectionTitle}>Outcome Details</Text>
          <Text style={text}>{outcomeDetails}</Text>
        </>
      )}

      <Hr style={hr} />

      {/* Money-Back Guarantee */}
      <Section style={refundBox}>
        <Text style={refundTitle}>Money-Back Guarantee</Text>
        <Text style={refundText}>
          As promised, because we were unable to get your ticket dismissed, you will receive
          a <strong>full refund</strong> of your attorney fee.
        </Text>
        <Section style={refundAmountBox}>
          <Text style={refundAmountLabel}>Refund Amount</Text>
          <Text style={refundAmountValue}>{formattedRefund}</Text>
        </Section>
        <Text style={refundProcessing}>
          Your refund will be processed within <strong>14 business days</strong> and returned
          to your original payment method. You&apos;ll receive a confirmation once processed.
        </Text>
      </Section>

      <Hr style={hr} />

      {/* Pay Your Fine Section */}
      <Section style={fineBox}>
        <Text style={fineTitle}>Pay Your Fine</Text>
        <Text style={fineText}>
          You are still responsible for paying your court fine. Please pay by the due date to avoid additional penalties.
        </Text>
        {fineAmount && (
          <Text style={fineAmountStyle}>{formatCurrency(fineAmount)}</Text>
        )}
        {paymentDueDate && (
          <Text style={fineDueDate}>Due by: {paymentDueDate}</Text>
        )}
        <Section style={paymentDetails}>
          <Text style={paymentDetailText}>
            <strong>Court:</strong> {paymentInfo.name}
          </Text>
          <Text style={paymentDetailText}>
            <strong>Citation #:</strong> {citationNumber}
          </Text>
          {paymentInfo.instructions && (
            <Text style={paymentInstructions}>{paymentInfo.instructions}</Text>
          )}
        </Section>
        <Button href={paymentInfo.url} style={fineButton}>
          Pay Fine Online
        </Button>
        <Text style={paymentLink}>
          Pay at:{' '}
          <Link href={paymentInfo.url} style={linkStyle}>
            {paymentInfo.url}
          </Link>
        </Text>
      </Section>

      <Hr style={hr} />

      {/* Further Options */}
      <Section style={optionsBox}>
        <Text style={optionsTitle}>Need Further Assistance?</Text>
        <Text style={optionsText}>
          If you&apos;d like to discuss appeal options or have questions about the outcome,
          please don&apos;t hesitate to contact us. We&apos;re here to help.
        </Text>
      </Section>

      {/* Contact */}
      <Text style={text}>
        If you have any questions, please reply to this email or call us at{' '}
        <strong>(901) 555-0199</strong>.
      </Text>

      <Text style={signature}>
        We appreciate your trust in TaskForce Tickets,<br />
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

const summaryValueAlert = {
  color: '#CF2A27',
  fontSize: '13px',
  fontWeight: '600' as const,
  padding: '4px 0',
};

const refundBox = {
  backgroundColor: '#10B981',
  borderRadius: '12px',
  padding: '24px',
  margin: '24px 0',
};

const refundTitle = {
  color: '#ffffff',
  fontSize: '18px',
  fontWeight: 'bold' as const,
  margin: '0 0 12px 0',
};

const refundText = {
  color: '#ffffff',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0 0 16px 0',
};

const refundAmountBox = {
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  borderRadius: '8px',
  padding: '16px',
  textAlign: 'center' as const,
  margin: '16px 0',
};

const refundAmountLabel = {
  color: '#ffffff',
  fontSize: '12px',
  margin: '0 0 4px 0',
  opacity: 0.9,
};

const refundAmountValue = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold' as const,
  margin: '0',
};

const refundProcessing = {
  color: '#ffffff',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '0',
  opacity: 0.9,
};

const fineBox = {
  backgroundColor: '#FEE2E2',
  borderLeft: '4px solid #DC2626',
  borderRadius: '0 12px 12px 0',
  padding: '24px',
  margin: '24px 0',
};

const fineTitle = {
  color: '#1A1A1A',
  fontSize: '18px',
  fontWeight: 'bold' as const,
  margin: '0 0 12px 0',
};

const fineText = {
  color: '#7F1D1D',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0 0 16px 0',
};

const fineAmountStyle = {
  color: '#1A1A1A',
  fontSize: '32px',
  fontWeight: 'bold' as const,
  textAlign: 'center' as const,
  margin: '16px 0 8px 0',
};

const fineDueDate = {
  color: '#DC2626',
  fontSize: '14px',
  fontWeight: 'bold' as const,
  textAlign: 'center' as const,
  margin: '0 0 16px 0',
};

const paymentDetails = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  padding: '16px',
  margin: '16px 0',
};

const paymentDetailText = {
  color: '#4A4A4A',
  fontSize: '14px',
  margin: '0 0 8px 0',
};

const paymentInstructions = {
  color: '#666666',
  fontSize: '13px',
  fontStyle: 'italic' as const,
  margin: '8px 0 0 0',
};

const fineButton = {
  backgroundColor: '#FFD100',
  borderRadius: '8px',
  color: '#1A1A1A',
  fontSize: '16px',
  fontWeight: 'bold' as const,
  padding: '14px 28px',
  textDecoration: 'none',
  display: 'inline-block',
  margin: '8px 0',
  textAlign: 'center' as const,
};

const paymentLink = {
  color: '#666666',
  fontSize: '12px',
  textAlign: 'center' as const,
  margin: '8px 0 0 0',
};

const linkStyle = {
  color: '#1A1A1A',
  textDecoration: 'underline',
};

const optionsBox = {
  backgroundColor: '#F8F8F8',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
};

const optionsTitle = {
  color: '#1A1A1A',
  fontSize: '14px',
  fontWeight: 'bold' as const,
  margin: '0 0 8px 0',
};

const optionsText = {
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

export default CaseNotDismissedEmail;
