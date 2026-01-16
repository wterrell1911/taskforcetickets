'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { IntakeFormData, FormStep } from '@/types';
import { Logo } from '@/components/ui/Logo';
import { FormStepIndicator } from '@/components/forms/FormStepIndicator';
import { ContactStep } from '@/components/forms/ContactStep';
import { TicketStep } from '@/components/forms/TicketStep';
import { DocumentsStep } from '@/components/forms/DocumentsStep';
import { ReviewStep } from '@/components/forms/ReviewStep';
import { PromoCodeInput } from '@/components/forms/PromoCodeInput';
import { EligibilityRejection } from '@/components/forms/EligibilityRejection';
import { ManualReviewNotice } from '@/components/forms/ManualReviewNotice';
import { ManualEntryForm, ManualEntryData } from '@/components/forms/ManualEntryForm';
// import { PaymentForm } from '@/components/payments/PaymentForm'; // LawPay - disabled
import { StripePaymentForm } from '@/components/payments/StripePaymentForm';
import { InsuranceSavingsCalculator } from '@/components/InsuranceSavingsCalculator';
import { getPriceForCategory, isDismissible, PRICING_TIERS } from '@/lib/pricing';
import { isValidEmail, isValidPhone, isBeforeDeadline, formatCurrency } from '@/lib/utils';
import { screenTicket, screenTicketWithDropdown, TicketScreeningResult } from '@/lib/eligibility/ticket-screener';
import { shouldProceedWithEligibility } from '@/lib/ocr';
import { PromoCodeInfo, calculateDiscountedPrice, isFreeWithPromo } from '@/lib/promo-codes';

const FORM_STEPS: { key: FormStep; label: string }[] = [
  { key: 'contact', label: 'Contact' },
  { key: 'ticket', label: 'Ticket Details' },
  { key: 'documents', label: 'Documents' },
  { key: 'review', label: 'Review' },
  { key: 'payment', label: 'Payment' },
];

const initialFormData: IntakeFormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  courtDate: '',
  courtJurisdiction: '',
  offenseCategory: '',
  ticketNumber: '',
  issuingOfficer: '',
  citationLocation: '',
  ticketImage: null,
  driversLicense: null,
  supportingDocument: null,
  understoodNotClient: false,
  understoodCourtCosts: false,
  understoodDeadline: false,
  agreedToTerms: false,
};

