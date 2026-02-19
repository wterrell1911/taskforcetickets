/**
 * Review Request Module
 * 
 * Handles automated review requests for dismissed traffic ticket cases.
 * 
 * Flow:
 * 1. Case dismissed → trigger review request
 * 2. Day 0: Initial SMS sent
 * 3. Day 3: Follow-up 1 (if no review detected)
 * 4. Day 7: Follow-up 2 (final reminder)
 * 
 * Usage:
 *   POST /api/reviews/request
 *   { caseId, customerName, customerPhone, customerEmail? }
 */

export {
  sendSMS,
  getGoogleReviewLink,
  getReviewRequestMessage,
} from './twilio';

export {
  createReviewRequest,
  sendInitialReviewRequest,
  sendFollowup1,
  sendFollowup2,
  markReviewReceived,
  getPendingFollowups,
  getReviewStats,
  type ReviewRequest,
} from './service';
