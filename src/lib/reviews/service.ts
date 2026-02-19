/**
 * Review Request Service
 * Handles sending review requests and tracking follow-ups
 */

import { getAdminClient } from '@/lib/db/supabase';
import { sendSMS, getReviewRequestMessage } from './twilio';

export interface ReviewRequest {
  id: string;
  case_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  status: 'pending' | 'sent' | 'followup1_sent' | 'followup2_sent' | 'completed' | 'failed';
  initial_sent_at?: string;
  followup1_sent_at?: string;
  followup2_sent_at?: string;
  review_received_at?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Create initial review request record
 */
export async function createReviewRequest(
  caseId: string,
  customerName: string,
  customerPhone: string,
  customerEmail?: string
): Promise<{ success: boolean; requestId?: string; error?: string }> {
  const supabase = getAdminClient();
  
  // Check if request already exists for this case
  const { data: existing } = await supabase
    .from('review_requests')
    .select('id')
    .eq('case_id', caseId)
    .single();
    
  if (existing) {
    return { success: false, error: 'Review request already exists for this case' };
  }
  
  const { data, error } = await supabase
    .from('review_requests')
    .insert({
      case_id: caseId,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail,
      status: 'pending',
    })
    .select('id')
    .single();
    
  if (error) {
    console.error('Failed to create review request:', error);
    return { success: false, error: error.message };
  }
  
  return { success: true, requestId: data.id };
}

/**
 * Send initial review request SMS
 */
export async function sendInitialReviewRequest(requestId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = getAdminClient();
  
  // Get the request
  const { data: request, error: fetchError } = await supabase
    .from('review_requests')
    .select('*')
    .eq('id', requestId)
    .single();
    
  if (fetchError || !request) {
    return { success: false, error: 'Review request not found' };
  }
  
  // Generate and send message
  const message = getReviewRequestMessage(request.customer_name, 'initial');
  const result = await sendSMS(request.customer_phone, message);
  
  if (!result.success) {
    // Update status to failed
    await supabase
      .from('review_requests')
      .update({ 
        status: 'failed', 
        error_message: result.error,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);
      
    return { success: false, error: result.error };
  }
  
  // Update status to sent
  await supabase
    .from('review_requests')
    .update({ 
      status: 'sent',
      initial_sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', requestId);
    
  return { success: true };
}

/**
 * Send follow-up review request (Day 3)
 */
export async function sendFollowup1(requestId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = getAdminClient();
  
  const { data: request, error: fetchError } = await supabase
    .from('review_requests')
    .select('*')
    .eq('id', requestId)
    .single();
    
  if (fetchError || !request) {
    return { success: false, error: 'Review request not found' };
  }
  
  if (request.status !== 'sent') {
    return { success: false, error: 'Invalid status for followup1' };
  }
  
  const message = getReviewRequestMessage(request.customer_name, 'followup1');
  const result = await sendSMS(request.customer_phone, message);
  
  if (!result.success) {
    return { success: false, error: result.error };
  }
  
  await supabase
    .from('review_requests')
    .update({ 
      status: 'followup1_sent',
      followup1_sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', requestId);
    
  return { success: true };
}

/**
 * Send final follow-up review request (Day 7)
 */
export async function sendFollowup2(requestId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = getAdminClient();
  
  const { data: request, error: fetchError } = await supabase
    .from('review_requests')
    .select('*')
    .eq('id', requestId)
    .single();
    
  if (fetchError || !request) {
    return { success: false, error: 'Review request not found' };
  }
  
  if (request.status !== 'followup1_sent') {
    return { success: false, error: 'Invalid status for followup2' };
  }
  
  const message = getReviewRequestMessage(request.customer_name, 'followup2');
  const result = await sendSMS(request.customer_phone, message);
  
  if (!result.success) {
    return { success: false, error: result.error };
  }
  
  await supabase
    .from('review_requests')
    .update({ 
      status: 'followup2_sent',
      followup2_sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', requestId);
    
  return { success: true };
}

/**
 * Mark review as received (call this when you detect a new Google review)
 */
export async function markReviewReceived(requestId: string): Promise<void> {
  const supabase = getAdminClient();
  
  await supabase
    .from('review_requests')
    .update({ 
      status: 'completed',
      review_received_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', requestId);
}

/**
 * Get all pending follow-ups that are due
 */
export async function getPendingFollowups(): Promise<{
  followup1Due: ReviewRequest[];
  followup2Due: ReviewRequest[];
}> {
  const supabase = getAdminClient();
  const now = new Date();
  
  // Followup 1 is due 3 days after initial send
  const followup1Threshold = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
  
  // Followup 2 is due 4 days after followup 1 (7 days total)
  const followup2Threshold = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString();
  
  const { data: followup1Due } = await supabase
    .from('review_requests')
    .select('*')
    .eq('status', 'sent')
    .lt('initial_sent_at', followup1Threshold);
    
  const { data: followup2Due } = await supabase
    .from('review_requests')
    .select('*')
    .eq('status', 'followup1_sent')
    .lt('followup1_sent_at', followup2Threshold);
    
  return {
    followup1Due: followup1Due || [],
    followup2Due: followup2Due || [],
  };
}

/**
 * Get review request stats
 */
export async function getReviewStats(): Promise<{
  total: number;
  pending: number;
  sent: number;
  completed: number;
  failed: number;
}> {
  const supabase = getAdminClient();
  
  const { data, error } = await supabase
    .from('review_requests')
    .select('status');
    
  if (error || !data) {
    return { total: 0, pending: 0, sent: 0, completed: 0, failed: 0 };
  }
  
  const stats = {
    total: data.length,
    pending: data.filter(r => r.status === 'pending').length,
    sent: data.filter(r => ['sent', 'followup1_sent', 'followup2_sent'].includes(r.status)).length,
    completed: data.filter(r => r.status === 'completed').length,
    failed: data.filter(r => r.status === 'failed').length,
  };
  
  return stats;
}