export default function IntakePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<FormStep>('contact');
  const [formData, setFormData] = useState<IntakeFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Eligibility screening state
  const [eligibilityResult, setEligibilityResult] = useState<TicketScreeningResult | null>(null);
  const [showRejection, setShowRejection] = useState(false);

  // Manual review state (when OCR confidence is too low)
  const [showManualReview, setShowManualReview] = useState(false);
  const [manualReviewReason, setManualReviewReason] = useState<string | undefined>();

  // Promo code state
  const [appliedPromo, setAppliedPromo] = useState<PromoCodeInfo | null>(null);

  // Payment state
  const [caseId, setCaseId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const updateFormData = useCallback((updates: Partial<IntakeFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    const updatedKeys = Object.keys(updates);
    setErrors((prev) => {
      const newErrors = { ...prev };
      updatedKeys.forEach((key) => delete newErrors[key]);
      return newErrors;
    });
  }, []);

  const validateStep = useCallback(
    (step: FormStep): boolean => {
      const newErrors: Record<string, string> = {};

      switch (step) {
        case 'contact':
          if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
          if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
          if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
          } else if (!isValidEmail(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
          }
          if (!formData.phone.trim()) {
            newErrors.phone = 'Phone number is required';
          } else if (!isValidPhone(formData.phone)) {
            newErrors.phone = 'Please enter a valid phone number';
          }
          break;

        case 'ticket':
          if (!formData.courtDate) {
            newErrors.courtDate = 'Court date is required';
          } else if (!isBeforeDeadline(new Date(formData.courtDate))) {
            newErrors.courtDate = 'Court date must be at least 3 business days from now';
          }
          if (!formData.courtJurisdiction) {
            newErrors.courtJurisdiction = 'Please select your court/jurisdiction';
          }
          if (!formData.offenseCategory) {
            newErrors.offenseCategory = 'Please select an offense type';
          }
          break;

        case 'documents':
          // License required unless using manual entry (which has its own license validation)
          if (!formData.driversLicense && !formData.useManualEntry) {
            newErrors.driversLicense = "Driver's license is required";
          }
          break;

        case 'review':
          if (!formData.understoodNotClient) newErrors.understoodNotClient = 'You must acknowledge this';
          if (!formData.understoodCourtCosts) newErrors.understoodCourtCosts = 'You must acknowledge this';
          if (!formData.understoodDeadline) newErrors.understoodDeadline = 'You must acknowledge this';
          if (!formData.agreedToTerms) newErrors.agreedToTerms = 'You must agree to the terms';
          break;
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [formData]
  );

  const handleNext = useCallback(() => {
    if (!validateStep(currentStep)) return;

    // Run eligibility screening after documents step
    if (currentStep === 'documents') {
      // STEP 1: Check OCR confidence before making any eligibility decision
      const hasManualEntry = !!(formData.useManualEntry && formData.manualEntryData);
      const confidenceCheck = shouldProceedWithEligibility(
        formData.ticketUpload?.extractedData,
        formData.licenseUpload?.extractedData,
        hasManualEntry
      );

      console.log('OCR Confidence Check:', confidenceCheck);

      // If confidence is too low and no manual entry, skip eligibility check
      // The case will still proceed but marked for manual review
      if (confidenceCheck.requiresManualReview && !hasManualEntry) {
        console.log('Low OCR confidence - proceeding without eligibility check, will require manual review');
        setEligibilityResult({
          eligible: null,
          status: 'manual_review_required',
          requiresManualReview: true,
          rejectionCode: 'LOW_CONFIDENCE',
          rejectionReason: confidenceCheck.reason,
          warnings: [],
        });
        // Don't block - proceed to review step
      } else if (formData.courtJurisdiction) {
        // STEP 2: Run eligibility check with dropdown-based screening (more reliable)
        const manualSpeed = formData.manualEntryData;
        const result = screenTicketWithDropdown({
          courtJurisdiction: formData.courtJurisdiction,
          speedLimit: manualSpeed?.speedLimit,
          actualSpeed: manualSpeed?.actualSpeed,
          licenseClass: formData.licenseUpload?.extractedData?.licenseClass || manualSpeed?.licenseClass,
          violationDescription: formData.ticketUpload?.extractedData?.violations?.join(' ') || manualSpeed?.violationDescription,
        });

        console.log('Eligibility Screening Result:', result);
        setEligibilityResult(result);

        // If auto-rejected, show rejection screen
        if (result.status === 'auto_rejected') {
          setShowRejection(true);
          return;
        }
      } else if (formData.ticketUpload?.extractedData && confidenceCheck.canProceed) {
        // Fallback to OCR-based screening only if confidence is high enough
        const result = screenTicket({
          ticketData: formData.ticketUpload.extractedData,
          licenseData: formData.licenseUpload?.extractedData,
        });

        console.log('Eligibility Screening Result (OCR):', result);
        setEligibilityResult(result);

        // If auto-rejected, show rejection screen
        if (result.status === 'auto_rejected') {
          setShowRejection(true);
          return;
        }
      }
    }

    const currentIndex = FORM_STEPS.findIndex((s) => s.key === currentStep);
    if (currentIndex < FORM_STEPS.length - 1) {
      setCurrentStep(FORM_STEPS[currentIndex + 1].key);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep, validateStep, formData]);

  const handleBack = useCallback(() => {
    const currentIndex = FORM_STEPS.findIndex((s) => s.key === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(FORM_STEPS[currentIndex - 1].key);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep]);

  // Calculate base price and final price with promo
  const basePrice =
    formData.offenseCategory && isDismissible(formData.offenseCategory)
      ? getPriceForCategory(formData.offenseCategory)
      : 0;
  const finalPrice = calculateDiscountedPrice(basePrice, appliedPromo);
  const isFree = isFreeWithPromo(basePrice, appliedPromo);

  // Determine if payment is needed
  const needsPayment = basePrice > 0 && !isFree;

  // Build FormData for API submission
  const buildFormData = useCallback(() => {
    const fd = new FormData();
    fd.append('firstName', formData.firstName);
    fd.append('lastName', formData.lastName);
    fd.append('email', formData.email);
    fd.append('phone', formData.phone);
    fd.append('courtDate', formData.courtDate);
    fd.append('courtJurisdiction', formData.courtJurisdiction);
    fd.append('offenseCategory', formData.offenseCategory);
    if (formData.ticketNumber) fd.append('ticketNumber', formData.ticketNumber);
    if (formData.issuingOfficer) fd.append('issuingOfficer', formData.issuingOfficer);
    if (formData.citationLocation) fd.append('citationLocation', formData.citationLocation);
    fd.append('understoodNotClient', String(formData.understoodNotClient));
    fd.append('understoodCourtCosts', String(formData.understoodCourtCosts));
    fd.append('understoodDeadline', String(formData.understoodDeadline));
    fd.append('agreedToTerms', String(formData.agreedToTerms));

    // Files
    if (formData.ticketImage) fd.append('ticketImage', formData.ticketImage);
    if (formData.driversLicense) fd.append('driversLicense', formData.driversLicense);
    if (formData.supportingDocument) fd.append('supportingDocument', formData.supportingDocument);

    // Manual entry data takes priority over OCR
    if (formData.manualEntryData) {
      const manual = formData.manualEntryData;
      if (manual.licenseNumber) fd.append('licenseNumber', manual.licenseNumber);
      if (manual.dateOfBirth) fd.append('dateOfBirth', manual.dateOfBirth);
      if (manual.address) fd.append('address', manual.address);
      if (manual.courtLocation) fd.append('courtLocation', manual.courtLocation);
      if (manual.violationDescription) fd.append('violationDescription', manual.violationDescription);
      if (manual.speedLimit) fd.append('speedLimit', manual.speedLimit);
      if (manual.actualSpeed) fd.append('actualSpeed', manual.actualSpeed);
      // Mark as manual entry for 100% confidence
      fd.append('ocrConfidence', '100');
    } else {
      // Fall back to OCR data if no manual entry
      if (formData.ticketUpload?.extractedData) {
        const ocr = formData.ticketUpload.extractedData;
        if (ocr.citationNumber) fd.append('ticketNumber', ocr.citationNumber);
        if (ocr.courtLocation) fd.append('courtLocation', ocr.courtLocation);
        if (ocr.courtTime) fd.append('courtTime', ocr.courtTime);
        fd.append('ocrConfidence', String(ocr.confidence || 0));
      }
      if (formData.licenseUpload?.extractedData) {
        const lic = formData.licenseUpload.extractedData;
        if (lic.licenseNumber) fd.append('licenseNumber', lic.licenseNumber);
        if (lic.dateOfBirth) fd.append('dateOfBirth', lic.dateOfBirth);
        if (lic.address) fd.append('address', lic.address);
      }
    }

    // Add eligibility status for manual review cases
    if (eligibilityResult?.requiresManualReview) {
      fd.append('requiresManualReview', 'true');
      if (eligibilityResult.rejectionReason) {
        fd.append('manualReviewReason', eligibilityResult.rejectionReason);
      }
    }

    return fd;
  }, [formData, eligibilityResult]);

  // Create case and proceed to payment
  const handleProceedToPayment = useCallback(async () => {
    console.log('handleProceedToPayment called');
    console.log('Form data:', formData);
    console.log('Eligibility result:', eligibilityResult);

    if (!validateStep('review')) {
      console.log('Review step validation failed');
      return;
    }

    setIsSubmitting(true);

    try {
      const fd = buildFormData();

      // Add promo code if applied
      if (appliedPromo?.code) {
        fd.append('promoCode', appliedPromo.code);
      }

      // CASE 1: Manual review required (low OCR confidence)
      // Still requires payment if payment would normally be required
      if (eligibilityResult?.requiresManualReview) {
        console.log('Manual review required...');

        // If payment is required, proceed to payment step first
        if (needsPayment) {
          console.log('Payment required before manual review submission');
          fd.append('finalPrice', String(finalPrice * 100));
          fd.append('paymentPending', 'true');
          fd.append('status', 'pending_manual_review');

          const response = await fetch('/api/cases/submit', {
            method: 'POST',
            body: fd,
          });
          const result = await response.json();
          console.log('Manual review case creation result:', result);

          if (result.success && result.caseId) {
            setCaseId(result.caseId);
            setCurrentStep('payment');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else {
            setErrors({ submit: result.error || 'Failed to create case' });
          }
          setIsSubmitting(false);
          return;
        }

        // Free promo code or non-dismissible - submit directly for manual review
        console.log('Submitting for manual review (no payment required)...');
        fd.append('finalPrice', '0');
        fd.append('status', 'pending_manual_review');

        const response = await fetch('/api/cases/submit', {
          method: 'POST',
          body: fd,
        });
        const result = await response.json();
        console.log('Manual review submission result:', result);

        if (result.success) {
          setCaseId(result.caseId);
          setManualReviewReason(eligibilityResult.rejectionReason);
          setShowManualReview(true);
        } else {
          setErrors({ submit: result.error || 'Failed to submit case for review' });
        }
        setIsSubmitting(false);
        return;
      }

      // CASE 2: Non-dismissible cases don't need payment
      if (formData.offenseCategory && !isDismissible(formData.offenseCategory)) {
        fd.append('finalPrice', '0');

        const response = await fetch('/api/cases/submit', {
          method: 'POST',
          body: fd,
        });
        const result = await response.json();
        if (result.success) {
          setCaseId(result.caseId);
          setIsSubmitted(true);
        } else {
          setErrors({ submit: result.error || 'Failed to submit case' });
        }
        setIsSubmitting(false);
        return;
      }

      // CASE 3: Free with promo code - submit directly
      if (isFree) {
        fd.append('finalPrice', '0');

        const response = await fetch('/api/cases/submit', {
          method: 'POST',
          body: fd,
        });
        const result = await response.json();
        if (result.success) {
          setCaseId(result.caseId);
          setIsSubmitted(true);
        } else {
          setErrors({ submit: result.error || 'Failed to submit case' });
        }
        setIsSubmitting(false);
        return;
      }

      // CASE 4: Paid case - create case first, then proceed to payment
      fd.append('finalPrice', String(finalPrice * 100));
      fd.append('paymentPending', 'true');

      const response = await fetch('/api/cases/submit', {
        method: 'POST',
        body: fd,
      });
      const result = await response.json();
      console.log('Paid case submission result:', result);

      if (result.success && result.caseId) {
        setCaseId(result.caseId);
        setCurrentStep('payment');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setErrors({ submit: result.error || 'Failed to create case' });
      }
    } catch (err) {
      console.error('Submission error:', err);
      setErrors({ submit: 'Failed to create case. Please try again.' });
    }
    setIsSubmitting(false);
  }, [formData, validateStep, appliedPromo, finalPrice, isFree, buildFormData, eligibilityResult]);

  // Handle payment success
  const handlePaymentSuccess = useCallback(() => {
    router.push(`/payment/success?case=${caseId}`);
  }, [caseId, router]);

  // Handle payment error
  const handlePaymentError = useCallback((error: string) => {
    setPaymentError(error);
  }, []);

  const currentIndex = FORM_STEPS.findIndex((s) => s.key === currentStep);
  // Payment step is last if payment is needed; otherwise review is last
  const isReviewStep = currentStep === 'review';
  const isPaymentStep = currentStep === 'payment';

  // Get money-back guarantee eligibility
  const currentTier = formData.offenseCategory
    ? PRICING_TIERS.find((t) => t.category === formData.offenseCategory)
    : null;
  const hasMoneyBackGuarantee = currentTier?.moneyBackGuarantee ?? false;

  // Handler to clear rejection and go back
  const handleClearRejection = useCallback(() => {
    setShowRejection(false);
    setEligibilityResult(null);
  }, []);

  // Show eligibility rejection screen
  if (showRejection && eligibilityResult?.status === 'auto_rejected') {
    return (
      <EligibilityRejection
        reason={eligibilityResult.rejectionReason || 'This ticket is not eligible for our online service.'}
        rejectionCode={eligibilityResult.rejectionCode}
        speedOver={eligibilityResult.speedOver}
        onGoBack={handleClearRejection}
      />
    );
  }

  // Show manual review screen (when OCR confidence is too low)
  if (showManualReview) {
    return (
      <ManualReviewNotice
        caseId={caseId || undefined}
        reason={manualReviewReason || 'We could not read all the information from your documents automatically.'}
        warnings={eligibilityResult?.warnings}
      />
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-[#F8F8F8] py-16 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-brand p-12 text-center">
            <div className="w-24 h-24 bg-[#FFD100] rounded-full flex items-center justify-center mx-auto mb-8">
              <svg className="w-12 h-12 text-[#1A1A1A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-extrabold text-[#1A1A1A] mb-6">Submission Received</h1>
            <p className="text-lg text-[#4A4A4A] mb-8">
              Thank you for submitting your case. You will receive a confirmation email shortly.
            </p>
            <div className="p-6 bg-[#FFD100]/10 border border-[#FFD100]/30 rounded-xl text-left mb-10">
              <p className="text-[#1A1A1A]">
                <strong>Important:</strong> You are NOT yet a client. An attorney-client relationship
                will only be established when you receive an &quot;accepted&quot; email from our team.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center justify-center bg-[#1A1A1A] text-white px-10 py-4 rounded-xl text-lg font-semibold hover:bg-[#2A2A2A] transition-colors"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      {/* Header */}
      <header className="bg-white border-b border-[#E5E5E5] py-5 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Logo size="sm" />
          <Link href="/" className="text-[#4A4A4A] hover:text-[#1A1A1A] transition-colors text-sm font-medium">
            Cancel
          </Link>
        </div>
      </header>

      {/* Form */}
      <main className="py-12 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-brand p-10">
            <FormStepIndicator currentStep={currentStep} steps={FORM_STEPS} />

            {currentStep === 'contact' && (
              <ContactStep data={formData} onChange={updateFormData} errors={errors} />
            )}
            {currentStep === 'ticket' && (
              <TicketStep data={formData} onChange={updateFormData} errors={errors} />
            )}
            {currentStep === 'documents' && !formData.useManualEntry && (
              <DocumentsStep data={formData} onChange={updateFormData} errors={errors} />
            )}
            {currentStep === 'documents' && formData.useManualEntry && (
              <ManualEntryForm
                onSubmit={(data: ManualEntryData) => {
                  // Save manual entry data and proceed to review
                  updateFormData({
                    manualEntryData: data,
                    // Also update main form fields from manual entry
                    courtDate: data.courtDate || formData.courtDate,
                    courtJurisdiction: data.courtJurisdiction || formData.courtJurisdiction,
                    ticketNumber: data.citationNumber || formData.ticketNumber,
                  });
                  setCurrentStep('review');
                }}
                onCancel={() => updateFormData({ useManualEntry: false })}
                ocrData={{
                  // Pre-fill with any OCR data we did capture (convert null to undefined)
                  courtDate: formData.courtDate,
                  courtJurisdiction: formData.courtJurisdiction,
                  courtLocation: formData.ticketUpload?.extractedData?.courtLocation ?? undefined,
                  citationNumber: formData.ticketNumber || (formData.ticketUpload?.extractedData?.citationNumber ?? undefined),
                  violationDescription: formData.ticketUpload?.extractedData?.violations?.join(', '),
                  violationLocation: formData.citationLocation || (formData.ticketUpload?.extractedData?.violationLocation ?? undefined),
                  fullName: (formData.licenseUpload?.extractedData?.fullName ?? undefined) || `${formData.firstName} ${formData.lastName}`.trim() || undefined,
                  licenseNumber: formData.licenseUpload?.extractedData?.licenseNumber ?? undefined,
                  licenseClass: formData.licenseUpload?.extractedData?.licenseClass ?? undefined,
                  expirationDate: formData.licenseUpload?.extractedData?.expirationDate ?? undefined,
                  dateOfBirth: formData.licenseUpload?.extractedData?.dateOfBirth ?? undefined,
                  address: formData.licenseUpload?.extractedData?.address ?? undefined,
                }}
              />
            )}
            {currentStep === 'review' && (
              <>
                <ReviewStep data={formData} onChange={updateFormData} errors={errors} />

                {/* Insurance Savings Calculator */}
                {formData.offenseCategory && basePrice > 0 && (
                  <div className="mt-8">
                    <InsuranceSavingsCalculator
                      ticketType={formData.offenseCategory as 'minor' | 'standard' | 'major'}
                      serviceFee={finalPrice}
                    />
                  </div>
                )}

                {/* Promo Code Section */}
                {basePrice > 0 && (
                  <div className="mt-8 pt-8 border-t border-[#E5E5E5] space-y-4">
                    <h3 className="font-semibold text-[#1A1A1A]">Have a promo code?</h3>
                    <PromoCodeInput
                      orderAmountCents={basePrice}
                      onPromoApplied={setAppliedPromo}
                      appliedPromo={appliedPromo}
                    />

                    {/* Price Summary with discount */}
                    {appliedPromo && basePrice !== finalPrice && (
                      <div className="bg-[#F8F8F8] rounded-xl p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-[#4A4A4A]">Original Price</span>
                          <span className="text-[#4A4A4A] line-through">{formatCurrency(basePrice)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-emerald-600">
                          <span>Discount ({appliedPromo.code})</span>
                          <span>-{formatCurrency(basePrice - finalPrice)}</span>
                        </div>
                        <div className="flex justify-between font-bold pt-2 border-t border-[#E5E5E5]">
                          <span className="text-[#1A1A1A]">Total Due</span>
                          <span className="text-[#1A1A1A] text-xl">
                            {isFree ? 'FREE' : formatCurrency(finalPrice)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Manual review notice if applicable */}
                {eligibilityResult?.requiresManualReview && (
                  <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <p className="font-medium text-amber-800">Manual Review Required</p>
                        <p className="text-sm text-amber-700 mt-1">
                          Your ticket will be reviewed by our team to confirm eligibility.
                          You&apos;ll receive an email within 24 hours.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Money-back guarantee notice */}
                {hasMoneyBackGuarantee && needsPayment && (
                  <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-emerald-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <div>
                        <p className="font-medium text-emerald-800">100% Money-Back Guarantee</p>
                        <p className="text-sm text-emerald-700 mt-1">
                          If we can&apos;t get your ticket dismissed, you get a full refund.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit error */}
                {errors.submit && (
                  <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-red-800">{errors.submit}</p>
                  </div>
                )}
              </>
            )}

            {/* Payment Step */}
            {currentStep === 'payment' && caseId && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">Complete Your Payment</h2>
                  <p className="text-[#4A4A4A]">
                    Case created successfully. Complete payment to submit your case.
                  </p>
                </div>

                {/* Payment Error */}
                {paymentError && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl mb-6">
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="font-medium text-red-800">Payment Failed</p>
                        <p className="text-sm text-red-700 mt-1">{paymentError}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Order Summary */}
                <div className="bg-[#F8F8F8] rounded-xl p-6 mb-6">
                  <h3 className="font-semibold text-[#1A1A1A] mb-4">Order Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-[#4A4A4A]">{currentTier?.label || 'Service Fee'}</span>
                      <span className="text-[#1A1A1A]">{formatCurrency(basePrice)}</span>
                    </div>
                    {appliedPromo && basePrice !== finalPrice && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Discount ({appliedPromo.code})</span>
                        <span>-{formatCurrency(basePrice - finalPrice)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg pt-3 border-t border-[#E5E5E5]">
                      <span className="text-[#1A1A1A]">Total</span>
                      <span className="text-[#1A1A1A]">{formatCurrency(finalPrice)}</span>
                    </div>
                  </div>

                  {hasMoneyBackGuarantee && (
                    <div className="mt-4 pt-4 border-t border-[#E5E5E5]">
                      <div className="flex items-center gap-2 text-emerald-600 text-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        100% Money-Back Guarantee
                      </div>
                    </div>
                  )}
                </div>

                <StripePaymentForm
                  caseId={caseId}
                  amount={finalPrice}
                  customerEmail={formData.email}
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                />
              </div>
            )}

            {/* Navigation - hidden on payment step since PaymentForm has its own buttons */}
            {!isPaymentStep && (
              <div className="flex justify-between mt-10 pt-8 border-t border-[#E5E5E5]">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={currentIndex === 0}
                  className={`px-8 py-4 rounded-xl font-semibold transition-colors ${
                    currentIndex === 0
                      ? 'text-[#E5E5E5] cursor-not-allowed'
                      : 'text-[#4A4A4A] hover:text-[#1A1A1A] hover:bg-[#F8F8F8]'
                  }`}
                >
                  Back
                </button>

                {isReviewStep ? (
                  <button
                    type="button"
                    onClick={handleProceedToPayment}
                    disabled={isSubmitting}
                    className="bg-[#FFD100] text-[#1A1A1A] px-10 py-4 rounded-xl font-bold hover:brightness-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Processing...
                      </>
                    ) : isFree ? (
                      'Submit for Free'
                    ) : needsPayment ? (
                      'Continue to Payment'
                    ) : (
                      'Submit for Review'
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="bg-[#FFD100] text-[#1A1A1A] px-10 py-4 rounded-xl font-bold hover:brightness-105 transition-all"
                  >
                    Continue
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Security note */}
          <p className="text-center text-sm text-[#4A4A4A]/60 mt-8 flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Your information is encrypted and secure
          </p>
        </div>
      </main>
    </div>
  );
}
