'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { DistributionChart } from '@/components/admin/DistributionChart';
import { StatCard } from '@/components/admin/StatCard';

interface OutcomeData {
  code: string;
  label: string;
  count: number;
  percent: number;
}

export default function DistributionPage() {
  const [outcomes, setOutcomes] = useState<OutcomeData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/admin/analytics?type=distribution');
        const data = await res.json();
        setOutcomes(data.data || []);
      } catch (error) {
        console.error('Failed to fetch outcome data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const find = (code: string) => outcomes.find((o) => o.code === code);
  const total = outcomes.reduce((s, o) => s + o.count, 0);
  const citations = find('CITATION');
  const warnings = (find('ADV')?.count || 0) + (find('CTSY')?.count || 0);
  const warningsPct = total > 0 ? Math.round((warnings / total) * 1000) / 10 : 0;
  const arrests = find('ARREST');

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Stop Outcomes</h1>
          <p className="text-[#4A4A4A] mt-1">
            How Memphis traffic stops are resolved. The source data records the
            outcome of each stop (citation, warning, arrest&hellip;), not the
            specific violation.
          </p>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl p-8 shadow-sm border border-[#E5E5E5] animate-pulse">
            <div className="h-80 bg-[#E5E5E5] rounded" />
          </div>
        ) : (
          <>
            {/* Headline outcomes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <StatCard
                title="Citations Issued"
                value={(citations?.count || 0).toLocaleString()}
                subtitle={`${(citations?.percent || 0).toFixed(1)}% of stops — your addressable market`}
              />
              <StatCard
                title="Warnings"
                value={warnings.toLocaleString()}
                subtitle={`${warningsPct.toFixed(1)}% advised or courtesy`}
              />
              <StatCard
                title="Arrests"
                value={(arrests?.count || 0).toLocaleString()}
                subtitle={`${(arrests?.percent || 0).toFixed(1)}% of stops`}
              />
            </div>

            <DistributionChart data={outcomes} />

            {/* Detailed table */}
            <div className="bg-white rounded-xl shadow-sm border border-[#E5E5E5] overflow-hidden">
              <div className="p-4 border-b border-[#E5E5E5]">
                <h3 className="font-semibold text-[#1A1A1A]">All Outcomes</h3>
              </div>
              <table className="w-full">
                <thead className="bg-[#F8F8F8] border-b border-[#E5E5E5]">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A1A1A]">
                      Outcome
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A1A1A]">
                      Code
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-[#1A1A1A]">
                      Count
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-[#1A1A1A]">
                      Share
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5E5]/50">
                  {outcomes.map((row) => (
                    <tr key={row.code} className="hover:bg-[#F8F8F8]">
                      <td className="px-4 py-3 font-medium text-[#1A1A1A]">{row.label}</td>
                      <td className="px-4 py-3 text-[#4A4A4A]">
                        <code className="text-xs">{row.code}</code>
                      </td>
                      <td className="px-4 py-3 text-right text-[#4A4A4A]">
                        {row.count.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-[#4A4A4A]">
                        {row.percent.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
