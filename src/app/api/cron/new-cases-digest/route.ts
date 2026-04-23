/**
 * GET /api/cron/new-cases-digest
 *
 * Daily digest of new + stale cases for the admin team.
 *
 * Runs Option C rules before building the email:
 *  - Rule 1: auto-reject pending_review cases whose court_date has passed
 *  - Rule 2: flag possible duplicates (same email + citation in last 30 days) in internal_notes
 *  - Rule 3: auto-transition to needs_info when OCR confidence < 70, citation_number missing,
 *            or court_location missing
 *
 * All Option C rules write a case_status_history entry and append to internal_notes.
 * No customer-facing email is sent by this route — the human reviews the digest and acts.
 *
 * Auth: Bearer ${CRON_SECRET}.
 * Caller: .github/workflows/daily-new-cases.yml.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { getAdminClient } from '@/lib/db/supabase';
import {
  NewCasesDigestEmail,
  type DigestCase,
  type RefundOwedCase,
  type DuplicateFlaggedCase,
  type DataQualityCase,
  type UrgentCase,
} from '@/lib/emails/templates/new-cases-digest';

export const maxDuration = 60;

const OCR_CONFIDENCE_THRESHOLD = 70;
const DUPLICATE_WINDOW_DAYS = 30;
const URGENT_COURT_DAYS = 7;
const STALE_PENDING_HOURS = 48;
const NEW_WINDOW_HOURS = 24;

const SYSTEM_ACTOR = 'system:new-cases-digest';

const AUTO_REJECT_NOTE_PREFIX = 'Auto-rejected: court date passed';
const DUPLICATE_NOTE_PREFIX = 'Possible duplicate of case';
const NEEDS_INFO_NOTE_PREFIX = 'Auto-flagged for missing data';

interface CaseRow {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  court_date: string;
  court_location: string | null;
  citation_number: string | null;
  offense_tier: string;
  amount_charged: number;
  status: string;
  payment_status: string | null;
  ocr_confidence: number | null;
  ocr_extraction_warnings: string[] | null;
  created_at: string;
  internal_notes: string | null;
  refund_issued_at: string | null;
}

function toDigestCase(c: CaseRow): DigestCase {
  return {
    id: c.id,
    clientName: c.customer_name,
    email: c.customer_email,
    phone: c.customer_phone,
    courtDate: c.court_date,
    offenseTier: c.offense_tier,
    priceDollars: c.amount_charged ? c.amount_charged / 100 : 0,
    status: c.status,
    paymentStatus: c.payment_status,
    ocrConfidence: c.ocr_confidence,
    createdAt: c.created_at,
  };
}

function todayISODate(): string {
  return new Date().toISOString().split('T')[0];
}

function appendNote(existing: string | null, addition: string): string {
  const stamp = new Date().toISOString().split('T')[0];
  const line = `[${stamp}] ${addition}`;
  return existing ? `${existing}\n${line}` : line;
}

async function recordStatusChange(params: {
  caseId: string;
  oldStatus: string;
  newStatus: string;
  notes: string;
}): Promise<void> {
  const supabase = getAdminClient();
  await supabase.from('case_status_history').insert({
    case_id: params.caseId,
    old_status: params.oldStatus,
    new_status: params.newStatus,
    changed_by: SYSTEM_ACTOR,
    notes: params.notes,
  });
}

/**
 * Rule 1: auto-reject pending_review cases whose court_date has already passed.
 * Returns the cases that were auto-rejected for the refund-owed section.
 */
async function applyAutoRejectRule(): Promise<void> {
  const supabase = getAdminClient();
  const today = todayISODate();

  const { data: targets, error } = await supabase
    .from('cases')
    .select('id, status, internal_notes, court_date')
    .eq('status', 'pending_review')
    .lt('court_date', today);

  if (error) {
    console.error('[digest] Rule 1 query failed:', error);
    return;
  }
  if (!targets || targets.length === 0) return;

  for (const c of targets) {
    const note = `${AUTO_REJECT_NOTE_PREFIX} (court_date=${c.court_date}, processed=${today})`;
    const nextNotes = appendNote(c.internal_notes, note);

    const { error: updateErr } = await supabase
      .from('cases')
      .update({
        status: 'rejected',
        internal_notes: nextNotes,
      })
      .eq('id', c.id)
      .eq('status', 'pending_review'); // no-op if something changed it first

    if (updateErr) {
      console.error(`[digest] Rule 1 update failed for case ${c.id}:`, updateErr);
      continue;
    }

    await recordStatusChange({
      caseId: c.id,
      oldStatus: 'pending_review',
      newStatus: 'rejected',
      notes: note,
    });
  }

  console.log(`[digest] Rule 1: auto-rejected ${targets.length} past-court-date cases`);
}

