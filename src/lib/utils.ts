import { type ClassValue, clsx } from 'clsx';

// Simple cn utility without tailwind-merge for now
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Calculate the submission deadline (3 business days before court date)
export function getSubmissionDeadline(courtDate: Date): Date {
  const deadline = new Date(courtDate);
  let businessDays = 3;

  while (businessDays > 0) {
    deadline.setDate(deadline.getDate() - 1);
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (deadline.getDay() !== 0 && deadline.getDay() !== 6) {
      businessDays--;
    }
  }

  return deadline;
}

// Check if submission is still valid (before deadline)
export function isBeforeDeadline(courtDate: Date): boolean {
  const now = new Date();
  const deadline = getSubmissionDeadline(courtDate);
  return now < deadline;
}

// Format date for display
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

// Format currency (amount is in cents)
export function formatCurrency(amountInCents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amountInCents / 100);
}

// Validate email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate phone (basic US format)
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10 || cleaned.length === 11;
}

// Format phone for display
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  if (cleaned.length === 11) {
    return `+${cleaned[0]} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
}
