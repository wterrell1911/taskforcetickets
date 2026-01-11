/**
 * Email sending service using Resend
 */

import { Resend } from 'resend';
import { render } from '@react-email/components';
import { SubmissionReceivedEmail } from './templates/submission-received';
import { CaseAcceptedEmail } from './templates/case-accepted';
import { CaseDismissedEmail } from './templates/case-dismissed';
import { CaseNotDismissedEmail } from './templates/case-not-dismissed';
import { NeedsInfoEmail } from './templates/needs-info';
import { RejectionCourtReminderEmail } from './templates/rejection-court-reminder';
import { generateICSFile } from '@/lib/calendar/generate-ics';
import { getCourtInfo } from '@/lib/constants/court-addresses';
import { getCalendarRecipients, areCalendarInvitesEnabled } from '@/lib/config/calendar-recipients';

// Lazy-initialized Resend client
let resendInstance: Resend | null = null;

function getResendClient(): Resend {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
}

// Email sender configuration
function getFromEmail(): string {
  return process.env.FROM_EMAIL || 'TaskForce Tickets <noreply@taskforcetickets.com>';
}

function getReplyToEmail(): string {
  return process.env.REPLY_TO_EMAIL || 'support@taskforcetickets.com';
}

/**
 * Email types for logging and tracking
 */
export type EmailType =
  | 'submission_received'
  | 'case_accepted'
  | 'needs_info'
  | 'case_dismissed'
  | 'case_not_dismissed'
  | 'rejection'
  | 'rejection_court_reminder';

/**
 * Result type for email sending
 */
interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send submission received email
 */