/**
 * Rule 2: flag new pending_review cases whose customer_email + citation_number
 * matches another case created in the last 30 days.
 */
async function applyDuplicateFlagRule(): Promise<void> {
  const supabase = getAdminClient();

  const windowStart = new Date();
  windowStart.setHours(windowStart.getHours() - NEW_WINDOW_HOURS);

  const duplicateWindowStart = new Date();
  duplicateWindowStart.setDate(duplicateWindowStart.getDate() - DUPLICATE_WINDOW_DAYS);

  const { data: newCases, error } = await supabase
    .from('cases')
    .select('id, customer_email, citation_number, internal_notes, created_at')
    .eq('status', 'pending_review')
    .gte('created_at', windowStart.toISOString())
    .not('citation_number', 'is', null);

  if (error) {
    console.error('[digest] Rule 2 query failed:', error);
    return;
  }
  if (!newCases || newCases.length === 0) return;

  let flagged = 0;

  for (const c of newCases) {
    // Skip if already flagged in an earlier run
    if (c.internal_notes?.includes(DUPLICATE_NOTE_PREFIX)) continue;

    const { data: matches } = await supabase
      .from('cases')
      .select('id, created_at')
      .eq('customer_email', c.customer_email)
      .eq('citation_number', c.citation_number)
      .gte('created_at', duplicateWindowStart.toISOString())
      .lt('created_at', c.created_at) // strictly older
      .limit(1);

    if (!matches || matches.length === 0) continue;

    const note = `${DUPLICATE_NOTE_PREFIX} ${matches[0].id} (submitted ${matches[0].created_at.split('T')[0]}). Verify before accepting.`;
    const nextNotes = appendNote(c.internal_notes, note);

    const { error: updateErr } = await supabase
      .from('cases')
      .update({ internal_notes: nextNotes })
      .eq('id', c.id);

    if (updateErr) {
      console.error(`[digest] Rule 2 update failed for case ${c.id}:`, updateErr);
      continue;
    }
    flagged++;
  }

  if (flagged > 0) console.log(`[digest] Rule 2: flagged ${flagged} possible duplicates`);
}

/**
 * Rule 3: auto-transition pending_review → needs_info when data quality is poor.
 */
async function applyDataQualityRule(): Promise<void> {
  const supabase = getAdminClient();

  const windowStart = new Date();
  windowStart.setHours(windowStart.getHours() - NEW_WINDOW_HOURS);

  const { data: candidates, error } = await supabase
    .from('cases')
    .select('id, status, internal_notes, ocr_confidence, citation_number, court_location')
    .eq('status', 'pending_review')
    .gte('created_at', windowStart.toISOString());

  if (error) {
    console.error('[digest] Rule 3 query failed:', error);
    return;
  }
  if (!candidates || candidates.length === 0) return;

  let transitioned = 0;

  for (const c of candidates) {
    const missing: string[] = [];
    if (c.ocr_confidence !== null && c.ocr_confidence < OCR_CONFIDENCE_THRESHOLD) {
      missing.push(`low OCR confidence (${c.ocr_confidence})`);
    }
    if (!c.citation_number) missing.push('citation number');
    if (!c.court_location) missing.push('court location');

    if (missing.length === 0) continue;

    const note = `${NEEDS_INFO_NOTE_PREFIX}: ${missing.join(', ')}`;
    const nextNotes = appendNote(c.internal_notes, note);

    const { error: updateErr } = await supabase
      .from('cases')
      .update({
        status: 'needs_info',
        internal_notes: nextNotes,
      })
      .eq('id', c.id)
      .eq('status', 'pending_review');

    if (updateErr) {
      console.error(`[digest] Rule 3 update failed for case ${c.id}:`, updateErr);
      continue;
    }

    await recordStatusChange({
      caseId: c.id,
      oldStatus: 'pending_review',
      newStatus: 'needs_info',
      notes: note,
    });

    transitioned++;
  }

  if (transitioned > 0) console.log(`[digest] Rule 3: transitioned ${transitioned} cases to needs_info`);
}

