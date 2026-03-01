/**
 * ICS Calendar File Generator
 * Generates .ics files for court date calendar invites
 */

export interface CourtEvent {
  caseId: string;
  clientName: string;
  citationNumber: string;
  courtDate: Date;
  courtTime?: string; // HH:MM format, defaults to 09:00 if not specified
  courtLocation: string;
  courtAddress: string;
  jurisdiction: string;
  violationDescription?: string;
}

/**
 * Escape special characters for ICS format
 */
function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Format a date for ICS format (YYYYMMDDTHHMMSSZ)
 */
function formatDateForICS(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/**
 * Generate an ICS calendar file for a court date
 */
export function generateICSFile(event: CourtEvent): string {
  const startDate = new Date(event.courtDate);
  const courtTime = event.courtTime || '09:00';
  const [hours, minutes] = courtTime.split(':').map(Number);
  startDate.setHours(hours, minutes, 0, 0);

  // End time: 1 hour after start
  const endDate = new Date(startDate);
  endDate.setHours(endDate.getHours() + 1);

  const uid = `court-${event.caseId}@taskforcetickets.com`;
  const now = formatDateForICS(new Date());
  const start = formatDateForICS(startDate);
  const end = formatDateForICS(endDate);

  const description = escapeICSText([
    `Case ID: ${event.caseId}`,
    `Client: ${event.clientName}`,
    `Citation: ${event.citationNumber}`,
    event.violationDescription ? `Violation: ${event.violationDescription}` : '',
    `Jurisdiction: ${event.jurisdiction}`,
    '',
    'TaskForce Tickets - Traffic Defense',
    'https://taskforcetickets.com',
  ].filter(Boolean).join('\n'));

  const summary = escapeICSText(`Court: ${event.clientName} - ${event.citationNumber}`);
  const location = escapeICSText(`${event.courtLocation}, ${event.courtAddress}`);

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TaskForce Tickets//Court Date//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    // Reminder 1 day before
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    'DESCRIPTION:Court date tomorrow',
    'END:VALARM',
    // Reminder 1 hour before
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Court date in 1 hour',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  return icsContent;
}

/**
 * Convert ICS content to base64 for email attachment
 */
export function icsToBase64(icsContent: string): string {
  return Buffer.from(icsContent, 'utf-8').toString('base64');
}
