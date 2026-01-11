/**
 * Calendar Invite Recipients Configuration
 *
 * Controls who receives calendar invites when cases are accepted.
 * Configure via CALENDAR_INVITE_RECIPIENTS environment variable.
 *
 * Format: comma-separated email addresses
 * Example: CALENDAR_INVITE_RECIPIENTS=info@taskforcetickets.com,will@taskforcetickets.com
 */

const DEFAULT_RECIPIENT = 'info@taskforcetickets.com';

/**
 * Get the list of email addresses that should receive calendar invites
 */
export function getCalendarRecipients(): string[] {
  const recipients = process.env.CALENDAR_INVITE_RECIPIENTS || DEFAULT_RECIPIENT;
  return recipients
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean);
}

/**
 * Check if calendar invites are enabled
 */
export function areCalendarInvitesEnabled(): boolean {
  // Disabled if explicitly set to 'false' or 'disabled'
  const setting = process.env.CALENDAR_INVITES_ENABLED;
  if (setting === 'false' || setting === 'disabled') {
    return false;
  }
  return true;
}
