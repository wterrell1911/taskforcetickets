import {
  Heading,
  Hr,
  Section,
  Text,
  Button,
} from '@react-email/components';
import * as React from 'react';
import { BaseEmail } from './base';

interface TierUpgradeEmailProps {
  customerName: string;
  caseId: string;
  citationNumber: string;
  courtDate: string;
  currentTier: string;
  requiredTier: string;
  currentAmount: number;
  requiredAmount: number;
  differenceAmount: number;
  deadline: string;
}

export function TierUpgradeEmail({
  customerName,
  caseId,
  citationNumber,
  courtDate,
  currentTier,
  requiredTier,
  currentAmount,
  requiredAmount,
  differenceAmount,
  deadline,
}: TierUpgradeEmailProps) {
  return (
    <BaseEmail previewText="Good news! We can help - one quick step needed">
      {/* Info Banner */}
      <Section style={infoBanner}>
        <Text style={infoIcon}>ℹ️</Text>
        <Text style={infoTitle}>Action Required</Text>
      </Section>

      <Heading style={heading}>Good News — We Can Help!</Heading>

      <Text style={text}>Hi {customerName},</Text>

      <Text style={text}>
        We&apos;ve reviewed your ticket and <strong>we can definitely help you</strong>. 
        However, after examining the details of your citation, we&apos;ve determined that 
        your violation requires our <strong>{requiredTier}</strong> service tier.
      </Text>

      {/* Tier Details */}
      <Section style={detailsBox}>
        <Text style={detailsTitle}>Tier Adjustment Needed</Text>
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
            <td style={detailsValue}>{courtDate}</td>
          </tr>
          <tr>
            <td style={detailsLabel}>You Paid</td>
            <td style={detailsValue}>{currentTier} — ${currentAmount}</td>
          </tr>
          <tr>
            <td style={detailsLabel}>Required Tier</td>
            <td style={detailsValue}>{requiredTier} — ${requiredAmount}</td>
          </tr>
          <tr>
            <td style={detailsLabelHighlight}>Amount Due</td>
            <td style={detailsValueHighlight}>${differenceAmount}</td>
          </tr>
        </table>
      </Section>

      <Hr style={hr} />

      {/* Why the change */}
      <Text style={sectionTitle}>Why the Tier Change?</Text>
      <Text style={text}>
        Different violations have different complexity levels. Based on the specifics of 
        your citation (violation type, speed over limit, or other factors), your case 
        falls into our {requiredTier} category. This ensures we can give your case the 
        attention and resources it needs.
      </Text>

      <Hr style={hr} />

      {/* CTA */}
      <Section style={highlightBox}>
        <Text style={highlightText}>
          <strong>Complete your payment by {deadline}</strong> so we have time to 
          prepare for your court date.
        </Text>
      </Section>

      <Section style={buttonContainer}>
        <Button style={button} href="https://taskforcetickets.com/intake">
          Complete Payment — ${differenceAmount}
        </Button>
      </Section>

      <Text style={smallText}>
        Or contact us if you have questions about your tier classification.
      </Text>

      <Hr style={hr} />

      {/* What happens next */}
      <Text style={sectionTitle}>What Happens Next?</Text>
      <Text style={text}>
        Once we receive your payment, we&apos;ll immediately accept your case and send 
        you a confirmation email. Then we handle everything — you won&apos;t need to 
        appear in court.
      </Text>

      {/* Contact */}
      <Text style={text}>
        Questions? Reply to this email or call us at <strong>(901) 554-5068</strong>.
      </Text>

      <Text style={signature}>
        Ready to help,<br />
        <strong>The TaskForce Tickets Team</strong>
      </Text>
    </BaseEmail>
  );
}

// Styles
const infoBanner = {
  backgroundColor: '#3B82F6',
  borderRadius: '8px',
  padding: '16px',
  textAlign: 'center' as const,
  margin: '0 0 24px 0',
};

const infoIcon = {
  fontSize: '32px',
  margin: '0',
};

const infoTitle = {
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

const smallText = {
  color: '#6B7280',
  fontSize: '12px',
  lineHeight: '20px',
  margin: '12px 0 0 0',
  textAlign: 'center' as const,
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

const detailsLabelHighlight = {
  color: '#1A1A1A',
  fontSize: '14px',
  fontWeight: 'bold' as const,
  padding: '8px 0 4px 0',
  width: '40%',
  borderTop: '1px solid #E5E5E5',
};

const detailsValueHighlight = {
  color: '#10B981',
  fontSize: '16px',
  fontWeight: 'bold' as const,
  padding: '8px 0 4px 0',
  borderTop: '1px solid #E5E5E5',
};

const highlightBox = {
  backgroundColor: '#FEF3C7',
  border: '1px solid #F59E0B',
  borderRadius: '8px',
  padding: '16px',
  margin: '16px 0',
};

const highlightText = {
  color: '#92400E',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0',
  textAlign: 'center' as const,
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '24px 0',
};

const button = {
  backgroundColor: '#10B981',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold' as const,
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '14px 28px',
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

export default TierUpgradeEmail;
