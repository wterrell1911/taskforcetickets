'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { TrendChart } from '@/components/admin/TrendChart';

interface TrendData {
  date: string;
  enforcement: number;
  intake: number;
}

export default function TrendsPage() {
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [days, setDays] = useState(90);
  const [groupBy, setGroupBy] = useState<'day' | 'week'>('day');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/analytics?type=trends&days=${days}&groupBy=${groupBy}`);
        const data = await res.json();
        setTrends(data.data || []);
      } catch (error) {
        console.error('Failed to fetch trend data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [days, groupBy]);

  // Calculate summary stats
  const totalEnforcement = trends.reduce((sum, t) => sum + t.enforcement, 0);
  const totalIntake = trends.reduce((sum, t) => sum + t.intake, 0);
  const avgDailyEnforcement = trends.length > 0 ? Math.round(totalEnforcement / trends.length) : 0;
  const avgDailyIntake = trends.length > 0 ? Math.round(totalIntake / trends.length) : 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A]">Trend Analysis</h1>
            <p className="text-[#4A4A4A] mt-1">
              Enforcement and intake volume over time
            </p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as 'day' | 'week')}
              className="px-4 py-2 border border-[#E5E5E5] rounded-lg bg-white focus:outline-none focus:border-[#FFD100]"
            >
              <option value="day">Daily</option>
              <option value="week">Weekly</option>
            </select>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="px-4 py-2 border border-[#E5E5E5] rounded-lg bg-white focus:outline-none focus:border-[#FFD100]"
            >
              <option value={30}>Last 30 days</option>
              <option value={60}>Last 60 days</option>
              <option value={90}>Last 90 days</option>
              <option value={180}>Last 6 months</option>
              <option value={365}>Last year</option>
            </select>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-[#E5E5E5]">
            <p className="text-sm text-[#4A4A4A]">Total Enforcement</p>
            <p className="text-2xl font-bold text-[#1A1A1A] mt-1">
              {totalEnforcement.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-[#E5E5E5]">
            <p className="text-sm text-[#4A4A4A]">Total Intake</p>
            <p className="text-2xl font-bold text-[#1A1A1A] mt-1">
              {totalIntake.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-[#E5E5E5]">
            <p className="text-sm text-[#4A4A4A]">Avg Daily Enforcement</p>
            <p className="text-2xl font-bold text-[#1A1A1A] mt-1">{avgDailyEnforcement}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-[#E5E5E5]">
            <p className="text-sm text-[#4A4A4A]">Avg Daily Intake</p>
            <p className="text-2xl font-bold text-[#1A1A1A] mt-1">{avgDailyIntake}</p>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl p-8 shadow-sm border border-[#E5E5E5] animate-pulse">
            <div className="h-80 bg-[#E5E5E5] rounded" />
          </div>
        ) : (
          <TrendChart
            data={trends}
            title={`${groupBy === 'day' ? 'Daily' : 'Weekly'} Trends - Last ${days} Days`}
          />
        )}

        {/* Insights */}
        <div className="bg-[#FFD100]/10 rounded-xl p-6 border border-[#FFD100]/30">
          <h3 className="font-semibold text-[#1A1A1A] mb-3">Insights</h3>
          <ul className="space-y-2 text-sm text-[#4A4A4A]">
            <li>
              • Peak enforcement typically occurs on weekdays, especially Tuesday-Thursday
            </li>
            <li>
              • Weekend enforcement volume is generally 40-50% lower than weekdays
            </li>
            <li>
              • Our intake tends to lag enforcement by 1-2 days as people receive citations and seek help
            </li>
            <li>
              • Month-end often shows increased enforcement activity (quota patterns)
            </li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}
