/**
 * Traffic Report Content Generator
 *
 * Generates social media posts and blog content from traffic data
 */

import { TrafficMetrics, EnforcementHotspot, WeeklyStats } from './types';
import {
  calculateTotalCitations,
  getTopViolationType,
  getTrafficWeather,
  formatWeekRange,
  getViolationBreakdown,
  calculateTaskforceSuccessRate,
} from './calculations';

interface GeneratedContent {
  headline: string;
  summary: string;
  twitterPost: string;
  facebookPost: string;
  instagramCaption: string;
  blogContent: string;
}

/**
 * Generate all content for a weekly traffic report
 */
export function generateWeeklyContent(
  metrics: TrafficMetrics,
  hotspots: EnforcementHotspot[],
  previousMetrics: TrafficMetrics | null
): GeneratedContent {
  const totalCitations = calculateTotalCitations(metrics);
  const topViolation = getTopViolationType(metrics);
  const weekRange = formatWeekRange(metrics.week_start, metrics.week_end);
  const breakdown = getViolationBreakdown(metrics);
  const taskforceRate = calculateTaskforceSuccessRate(metrics);

  // Calculate change
  let changeText = '';
  if (previousMetrics) {
    const prevTotal = calculateTotalCitations(previousMetrics);
    const change = totalCitations - prevTotal;
    const changePercent = prevTotal > 0 ? Math.round((change / prevTotal) * 100) : 0;
    if (change > 0) {
      changeText = `up ${changePercent}% from last week`;
    } else if (change < 0) {
      changeText = `down ${Math.abs(changePercent)}% from last week`;
    } else {
      changeText = 'unchanged from last week';
    }
  }

  const weather = getTrafficWeather(
    totalCitations,
    previousMetrics ? calculateTotalCitations(metrics) - calculateTotalCitations(previousMetrics) : 0
  );

  // Format hotspots
  const topHotspots = hotspots.slice(0, 3);
  const hotspotList = topHotspots.map((h) => h.location_name).join(', ');

  return {
    headline: generateHeadline(totalCitations, weather, topViolation.type),
    summary: generateSummary(totalCitations, changeText, topViolation, metrics.dismissal_rate),
    twitterPost: generateTwitterPost(weekRange, totalCitations, weather, topHotspots),
    facebookPost: generateFacebookPost(
      weekRange,
      totalCitations,
      changeText,
      breakdown,
      hotspotList,
      taskforceRate
    ),
    instagramCaption: generateInstagramCaption(weekRange, weather, totalCitations, topHotspots),
    blogContent: generateBlogContent(
      weekRange,
      metrics,
      breakdown,
      hotspots,
      weather,
      taskforceRate,
      changeText
    ),
  };
}

function generateHeadline(
  totalCitations: number,
  weather: ReturnType<typeof getTrafficWeather>,
  topViolation: string
): string {
  const headlines = [
    `Memphis Traffic Weather: ${weather.label} - ${totalCitations.toLocaleString()} Citations Issued`,
    `${weather.emoji} ${weather.label}: ${topViolation} Tops This Week's Citations`,
    `Weekly Traffic Report: ${totalCitations.toLocaleString()} Tickets in Memphis`,
  ];
  return headlines[0];
}

function generateSummary(
  totalCitations: number,
  changeText: string,
  topViolation: { type: string; count: number },
  dismissalRate: number
): string {
  let summary = `Memphis law enforcement issued ${totalCitations.toLocaleString()} traffic citations this week`;
  if (changeText) {
    summary += `, ${changeText}`;
  }
  summary += `. ${topViolation.type} violations led the way with ${topViolation.count.toLocaleString()} tickets. `;
  summary += `The current court dismissal rate stands at ${dismissalRate}%.`;
  return summary;
}

function generateTwitterPost(
  weekRange: string,
  totalCitations: number,
  weather: ReturnType<typeof getTrafficWeather>,
  hotspots: EnforcementHotspot[]
): string {
  const hotspotText =
    hotspots.length > 0 ? `\n\nHotspots: ${hotspots.map((h) => h.location_name).join(', ')}` : '';

  return `${weather.emoji} Memphis Traffic Weather (${weekRange})

${weather.label}
${totalCitations.toLocaleString()} citations issued${hotspotText}

Got a ticket? We can help.
taskforcetickets.com

#Memphis #TrafficTicket #DriveSafe`;
}

function generateFacebookPost(
  weekRange: string,
  totalCitations: number,
  changeText: string,
  breakdown: Array<{ type: string; count: number; percentage: number }>,
  hotspotList: string,
  taskforceRate: number
): string {
  const breakdownText = breakdown
    .slice(0, 4)
    .map((v) => `  - ${v.type}: ${v.count.toLocaleString()} (${v.percentage}%)`)
    .join('\n');

  return `MEMPHIS WEEKLY TRAFFIC REPORT
${weekRange}

This week's numbers are in! Memphis law enforcement issued ${totalCitations.toLocaleString()} traffic citations${changeText ? `, ${changeText}` : ''}.

CITATION BREAKDOWN:
${breakdownText}

ENFORCEMENT HOTSPOTS:
${hotspotList || 'Check our website for details'}

DID YOU GET A TICKET?
TaskForce Tickets has a ${taskforceRate}% success rate getting citations dismissed. We appear in court so you don't have to.

Learn more: taskforcetickets.com

#MemphisTraffic #TrafficTicket #TaskForceTickets`;
}

