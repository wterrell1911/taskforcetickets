'use client';

import { cn } from '@/lib/utils';
import { FormStep } from '@/types';

interface FormStepIndicatorProps {
  currentStep: FormStep;
  steps: { key: FormStep; label: string }[];
}

export function FormStepIndicator({ currentStep, steps }: FormStepIndicatorProps) {
  const currentIndex = steps.findIndex((s) => s.key === currentStep);

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.key} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm transition-colors border-2',
                  index < currentIndex && 'bg-[#FFD100] border-[#FFD100] text-[#1A1A1A]',
                  index === currentIndex && 'bg-[#1A1A1A] border-[#1A1A1A] text-white',
                  index > currentIndex && 'bg-white border-[#E5E5E5] text-[#4A4A4A]'
                )}
              >
                {index < currentIndex ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={cn(
                  'mt-3 text-xs font-medium hidden sm:block',
                  index <= currentIndex ? 'text-[#1A1A1A]' : 'text-[#4A4A4A]'
                )}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-0.5 mx-3',
                  index < currentIndex ? 'bg-[#FFD100]' : 'bg-[#E5E5E5]'
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
