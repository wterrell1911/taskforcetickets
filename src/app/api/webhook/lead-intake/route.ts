import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface NormalizedLead {
  id: string;
  timestamp: string;
  source_type: 'form' | 'call' | 'chat';
  marketing_source: string | null;
  name: string | null;
  phone: string | null;
  email: string | null;
  message: string | null;
  practice_area: string;
  landing_page: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  gclid: string | null;
  call_duration: number | null;
  call_recording_url: string | null;
  raw_payload: unknown;
}

// Map CallRail source names to our marketing source categories
function mapCallRailSource(sourceName: string): string {
  const sourceMap: Record<string, string> = {
    'Google Organic': 'organic',
    'Google Paid': 'paid',
    'Google Local Services': 'lsa',
    'Google Maps': 'maps',
    'Bing Organic': 'organic',
    'Bing Paid': 'paid',
    'Facebook': 'social',
    'Instagram': 'social',
    'Direct': 'direct',
    'Referral': 'referral',
  };
  
  return sourceMap[sourceName] || 'direct';
}

function normalizeFormLead(body: Record<string, unknown>): Partial<NormalizedLead> {
  return {
    source_type: 'form',
    name: `${body.firstName || ''} ${body.lastName || ''}`.trim() || null,
    phone: (body.phone as string) || null,
    email: (body.email as string) || null,
    message: (body.message as string) || null,
    landing_page: (body.landing_page as string) || null,
    utm_source: (body.utm_source as string) || null,
    utm_medium: (body.utm_medium as string) || null,
    utm_campaign: (body.utm_campaign as string) || null,
    utm_term: (body.utm_term as string) || null,
    utm_content: (body.utm_content as string) || null,
    gclid: (body.gclid as string) || null,
    marketing_source: (body.utm_source as string) ? 'paid' : 'direct',
  };
}

function normalizeCallRailLead(body: Record<string, unknown>): Partial<NormalizedLead> {
  return {
    source_type: 'call',
    name: (body.caller_name as string) || null,
    phone: (body.caller_number as string) || (body.caller_phone_number as string) || null,
    email: null,
    message: null,
    call_duration: (body.duration as number) || null,
    call_recording_url: (body.recording as string) || null,
    marketing_source: mapCallRailSource((body.source_name as string) || ''),
  };
}

function normalizeChatLead(body: Record<string, unknown>): Partial<NormalizedLead> {
  return {
    source_type: 'chat',
    name: (body.name as string) || null,
    phone: (body.phone as string) || null,
    email: (body.email as string) || null,
    message: (body.message as string) || (body.transcript as string) || null,
    marketing_source: 'direct',
  };
}

export async function POST(request: NextRequest) {
  // Authenticate request
  const authHeader = request.headers.get('authorization');
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  const webhookSecret = process.env.WEBHOOK_SECRET;
  
  const providedToken = authHeader?.replace('Bearer ', '') || token;
  
  if (webhookSecret && providedToken !== webhookSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabase();
  
  // Parse request
  const source = url.searchParams.get('source') || 'form';
  let body: Record<string, unknown>;
  
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  
  // Normalize based on source
  let normalizedData: Partial<NormalizedLead>;
  
  switch (source) {
    case 'callrail':
      normalizedData = normalizeCallRailLead(body);
      break;
    case 'chat':
      normalizedData = normalizeChatLead(body);
      break;
    case 'form':
    default:
      normalizedData = normalizeFormLead(body);
      break;
  }
  
  // Create the full lead object
  const lead: NormalizedLead = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    source_type: normalizedData.source_type || 'form',
    marketing_source: normalizedData.marketing_source || 'direct',
    name: normalizedData.name || null,
    phone: normalizedData.phone || null,
    email: normalizedData.email || null,
    message: normalizedData.message || null,
    practice_area: 'traffic_ticket',
    landing_page: normalizedData.landing_page || null,
    utm_source: normalizedData.utm_source || null,
    utm_medium: normalizedData.utm_medium || null,
    utm_campaign: normalizedData.utm_campaign || null,
    utm_term: normalizedData.utm_term || null,
    utm_content: normalizedData.utm_content || null,
    gclid: normalizedData.gclid || null,
    call_duration: normalizedData.call_duration || null,
    call_recording_url: normalizedData.call_recording_url || null,
    raw_payload: body,
  };
  
  // Insert into Supabase
  const { error: dbError } = await supabase
    .from('leads')
    .insert({
      id: lead.id,
      source_type: lead.source_type,
      marketing_source: lead.marketing_source,
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      message: lead.message,
      practice_area: lead.practice_area,
      landing_page: lead.landing_page,
      utm_source: lead.utm_source,
      utm_medium: lead.utm_medium,
      utm_campaign: lead.utm_campaign,
      utm_term: lead.utm_term,
      utm_content: lead.utm_content,
      gclid: lead.gclid,
      call_duration: lead.call_duration,
      call_recording_url: lead.call_recording_url,
      raw_payload: lead.raw_payload,
    });
  
  if (dbError) {
    console.error('Error inserting lead:', dbError);
    // Continue even if DB insert fails - we still want to forward to other services
  }
  
  // Forward to Zapier webhook if configured
  const zapierUrl = process.env.ZAPIER_WEBHOOK_URL;
  if (zapierUrl) {
    try {
      await fetch(zapierUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead),
      });
    } catch (err) {
      console.error('Error forwarding to Zapier:', err);
    }
  }
  
  // Forward to 302 CRM webhook if configured
  const crmUrl = process.env.CRM_WEBHOOK_URL;
  if (crmUrl) {
    try {
      await fetch(crmUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead),
      });
    } catch (err) {
      console.error('Error forwarding to CRM:', err);
    }
  }
  
  return NextResponse.json(lead, { status: 200 });
}
