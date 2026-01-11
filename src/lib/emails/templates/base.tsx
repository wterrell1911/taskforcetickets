import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface BaseEmailProps {
  previewText: string;
  children: React.ReactNode;
}

export function BaseEmail({ previewText, children }: BaseEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
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
          <Section style={content}>{children}</Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              TaskForce Tickets | 1661 International Drive, Suite 400 | Memphis, TN 38120
            </Text>
            <Text style={footerText}>
              <Link href="https://taskforcetickets.com/terms" style={footerLink}>
                Terms of Service
              </Link>
              {' | '}
              <Link href="https://taskforcetickets.com/privacy" style={footerLink}>
                Privacy Policy
              </Link>
            </Text>
            <Text style={footerDisclaimer}>
              This email was sent to you because you submitted a case to TaskForce Tickets.
              If you did not submit a case, please contact us immediately.
            </Text>
            <Text style={footerCopyright}>
              &copy; {new Date().getFullYear()} TaskForce Tickets. All rights reserved.
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

const footer = {
  backgroundColor: '#1A1A1A',
  padding: '24px',
  borderRadius: '0 0 12px 12px',
};

const footerText = {
  color: '#666666',
  fontSize: '12px',
  lineHeight: '20px',
  textAlign: 'center' as const,
  margin: '0 0 8px 0',
};

const footerLink = {
  color: '#FFD100',
  textDecoration: 'none',
};

const footerDisclaimer = {
  color: '#666666',
  fontSize: '11px',
  lineHeight: '16px',
  textAlign: 'center' as const,
  margin: '16px 0 0 0',
  fontStyle: 'italic' as const,
};

const footerCopyright = {
  color: '#666666',
  fontSize: '11px',
  textAlign: 'center' as const,
  margin: '8px 0 0 0',
};
