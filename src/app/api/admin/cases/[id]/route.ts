import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAdminClient, getSignedUrl, STORAGE_BUCKETS } from '@/lib/db/supabase';
import { safeDecrypt } from '@/lib/encryption';
import {
  sendCaseAcceptedEmail,
  sendCaseDismissedEmail,
  sendCaseNotDismissedEmail,
  sendNeedsInfoEmail,
  logEmailSent,
} from '@/lib/emails/send-email';

const AUTH_COOKIE_NAME = 'tft_admin_auth';

/**
 * Verify admin authentication
 */
async function verifyAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) return false;

  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    return payload.exp > Date.now();
  } catch {
    return false;
  }
}

/**
 * GET /api/admin/cases/[id] - Get case details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const supabase = getAdminClient();

  const { data: caseData, error } = await supabase
    .from('cases')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !caseData) {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 });
  }

  // Generate signed URLs for documents
  const [ticketUrl, licenseUrl, supportingUrl] = await Promise.all([
    caseData.ticket_document_path
      ? getSignedUrl(STORAGE_BUCKETS.INTAKE_DOCUMENTS, caseData.ticket_document_path)
      : null,
    caseData.license_document_path
      ? getSignedUrl(STORAGE_BUCKETS.INTAKE_DOCUMENTS, caseData.license_document_path)
      : null,
    caseData.supporting_document_path
      ? getSignedUrl(STORAGE_BUCKETS.INTAKE_DOCUMENTS, caseData.supporting_document_path)
      : null,
  ]);

  // Decrypt sensitive fields for admin view
  const decryptedCase = {
    ...caseData,
    license_number: safeDecrypt(caseData.license_number_encrypted),
    date_of_birth: safeDecrypt(caseData.date_of_birth_encrypted),
    customer_address: safeDecrypt(caseData.customer_address_encrypted),
    // Document URLs
    ticket_url: ticketUrl,
    license_url: licenseUrl,
    supporting_url: supportingUrl,
  };

  return NextResponse.json(decryptedCase);
}

/**
 * PATCH /api/admin/cases/[id] - Update case status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { action, ...updateData } = body;

  const supabase = getAdminClient();

  // Get current case data
  const { data: caseData, error: fetchError } = await supabase
    .from('cases')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !caseData) {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 });
  }

  const now = new Date().toISOString();
  let updates: Record<string, unknown> = {};
  let emailSent = false;

  switch (action) {
    case 'accept':
      updates = {
        status: 'accepted',
        accepted_at: now,
        ...updateData,
      };

      // Send acceptance email with calendar invite
      const acceptResult = await sendCaseAcceptedEmail({
        to: caseData.customer_email,
        customerName: caseData.customer_name,
        caseId: id.slice(0, 8).toUpperCase(),
        citationNumber: caseData.citation_number || 'N/A',
        courtDate: new Date(caseData.court_date).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        courtTime: caseData.court_time,
        courtLocation: caseData.court_location || 'See citation for location',
        jurisdiction: caseData.court_jurisdiction,
        violationDescription: caseData.violation_description,
      });

      await logEmailSent({
        caseId: id,
        emailType: 'case_accepted',
        recipientEmail: caseData.customer_email,
        subject: 'Your Case Has Been Accepted - TaskForce Tickets',
        resendMessageId: acceptResult.messageId,
        status: acceptResult.success ? 'sent' : 'failed',
        errorMessage: acceptResult.error,
      });

      emailSent = acceptResult.success;
      break;

    case 'needs_info':
      updates = {
        status: 'needs_info',
        ...updateData,
      };

      const itemsNeeded = updateData.items_needed || ['Additional documentation required'];
      const deadline = updateData.deadline || calculateDeadline(caseData.court_date);

      const infoResult = await sendNeedsInfoEmail({
        to: caseData.customer_email,
        customerName: caseData.customer_name,
        caseId: id.slice(0, 8).toUpperCase(),
        courtDate: new Date(caseData.court_date).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        itemsNeeded,
        deadline,
      });

      await logEmailSent({
        caseId: id,
        emailType: 'needs_info',
        recipientEmail: caseData.customer_email,
        subject: 'Action Required: Additional Information Needed for Your Case',
        resendMessageId: infoResult.messageId,
        status: infoResult.success ? 'sent' : 'failed',
        errorMessage: infoResult.error,
      });

      emailSent = infoResult.success;
      break;

    case 'dismiss':
      updates = {
        status: 'dismissed',
        disposed_at: now,
        disposition_type: 'dismissed',
        review_requested_at: now,
        dismissed_email_sent_at: now,
        ...updateData,
      };

      const dismissResult = await sendCaseDismissedEmail({
        to: caseData.customer_email,
        customerName: caseData.customer_name,
        caseId: id.slice(0, 8).toUpperCase(),
        citationNumber: caseData.citation_number || 'N/A',
        courtCostsAmount: updateData.court_costs_amount || caseData.court_costs_amount,
        courtCostsDueDate: updateData.court_costs_due_date
          ? new Date(updateData.court_costs_due_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
          : undefined,
        courtKey: updateData.court_payment_key || caseData.court_payment_key,
      });

      await logEmailSent({
        caseId: id,
        emailType: 'case_dismissed',
        recipientEmail: caseData.customer_email,
        subject: 'Great News! Your Traffic Ticket Has Been Dismissed',
        resendMessageId: dismissResult.messageId,
        status: dismissResult.success ? 'sent' : 'failed',
        errorMessage: dismissResult.error,
      });

      emailSent = dismissResult.success;
      break;

    case 'not_dismissed':
      updates = {
        status: 'not_dismissed',
        disposed_at: now,
        disposition_type: 'not_dismissed',
        not_dismissed_email_sent_at: now,
        ...updateData,
      };

      const notDismissedResult = await sendCaseNotDismissedEmail({
        to: caseData.customer_email,
        customerName: caseData.customer_name,
        caseId: id.slice(0, 8).toUpperCase(),
        citationNumber: caseData.citation_number || 'N/A',
        outcomeDetails: updateData.outcome_details,
        refundAmount: caseData.amount_charged,
        fineAmount: updateData.fine_amount || caseData.fine_amount,
        paymentDueDate: updateData.fine_due_date
          ? new Date(updateData.fine_due_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
          : undefined,
        courtKey: updateData.court_payment_key || caseData.court_payment_key,
      });

      await logEmailSent({
        caseId: id,
        emailType: 'case_not_dismissed',
        recipientEmail: caseData.customer_email,
        subject: 'Your Case Update - TaskForce Tickets',
        resendMessageId: notDismissedResult.messageId,
        status: notDismissedResult.success ? 'sent' : 'failed',
        errorMessage: notDismissedResult.error,
      });

      emailSent = notDismissedResult.success;
      break;

    case 'reject':
      const rejectionReason = updateData.rejectionReason || 'Case rejected';
      updates = {
        status: 'rejected',
        internal_notes: caseData.internal_notes
          ? `${caseData.internal_notes}\n\n[${now}] REJECTED: ${rejectionReason}`
          : `[${now}] REJECTED: ${rejectionReason}`,
      };
      // TODO: Send rejection email to client
      break;

    case 'update':
      // Update editable fields
      updates = {
        ...(updateData.customer_name !== undefined && { customer_name: updateData.customer_name }),
        ...(updateData.customer_email !== undefined && { customer_email: updateData.customer_email }),
        ...(updateData.customer_phone !== undefined && { customer_phone: updateData.customer_phone }),
        ...(updateData.court_date !== undefined && { court_date: updateData.court_date }),
        ...(updateData.citation_number !== undefined && { citation_number: updateData.citation_number }),
        ...(updateData.court_location !== undefined && { court_location: updateData.court_location }),
        ...(updateData.court_time !== undefined && { court_time: updateData.court_time || null }),
        ...(updateData.internal_notes !== undefined && { internal_notes: updateData.internal_notes }),
        updated_at: now,
      };
      break;

    default:
      // General update without status change
      updates = updateData;
  }

  // Update case
  const { error: updateError } = await supabase
    .from('cases')
    .update(updates)
    .eq('id', id);

  if (updateError) {
    console.error('Failed to update case:', updateError);
    return NextResponse.json({ error: 'Failed to update case' }, { status: 500 });
  }

  // Log status change
  if (action) {
    await supabase.from('case_status_history').insert({
      case_id: id,
      old_status: caseData.status,
      new_status: updates.status || caseData.status,
      changed_by: 'admin', // Could be extracted from auth token
      notes: updateData.notes,
    });
  }

  return NextResponse.json({
    success: true,
    emailSent,
    message: `Case ${action || 'updated'} successfully`,
  });
}

/**
 * Calculate deadline based on court date (2 days before)
 */
function calculateDeadline(courtDate: string): string {
  const date = new Date(courtDate);
  date.setDate(date.getDate() - 2);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