async function queryRefundOwed(): Promise<RefundOwedCase[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('cases')
    .select(
      'id, customer_name, customer_email, customer_phone, court_date, court_location, citation_number, offense_tier, amount_charged, status, payment_status, ocr_confidence, ocr_extraction_warnings, created_at, internal_notes, refund_issued_at',
    )
    .eq('status', 'rejected')
    .eq('payment_status', 'succeeded')
    .is('refund_issued_at', null)
    .like('internal_notes', `%${AUTO_REJECT_NOTE_PREFIX}%`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[digest] refund-owed query failed:', error);
    return [];
  }
  return (data ?? []).map((c) => ({
    ...toDigestCase(c as CaseRow),
    amountPaidDollars: (c as CaseRow).amount_charged / 100,
  }));
}

async function queryUrgent(): Promise<UrgentCase[]> {
  const supabase = getAdminClient();
  const today = todayISODate();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + URGENT_COURT_DAYS);
  const cutoffISO = cutoff.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('cases')
    .select(
      'id, customer_name, customer_email, customer_phone, court_date, court_location, citation_number, offense_tier, amount_charged, status, payment_status, ocr_confidence, ocr_extraction_warnings, created_at, internal_notes, refund_issued_at',
    )
    .gte('court_date', today)
    .lte('court_date', cutoffISO)
    .in('status', ['pending_review', 'needs_info', 'accepted', 'in_progress'])
    .order('court_date', { ascending: true });

  if (error) {
    console.error('[digest] urgent query failed:', error);
    return [];
  }
  const todayDate = new Date(today);
  return (data ?? []).map((c) => {
    const courtDate = new Date((c as CaseRow).court_date);
    const daysUntilCourt = Math.round((courtDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
    return {
      ...toDigestCase(c as CaseRow),
      daysUntilCourt,
    };
  });
}

async function queryDuplicates(): Promise<DuplicateFlaggedCase[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('cases')
    .select(
      'id, customer_name, customer_email, customer_phone, court_date, court_location, citation_number, offense_tier, amount_charged, status, payment_status, ocr_confidence, ocr_extraction_warnings, created_at, internal_notes, refund_issued_at',
    )
    .eq('status', 'pending_review')
    .like('internal_notes', `%${DUPLICATE_NOTE_PREFIX}%`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[digest] duplicates query failed:', error);
    return [];
  }
  return (data ?? []).map((c) => {
    const notes = (c as CaseRow).internal_notes ?? '';
    const match = notes.match(/Possible duplicate of case ([0-9a-f-]+)/i);
    return {
      ...toDigestCase(c as CaseRow),
      duplicateOfId: match ? match[1] : '',
    };
  });
}

async function queryDataQuality(): Promise<DataQualityCase[]> {
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('cases')
    .select(
      'id, customer_name, customer_email, customer_phone, court_date, court_location, citation_number, offense_tier, amount_charged, status, payment_status, ocr_confidence, ocr_extraction_warnings, created_at, internal_notes, refund_issued_at',
    )
    .eq('status', 'needs_info')
    .like('internal_notes', `%${NEEDS_INFO_NOTE_PREFIX}%`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[digest] data-quality query failed:', error);
    return [];
  }
  return (data ?? []).map((c) => {
    const notes = (c as CaseRow).internal_notes ?? '';
    const match = notes.match(/Auto-flagged for missing data: ([^\n]+)/);
    const missingFields = match ? match[1].split(',').map((s) => s.trim()) : [];
    return { ...toDigestCase(c as CaseRow), missingFields };
  });
}

async function queryNewLast24h(): Promise<DigestCase[]> {
  const supabase = getAdminClient();
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - NEW_WINDOW_HOURS);

  const { data, error } = await supabase
    .from('cases')
    .select(
      'id, customer_name, customer_email, customer_phone, court_date, court_location, citation_number, offense_tier, amount_charged, status, payment_status, ocr_confidence, ocr_extraction_warnings, created_at, internal_notes, refund_issued_at',
    )
    .eq('status', 'pending_review')
    .gte('created_at', cutoff.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[digest] new-cases query failed:', error);
    return [];
  }
  return (data ?? []).map((c) => toDigestCase(c as CaseRow));
}

