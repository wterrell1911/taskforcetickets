import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/db/supabase';
import { sendRejectionCourtReminderEmail, logEmailSent } from '@/lib/emails/send-email';

/**
 * Cron job endpoint for sending court date reminders to rejected cases
 *
 * This should be called daily by a cron job service (e.g., Vercel Cron)
 * Sends reminders to rejected cases 7 days before their court date
 *
 * Security: Requires CRON_SECRET in Authorization header
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('CRON_SECRET not configured');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('Starting rejection court date reminder job...');

  try {
    const supabase = getAdminClient();

    // Calculate the date 7 days from now
    const today = new Date();
    const reminderDate = new Date(today);
    reminderDate.setDate(reminderDate.getDate() + 7);

    // Format as YYYY-MM-DD for database query
    const reminderDateStr = reminderDate.toISOString().split('T')[0];

    // Find rejected cases with court date exactly 7 days away
    // that haven't already received a reminder
    const { data: cases, error: fetchError } = await supabase
      .from('cases')
      .select('*')
      .eq('status', 'rejected')
      .eq('court_date', reminderDateStr)
      .is('rejection_reminder_sent_at', null);

    if (fetchError) {
      console.error('Failed to fetch cases:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch cases', message: fetchError.message },
        { status: 500 }
      );
    }

    if (!cases || cases.length === 0) {
      console.log('No rejection reminders to send');
      return NextResponse.json({
        success: true,
        emailsSent: 0,
        message: 'No rejection reminders to send',
        reminderDateChecked: reminderDateStr,
        timestamp: new Date().toISOString(),
      });
    }

    console.log(`Found ${cases.length} rejected cases with court date on ${reminderDateStr}`);

    const results = {
      total: cases.length,
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Send reminder to each case
    for (const caseData of cases) {
      try {
        // Extract rejection reason from internal notes if available
        let rejectionReason: string | undefined;
        if (caseData.internal_notes) {
          const match = caseData.internal_notes.match(/REJECTED:\s*(.+?)(?:\n|$)/);
          if (match) {
            rejectionReason = match[1];
          }
        }

        const courtDateFormatted = new Date(caseData.court_date).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        const result = await sendRejectionCourtReminderEmail({
          to: caseData.customer_email,
          customerName: caseData.customer_name,
          caseId: caseData.id.slice(0, 8).toUpperCase(),
          citationNumber: caseData.citation_number || 'N/A',
          courtDate: courtDateFormatted,
          courtTime: caseData.court_time || undefined,
          courtLocation: caseData.court_location || undefined,
          rejectionReason,
        });

        // Log the email
        await logEmailSent({
          caseId: caseData.id,
          emailType: 'rejection_court_reminder',
          recipientEmail: caseData.customer_email,
          subject: `IMPORTANT: Your Court Date is ${courtDateFormatted} - Action Required`,
          resendMessageId: result.messageId,
          status: result.success ? 'sent' : 'failed',
          errorMessage: result.error,
        });

        if (result.success) {
          // Mark the reminder as sent
          await supabase
            .from('cases')
            .update({ rejection_reminder_sent_at: new Date().toISOString() })
            .eq('id', caseData.id);

          results.sent++;
          console.log(`Sent reminder to ${caseData.customer_email} for case ${caseData.id}`);
        } else {
          results.failed++;
          results.errors.push(`Case ${caseData.id}: ${result.error}`);
        }
      } catch (err) {
        results.failed++;
        const errMsg = err instanceof Error ? err.message : 'Unknown error';
        results.errors.push(`Case ${caseData.id}: ${errMsg}`);
        console.error(`Failed to send reminder for case ${caseData.id}:`, err);
      }
    }

    console.log('Rejection reminder job completed:', results);

    return NextResponse.json({
      success: true,
      emailsSent: results.sent,
      emailsFailed: results.failed,
      errors: results.errors,
      reminderDateChecked: reminderDateStr,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Rejection reminder job failed:', error);
    return NextResponse.json(
      { error: 'Job failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Also support POST for more flexibility
export const POST = GET;
