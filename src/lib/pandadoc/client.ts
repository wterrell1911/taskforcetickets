/**
 * PandaDoc API Client
 * Handles document generation and eSignature workflows
 * 
 * API: https://developers.pandadoc.com
 */

const PANDADOC_API_BASE = 'https://api.pandadoc.com/public/v1';

export interface PandaDocRecipient {
  email: string;
  firstName: string;
  lastName: string;
  role: string; // Must match role in template
  signingOrder?: number;
}

export interface PandaDocField {
  name: string;
  value: string;
}

export interface CreateDocumentOptions {
  templateId: string;
  name: string;
  recipients: PandaDocRecipient[];
  tokens?: PandaDocField[]; // Template variables/tokens
  fields?: Record<string, PandaDocField>; // Pre-filled form fields
  metadata?: Record<string, string>;
  tags?: string[];
}

export interface PandaDocDocument {
  id: string;
  name: string;
  status: 'document.draft' | 'document.sent' | 'document.completed' | 'document.viewed' | 'document.waiting_approval' | 'document.rejected' | 'document.waiting_pay';
  dateCreated: string;
  dateModified: string;
  expirationDate?: string;
  uuid?: string;
  links?: {
    signing?: string;
    viewing?: string;
  }[];
}

export interface SendDocumentOptions {
  message?: string;
  subject?: string;
  silent?: boolean; // Don't send email, just return signing link
}

export interface DocumentStatusResult {
  id: string;
  name: string;
  status: string;
  statusDisplay: string;
  dateCreated: string;
  dateCompleted?: string;
  recipients: {
    email: string;
    firstName: string;
    lastName: string;
    hasCompleted: boolean;
    completedAt?: string;
  }[];
}

/**
 * Get PandaDoc API key
 */
function getApiKey(): string | null {
  return process.env.PANDADOC_API_KEY || null;
}

/**
 * Make authenticated request to PandaDoc API
 */
async function pandadocRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    return { success: false, error: 'PandaDoc API key not configured' };
  }

  try {
    const response = await fetch(`${PANDADOC_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `API-Key ${apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('PandaDoc API error:', response.status, errorBody);
      return {
        success: false,
        error: `PandaDoc API error: ${response.status}`,
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('PandaDoc request error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'PandaDoc request failed',
    };
  }
}

/**
 * Create a document from a template
 */
export async function createDocument(
  options: CreateDocumentOptions
): Promise<{ success: boolean; documentId?: string; error?: string }> {
  const payload: Record<string, unknown> = {
    template_uuid: options.templateId,
    name: options.name,
    recipients: options.recipients.map(r => ({
      email: r.email,
      first_name: r.firstName,
      last_name: r.lastName,
      role: r.role,
      signing_order: r.signingOrder,
    })),
  };

  // Add template tokens (variables)
  if (options.tokens && options.tokens.length > 0) {
    payload.tokens = options.tokens.map(t => ({
      name: t.name,
      value: t.value,
    }));
  }

  // Add pre-filled fields
  if (options.fields && Object.keys(options.fields).length > 0) {
    payload.fields = options.fields;
  }

  // Add metadata
  if (options.metadata && Object.keys(options.metadata).length > 0) {
    payload.metadata = options.metadata;
  }

  // Add tags
  if (options.tags && options.tags.length > 0) {
    payload.tags = options.tags;
  }

  const result = await pandadocRequest<{ id: string }>('/documents', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (result.success && result.data) {
    return { success: true, documentId: result.data.id };
  }

  return { success: false, error: result.error };
}

/**
 * Send a document for signature
 */
export async function sendDocument(
  documentId: string,
  options?: SendDocumentOptions
): Promise<{ success: boolean; error?: string }> {
  const payload: Record<string, unknown> = {};
  
  if (options?.message) {
    payload.message = options.message;
  }
  if (options?.subject) {
    payload.subject = options.subject;
  }
  if (options?.silent !== undefined) {
    payload.silent = options.silent;
  }

  const result = await pandadocRequest(`/documents/${documentId}/send`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return { success: result.success, error: result.error };
}

/**
 * Get document status and details
 */
export async function getDocumentStatus(
  documentId: string
): Promise<{ success: boolean; document?: DocumentStatusResult; error?: string }> {
  const result = await pandadocRequest<{
    id: string;
    name: string;
    status: string;
    date_created: string;
    date_completed?: string;
    recipients: Array<{
      email: string;
      first_name: string;
      last_name: string;
      has_completed: boolean;
      completed_date?: string;
    }>;
  }>(`/documents/${documentId}/details`);

  if (result.success && result.data) {
    const statusMap: Record<string, string> = {
      'document.draft': 'Draft',
      'document.sent': 'Sent for Signature',
      'document.viewed': 'Viewed',
      'document.completed': 'Completed',
      'document.rejected': 'Rejected',
      'document.waiting_approval': 'Pending Approval',
    };

    return {
      success: true,
      document: {
        id: result.data.id,
        name: result.data.name,
        status: result.data.status,
        statusDisplay: statusMap[result.data.status] || result.data.status,
        dateCreated: result.data.date_created,
        dateCompleted: result.data.date_completed,
        recipients: result.data.recipients.map(r => ({
          email: r.email,
          firstName: r.first_name,
          lastName: r.last_name,
          hasCompleted: r.has_completed,
          completedAt: r.completed_date,
        })),
      },
    };
  }

  return { success: false, error: result.error };
}

/**
 * Get signing link for a recipient
 */
export async function getSigningLink(
  documentId: string,
  recipientEmail: string
): Promise<{ success: boolean; link?: string; error?: string }> {
  const result = await pandadocRequest<{ link: string }>(
    `/documents/${documentId}/session`,
    {
      method: 'POST',
      body: JSON.stringify({
        recipient: recipientEmail,
        lifetime: 3600, // 1 hour
      }),
    }
  );

  if (result.success && result.data) {
    return { success: true, link: result.data.link };
  }

  return { success: false, error: result.error };
}

/**
 * Download completed document
 */
export async function downloadDocument(
  documentId: string
): Promise<{ success: boolean; buffer?: Buffer; error?: string }> {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    return { success: false, error: 'PandaDoc API key not configured' };
  }

  try {
    const response = await fetch(
      `${PANDADOC_API_BASE}/documents/${documentId}/download`,
      {
        headers: {
          'Authorization': `API-Key ${apiKey}`,
        },
      }
    );

    if (!response.ok) {
      return { success: false, error: `Download failed: ${response.status}` };
    }

    const arrayBuffer = await response.arrayBuffer();
    return { success: true, buffer: Buffer.from(arrayBuffer) };
  } catch (error) {
    console.error('Document download error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Download failed',
    };
  }
}

/**
 * List templates available in the account
 */
export async function listTemplates(): Promise<{
  success: boolean;
  templates?: Array<{ id: string; name: string }>;
  error?: string;
}> {
  const result = await pandadocRequest<{
    results: Array<{ id: string; name: string }>;
  }>('/templates');

  if (result.success && result.data) {
    return {
      success: true,
      templates: result.data.results,
    };
  }

  return { success: false, error: result.error };
}
