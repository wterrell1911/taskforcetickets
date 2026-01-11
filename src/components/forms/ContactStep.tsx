'use client';

import { IntakeFormData } from '@/types';

interface ContactStepProps {
  data: IntakeFormData;
  onChange: (data: Partial<IntakeFormData>) => void;
  errors: Record<string, string>;
}

export function ContactStep({ data, onChange, errors }: ContactStepProps) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-extrabold text-[#1A1A1A] mb-3">Contact Information</h2>
        <p className="text-[#4A4A4A]">
          We&apos;ll use this information to keep you updated on your case.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="firstName" className="block text-sm font-semibold text-[#1A1A1A] mb-2">
            First Name <span className="text-[#CF2A27]">*</span>
          </label>
          <input
            type="text"
            id="firstName"
            value={data.firstName}
            onChange={(e) => onChange({ firstName: e.target.value })}
            className={`w-full px-4 py-4 rounded-xl border ${
              errors.firstName ? 'border-[#CF2A27]' : 'border-[#E5E5E5]'
            } focus:border-[#FFD100] focus:ring-0 outline-none transition-colors`}
            placeholder="John"
          />
          {errors.firstName && (
            <p className="mt-2 text-sm text-[#CF2A27]">{errors.firstName}</p>
          )}
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-semibold text-[#1A1A1A] mb-2">
            Last Name <span className="text-[#CF2A27]">*</span>
          </label>
          <input
            type="text"
            id="lastName"
            value={data.lastName}
            onChange={(e) => onChange({ lastName: e.target.value })}
            className={`w-full px-4 py-4 rounded-xl border ${
              errors.lastName ? 'border-[#CF2A27]' : 'border-[#E5E5E5]'
            } focus:border-[#FFD100] focus:ring-0 outline-none transition-colors`}
            placeholder="Doe"
          />
          {errors.lastName && (
            <p className="mt-2 text-sm text-[#CF2A27]">{errors.lastName}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-[#1A1A1A] mb-2">
          Email Address <span className="text-[#CF2A27]">*</span>
        </label>
        <input
          type="email"
          id="email"
          value={data.email}
          onChange={(e) => onChange({ email: e.target.value })}
          className={`w-full px-4 py-4 rounded-xl border ${
            errors.email ? 'border-[#CF2A27]' : 'border-[#E5E5E5]'
          } focus:border-[#FFD100] focus:ring-0 outline-none transition-colors`}
          placeholder="john@example.com"
        />
        {errors.email && <p className="mt-2 text-sm text-[#CF2A27]">{errors.email}</p>}
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-semibold text-[#1A1A1A] mb-2">
          Phone Number <span className="text-[#CF2A27]">*</span>
        </label>
        <input
          type="tel"
          id="phone"
          value={data.phone}
          onChange={(e) => onChange({ phone: e.target.value })}
          className={`w-full px-4 py-4 rounded-xl border ${
            errors.phone ? 'border-[#CF2A27]' : 'border-[#E5E5E5]'
          } focus:border-[#FFD100] focus:ring-0 outline-none transition-colors`}
          placeholder="(901) 555-0123"
        />
        {errors.phone && <p className="mt-2 text-sm text-[#CF2A27]">{errors.phone}</p>}
      </div>
    </div>
  );
}
