/**
 * Service Agreement Generation
 * Creates and sends service agreements after payment
 */

import {
  createDocument,
  sendDocument,
  getDocumentStatus,
  getSigningLink,
  type CreateDocumentOptions,
} from './client';

// Template ID placeholder - configure this in environment or admin
const SERVICE_AGREEMENT_TEMPLATE_ID = process.env.PANDADOC_TEMPLATE_ID || 'YOUR_TEMPLATE_ID';

export interface CaseInfo {
  caseId: string;
  customerName: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress?: string;
  courtDate: string;
  courtJurisdiction: string;
  courtLocation?: string;
  offenseDescription: string;
  amountCharged: number; // in cents
  ticketNumber?: string;
}

export interface ServiceAgreementResult {
  success: boolean;
  documentId?: string;
  signingLink?: string;
  error?: string;
}

/**
 * Generate and send service agreement after payment
 */
export async function createServiceAgreement(
  caseInfo: CaseInfo
): Promise<ServiceAgreementResult> {
  // Format court date for display
  const courtDateFormatted = new Date(caseInfo.courtDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Format fee for display
  const feeFormatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(caseInfo.amountCharged / 100);

  const options: CreateDocumentOptions = {
    templateId: SERVICE_AGREEMENT_TEMPLATE_ID,
    name: `Service Agreement - ${caseInfo.customerName} - ${caseInfo.caseId.slice(0, 8).toUpperCase()}`,
    recipients: [
      {
        email: caseInfo.customerEmail,
        firstName: caseInfo.customerFirstName,
        lastName: caseInfo.customerLastName,
        role: 'Client', // Must match role name in PandaDoc template
        signingOrder: 1,
      },
    ],
    tokens: [
      { name: 'client_name', value: caseInfo.customerName },
      { name: 'client_first_name', value: caseInfo.customerFirstName },
      { name: 'client_last_name', value: caseInfo.customerLastName },
      { name: 'client_email', value: caseInfo.customerEmail },
      { name: 'client_phone', value: caseInfo.customerPhone },
      { name: 'client_address', value: caseInfo.customerAddress || 'N/A' },
      { name: 'case_id', value: caseInfo.caseId.slice(0, 8).toUpperCase() },
      { name: 'court_date', value: courtDateFormatted },
      { name: 'court_jurisdiction', value: caseInfo.courtJurisdiction },
      { name: 'court_location', value: caseInfo.courtLocation || caseInfo.courtJurisdiction },
      { name: 'offense_description', value: caseInfo.offenseDescription },
      { name: 'ticket_number', value: caseInfo.ticketNumber || 'TBD' },
      { name: 'service_fee', value: feeFormatted },
      { name: 'agreement_date', value: new Date().toLocaleDateString('en-US') },
    ],
    metadata: {
      caseId: caseInfo.caseId,
      type: 'service_agreement',
    },
    tags: ['service-agreement', 'traffic-ticket'],
  };

  // Step 1: Create the document
  const createResult = await createDocument(options);
  
  if (!createResult.success || !createResult.documentId) {
    return {
      success: false,
      error: createResult.error || 'Failed to create document',
    };
  }

  const documentId = createResult.documentId;

  // Step 2: Wait a moment for document to be ready (PandaDoc needs time)
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Step 3: Send for signature
  const sendResult = await sendDocument(documentId, {
    subject: `TaskForce Tickets Service Agreement - Case ${caseInfo.caseId.slice(0, 8).toUpperCase()}`,
    message: `Dear ${caseInfo.customerFirstName},\n\nThank you for choosing TaskForce Tickets. Please review and sign the attached service agreement to begin your case.\n\nYour court date is ${courtDateFormatted}. We will represent you and work to get your ticket dismissed.\n\nBest regards,\nTaskForce Tickets Team`,
  });

  if (!sendResult.success) {
    return {
      success: false,
      documentId,
      error: sendResult.error || 'Document created but failed to send',
    };
  }

  // Step 4: Get signing link (optional - for embedding or direct link)
  const linkResult = await getSigningLink(documentId, caseInfo.customerEmail);

  return {
    success: true,
    documentId,
    signingLink: linkResult.link,
  };
}

/**
 * Check service agreement status
 */
export async function checkAgreementStatus(documentId: string): Promise<{
  signed: boolean;
  status: string;
  signedAt?: string;
  error?: string;
}> {
  const result = await getDocumentStatus(documentId);

  if (!result.success || !result.document) {
    return {
      signed: false,
      status: 'unknown',
      error: result.error,
    };
  }

  const doc = result.document;
  const clientRecipient = doc.recipients[0];

  return {
    signed: doc.status === 'document.completed',
    status: doc.statusDisplay,
    signedAt: clientRecipient?.completedAt,
  };
}

/**
 * Resend service agreement
 */
export async function resendAgreement(documentId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  return sendDocument(documentId);
}
