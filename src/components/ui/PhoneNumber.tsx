'use client';

import { PHONE_DISPLAY, PHONE_HREF } from '@/lib/constants/contact';
import { useTracking } from '@/hooks/useTracking';

interface PhoneNumberProps {
  number?: string;
  displayNumber?: string;
  label?: string;
  className?: string;
  variant?: 'header' | 'footer' | 'cta' | 'inline' | 'hero';
  showIcon?: boolean;
}

export function PhoneNumber({
  number = PHONE_HREF,
  displayNumber = PHONE_DISPLAY,
  label,
  className = '',
  variant = 'inline',
  showIcon = true,
}: PhoneNumberProps) {
  const { trackPhoneClick } = useTracking();
  
  const baseStyles = 'callrail-replace inline-flex items-center gap-2 transition-colors';
  
  const variantStyles: Record<string, string> = {
    header: 'text-[#4A4A4A] hover:text-[#1A1A1A] text-sm font-medium',
    footer: 'text-white/70 hover:text-white',
    cta: 'text-white/80 hover:text-white text-lg',
    hero: 'text-[#4A4A4A] hover:text-[#1A1A1A] text-sm',
    inline: 'text-[#1A1A1A] hover:text-[#FFD100]',
  };

  const PhoneIcon = () => (
    <svg 
      className="w-4 h-4" 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" 
      />
    </svg>
  );

  const handleClick = () => {
    trackPhoneClick(displayNumber);
  };

  return (
    <a
      href={number}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      aria-label={`Call us at ${displayNumber}`}
      onClick={handleClick}
    >
      {showIcon && <PhoneIcon />}
      {label && <span className="sr-only">{label}: </span>}
      <span>{displayNumber}</span>
    </a>
  );
}
