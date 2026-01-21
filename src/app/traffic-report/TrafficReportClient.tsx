'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface WeatherData {
  level: 'sunny' | 'cloudy' | 'rainy' | 'stormy';
  label: string;
  description: string;
  emoji: string;
}

interface ViolationBreakdown {
  type: string;
  count: number;
  percentage: number;
}

interface TrendData {
  week: string;
  weekStart: string;
  totalStops: number;
}

interface TaskforceStats {
  totalCases: number;
  dismissedCases: number;
  successRate: number;
}

interface CurrentWeekData {
  weekStart: string;
  weekEnd: string;
  weekRange: string;
  totalStops: number;
  weekOverWeekChange: number;
  weather: WeatherData;
  breakdown: ViolationBreakdown[];
  hotspots: Array<{ location: string; count: number; precinct: string }>;
  taskforceStats: TaskforceStats | null;
}

interface TrafficReportData {
  currentWeek: CurrentWeekData;
  report: {
    headline: string;
    summary: string;
  } | null;
  trends: TrendData[];
}

const weatherColors = {
  sunny: 'bg-amber-100 border-amber-300 text-amber-800',
  cloudy: 'bg-slate-100 border-slate-300 text-slate-700',
  rainy: 'bg-blue-100 border-blue-300 text-blue-800',
  stormy: 'bg-purple-100 border-purple-300 text-purple-800',
};

const weatherBg = {
  sunny: 'from-amber-50 to-yellow-50',
  cloudy: 'from-slate-50 to-gray-50',
  rainy: 'from-blue-50 to-cyan-50',
  stormy: 'from-purple-50 to-indigo-50',
};

