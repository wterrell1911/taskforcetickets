/**
 * PandaDoc Integration
 * Document generation and eSignature for service agreements
 */

export {
  createDocument,
  sendDocument,
  getDocumentStatus,
  getSigningLink,
  downloadDocument,
  listTemplates,
  type CreateDocumentOptions,
  type PandaDocRecipient,
  type PandaDocField,
  type PandaDocDocument,
  type SendDocumentOptions,
  type DocumentStatusResult,
} from './client';

export {
  createServiceAgreement,
  checkAgreementStatus,
  resendAgreement,
  type CaseInfo,
  type ServiceAgreementResult,
} from './service-agreement';
