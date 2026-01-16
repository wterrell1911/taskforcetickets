/**
 * Case Status Constants
 *
 * Defines all possible case statuses and their display information
 */

export const CASE_STATUSES = {
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  ACCEPTED: 'accepted',
  COURT_SCHEDULED: 'court_scheduled',
  APPEARED: 'appeared',
  DISMISSED: 'dismissed',
  NOT_DISMISSED: 'not_dismissed',
  CLOSED: 'closed',
} as const;

export type CaseStatus = (typeof CASE_STATUSES)[keyof typeof CASE_STATUSES];

export const STATUS_DISPLAY: Record<
  CaseStatus,
  { label: string; description: string; color: string }
> = {
  submitted: {
    label: 'Submitted',
    description: 'We received your ticket',
    color: 'blue',
  },
  under_review: {
    label: 'Under Review',
    description: 'Checking eligibility',
    color: 'yellow',
  },
  accepted: {
    label: 'Accepted',
    description: 'We will appear for you',
    color: 'green',
  },
  court_scheduled: {
    label: 'Court Scheduled',
    description: 'Appearance date set',
    color: 'purple',
  },
  appeared: {
    label: 'Court Complete',
    description: 'We appeared on your behalf',
    color: 'indigo',
  },
  dismissed: {
    label: 'Dismissed!',
    description: 'No conviction, no points',
    color: 'green',
  },
  not_dismissed: {
    label: 'Not Dismissed',
    description: 'Check email for details',
    color: 'red',
  },
  closed: {
    label: 'Closed',
    description: 'Case complete',
    color: 'gray',
  },
};

/**
 * Get the progression stages for the status tracker
 */
export function getStatusStages(finalStatus?: CaseStatus): CaseStatus[] {
  // Default happy path
  const stages: CaseStatus[] = [
    CASE_STATUSES.SUBMITTED,
    CASE_STATUSES.ACCEPTED,
    CASE_STATUSES.COURT_SCHEDULED,
    CASE_STATUSES.DISMISSED,
  ];

  // If final status is not_dismissed, swap it in
  if (finalStatus === CASE_STATUSES.NOT_DISMISSED) {
    stages[3] = CASE_STATUSES.NOT_DISMISSED;
  }

  return stages;
}

/**
 * Check if a status is a terminal/final status
 */
export function isTerminalStatus(status: CaseStatus): boolean {
  return [
    CASE_STATUSES.DISMISSED,
    CASE_STATUSES.NOT_DISMISSED,
    CASE_STATUSES.CLOSED,
  ].includes(status);
}
