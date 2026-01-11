import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient, STORAGE_BUCKETS, generateFilePath } from '@/lib/db/supabase';
import { encryptSensitiveField, maskLicenseNumber } from '@/lib/encryption';
import { sendSubmissionReceivedEmail, logEmailSent } from '@/lib/emails/send-email';
import { CURRENT_TERMS_VERSION } from '@/types';
import { getPriceForCategory } from '@/lib/pricing';

/**
 * Calculate if court date is at least 3 business days away
 */
function isValidDeadline(courtDateStr: string): boolean {
  const courtDate = new Date(courtDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let businessDays = 0;
  const checkDate = new Date(today);

  while (checkDate < courtDate) {
    checkDate.setDate(checkDate.getDate() + 1);
    const dayOfWeek = checkDate.getDay();
    // Skip weekends (0 = Sunday, 6 = Saturday)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      businessDays++;
    }
  }

  return businessDays >= 3;
}

/**
 * Format court date for display
 */
function formatCourtDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Get offense tier label
 */
function getOffenseTierLabel(tier: string): string {
  switch (tier) {
    case 'minor':
      return 'Minor Offense';
    case 'standard':
      return 'Standard Offense';
    case 'major':
      return 'Major Offense';
    default:
      return tier;
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // Extract form fields
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const courtDate = formData.get('courtDate') as string;
    const courtJurisdiction = formData.get('courtJurisdiction') as string | null;
    const offenseCategory = formData.get('offenseCategory') as string;
    const ticketNumber = formData.get('ticketNumber') as string | null;
    const issuingOfficer = formData.get('issuingOfficer') as string | null;
    const citationLocation = formData.get('citationLocation') as string | null;

    // Manual review flag
    const requiresManualReview = formData.get('requiresManualReview') === 'true';
    const manualReviewReason = formData.get('manualReviewReason') as string | null;
    const requestedStatus = formData.get('status') as string | null;

    // Debug logging
    console.log('Submit API received:', {
      firstName,
      lastName,
      email,
      phone,
      courtDate,
      courtJurisdiction,
      offenseCategory,
      requiresManualReview,
      requestedStatus,
    });

    // Agreement fields
    const understoodNotClient = formData.get('understoodNotClient') === 'true';
    const understoodCourtCosts = formData.get('understoodCourtCosts') === 'true';
    const understoodDeadline = formData.get('understoodDeadline') === 'true';
    const agreedToTerms = formData.get('agreedToTerms') === 'true';

    // OCR extracted data (optional)
    const licenseNumber = formData.get('licenseNumber') as string | null;
    const dateOfBirth = formData.get('dateOfBirth') as string | null;
    const address = formData.get('address') as string | null;
    const courtLocation = formData.get('courtLocation') as string | null;
    const courtTime = formData.get('courtTime') as string | null;
    const ocrRawText = formData.get('ocrRawText') as string | null;
    const ocrConfidence = formData.get('ocrConfidence') as string | null;
    const ocrWarnings = formData.get('ocrWarnings') as string | null;

    // Document files
    const ticketFile = formData.get('ticketImage') as File | null;
    const licenseFile = formData.get('driversLicense') as File | null;
    const supportingFile = formData.get('supportingDocument') as File | null;

    // Validation
    if (!firstName || !lastName || !email || !phone || !courtDate || !offenseCategory) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!understoodNotClient || !understoodCourtCosts || !understoodDeadline || !agreedToTerms) {
      return NextResponse.json(
        { error: 'All acknowledgments must be accepted' },
        { status: 400 }
      );
    }

    // Validate court date deadline
    if (!isValidDeadline(courtDate)) {
      return NextResponse.json(
        { error: 'Court date must be at least 3 business days from today' },
        { status: 400 }
      );
    }

    // Validate required documents (license required unless using manual entry with license number)
    const hasManualLicenseData = !!licenseNumber;
    if (!licenseFile && !hasManualLicenseData) {
      return NextResponse.json(
        { error: "Driver's license is required (upload or enter number manually)" },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();
    const now = new Date().toISOString();
    const customerName = `${firstName} ${lastName}`;
    const price = getPriceForCategory(offenseCategory as 'minor' | 'standard' | 'major');

    // Determine case status - use manual review status if flagged
    const caseStatus = requiresManualReview ? 'pending_review' : (requestedStatus || 'pending_review');

    // Generate case ID first (we need it for file paths)
    const { data: caseData, error: insertError } = await supabase
      .from('cases')
      .insert({
        status: caseStatus,
        customer_name: customerName,
        customer_email: email,
        customer_phone: phone,
        customer_address_encrypted: address ? encryptSensitiveField(address) : null,
        license_number_encrypted: licenseNumber ? encryptSensitiveField(licenseNumber) : null,
        license_number_masked: licenseNumber ? maskLicenseNumber(licenseNumber) : null,
        date_of_birth_encrypted: dateOfBirth ? encryptSensitiveField(dateOfBirth) : null,
        citation_number: ticketNumber,
        court_date: courtDate,
        court_time: courtTime,
        court_location: courtLocation,
        court_jurisdiction: courtJurisdiction,
        violation_location: citationLocation,
        officer_name: issuingOfficer,
        offense_tier: offenseCategory,
        amount_charged: price, // in cents
        ocr_raw_text: ocrRawText,
        ocr_confidence: ocrConfidence ? parseFloat(ocrConfidence) : null,
        ocr_extraction_warnings: ocrWarnings ? JSON.parse(ocrWarnings) : [],
        internal_notes: manualReviewReason ? `Manual Review Required: ${manualReviewReason}` : null,
        terms_accepted_at: now,
        terms_version: CURRENT_TERMS_VERSION,
        privacy_accepted_at: now,
        deadline_acknowledged: understoodDeadline,
        payment_status: requiresManualReview ? 'pending' : 'pending',
      })
      .select('id')
      .single();

    if (insertError || !caseData) {
      console.error('Failed to create case:', insertError);
      return NextResponse.json(
        { error: 'Failed to create case' },
        { status: 500 }
      );
    }

    const caseId = caseData.id;

    // Upload documents to storage
    const uploadPromises: Promise<void>[] = [];
    const documentPaths: { ticket?: string; license?: string; supporting?: string } = {};

    // Upload ticket document
    if (ticketFile) {
      const ticketPath = generateFilePath(caseId, 'ticket', ticketFile.name);
      uploadPromises.push(
        supabase.storage
          .from(STORAGE_BUCKETS.INTAKE_DOCUMENTS)
          .upload(ticketPath, ticketFile)
          .then(({ error }) => {
            if (!error) documentPaths.ticket = ticketPath;
            else console.error('Ticket upload error:', error);
          })
      );
    }

    // Upload license document
    if (licenseFile) {
      const licensePath = generateFilePath(caseId, 'license', licenseFile.name);
      uploadPromises.push(
        supabase.storage
          .from(STORAGE_BUCKETS.INTAKE_DOCUMENTS)
          .upload(licensePath, licenseFile)
          .then(({ error }) => {
            if (!error) documentPaths.license = licensePath;
            else console.error('License upload error:', error);
          })
      );
    }

    // Upload supporting document
    if (supportingFile) {
      const supportingPath = generateFilePath(caseId, 'supporting', supportingFile.name);
      uploadPromises.push(
        supabase.storage
          .from(STORAGE_BUCKETS.INTAKE_DOCUMENTS)
          .upload(supportingPath, supportingFile)
          .then(({ error }) => {
            if (!error) documentPaths.supporting = supportingPath;
            else console.error('Supporting upload error:', error);
          })
      );
    }

    // Wait for all uploads
    await Promise.all(uploadPromises);

    // Update case with document paths
    await supabase
      .from('cases')
      .update({
        ticket_document_path: documentPaths.ticket,
        license_document_path: documentPaths.license,
        supporting_document_path: documentPaths.supporting,
      })
      .eq('id', caseId);

    // Send confirmation email
    const emailResult = await sendSubmissionReceivedEmail({
      to: email,
      customerName,
      caseId: caseId.slice(0, 8).toUpperCase(), // Short ID for display
      courtDate: formatCourtDate(courtDate),
      offenseType: getOffenseTierLabel(offenseCategory),
      amountCharged: price,
    });

    // Log email
    await logEmailSent({
      caseId,
      emailType: 'submission_received',
      recipientEmail: email,
      subject: "We've Received Your Traffic Ticket Submission - Action Required",
      resendMessageId: emailResult.messageId,
      status: emailResult.success ? 'sent' : 'failed',
      errorMessage: emailResult.error,
    });

    return NextResponse.json({
      success: true,
      caseId,
      message: 'Case submitted successfully',
    });
  } catch (error) {
    console.error('Case submission error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
