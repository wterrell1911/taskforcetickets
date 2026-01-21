/**
 * GET /api/traffic-report
 *
 * Public API for fetching traffic report data
 * Pulls from existing enforcement records (synced from Memphis Data Hub)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getEnforcementRecords } from '@/lib/db/store';
import { getAdminClient } from '@/lib/db/supabase';
import { EnforcementRecord } from '@/types/admin';

interface WeeklyStats {
  weekStart: string;
  weekEnd: string;
  weekRange: string;
  totalStops: number;
  weekOverWeekChange: number;
  weather: {
    level: 'sunny' | 'cloudy' | 'rainy' | 'stormy';
    label: string;
    description: string;
    emoji: string;
  };
  breakdown: Array<{ type: string; count: number; percentage: number }>;
  hotspots: Array<{ location: string; count: number; precinct: string }>;
}

export async function GET(request: NextRequest) {
  const weeksCount = parseInt(request.nextUrl.searchParams.get('weeks') || '8');

  try {
    // Get all enforcement records
    const records = await getEnforcementRecords();

    if (!records || records.length === 0) {
      return NextResponse.json({ error: 'No traffic data available' }, { status: 404 });
    }

    // Group records by week
    const weeklyData = groupByWeek(records);
    const sortedWeeks = Object.keys(weeklyData).sort().reverse();

    if (sortedWeeks.length === 0) {
      return NextResponse.json({ error: 'No traffic data available' }, { status: 404 });
    }

    // Get current week stats
    const currentWeekStart = sortedWeeks[0];
    const currentWeekRecords = weeklyData[currentWeekStart];
    const previousWeekRecords = sortedWeeks[1] ? weeklyData[sortedWeeks[1]] : [];

    const totalStops = currentWeekRecords.length;
    const previousTotal = previousWeekRecords.length;
    const weekOverWeekChange = previousTotal > 0
      ? Math.round(((totalStops - previousTotal) / previousTotal) * 100)
      : 0;

    // Calculate breakdown by category
    const breakdown = calculateBreakdown(currentWeekRecords);

    // Calculate hotspots by precinct
    const hotspots = calculateHotspots(currentWeekRecords);

    // Determine weather level
    const weather = getTrafficWeather(totalStops, weekOverWeekChange);

    // Build trend data
    const trends = sortedWeeks.slice(0, weeksCount).map(weekStart => ({
      week: formatWeekLabel(weekStart),
      weekStart,
      totalStops: weeklyData[weekStart].length,
    })).reverse();

    // Get real TaskForce success rate from actual cases
    const taskforceStats = await getTaskforceStats();

    return NextResponse.json({
      currentWeek: {
        weekStart: currentWeekStart,
        weekEnd: getWeekEnd(currentWeekStart),
        weekRange: formatWeekRange(currentWeekStart),
        totalStops,
        weekOverWeekChange,
        weather,
        breakdown,
        hotspots: hotspots.slice(0, 5),
        // Only show TaskForce stats if we have real data
        taskforceStats,
      },
      trends,
      dataSource: 'Memphis Data Hub - MPD Traffic Stops',
      lastUpdated: records[0]?.updatedAt || new Date().toISOString(),
    });
  } catch (error) {
    console.error('Traffic report error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch traffic report' },
      { status: 500 }
    );
  }
}

function groupByWeek(records: EnforcementRecord[]): Record<string, EnforcementRecord[]> {
  const weeks: Record<string, EnforcementRecord[]> = {};

  for (const record of records) {
    if (!record.date) continue;
    const weekStart = getWeekStart(record.date);
    if (!weeks[weekStart]) {
      weeks[weekStart] = [];
    }
    weeks[weekStart].push(record);
  }

  return weeks;
}

function getWeekStart(dateStr: string): string {
  const date = new Date(dateStr);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(date.setDate(diff));
  return monday.toISOString().split('T')[0];
}

function getWeekEnd(weekStart: string): string {
  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return end.toISOString().split('T')[0];
}

function formatWeekLabel(weekStart: string): string {
  const date = new Date(weekStart);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatWeekRange(weekStart: string): string {
  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return `${startStr} - ${endStr}`;
}

function calculateBreakdown(records: EnforcementRecord[]): Array<{ type: string; count: number; percentage: number }> {
  const categories: Record<string, number> = {
    speed: 0,
    equipment: 0,
    registration: 0,
    license: 0,
    insurance: 0,
    other: 0,
  };

  for (const record of records) {
    const cat = record.violationCategory || 'other';
    categories[cat] = (categories[cat] || 0) + 1;
  }

  const total = records.length;
  const labels: Record<string, string> = {
    speed: 'Speeding',
    equipment: 'Equipment Violations',
    registration: 'Registration',
    license: 'License Violations',
    insurance: 'No Insurance',
    other: 'Other',
  };

  return Object.entries(categories)
    .filter(([_, count]) => count > 0)
    .map(([type, count]) => ({
      type: labels[type] || type,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

function calculateHotspots(records: EnforcementRecord[]): Array<{ location: string; count: number; precinct: string }> {
  const precincts: Record<string, { count: number; locations: Record<string, number> }> = {};

  for (const record of records) {
    const precinct = record.precinct || 'Unknown';
    if (!precincts[precinct]) {
      precincts[precinct] = { count: 0, locations: {} };
    }
    precincts[precinct].count++;

    if (record.location) {
      precincts[precinct].locations[record.location] =
        (precincts[precinct].locations[record.location] || 0) + 1;
    }
  }

  return Object.entries(precincts)
    .map(([precinct, data]) => {
      // Find most common location in this precinct
      const topLocation = Object.entries(data.locations)
        .sort(([, a], [, b]) => b - a)[0];

      return {
        location: topLocation ? topLocation[0] : `Precinct ${precinct}`,
        count: data.count,
        precinct,
      };
    })
    .sort((a, b) => b.count - a.count);
}

async function getTaskforceStats(): Promise<{
  totalCases: number;
  dismissedCases: number;
  successRate: number | null;
} | null> {
  try {
    const supabase = getAdminClient();

    // Get counts of dismissed and not_dismissed cases
    const { data: cases, error } = await supabase
      .from('cases')
      .select('status')
      .in('status', ['dismissed', 'not_dismissed']);

    if (error || !cases || cases.length === 0) {
      return null; // No data yet
    }

    const dismissed = cases.filter(c => c.status === 'dismissed').length;
    const notDismissed = cases.filter(c => c.status === 'not_dismissed').length;
    const total = dismissed + notDismissed;

    if (total === 0) {
      return null;
    }

    return {
      totalCases: total,
      dismissedCases: dismissed,
      successRate: Math.round((dismissed / total) * 100),
    };
  } catch (error) {
    console.error('Error fetching TaskForce stats:', error);
    return null;
  }
}

function getTrafficWeather(totalStops: number, weekOverWeekChange: number): {
  level: 'sunny' | 'cloudy' | 'rainy' | 'stormy';
  label: string;
  description: string;
  emoji: string;
} {
  // Thresholds based on typical weekly volumes
  if (totalStops < 500 && weekOverWeekChange < 0) {
    return {
      level: 'sunny',
      label: 'Light Enforcement',
      description: 'Below average traffic stop activity this week',
      emoji: '☀️',
    };
  }

  if (totalStops < 1000) {
    return {
      level: 'cloudy',
      label: 'Moderate Enforcement',
      description: 'Average traffic stop activity expected',
      emoji: '⛅',
    };
  }

  if (totalStops < 2000 || weekOverWeekChange > 20) {
    return {
      level: 'rainy',
      label: 'Heavy Enforcement',
      description: 'Above average activity - drive carefully',
      emoji: '🌧️',
    };
  }

  return {
    level: 'stormy',
    label: 'Intense Enforcement',
    description: 'Very high activity - extra caution advised',
    emoji: '⛈️',
  };
}
