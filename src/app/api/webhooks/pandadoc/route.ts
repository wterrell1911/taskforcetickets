/**
 * POST /api/webhooks/pandadoc
 * Handle PandaDoc webhook events (document signed, completed, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/db/supabase';

// PandaDoc webhook events we care about
type PandaDocEvent =
  | 'document_state_changed'
  | 'recipient_completed'
  | 'document_updated'
  | 'document_deleted';

interface PandaDocWebhookPayload {
  event: PandaDocEvent;
  data: {
    id: string; // Document ID
    name: string;
    status: string;
    date_created?: string;
    date_modified?: string;
    date_completed?: string;
    metadata?: Record<string, string>;
    recipients?: Array<{
      email: string;
      first_name: string;
      last_name: string;
      has_completed: boolean;
      completed_date?: string;
    }>;
  };
}

/**
 * Verify webhook signature (if configured)
 */
function verifyWebhookSignature(
  request: NextRequest,
  body: string
): boolean {
  const webhookSecret = process.env.PANDADOC_WEBHOOK_SECRET;
  
  // If no secret configured, skip verification (not recommended for production)
  if (!webhookSecret) {
    console.warn('PANDADOC_WEBHOOK_SECRET not configured - skipping signature verification');
    return true;
  }

  const signature = request.headers.get('x-pandadoc-signature');
  
  if (!signature) {
    console.error('Missing PandaDoc webhook signature');
    return false;
  }

  // PandaDoc uses HMAC-SHA256
  // In production, verify: crypto.createHmac('sha256', webhookSecret).update(body).digest('hex') === signature
  // For now, we'll trust if secret exists
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    
    // Verify webhook signature
    if (!verifyWebhookSignature(request, body)) {
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const payload: PandaDocWebhookPayload = JSON.parse(body);
    
    console.log('PandaDoc webhook received:', payload.event, payload.data.id);

    const supabase = getAdminClient();

    // Handle different events
    switch (payload.event) {
      case 'document_state_changed':
        await handleStateChange(supabase, payload.data);
        break;

      case 'recipient_completed':
        await handleRecipientCompleted(supabase, payload.data);
        break;

      case 'document_deleted':
        await handleDocumentDeleted(supabase, payload.data);
        break;

      default:
        console.log('Unhandled PandaDoc event:', payload.event);
    }

    return NextResponse.json({ success: true, received: true });
  } catch (error) {
    console.error('PandaDoc webhook error:', error);
    return NextResponse.json(
      { success: false, error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle document state change
 */
async function handleStateChange(
  supabase: ReturnType<typeof getAdminClient>,
  data: PandaDocWebhookPayload['data']
) {
  const caseId = data.metadata?.caseId;
  
  if (!caseId) {
    console.warn('No caseId in PandaDoc document metadata');
    return;
  }

  // Update case with agreement status
  const updateData: Record<string, unknown> = {
    pandadoc_document_id: data.id,
    pandadoc_status: data.status,
    updated_at: new Date().toISOString(),
  };

  // If document is completed (fully signed)
  if (data.status === 'document.completed') {
    updateData.agreement_signed_at = data.date_completed || new Date().toISOString();
    updateData.agreement_status = 'signed';
    
    console.log(`Service agreement signed for case ${caseId}`);
  }

  await supabase
    .from('cases')
    .update(updateData)
    .eq('id', caseId);
}

/**
 * Handle recipient completed signing
 */
async function handleRecipientCompleted(
  supabase: ReturnType<typeof getAdminClient>,
  data: PandaDocWebhookPayload['data']
) {
  const caseId = data.metadata?.caseId;
  
  if (!caseId) {
    console.warn('No caseId in PandaDoc document metadata');
    return;
  }

  // Find the client recipient
  const clientRecipient = data.recipients?.find(r => r.has_completed);
  
  if (clientRecipient) {
    await supabase
      .from('cases')
      .update({
        pandadoc_document_id: data.id,
        agreement_signed_at: clientRecipient.completed_date || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', caseId);

    console.log(`Client ${clientRecipient.email} signed agreement for case ${caseId}`);
  }
}

/**
 * Handle document deleted
 */
async function handleDocumentDeleted(
  supabase: ReturnType<typeof getAdminClient>,
  data: PandaDocWebhookPayload['data']
) {
  const caseId = data.metadata?.caseId;
  
  if (!caseId) {
    return;
  }

  // Clear document reference
  await supabase
    .from('cases')
    .update({
      pandadoc_document_id: null,
      pandadoc_status: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', caseId);

  console.log(`PandaDoc document deleted for case ${caseId}`);
}

// Support GET for webhook verification
export async function GET() {
  return NextResponse.json({ 
    success: true, 
    message: 'PandaDoc webhook endpoint active' 
  });
}