export default function TrafficReportClient() {
  const [data, setData] = useState<TrafficReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReport();
  }, []);

  async function fetchReport() {
    try {
      const res = await fetch('/api/traffic-report');
      if (!res.ok) {
        throw new Error('No data available');
      }
      const reportData = await res.json();
      setData(reportData);
    } catch (err) {
      setError('Traffic data not yet available. Check back soon!');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F8F8] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A1A1A]"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#F8F8F8]">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-[#1A1A1A] mb-4">
              Memphis Traffic Weather Report
            </h1>
            <p className="text-[#4A4A4A] mb-8">{error}</p>
            <Link
              href="/"
              className="inline-block bg-[#FFD100] text-[#1A1A1A] px-8 py-3 rounded-lg font-semibold hover:bg-[#FFD100]/90"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { currentWeek, trends } = data;
  const weather = currentWeek.weather;

  return (
    <div className="min-h-screen bg-[#F8F8F8]">
      {/* Hero Section */}
      <section
        className={`bg-gradient-to-b ${weatherBg[weather.level]} py-16 border-b border-[#E5E5E5]`}
      >
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <p className="text-[#4A4A4A] mb-2">Week of {currentWeek.weekRange}</p>
            <h1 className="text-4xl md:text-5xl font-bold text-[#1A1A1A] mb-4">
              Memphis Traffic Weather
            </h1>
          </div>

          {/* Weather Card */}
          <div
            className={`max-w-xl mx-auto rounded-2xl border-2 p-8 text-center ${weatherColors[weather.level]}`}
          >
            <span className="text-6xl mb-4 block">{weather.emoji}</span>
            <h2 className="text-2xl font-bold mb-2">{weather.label}</h2>
            <p className="text-lg">{weather.description}</p>
          </div>

          {/* Key Stats */}
          <div className={`grid ${currentWeek.taskforceStats ? 'md:grid-cols-2' : 'md:grid-cols-1 max-w-md mx-auto'} gap-6 mt-8`}>
            <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-[#E5E5E5]">
              <p className="text-4xl font-bold text-[#1A1A1A]">
                {currentWeek.totalStops.toLocaleString()}
              </p>
              <p className="text-[#4A4A4A] mt-1">Traffic Stops This Week</p>
              {currentWeek.weekOverWeekChange !== 0 && (
                <p
                  className={`text-sm mt-2 font-medium ${
                    currentWeek.weekOverWeekChange > 0 ? 'text-red-600' : 'text-emerald-600'
                  }`}
                >
                  {currentWeek.weekOverWeekChange > 0 ? '+' : ''}
                  {currentWeek.weekOverWeekChange}% vs last week
                </p>
              )}
            </div>
            {currentWeek.taskforceStats && (
              <div className="bg-white rounded-xl p-6 text-center shadow-sm border border-[#E5E5E5]">
                <p className="text-4xl font-bold text-emerald-600">
                  {currentWeek.taskforceStats.successRate}%
                </p>
                <p className="text-[#4A4A4A] mt-1">TaskForce Dismissal Rate</p>
                <p className="text-xs text-[#4A4A4A] mt-1">
                  Based on {currentWeek.taskforceStats.totalCases} resolved cases
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Citation Breakdown */}
      <section className="py-12 border-b border-[#E5E5E5]">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-[#1A1A1A] mb-6">Citation Breakdown</h2>
          <div className="bg-white rounded-xl shadow-sm border border-[#E5E5E5] overflow-hidden">
            <div className="divide-y divide-[#E5E5E5]/50">
              {currentWeek.breakdown.map((v, i) => (
                <div key={i} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-2 h-8 rounded-full"
                      style={{
                        backgroundColor: `hsl(${(i * 40 + 200) % 360}, 70%, 50%)`,
                      }}
                    />
                    <span className="font-medium text-[#1A1A1A]">{v.type}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-[#1A1A1A]">{v.count.toLocaleString()}</span>
                    <span className="text-[#4A4A4A] ml-2">({v.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Enforcement Hotspots */}
      {currentWeek.hotspots.length > 0 && (
        <section className="py-12 border-b border-[#E5E5E5]">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">Enforcement Hotspots</h2>
            <p className="text-[#4A4A4A] mb-6">
              Areas with the highest enforcement activity this week
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {currentWeek.hotspots.map((h, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl p-5 shadow-sm border border-[#E5E5E5] flex items-start gap-4"
                >
                  <div className="w-10 h-10 bg-[#FFD100]/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">📍</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#1A1A1A]">{h.location}</h3>
                    <p className="text-[#4A4A4A] text-sm mt-1">
                      {h.count} stops (Precinct {h.precinct})
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trend Chart (Simple) */}
      {trends.length > 1 && (
        <section className="py-12 border-b border-[#E5E5E5]">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-2xl font-bold text-[#1A1A1A] mb-6">Weekly Trends</h2>
            <div className="bg-white rounded-xl shadow-sm border border-[#E5E5E5] p-6">
              <div className="flex items-end gap-2 h-48">
                {trends.map((t, i) => {
                  const maxStops = Math.max(...trends.map((d) => d.totalStops));
                  const height = maxStops > 0 ? (t.totalStops / maxStops) * 100 : 0;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div
                        className="w-full bg-[#FFD100] rounded-t-lg transition-all hover:bg-[#FFD100]/80"
                        style={{ height: `${height}%` }}
                        title={`${t.totalStops} stops`}
                      />
                      <span className="text-xs text-[#4A4A4A] rotate-45 origin-left whitespace-nowrap">
                        {t.week}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-8 pt-4 border-t border-[#E5E5E5]">
                <p className="text-sm text-[#4A4A4A] text-center">
                  Total traffic stops per week over the past {trends.length} weeks
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* TaskForce CTA */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-[#1A1A1A] rounded-2xl p-8 md:p-12 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">Got a Ticket This Week?</h2>
            {currentWeek.taskforceStats ? (
              <p className="text-white/80 mb-2 text-lg">
                TaskForce Tickets has a{' '}
                <span className="text-[#FFD100] font-bold">
                  {currentWeek.taskforceStats.successRate}% success rate
                </span>{' '}
                getting citations dismissed.
              </p>
            ) : (
              <p className="text-white/80 mb-2 text-lg">
                TaskForce Tickets can help get your citation dismissed.
              </p>
            )}
            <p className="text-white/60 mb-8">
              We appear in court so you don&apos;t have to. No conviction means no points on your
              license.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/intake"
                className="inline-block bg-[#FFD100] text-[#1A1A1A] px-8 py-4 rounded-lg font-bold text-lg hover:bg-[#FFD100]/90 transition-colors"
              >
                Check Your Eligibility
              </Link>
              <Link
                href="/201-poplar-guide"
                className="inline-block bg-white/10 text-white px-8 py-4 rounded-lg font-semibold hover:bg-white/20 transition-colors"
              >
                201 Poplar Guide
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Info */}
      <section className="py-8 border-t border-[#E5E5E5]">
        <div className="max-w-4xl mx-auto px-4">
          <p className="text-sm text-[#4A4A4A] text-center">
            This report is compiled from public records and enforcement data. TaskForce Tickets
            provides this information as a public service to Memphis drivers. Data is updated
            weekly.
          </p>
          <div className="flex justify-center gap-6 mt-4">
            <Link href="/" className="text-sm text-[#1A1A1A] hover:text-[#FFD100]">
              Home
            </Link>
            <Link href="/intake" className="text-sm text-[#1A1A1A] hover:text-[#FFD100]">
              Submit a Ticket
            </Link>
            <Link href="/201-poplar-guide" className="text-sm text-[#1A1A1A] hover:text-[#FFD100]">
              Court Guide
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
