'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { ZoneTable } from '@/components/admin/ZoneTable';

interface ZoneData {
  zone: string;
  enforcementVolume: number;
  intakeVolume: number;
  conversionRate: number;
  opportunityScore: number;
}

export default function ZoneAnalysisPage() {
  const [zones, setZones] = useState<ZoneData[]>([]);
  const [days, setDays] = useState(90);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/analytics?type=zones&days=${days}`);
        const data = await res.json();
        setZones(data.data || []);
      } catch (error) {
        console.error('Failed to fetch zone data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [days]);

  const handleExport = () => {
    window.location.href = `/api/admin/analytics/export?days=${days}`;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A]">Zone Analysis</h1>
            <p className="text-[#4A4A4A] mt-1">
              Market gap analysis by geographic zone
            </p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="px-4 py-2 border border-[#E5E5E5] rounded-lg bg-white focus:outline-none focus:border-[#FFD100]"
            >
              <option value={30}>Last 30 days</option>
              <option value={60}>Last 60 days</option>
              <option value={90}>Last 90 days</option>
              <option value={180}>Last 180 days</option>
              <option value={365}>Last year</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl p-8 shadow-sm border border-[#E5E5E5] animate-pulse">
            <div className="h-64 bg-[#E5E5E5] rounded" />
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-3 gap-6">
              <div className="bg-[#FFD100]/10 rounded-xl p-6 border border-[#FFD100]/30">
                <h3 className="text-sm font-medium text-[#1A1A1A]">Top Marketing Opportunity</h3>
                <p className="text-2xl font-bold text-[#1A1A1A] mt-2">
                  {zones[0]?.zone || 'N/A'}
                </p>
                <p className="text-sm text-[#4A4A4A] mt-1">
                  {zones[0]?.enforcementVolume.toLocaleString() || 0} citations, only{' '}
                  {zones[0]?.conversionRate.toFixed(1) || 0}% conversion
                </p>
              </div>

              <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-200">
                <h3 className="text-sm font-medium text-emerald-800">Best Performing Zone</h3>
                <p className="text-2xl font-bold text-emerald-900 mt-2">
                  {[...zones].sort((a, b) => b.conversionRate - a.conversionRate)[0]?.zone || 'N/A'}
                </p>
                <p className="text-sm text-emerald-700 mt-1">
                  {[...zones].sort((a, b) => b.conversionRate - a.conversionRate)[0]?.conversionRate.toFixed(1) || 0}%
                  conversion rate
                </p>
              </div>

              <div className="bg-[#F8F8F8] rounded-xl p-6 border border-[#E5E5E5]">
                <h3 className="text-sm font-medium text-[#4A4A4A]">Total Zones Tracked</h3>
                <p className="text-2xl font-bold text-[#1A1A1A] mt-2">{zones.length}</p>
                <p className="text-sm text-[#4A4A4A] mt-1">
                  {zones.reduce((sum, z) => sum + z.enforcementVolume, 0).toLocaleString()} total citations
                </p>
              </div>
            </div>

            <ZoneTable data={zones} onExport={handleExport} />

            {/* Interpretation guide */}
            <div className="bg-[#F8F8F8] rounded-xl p-6 border border-[#E5E5E5]">
              <h3 className="font-semibold text-[#1A1A1A] mb-4">How to Interpret This Data</h3>
              <div className="grid md:grid-cols-2 gap-6 text-sm text-[#4A4A4A]">
                <div>
                  <h4 className="font-medium text-[#1A1A1A] mb-2">Opportunity Score</h4>
                  <p>
                    Higher scores indicate zones with high enforcement activity but low conversion
                    to our intake. These are prime targets for marketing spend.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-[#1A1A1A] mb-2">Conversion Rate</h4>
                  <p>
                    The percentage of enforcement volume that becomes our clients. A 10%+ rate
                    indicates strong market presence in that zone.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