export async function sendSubmissionReceivedEmail(params: {
  to: string;
  customerName: string;
  caseId: string;
  courtDate: string;
  offenseType: string;
  amountCharged: number;
}): Promise<SendEmailResult> {
  try {
    const html = await render(
      SubmissionReceivedEmail({
        customerName: params.customerName,
        caseId: params.caseId,
        courtDate: params.courtDate,
        offenseType: params.offenseType,
        amountCharged: params.amountCharged,
      })
    );

    const { data, error } = await getResendClient().emails.send({
      from: getFromEmail(),
      to: params.to,
      replyTo: getReplyToEmail(),
      subject: "We've Received Your Traffic Ticket Submission - Action Required",
      html,
    });

    if (error) {
      console.error('Failed to send submission received email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Failed to send submission received email:', message);
    return { success: false, error: message };
  }
}

/**
 * Send case accepted email with calendar invite attachment
 */
export async function sendCaseAcceptedEmail(params: {
  to: string;
  customerName: string;
  caseId: string;
  citationNumber: string;
  courtDate: string;
  courtTime?: string;
  courtLocation: string;
  jurisdiction?: string;
  violationDescription?: string;
}): Promise<SendEmailResult> {
  try {
    const html = await render(
      CaseAcceptedEmail({
        customerName: params.customerName,
        caseId: params.caseId,
        citationNumber: params.citationNumber,
        courtDate: params.courtDate,
        courtTime: params.courtTime,
        courtLocation: params.courtLocation,
      })
    );

    // Generate calendar invite attachment
    const courtInfo = getCourtInfo(params.jurisdiction);
    const icsContent = generateICSFile({
      caseId: params.caseId,
      clientName: params.customerName,
      citationNumber: params.citationNumber,
      courtDate: new Date(params.courtDate),
      courtTime: params.courtTime,
      courtLocation: courtInfo.name,
      courtAddress: courtInfo.address,
      jurisdiction: params.jurisdiction || 'Memphis Area',
      violationDescription: params.violationDescription,
    });

    const attachments = [
      {
        filename: `court-date-${params.caseId}.ics`,
        content: Buffer.from(icsContent, 'utf-8').toString('base64'),
        contentType: 'text/calendar',
      },
    ];

    // Send to customer
    const { data, error } = await getResendClient().emails.send({
      from: getFromEmail(),
      to: params.to,
      replyTo: getReplyToEmail(),
      subject: 'Your Case Has Been Accepted - TaskForce Tickets',
      html,
      attachments,
    });

    if (error) {
      console.error('Failed to send case accepted email:', error);
      return { success: false, error: error.message };
    }

    // Also send calendar invite to internal recipients
    if (areCalendarInvitesEnabled()) {
      const internalRecipients = getCalendarRecipients();
      if (internalRecipients.length > 0) {
        try {
          await getResendClient().emails.send({
            from: getFromEmail(),
            to: internalRecipients,
            subject: `Court Date: ${params.customerName} - ${params.citationNumber} (${params.courtDate})`,
            html: `<p>Calendar invite attached for case ${params.caseId}.</p>
<p><strong>Client:</strong> ${params.customerName}</p>
<p><strong>Citation:</strong> ${params.citationNumber}</p>
<p><strong>Court Date:</strong> ${params.courtDate}${params.courtTime ? ` at ${params.courtTime}` : ''}</p>
<p><strong>Location:</strong> ${courtInfo.name}</p>
<p><strong>Address:</strong> ${courtInfo.address}</p>`,
            attachments,
          });
        } catch (internalErr) {
          // Log but don't fail - customer email was sent successfully
          console.error('Failed to send internal calendar invite:', internalErr);
        }
      }
    }

    return { success: true, messageId: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Failed to send case accepted email:', message);
    return { success: false, error: message };
  }
}

/**
 * Send needs info email
 */
export async function sendNeedsInfoEmail(params: {
  to: string;
  customerName: string;
  caseId: string;
  courtDate: string;
  itemsNeeded: string[];
  deadline: string;
}): Promise<SendEmailResult> {
  try {
    const html = await render(
      NeedsInfoEmail({
        customerName: params.customerName,
        caseId: params.caseId,
        courtDate: params.courtDate,
        itemsNeeded: params.itemsNeeded,
        deadline: params.deadline,
      })
    );

    const { data, error } = await getResendClient().emails.send({
      from: getFromEmail(),
      to: params.to,
      replyTo: getReplyToEmail(),
      subject: 'Action Required: Additional Information Needed for Your Case',
      html,
    });

    if (error) {
      console.error('Failed to send needs info email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Failed to send needs info email:', message);
    return { success: false, error: message };
  }
}

/**
 * Send case dismissed email (with Google review CTA and court payment link)
 */
export async function sendCaseDismissedEmail(params: {
  to: string;
  customerName: string;
  caseId: string;
  citationNumber: string;
  courtCostsAmount?: number;
  courtCostsDueDate?: string;
  courtKey?: string;
}): Promise<SendEmailResult> {
  try {
    const reviewUrl = process.env.GOOGLE_REVIEW_URL || 'https://g.page/r/taskforcetickets/review';

    const html = await render(
      CaseDismissedEmail({
        customerName: params.customerName,
        caseId: params.caseId,
        citationNumber: params.citationNumber,
        courtCostsAmount: params.courtCostsAmount,
        courtCostsDueDate: params.courtCostsDueDate,
        courtKey: params.courtKey,
        reviewUrl,
      })
    );

    const { data, error } = await getResendClient().emails.send({
      from: getFromEmail(),
      to: params.to,
      replyTo: getReplyToEmail(),
      subject: 'Great News! Your Traffic Ticket Has Been Dismissed',
      html,
    });

    if (error) {
      console.error('Failed to send case dismissed email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Failed to send case dismissed email:', message);
    return { success: false, error: message };
  }
}

/**
 * Send case not dismissed email (with refund info and court payment link)
 */
export async function sendCaseNotDismissedEmail(params: {
  to: string;
  customerName: string;
  caseId: string;
  citationNumber: string;
  outcomeDetails?: string;
  refundAmount: number;
  fineAmount?: number;
  paymentDueDate?: string;
  courtKey?: string;
}): Promise<SendEmailResult> {
  try {
    const html = await render(
      CaseNotDismissedEmail({
        customerName: params.customerName,
        caseId: params.caseId,
        citationNumber: params.citationNumber,
        outcomeDetails: params.outcomeDetails,
        refundAmount: params.refundAmount,
        fineAmount: params.fineAmount,
        paymentDueDate: params.paymentDueDate,
        courtKey: params.courtKey,
      })
    );

    const { data, error } = await getResendClient().emails.send({
      from: getFromEmail(),
      to: params.to,
      replyTo: getReplyToEmail(),
      subject: 'Your Case Update - TaskForce Tickets',
      html,
    });

    if (error) {
      console.error('Failed to send case not dismissed email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Failed to send case not dismissed email:', message);
    return { success: false, error: message };
  }
}

/**
 * Send rejection court reminder email (7 days before court date for rejected cases)
 */
export async function sendRejectionCourtReminderEmail(params: {
  to: string;
  customerName: string;
  caseId: string;
  citationNumber: string;
  courtDate: string;
  courtTime?: string;
  courtLocation?: string;
  rejectionReason?: string;
}): Promise<SendEmailResult> {
  try {
    const html = await render(
      RejectionCourtReminderEmail({
        customerName: params.customerName,
        caseId: params.caseId,
        citationNumber: params.citationNumber,
        courtDate: params.courtDate,
        courtTime: params.courtTime,
        courtLocation: params.courtLocation,
        rejectionReason: params.rejectionReason,
      })
    );

    const { data, error } = await getResendClient().emails.send({
      from: getFromEmail(),
      to: params.to,
      replyTo: getReplyToEmail(),
      subject: `IMPORTANT: Your Court Date is ${params.courtDate} - Action Required`,
      html,
    });

    if (error) {
      console.error('Failed to send rejection court reminder email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, messageId: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Failed to send rejection court reminder email:', message);
    return { success: false, error: message };
  }
}

/**
 * Log email sending to database
 */
export async function logEmailSent(params: {
  caseId: string;
  emailType: EmailType;
  recipientEmail: string;
  subject: string;
  resendMessageId?: string;
  status: 'sent' | 'failed';
  errorMessage?: string;
}): Promise<void> {
  try {
    // Import dynamically to avoid circular dependencies
    const { getAdminClient } = await import('@/lib/db/supabase');
    const supabase = getAdminClient();

    await supabase.from('email_logs').insert({
      case_id: params.caseId,
      email_type: params.emailType,
      recipient_email: params.recipientEmail,
      subject: params.subject,
      resend_message_id: params.resendMessageId,
      status: params.status,
      error_message: params.errorMessage,
    });
  } catch (err) {
    console.error('Failed to log email:', err);
  }
}
