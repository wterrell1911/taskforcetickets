// Email configuration and payment links

export const EMAIL_CONFIG = {
  from: {
    name: 'Task Force Tickets',
    email: 'noreply@taskforcetickets.com',
  },
  replyTo: 'support@taskforcetickets.com',
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://taskforcetickets.com',
};

// Payment links for different courts
export const COURT_PAYMENT_LINKS: Record<string, { name: string; url: string; instructions?: string }> = {
  'memphis-city-court': {
    name: 'Memphis City Court',
    url: 'https://tncourtpay.com/memphis',
    instructions: 'Enter your citation number when prompted',
  },
  'shelby-county-general-sessions': {
    name: 'Shelby County General Sessions',
    url: 'https://tncourtpay.com/shelbycounty',
    instructions: 'Use your case number to look up your balance',
  },
  'tennessee-highway-patrol': {
    name: 'Tennessee Highway Patrol',
    url: 'https://tncourtpay.com/thp',
    instructions: 'Enter your citation number',
  },
  'bartlett-city-court': {
    name: 'Bartlett City Court',
    url: 'https://tncourtpay.com/bartlett',
  },
  'germantown-city-court': {
    name: 'Germantown City Court',
    url: 'https://tncourtpay.com/germantown',
  },
  'collierville-city-court': {
    name: 'Collierville City Court',
    url: 'https://tncourtpay.com/collierville',
  },
  'default': {
    name: 'Tennessee Court Pay',
    url: 'https://tncourtpay.com',
    instructions: 'Search for your court and enter your citation number',
  },
};

// Google review link
export const GOOGLE_REVIEW_LINK = 'https://g.page/r/taskforcetickets/review';

// Status page links
export const getStatusPageUrl = (caseId: string) =>
  `${EMAIL_CONFIG.baseUrl}/status/${caseId}`;

export const getIntakeUrl = () =>
  `${EMAIL_CONFIG.baseUrl}/intake`;

// Email subject lines
export const EMAIL_SUBJECTS = {
  submissionReceived: 'We Received Your Ticket - Task Force Tickets',
  additionalInfoNeeded: 'Action Required: Additional Information Needed',
  caseAccepted: 'Great News: Your Case Has Been Accepted',
  ticketDismissed: 'Congratulations! Your Ticket Has Been Dismissed',
  ticketNotDismissed: 'Update on Your Traffic Ticket Case',
};
