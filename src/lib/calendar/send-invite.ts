/**
 * Send calendar invite via email with ICS attachment
 * More reliable than Google Calendar API - works with any email
 */

import { Resend } from 'resend';
import { generateICSContent, CALENDAR_RECIPIENTS } from './google-calendar';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendCalendarInviteParams {
  caseId: string;
  customerName: string;
  citationNumber: string;
  courtDate: string;
  courtTime?: string;
  courtLocation?: string;
  courtJurisdiction?: string;
}

export async function sendCourtDateCalendarInvite(params: SendCalendarInviteParams): Promise<{ success: boolean; error?: string }> {
  try {
    const icsContent = generateICSContent({
      caseId: params.caseId,
      customerName: params.customerName,
      citationNumber: params.citationNumber,
      courtDate: params.courtDate,
      courtTime: params.courtTime,
      courtLocation: params.courtLocation,
      courtJurisdiction: params.courtJurisdiction,
    });

    // Format court date for display
    const courtDateObj = new Date(params.courtDate);
    const formattedDate = courtDateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const location = params.courtLocation || 
      (params.courtJurisdiction === 'Memphis' || params.courtJurisdiction === 'Shelby County'
        ? '201 Poplar Ave, Memphis, TN 38103'
        : params.courtJurisdiction || 'Memphis Traffic Court');

    // Send email with ICS attachment to all recipients
    await resend.emails.send({
      from: 'TaskForce Tickets <notifications@taskforcetickets.com>',
      to: CALENDAR_RECIPIENTS,
      subject: `📅 Court Date Added: ${params.customerName} - ${formattedDate}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #FFD100; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; color: #1A1A1A; font-size: 24px;">📅 New Court Date</h1>
          </div>
          
          <div style="background: #f8f8f8; padding: 24px; border-radius: 0 0 8px 8px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5; color: #666;">Client</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5; font-weight: 600; text-align: right;">${params.customerName}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5; color: #666;">Citation #</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5; font-weight: 600; text-align: right;">${params.citationNumber || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5; color: #666;">Court Date</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5; font-weight: 600; text-align: right;">${formattedDate}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5; color: #666;">Time</td>
                <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5; font-weight: 600; text-align: right;">${params.courtTime || '9:00 AM'}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0; color: #666;">Location</td>
                <td style="padding: 12px 0; font-weight: 600; text-align: right;">${location}</td>
              </tr>
            </table>
            
            <p style="margin-top: 24px; color: #666; font-size: 14px;">
              📎 Open the attached .ics file to add this to your calendar.
            </p>
            
            <p style="margin-top: 16px; color: #999; font-size: 12px;">
              Case ID: ${params.caseId}
            </p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `court-date-${params.citationNumber || params.caseId}.ics`,
          content: Buffer.from(icsContent).toString('base64'),
        },
      ],
    });

    console.log(`Calendar invite sent for case ${params.caseId} to ${CALENDAR_RECIPIENTS.length} recipients`);

    return { success: true };
  } catch (error) {
    console.error('Failed to send calendar invite:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send calendar invite',
    };
  }
}
