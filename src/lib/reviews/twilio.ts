/**
 * Twilio SMS client for review requests
 */

import twilio from 'twilio';

// Twilio credentials from environment
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

// Google Place ID for direct review link
const googlePlaceId = process.env.GOOGLE_PLACE_ID;

/**
 * Get the direct Google review link
 */
export function getGoogleReviewLink(): string {
  if (!googlePlaceId) {
    // Fallback to search if no Place ID configured
    return 'https://www.google.com/search?q=TaskForce+Tickets+Memphis+reviews';
  }
  return `https://search.google.com/local/writereview?placeid=${googlePlaceId}`;
}

/**
 * Send an SMS message via Twilio
 */
export async function sendSMS(to: string, body: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!accountSid || !authToken || !fromNumber) {
    console.error('Twilio credentials not configured');
    return { success: false, error: 'Twilio not configured' };
  }

  try {
    const client = twilio(accountSid, authToken);
    
    // Normalize phone number to E.164 format
    const normalizedTo = normalizePhoneNumber(to);
    
    const message = await client.messages.create({
      body,
      from: fromNumber,
      to: normalizedTo,
    });

    return { success: true, messageId: message.sid };
  } catch (error) {
    console.error('Twilio send error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Normalize phone number to E.164 format
 */
function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // If 10 digits, assume US and add +1
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  
  // If 11 digits starting with 1, add +
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  
  // Otherwise assume it's already formatted correctly
  return digits.startsWith('+') ? phone : `+${digits}`;
}

/**
 * Generate review request message templates
 */
export function getReviewRequestMessage(customerName: string, messageType: 'initial' | 'followup1' | 'followup2'): string {
  const reviewLink = getGoogleReviewLink();
  const firstName = customerName.split(' ')[0];
  
  switch (messageType) {
    case 'initial':
      return `Hi ${firstName}! 🎉 Great news - your traffic ticket has been dismissed! We're so glad we could help.

If you have a moment, a Google review would mean the world to us. It helps other Memphis drivers find us when they need help.

Leave a review: ${reviewLink}

Thank you for trusting TaskForce Tickets!`;

    case 'followup1':
      return `Hi ${firstName}, just a quick follow-up! If you were happy with how we handled your ticket, we'd really appreciate a Google review.

It only takes 30 seconds: ${reviewLink}

Thanks again for choosing TaskForce Tickets! 🙏`;

    case 'followup2':
      return `Last reminder, ${firstName}! If we earned it, a 5-star review helps us help more Memphis drivers.

${reviewLink}

No worries if you're busy - we appreciate you either way!`;

    default:
      return `Hi ${firstName}, thank you for using TaskForce Tickets! If you have a moment, please leave us a review: ${reviewLink}`;
  }
}
