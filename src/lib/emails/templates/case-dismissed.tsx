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

interface CaseDismissedEmailProps {
  customerName: string;
  caseId: string;
  citationNumber: string;
  courtCostsAmount?: number;
  courtCostsDueDate?: string;
  courtKey?: string;
  reviewUrl?: string;
}

export function CaseDismissedEmail({
  customerName,
  caseId,
  citationNumber,
  courtCostsAmount,
  courtCostsDueDate,
  courtKey,
  reviewUrl = 'https://g.page/r/taskforcetickets/review',
}: CaseDismissedEmailProps) {
  const paymentInfo = courtKey ? COURT_PAYMENT_LINKS[courtKey] : COURT_PAYMENT_LINKS['default'];
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  return (
    <BaseEmail previewText="Great news! Your traffic ticket has been DISMISSED">
      {/* Success Banner */}
      <Section style={successBanner}>
        <Text style={successEmoji}>🎉</Text>
        <Text style={successTitle}>TICKET DISMISSED!</Text>
      </Section>

      <Heading style={heading}>Great News, {customerName}!</Heading>

      <Text style={textLarge}>
        Your traffic ticket has been <strong>dismissed</strong>. No points will be added to your
        driving record for this citation.
      </Text>

      {/* Case Summary */}
      <Section style={summaryBox}>
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
            <td style={summaryValueSuccess}>DISMISSED ✓</td>
          </tr>
        </table>
      </Section>

      {/* What This Means */}
      <Text style={sectionTitle}>What This Means For You</Text>
      <Text style={text}>
        ✓ <strong>No conviction</strong> on your record for this citation<br />
        ✓ <strong>No points</strong> added to your driving record<br />
        ✓ <strong>No increase</strong> to your insurance premiums from this ticket
      </Text>

      {/* Court Costs Payment Section */}
      <Section style={paymentBox}>
        <Text style={paymentTitle}>Pay Your Court Costs</Text>
        <Text style={paymentWarning}>
          <strong>Important:</strong> While your ticket was dismissed, you are still responsible for paying court costs.
          {courtCostsDueDate && ` Please pay by ${courtCostsDueDate} to avoid penalties.`}
        </Text>
        {courtCostsAmount && (
          <Text style={paymentAmount}>{formatCurrency(courtCostsAmount)}</Text>
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
        <Button href={paymentInfo.url} style={paymentButton}>
          Pay Court Costs Now
        </Button>
        <Text style={paymentLink}>
          Or visit:{' '}
          <Link href={paymentInfo.url} style={linkStyle}>
            {paymentInfo.url}
          </Link>
        </Text>
      </Section>

      <Hr style={hr} />

      {/* Review Request */}
      <Section style={reviewBox}>
        <Text style={reviewTitle}>Help Others Find Us!</Text>
        <Text style={reviewText}>
          We&apos;re thrilled we could help you. Would you mind taking 30 seconds to share your
          experience? Your review helps others who are dealing with traffic tickets find us.
        </Text>
        <Text style={reviewText}>
          <strong>Leave a review and receive $5 back</strong> as a thank you for your time.
        </Text>
        <Button href={reviewUrl} style={reviewButton}>
          Leave a Google Review
        </Button>
        <Text style={reviewInstructions}>
          After posting your review, simply reply to this email with a screenshot to receive
          your $5 refund. We appreciate honest reviews - positive or constructive!
        </Text>
      </Section>

      <Hr style={hr} />

      {/* Referral */}
      <Text style={text}>
        Know someone with a traffic ticket? We&apos;d love to help them too!
        Send them to <strong>taskforcetickets.com</strong>.
      </Text>

      <Text style={signature}>
        Thank you for choosing TaskForce Tickets,<br />
        <strong>The TaskForce Tickets Team</strong>
      </Text>
    </BaseEmail>
  );
}

// Styles
const successBanner = {
  backgroundColor: '#10B981',
  borderRadius: '12px',
  padding: '24px',
  textAlign: 'center' as const,
  margin: '0 0 24px 0',
};

const successEmoji = {
  fontSize: '48px',
  margin: '0',
};

const successTitle = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'bold' as const,
  margin: '12px 0 0 0',
  letterSpacing: '1px',
};

const heading = {
  color: '#1A1A1A',
  fontSize: '24px',
  fontWeight: 'bold' as const,
  margin: '0 0 16px 0',
};

const textLarge = {
  color: '#4A4A4A',
  fontSize: '16px',
  lineHeight: '26px',
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
  margin: '0 0 24px 0',
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

const summaryValueSuccess = {
  color: '#10B981',
  fontSize: '13px',
  fontWeight: 'bold' as const,
  padding: '4px 0',
};

const paymentBox = {
  backgroundColor: '#FEF3C7',
  borderLeft: '4px solid #F59E0B',
  borderRadius: '0 12px 12px 0',
  padding: '24px',
  margin: '24px 0',
};

const paymentTitle = {
  color: '#1A1A1A',
  fontSize: '18px',
  fontWeight: 'bold' as const,
  margin: '0 0 12px 0',
};

const paymentWarning = {
  color: '#92400E',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0 0 16px 0',
};

const paymentAmount = {
  color: '#1A1A1A',
  fontSize: '32px',
  fontWeight: 'bold' as const,
  textAlign: 'center' as const,
  margin: '16px 0',
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

const paymentButton = {
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

const reviewBox = {
  backgroundColor: '#FFF9E6',
  border: '2px solid #FFD100',
  borderRadius: '12px',
  padding: '24px',
  textAlign: 'center' as const,
  margin: '24px 0',
};

const reviewTitle = {
  color: '#1A1A1A',
  fontSize: '18px',
  fontWeight: 'bold' as const,
  margin: '0 0 12px 0',
};

const reviewText = {
  color: '#4A4A4A',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0 0 12px 0',
};

const reviewButton = {
  backgroundColor: '#FFD100',
  borderRadius: '8px',
  color: '#1A1A1A',
  fontSize: '14px',
  fontWeight: 'bold' as const,
  padding: '12px 24px',
  textDecoration: 'none',
  display: 'inline-block',
  margin: '8px 0',
};

const reviewInstructions = {
  color: '#666666',
  fontSize: '12px',
  lineHeight: '18px',
  margin: '12px 0 0 0',
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

export default CaseDismissedEmail;