async function queryStalePending(): Promise<DigestCase[]> {
  const supabase = getAdminClient();
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - STALE_PENDING_HOURS);

  const { data, error } = await supabase
    .from('cases')
    .select(
      'id, customer_name, customer_email, customer_phone, court_date, court_location, citation_number, offense_tier, amount_charged, status, payment_status, ocr_confidence, ocr_extraction_warnings, created_at, internal_notes, refund_issued_at',
    )
    .eq('status', 'pending_review')
    .lt('created_at', cutoff.toISOString())
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[digest] stale-pending query failed:', error);
    return [];
  }
  return (data ?? []).map((c) => toDigestCase(c as CaseRow));
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error('[digest] CRON_SECRET not configured');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const started = Date.now();
  console.log('[digest] Starting daily new-cases digest...');

  // Apply Option C rules (state changes)
  await applyAutoRejectRule();
  await applyDuplicateFlagRule();
  await applyDataQualityRule();

  // Build email sections from current state
  const [refundOwed, urgent, duplicates, dataQuality, newCases, stalePending] = await Promise.all([
    queryRefundOwed(),
    queryUrgent(),
    queryDuplicates(),
    queryDataQuality(),
    queryNewLast24h(),
    queryStalePending(),
  ]);

  const totalItems =
    refundOwed.length + urgent.length + duplicates.length + dataQuality.length + newCases.length + stalePending.length;

  console.log('[digest] Section counts:', {
    refundOwed: refundOwed.length,
    urgent: urgent.length,
    duplicates: duplicates.length,
    dataQuality: dataQuality.length,
    newCases: newCases.length,
    stalePending: stalePending.length,
  });

  if (totalItems === 0) {
    console.log('[digest] All sections empty — skipping email');
    return NextResponse.json({
      success: true,
      emailSent: false,
      reason: 'no items to report',
      elapsedMs: Date.now() - started,
    });
  }

  const recipients = (process.env.NEW_CASES_DIGEST_RECIPIENTS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (recipients.length === 0) {
    console.error('[digest] NEW_CASES_DIGEST_RECIPIENTS not configured');
    return NextResponse.json(
      { success: false, error: 'No recipients configured' },
      { status: 500 },
    );
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.error('[digest] RESEND_API_KEY not configured');
    return NextResponse.json(
      { success: false, error: 'Email service not configured' },
      { status: 500 },
    );
  }

  const resend = new Resend(resendApiKey);

  const today = todayISODate();
  const urgentCount = urgent.length + refundOwed.length;
  const subject =
    urgentCount > 0
      ? `[TFT] ${urgentCount} urgent • ${newCases.length} new (${today})`
      : `[TFT] ${newCases.length} new cases (${today})`;

  const html = await render(
    NewCasesDigestEmail({
      date: today,
      refundOwed,
      urgent,
      duplicates,
      dataQuality,
      newCases,
      stalePending,
    }),
  );

  try {
    const { data, error } = await resend.emails.send({
      from: 'TaskForce Tickets Admin <admin@taskforcetickets.com>',
      to: recipients,
      subject,
      html,
    });

    if (error) {
      console.error('[digest] Resend error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    console.log(`[digest] Sent in ${Date.now() - started}ms to ${recipients.join(', ')}`);
    return NextResponse.json({
      success: true,
      emailSent: true,
      messageId: data?.id,
      recipients,
      sectionCounts: {
        refundOwed: refundOwed.length,
        urgent: urgent.length,
        duplicates: duplicates.length,
        dataQuality: dataQuality.length,
        newCases: newCases.length,
        stalePending: stalePending.length,
      },
      elapsedMs: Date.now() - started,
    });
  } catch (err) {
    console.error('[digest] Send failed:', err);
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Send failed' },
      { status: 500 },
    );
  }
}
