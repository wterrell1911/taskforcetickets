import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import { WeeklyDigestEmail } from '@/lib/emails/templates/weekly-digest';
import { getGA4Metrics } from '@/lib/analytics/ga4';
import { getSearchConsoleMetrics } from '@/lib/analytics/search-console';
import { getCallRailMetrics } from '@/lib/analytics/callrail';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

function getWeekDates(): { thisWeekStart: string; thisWeekEnd: string; lastWeekStart: string; lastWeekEnd: string } {
  const now = new Date();
  const thisWeekEnd = now.toISOString().split('T')[0];
  
  const thisWeekStartDate = new Date(now);
  thisWeekStartDate.setDate(thisWeekStartDate.getDate() - 7);
  const thisWeekStart = thisWeekStartDate.toISOString().split('T')[0];
  
  const lastWeekStartDate = new Date(thisWeekStartDate);
  lastWeekStartDate.setDate(lastWeekStartDate.getDate() - 7);
  const lastWeekStart = lastWeekStartDate.toISOString().split('T')[0];
  
  const lastWeekEndDate = new Date(thisWeekStartDate);
  lastWeekEndDate.setDate(lastWeekEndDate.getDate() - 1);
  const lastWeekEnd = lastWeekEndDate.toISOString().split('T')[0];
  
  return { thisWeekStart, thisWeekEnd, lastWeekStart, lastWeekEnd };
}

function calculateChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

async function getLeadCounts(startDate: string, endDate: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('leads')
    .select('source_type, marketing_source')
    .gte('created_at', startDate)
    .lte('created_at', endDate);
  
  if (error) return { total: 0, forms: 0, calls: 0, bySource: [] as Array<{ source: string; count: number }> };
  
  const leads = data || [];
  const sourceCount: Record<string, number> = {};
  
  leads.forEach((lead) => {
    const source = lead.marketing_source || 'direct';
    sourceCount[source] = (sourceCount[source] || 0) + 1;
  });
  
  return {
    total: leads.length,
    forms: leads.filter((l) => l.source_type === 'form').length,
    calls: leads.filter((l) => l.source_type === 'call').length,
    bySource: Object.entries(sourceCount)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count),
  };
}

function generateActionItems(kpis: {
  leads: { value: number; change: number };
  calls: { value: number; change: number };
  formSubmissions: { value: number; change: number };
  sessions: { value: number; change: number };
}): string[] {
  const items: string[] = [];
  
  if (kpis.leads.change < -20) {
    items.push('Lead volume down significantly - consider increasing ad spend or reviewing landing page');
  }
  
  if (kpis.calls.change < -20) {
    items.push('Call volume dropped - check phone number visibility and CTAs');
  }
  
  if (kpis.sessions.change > 20 && kpis.leads.change < 0) {
    items.push('Traffic up but leads down - review conversion paths and form friction');
  }
  
  if (kpis.formSubmissions.change > 50) {
    items.push('🎉 Form submissions up significantly - great job on optimization!');
  }
  
  if (items.length === 0) {
    items.push('Metrics look steady - continue current strategy');
  }
  
  return items;
}

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const resend = getResend();
  const { thisWeekStart, thisWeekEnd, lastWeekStart, lastWeekEnd } = getWeekDates();
  
  // Fetch all metrics in parallel
  const [thisWeekLeads, lastWeekLeads, thisWeekGA4, lastWeekGA4, thisWeekGSC, thisWeekCallRail, lastWeekCallRail] =
    await Promise.all([
      getLeadCounts(thisWeekStart, thisWeekEnd),
      getLeadCounts(lastWeekStart, lastWeekEnd),
      process.env.GOOGLE_ANALYTICS_PROPERTY_ID
        ? getGA4Metrics(process.env.GOOGLE_ANALYTICS_PROPERTY_ID, thisWeekStart, thisWeekEnd)
        : null,
      process.env.GOOGLE_ANALYTICS_PROPERTY_ID
        ? getGA4Metrics(process.env.GOOGLE_ANALYTICS_PROPERTY_ID, lastWeekStart, lastWeekEnd)
        : null,
      process.env.SEARCH_CONSOLE_SITE_URL
        ? getSearchConsoleMetrics(process.env.SEARCH_CONSOLE_SITE_URL, thisWeekStart, thisWeekEnd)
        : null,
      process.env.CALLRAIL_ACCOUNT_ID
        ? getCallRailMetrics(process.env.CALLRAIL_ACCOUNT_ID, thisWeekStart, thisWeekEnd)
        : null,
      process.env.CALLRAIL_ACCOUNT_ID
        ? getCallRailMetrics(process.env.CALLRAIL_ACCOUNT_ID, lastWeekStart, lastWeekEnd)
        : null,
    ]);
  
  // Calculate KPIs with week-over-week change
  const kpis = {
    leads: {
      value: thisWeekLeads.total,
      change: calculateChange(thisWeekLeads.total, lastWeekLeads.total),
    },
    calls: {
      value: thisWeekCallRail?.totalCalls || 0,
      change: calculateChange(thisWeekCallRail?.totalCalls || 0, lastWeekCallRail?.totalCalls || 0),
    },
    formSubmissions: {
      value: thisWeekLeads.forms,
      change: calculateChange(thisWeekLeads.forms, lastWeekLeads.forms),
    },
    sessions: {
      value: thisWeekGA4?.sessions || 0,
      change: calculateChange(thisWeekGA4?.sessions || 0, lastWeekGA4?.sessions || 0),
    },
  };
  
  // Get top keywords
  const topKeywords = (thisWeekGSC?.topQueries || []).slice(0, 5).map((q) => ({
    keyword: q.query,
    impressions: q.impressions,
    clicks: q.clicks,
    position: q.position,
  }));
  
  // Generate action items
  const actionItems = generateActionItems(kpis);
  
  // Render email
  const emailProps = {
    period: {
      start: thisWeekStart,
      end: thisWeekEnd,
    },
    kpis,
    topKeywords,
    leadSources: thisWeekLeads.bySource,
    actionItems,
  };
  
  const emailHtml = await render(WeeklyDigestEmail(emailProps));
  
  // Send email
  const recipients = (process.env.WEEKLY_DIGEST_RECIPIENTS || '').split(',').filter(Boolean);
  
  if (recipients.length === 0) {
    return NextResponse.json({
      success: false,
      error: 'No recipients configured',
      preview: emailProps,
    });
  }
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'TaskForce Tickets <reports@taskforcetickets.com>',
      to: recipients,
      subject: `Weekly Report: ${kpis.leads.value} leads, ${kpis.calls.value} calls (${thisWeekStart} - ${thisWeekEnd})`,
      html: emailHtml,
    });
    
    if (error) {
      console.error('Error sending weekly digest:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      messageId: data?.id,
      recipients,
      preview: emailProps,
    });
  } catch (error) {
    console.error('Error sending weekly digest:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
