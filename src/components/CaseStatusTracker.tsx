'use client';

import {
  STATUS_DISPLAY,
  CASE_STATUSES,
  getStatusStages,
  type CaseStatus,
} from '@/lib/constants/case-statuses';

interface StatusEvent {
  status: string;
  timestamp: string;
  note?: string;
}

interface CaseStatusTrackerProps {
  currentStatus: CaseStatus;
  statusHistory: StatusEvent[];
  courtDate?: string | null;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatCourtDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function CaseStatusTracker({
  currentStatus,
  statusHistory,
  courtDate,
}: CaseStatusTrackerProps) {
  const stages = getStatusStages(
    currentStatus === CASE_STATUSES.NOT_DISMISSED
      ? CASE_STATUSES.NOT_DISMISSED
      : undefined
  );

  const currentIndex = stages.indexOf(currentStatus);
  const progressIndex = currentIndex >= 0 ? currentIndex : 0;

  const isDismissed = currentStatus === CASE_STATUSES.DISMISSED;
  const isNotDismissed = currentStatus === CASE_STATUSES.NOT_DISMISSED;

  return (
    <div className="bg-white rounded-2xl shadow-brand border border-[#E5E5E5] p-6">
      <h3 className="text-lg font-bold text-[#1A1A1A] mb-6">Case Status</h3>

      {/* Progress Bar */}
      <div className="relative mb-8">
        {/* Background line */}
        <div className="absolute top-4 left-4 right-4 h-1 bg-[#E5E5E5] rounded" />

        {/* Progress line */}
        <div
          className={`absolute top-4 left-4 h-1 rounded transition-all duration-500 ${
            isDismissed
              ? 'bg-[#10B981]'
              : isNotDismissed
                ? 'bg-[#CF2A27]'
                : 'bg-[#FFD100]'
          }`}
          style={{
            width: `calc(${(progressIndex / (stages.length - 1)) * 100}% - 32px)`,
          }}
        />

        {/* Stage indicators */}
        <div className="relative flex justify-between">
          {stages.map((stage, index) => {
            const isComplete = index <= progressIndex;
            const isCurrent = index === progressIndex;
            const info = STATUS_DISPLAY[stage];
            const isFinal = index === stages.length - 1;

            let bgColor = 'bg-[#E5E5E5]';
            let textColor = 'text-[#4A4A4A]';
            let ringColor = '';

            if (isComplete) {
              if (isFinal && isDismissed) {
                bgColor = 'bg-[#10B981]';
                textColor = 'text-white';
              } else if (isFinal && isNotDismissed) {
                bgColor = 'bg-[#CF2A27]';
                textColor = 'text-white';
              } else {
                bgColor = 'bg-[#FFD100]';
                textColor = 'text-[#1A1A1A]';
              }
            }

            if (isCurrent) {
              ringColor = isDismissed
                ? 'ring-4 ring-[#10B981]/30'
                : isNotDismissed
                  ? 'ring-4 ring-[#CF2A27]/30'
                  : 'ring-4 ring-[#FFD100]/30';
            }

            return (
              <div key={stage} className="flex flex-col items-center w-20">
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                    ${bgColor} ${textColor} ${ringColor}
                    transition-all duration-300
                  `}
                >
                  {isComplete ? (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={`mt-2 text-xs font-medium text-center ${
                    isCurrent ? 'text-[#1A1A1A]' : 'text-[#4A4A4A]'
                  }`}
                >
                  {info.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Status Detail */}
      <div className="p-4 bg-[#F8F8F8] rounded-xl">
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${
              isDismissed
                ? 'bg-[#10B981]'
                : isNotDismissed
                  ? 'bg-[#CF2A27]'
                  : 'bg-[#FFD100] animate-pulse'
            }`}
          />
          <div>
            <p className="font-semibold text-[#1A1A1A]">
              {STATUS_DISPLAY[currentStatus]?.label}
              {isDismissed && ' 🎉'}
            </p>
            <p className="text-sm text-[#4A4A4A]">
              {STATUS_DISPLAY[currentStatus]?.description}
            </p>
          </div>
        </div>

        {/* Court date notice */}
        {courtDate &&
          (currentStatus === CASE_STATUSES.ACCEPTED ||
            currentStatus === CASE_STATUSES.COURT_SCHEDULED) && (
            <div className="mt-4 p-3 bg-[#FFD100]/20 border border-[#FFD100]/30 rounded-lg">
              <p className="text-sm text-[#1A1A1A]">
                <strong>Court Date:</strong> {formatCourtDate(courtDate)}
              </p>
              <p className="text-sm text-[#4A4A4A] mt-1">
                You don&apos;t need to appear - we&apos;ve got you covered!
              </p>
            </div>
          )}

        {/* Dismissal celebration */}
        {isDismissed && (
          <div className="mt-4 p-3 bg-[#10B981]/10 border border-[#10B981]/30 rounded-lg">
            <p className="text-sm text-[#10B981] font-medium">
              Great news! Your ticket has been dismissed. No points on your
              license, no insurance increase.
            </p>
          </div>
        )}

        {/* Not dismissed info */}
        {isNotDismissed && (
          <div className="mt-4 p-3 bg-[#CF2A27]/10 border border-[#CF2A27]/30 rounded-lg">
            <p className="text-sm text-[#CF2A27]">
              Unfortunately, the ticket was not dismissed. Check your email for
              details about next steps and your money-back guarantee.
            </p>
          </div>
        )}
      </div>

      {/* History */}
      {statusHistory.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-[#4A4A4A] mb-3">History</h4>
          <div className="space-y-2">
            {statusHistory.map((event, i) => (
              <div key={i} className="flex items-start gap-3 text-sm">
                <span className="text-[#4A4A4A] w-28 flex-shrink-0">
                  {formatDate(event.timestamp)}
                </span>
                <span className="text-[#1A1A1A]">
                  {STATUS_DISPLAY[event.status as CaseStatus]?.label ||
                    event.status}
                </span>
                {event.note && (
                  <span className="text-[#4A4A4A]">- {event.note}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
