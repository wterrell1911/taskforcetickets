'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatCard } from '@/components/admin/StatCard';
import { ZoneTable } from '@/components/admin/ZoneTable';
import { TrendChart } from '@/components/admin/TrendChart';

interface Summary {
  totalEnforcement: number;
  totalIntake: number;
  overallConversionRate: string;
  topOpportunityZones: {
    zone: string;
    enforcementVolume: number;
    intakeVolume: number;
    conversionRate: number;
    opportunityScore: number;
  }[];
}

interface TrendData {
  date: string;
  enforcement: number;
  intake: number;
}

interface TrafficStats {
  totalRecords: number;
  lastUpdated: string;
  citationRate: number;
  warningRate: number;
  topPrecincts: Array<{ name: string; count: number }>;
  topZipCodes: Array<{ zip: string; count: number }>;
  topDistricts: Array<{ name: string; count: number }>;
  yearlyTrend: Array<{ year: number; count: number }>;
}

export default function AdminDashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [trafficStats, setTrafficStats] = useState<TrafficStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [summaryRes, trendsRes, trafficRes] = await Promise.all([
          fetch('/api/admin/analytics?type=summary&days=90'),
          fetch('/api/admin/analytics?type=trends&days=30&groupBy=day'),
          fetch('/api/admin/traffic-stats'),
        ]);

        const summaryData = await summaryRes.json();
        const trendsData = await trendsRes.json();
        const trafficData = await trafficRes.json();

        setSummary(summaryData.summary);
        setTrends(trendsData.data || []);
        if (trafficData.totalRecords > 0) {
          setTrafficStats(trafficData);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleExport = () => {
    window.location.href = '/api/admin/analytics/export?days=90';
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Analytics Overview</h1>
          <p className="text-[#4A4A4A] mt-1">
            Enforcement intelligence for Memphis &amp; Shelby County
          </p>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="grid grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-[#E5E5E5] animate-pulse">
                <div className="h-4 bg-[#E5E5E5] rounded w-1/2 mb-3" />
                <div className="h-8 bg-[#E5E5E5] rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-6">
            <StatCard
              title="Total Enforcement Records"
              value={summary?.totalEnforcement.toLocaleString() || '0'}
              subtitle="Last 90 days"
            />
            <StatCard
              title="Our Intake Volume"
              value={summary?.totalIntake.toLocaleString() || '0'}
              subtitle="Last 90 days"
            />
            <StatCard
              title="Overall Conversion"
              value={`${summary?.overallConversionRate || '0'}%`}
              subtitle="Intake / Enforcement"
            />
            <StatCard
              title="Top Opportunity Zone"
              value={summary?.topOpportunityZones[0]?.zone || 'N/A'}
              subtitle={`Score: ${summary?.topOpportunityZones[0]?.opportunityScore || 0}`}
            />
          </div>
        )}

        {/* Trend Chart */}
        <TrendChart data={trends} title="30-Day Enforcement vs. Intake Trends" />

        {/* Zone Analysis Table */}
        <ZoneTable
          data={summary?.topOpportunityZones || []}
          onExport={handleExport}
        />

        {/* MPD Traffic Stats */}
        {trafficStats && (
          <div className="bg-white rounded-xl shadow-sm border border-[#E5E5E5] p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-[#1A1A1A]">MPD Traffic Stops Data</h2>
                <p className="text-sm text-[#4A4A4A]">
                  {trafficStats.totalRecords.toLocaleString()} records • Last updated{' '}
                  {new Date(trafficStats.lastUpdated).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#1A1A1A]">{trafficStats.citationRate}%</p>
                  <p className="text-xs text-[#4A4A4A]">Citations</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#4A4A4A]">{trafficStats.warningRate}%</p>
                  <p className="text-xs text-[#4A4A4A]">Warnings</p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Top Precincts */}
              <div>
                <h3 className="text-sm font-medium text-[#4A4A4A] mb-3">Top Precincts</h3>
                <div className="space-y-2">
                  {trafficStats.topPrecincts.slice(0, 5).map((p, i) => (
                    <div key={p.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-[#FFD100]/20 rounded text-xs flex items-center justify-center font-medium">
                          {i + 1}
                        </span>
                        <span className="text-sm text-[#1A1A1A]">{p.name}</span>
                      </div>
                      <span className="text-sm text-[#4A4A4A]">{p.count.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top ZIP Codes */}
              <div>
                <h3 className="text-sm font-medium text-[#4A4A4A] mb-3">Top ZIP Codes</h3>
                <div className="space-y-2">
                  {trafficStats.topZipCodes.slice(0, 5).map((z, i) => (
                    <div key={z.zip} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-[#FFD100]/20 rounded text-xs flex items-center justify-center font-medium">
                          {i + 1}
                        </span>
                        <span className="text-sm text-[#1A1A1A]">{z.zip}</span>
                      </div>
                      <span className="text-sm text-[#4A4A4A]">{z.count.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Yearly Trend */}
              <div>
                <h3 className="text-sm font-medium text-[#4A4A4A] mb-3">By Year</h3>
                <div className="space-y-2">
                  {trafficStats.yearlyTrend
                    .filter(y => y.year >= 2021 && y.year <= 2025)
                    .reverse()
                    .map((y) => {
                      const maxCount = Math.max(...trafficStats.yearlyTrend.map(t => t.count));
                      const pct = (y.count / maxCount) * 100;
                      return (
                        <div key={y.year}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-[#1A1A1A]">{y.year}</span>
                            <span className="text-[#4A4A4A]">{y.count.toLocaleString()}</span>
                          </div>
                          <div className="h-2 bg-[#E5E5E5] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#FFD100] rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-6">
          <a
            href="/admin/dashboard/sync"
            className="bg-white rounded-xl p-6 shadow-sm border border-[#E5E5E5] hover:border-[#FFD100] transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#FFD100]/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-[#1A1A1A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-[#1A1A1A]">Sync MPD Data</h3>
                <p className="text-sm text-[#4A4A4A]">Pull latest from Socrata</p>
              </div>
            </div>
          </a>

          <a
            href="/admin/manual-entry"
            className="bg-white rounded-xl p-6 shadow-sm border border-[#E5E5E5] hover:border-[#FFD100] transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#FFD100]/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-[#1A1A1A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-[#1A1A1A]">Manual Entry</h3>
                <p className="text-sm text-[#4A4A4A]">Add Shelby Co / THP data</p>
              </div>
            </div>
          </a>

          <a
            href="/admin/dashboard/zones"
            className="bg-white rounded-xl p-6 shadow-sm border border-[#E5E5E5] hover:border-[#FFD100] transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#FFD100]/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-[#1A1A1A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-[#1A1A1A]">Zone Analysis</h3>
                <p className="text-sm text-[#4A4A4A]">View detailed breakdown</p>
              </div>
            </div>
          </a>
        </div>
      </div>
    </AdminLayout>
  );
}