function generateInstagramCaption(
  weekRange: string,
  weather: ReturnType<typeof getTrafficWeather>,
  totalCitations: number,
  hotspots: EnforcementHotspot[]
): string {
  const hotspotEmoji = '📍';
  const hotspotText = hotspots.slice(0, 3).map((h) => `${hotspotEmoji} ${h.location_name}`);

  return `${weather.emoji} MEMPHIS TRAFFIC WEATHER ${weather.emoji}
Week of ${weekRange}

${weather.label.toUpperCase()}

${totalCitations.toLocaleString()} citations issued this week

Top Enforcement Areas:
${hotspotText.join('\n')}

⚠️ ${weather.description}

Got a ticket? Don't stress. We handle it.
Link in bio 👆

#Memphis #TrafficTicket #MemphisTraffic #Tennessee #DriveSafe #TaskForceTickets #TrafficCourt #201Poplar`;
}

function generateBlogContent(
  weekRange: string,
  metrics: TrafficMetrics,
  breakdown: Array<{ type: string; count: number; percentage: number }>,
  hotspots: EnforcementHotspot[],
  weather: ReturnType<typeof getTrafficWeather>,
  taskforceRate: number,
  changeText: string
): string {
  const totalCitations = calculateTotalCitations(metrics);

  const breakdownHtml = breakdown
    .map(
      (v) =>
        `<li><strong>${v.type}:</strong> ${v.count.toLocaleString()} citations (${v.percentage}%)</li>`
    )
    .join('\n');

  const hotspotsHtml =
    hotspots.length > 0
      ? hotspots
          .map((h) => `<li><strong>${h.location_name}:</strong> ${h.citation_count} citations</li>`)
          .join('\n')
      : '<li>Data not available this week</li>';

  return `# Memphis Traffic Weather Report: ${weekRange}

## ${weather.emoji} This Week's Forecast: ${weather.label}

${weather.description}

Memphis law enforcement issued **${totalCitations.toLocaleString()} traffic citations** this week${changeText ? `, ${changeText}` : ''}. Here's everything you need to know about traffic enforcement in the Memphis area.

## Citation Breakdown

<ul>
${breakdownHtml}
</ul>

## Enforcement Hotspots

Where are police focusing their efforts? Here are this week's top enforcement locations:

<ul>
${hotspotsHtml}
</ul>

## Court Statistics

- **Total Court Appearances:** ${metrics.total_court_appearances.toLocaleString()}
- **Dismissal Rate:** ${metrics.dismissal_rate}%
- **Average Fine Amount:** $${metrics.average_fine_amount}

## What This Means For You

${
  weather.level === 'stormy' || weather.level === 'rainy'
    ? `With ${weather.level === 'stormy' ? 'very high' : 'above average'} enforcement activity, it's especially important to follow all traffic laws. Keep your speed in check, come to complete stops, and make sure your registration and insurance are up to date.`
    : `Enforcement is at ${weather.level === 'sunny' ? 'below average' : 'normal'} levels, but that doesn't mean you should let your guard down. Always follow traffic laws and drive safely.`
}

## Got a Ticket?

If you've received a traffic citation in Memphis or Shelby County, TaskForce Tickets can help. Our team has a **${taskforceRate}% success rate** getting tickets dismissed.

**Why choose TaskForce Tickets?**
- We appear in court so you don't have to
- No conviction means no points on your license
- Protect your insurance rates
- Affordable flat-rate pricing

[Check your eligibility now](/intake) and see if we can help with your ticket.

---

*This report is compiled from public records and enforcement data. TaskForce Tickets provides this information as a public service to Memphis drivers.*`;
}

/**
 * Generate a quick alert for unusual enforcement activity
 */
export function generateEnforcementAlert(
  location: string,
  citationCount: number,
  violationType: string
): string {
  return `🚨 ENFORCEMENT ALERT 🚨

Heavy traffic enforcement reported at ${location}.

${citationCount} ${violationType} citations issued in the past week at this location.

Drive carefully and follow all traffic laws.

#Memphis #TrafficAlert #DriveSafe`;
}

/**
 * Generate end-of-month summary
 */
export function generateMonthlySummary(monthlyMetrics: TrafficMetrics[]): string {
  const totalCitations = monthlyMetrics.reduce((sum, m) => sum + calculateTotalCitations(m), 0);
  const avgDismissalRate =
    monthlyMetrics.reduce((sum, m) => sum + m.dismissal_rate, 0) / monthlyMetrics.length;
  const totalTaskforceCases = monthlyMetrics.reduce((sum, m) => sum + m.taskforce_cases_filed, 0);
  const totalDismissals = monthlyMetrics.reduce((sum, m) => sum + m.taskforce_dismissals, 0);

  return `📊 MEMPHIS TRAFFIC: MONTHLY RECAP

Total Citations: ${totalCitations.toLocaleString()}
Average Dismissal Rate: ${Math.round(avgDismissalRate)}%
TaskForce Cases: ${totalTaskforceCases}
TaskForce Dismissals: ${totalDismissals}
Success Rate: ${totalTaskforceCases > 0 ? Math.round((totalDismissals / totalTaskforceCases) * 100) : 0}%

Another month of helping Memphis drivers protect their records.

Got a ticket? We can help.
taskforcetickets.com`;
}
