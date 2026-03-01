/**
 * Traffic Data Calculations
 *
 * Utility functions for calculating traffic statistics and trends
 */

import {
  TrafficMetrics,
  EnforcementHotspot,
  WeeklyStats,
  TrendData,
  VIOLATION_TYPES,
} from './types';

/**
 * Calculate the total citations for a given week
 */
export function calculateTotalCitations(metrics: TrafficMetrics): number {
  return (
    metrics.speeding_citations +
    metrics.red_light_citations +
    metrics.stop_sign_citations +
    metrics.reckless_driving_citations +
    metrics.no_insurance_citations +
    metrics.license_violations +
    metrics.other_citations
  );
}

/**
 * Get the top violation type for the week
 */
export function getTopViolationType(metrics: TrafficMetrics): {
  type: string;
  count: number;
} {
  const violations = [
    { type: 'speeding', count: metrics.speeding_citations },
    { type: 'red_light', count: metrics.red_light_citations },
    { type: 'stop_sign', count: metrics.stop_sign_citations },
    { type: 'reckless_driving', count: metrics.reckless_driving_citations },
    { type: 'no_insurance', count: metrics.no_insurance_citations },
    { type: 'license', count: metrics.license_violations },
    { type: 'other', count: metrics.other_citations },
  ];

  const top = violations.reduce((max, v) => (v.count > max.count ? v : max), violations[0]);

  return {
    type: VIOLATION_TYPES[top.type as keyof typeof VIOLATION_TYPES],
    count: top.count,
  };
}

/**
 * Calculate week-over-week change percentage
 */
export function calculateWeekOverWeekChange(
  currentWeek: TrafficMetrics,
  previousWeek: TrafficMetrics | null
): number {
  if (!previousWeek) return 0;

  const currentTotal = calculateTotalCitations(currentWeek);
  const previousTotal = calculateTotalCitations(previousWeek);

  if (previousTotal === 0) return currentTotal > 0 ? 100 : 0;

  return Math.round(((currentTotal - previousTotal) / previousTotal) * 100);
}

/**
 * Calculate TaskForce success rate
 */
export function calculateTaskforceSuccessRate(metrics: TrafficMetrics): number {
  if (metrics.taskforce_cases_filed === 0) return 0;
  return Math.round((metrics.taskforce_dismissals / metrics.taskforce_cases_filed) * 100);
}

/**
 * Generate weekly stats summary
 */
export function generateWeeklyStats(
  metrics: TrafficMetrics,
  previousMetrics: TrafficMetrics | null,
  hotspots: EnforcementHotspot[]
): WeeklyStats {
  const topViolation = getTopViolationType(metrics);

  return {
    totalCitations: calculateTotalCitations(metrics),
    weekOverWeekChange: calculateWeekOverWeekChange(metrics, previousMetrics),
    topViolationType: topViolation.type,
    topViolationCount: topViolation.count,
    dismissalRate: metrics.dismissal_rate,
    averageFine: metrics.average_fine_amount,
    hotspots: hotspots,
    taskforceSuccessRate: calculateTaskforceSuccessRate(metrics),
  };
}

/**
 * Generate trend data for charts
 */
export function generateTrendData(metricsHistory: TrafficMetrics[]): TrendData[] {
  return metricsHistory.map((m) => ({
    week: formatWeekLabel(m.week_start),
    totalCitations: calculateTotalCitations(m),
    dismissalRate: m.dismissal_rate,
  }));
}

/**
 * Format week label for display
 */
export function formatWeekLabel(weekStart: string): string {
  const date = new Date(weekStart);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Format date range for display
 */
export function formatWeekRange(weekStart: string, weekEnd: string): string {
  const start = new Date(weekStart);
  const end = new Date(weekEnd);

  const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return `${startStr} - ${endStr}`;
}

/**
 * Get the Monday of the current week
 */
export function getCurrentWeekStart(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split('T')[0];
}

/**
 * Get the Sunday of a week given its Monday
 */
export function getWeekEnd(weekStart: string): string {
  const start = new Date(weekStart);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return end.toISOString().split('T')[0];
}

/**
 * Calculate the "weather" severity level based on citation activity
 */
export function getTrafficWeather(
  totalCitations: number,
  weekOverWeekChange: number
): {
  level: 'sunny' | 'cloudy' | 'rainy' | 'stormy';
  label: string;
  description: string;
  emoji: string;
} {
  // Thresholds based on typical Memphis citation volumes
  // These can be adjusted based on actual data

  if (totalCitations < 500 && weekOverWeekChange < 0) {
    return {
      level: 'sunny',
      label: 'Light Traffic Enforcement',
      description: 'Below average citation activity this week',
      emoji: '☀️',
    };
  }

  if (totalCitations < 800) {
    return {
      level: 'cloudy',
      label: 'Moderate Enforcement',
      description: 'Average citation activity expected',
      emoji: '⛅',
    };
  }

  if (totalCitations < 1200 || weekOverWeekChange > 20) {
    return {
      level: 'rainy',
      label: 'Heavy Enforcement',
      description: 'Above average citation activity - drive carefully',
      emoji: '🌧️',
    };
  }

  return {
    level: 'stormy',
    label: 'Severe Enforcement',
    description: 'Very high citation activity - extra caution advised',
    emoji: '⛈️',
  };
}

/**
 * Get violation breakdown as percentages
 */
export function getViolationBreakdown(metrics: TrafficMetrics): Array<{
  type: string;
  count: number;
  percentage: number;
}> {
  const total = calculateTotalCitations(metrics);
  if (total === 0) return [];

  const violations = [
    { type: 'Speeding', count: metrics.speeding_citations },
    { type: 'Red Light', count: metrics.red_light_citations },
    { type: 'Stop Sign', count: metrics.stop_sign_citations },
    { type: 'Reckless Driving', count: metrics.reckless_driving_citations },
    { type: 'No Insurance', count: metrics.no_insurance_citations },
    { type: 'License Violations', count: metrics.license_violations },
    { type: 'Other', count: metrics.other_citations },
  ];

  return violations
    .filter((v) => v.count > 0)
    .map((v) => ({
      ...v,
      percentage: Math.round((v.count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count);
}
