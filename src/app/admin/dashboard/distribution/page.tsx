'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { DistributionChart } from '@/components/admin/DistributionChart';

interface DistributionData {
  category: string;
  enforcementCount: number;
  enforcementPercent: number;
  intakeCount: number;
  intakePercent: number;
  gap: number;
}

const categoryLabels: Record<string, string> = {
  speed: 'Speeding',
  equipment: 'Equipment',
  registration: 'Registration',
  license: 'License',
  insurance: 'Insurance',
  other: 'Other',
};

export default function DistributionPage() {
  const [distribution, setDistribution] = useState<DistributionData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/admin/analytics?type=distribution');
        const data = await res.json();
        setDistribution(data.data || []);
      } catch (error) {
        console.error('Failed to fetch distribution data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const underrepresented = distribution.filter((d) => d.gap > 2).sort((a, b) => b.gap - a.gap);
  const overrepresented = distribution.filter((d) => d.gap < -2).sort((a, b) => a.gap - b.gap);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Offense Distribution</h1>
          <p className="text-[#4A4A4A] mt-1">
            Compare enforcement patterns vs. our intake mix
          </p>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl p-8 shadow-sm border border-[#E5E5E5] animate-pulse">
            <div className="h-80 bg-[#E5E5E5] rounded" />
          </div>
        ) : (
          <>
            <DistributionChart data={distribution} />

            {/* Detailed table */}
            <div className="bg-white rounded-xl shadow-sm border border-[#E5E5E5] overflow-hidden">
              <div className="p-4 border-b border-[#E5E5E5]">
                <h3 className="font-semibold text-[#1A1A1A]">Detailed Breakdown</h3>
              </div>
              <table className="w-full">
                <thead className="bg-[#F8F8F8] border-b border-[#E5E5E5]">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-[#1A1A1A]">
                      Category
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-[#1A1A1A]">
                      Enforcement Count
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-[#1A1A1A]">
                      Enforcement %
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-[#1A1A1A]">
                      Intake Count
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-[#1A1A1A]">
                      Intake %
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-[#1A1A1A]">
                      Gap
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5E5]/50">
                  {distribution.map((row) => (
                    <tr key={row.category} className="hover:bg-[#F8F8F8]">
                      <td className="px-4 py-3 font-medium text-[#1A1A1A]">
                        {categoryLabels[row.category]}
                      </td>
                      <td className="px-4 py-3 text-right text-[#4A4A4A]">
                        {row.enforcementCount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-[#4A4A4A]">
                        {row.enforcementPercent.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-right text-[#4A4A4A]">
                        {row.intakeCount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-[#4A4A4A]">
                        {row.intakePercent.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            row.gap > 2
                              ? 'bg-[#FFD100]/20 text-[#1A1A1A]'
                              : row.gap < -2
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-[#F8F8F8] text-[#4A4A4A]'
                          }`}
                        >
                          {row.gap > 0 ? '+' : ''}
                          {row.gap.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Recommendations */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-[#FFD100]/10 rounded-xl p-6 border border-[#FFD100]/30">
                <h3 className="font-semibold text-[#1A1A1A] mb-3">Underrepresented (Opportunity)</h3>
                <p className="text-sm text-[#4A4A4A] mb-4">
                  These offense types make up more of enforcement than our intake - potential
                  marketing focus areas:
                </p>
                {underrepresented.length > 0 ? (
                  <ul className="space-y-2">
                    {underrepresented.map((d) => (
                      <li key={d.category} className="flex justify-between text-sm">
                        <span className="text-[#1A1A1A]">{categoryLabels[d.category]}</span>
                        <span className="font-medium text-[#4A4A4A]">+{d.gap.toFixed(1)}% gap</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-[#4A4A4A]">All categories well represented</p>
                )}
              </div>

              <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-200">
                <h3 className="font-semibold text-emerald-900 mb-3">
                  Overrepresented (Strong Market)
                </h3>
                <p className="text-sm text-emerald-800 mb-4">
                  These offense types are well-captured in our intake relative to enforcement:
                </p>
                {overrepresented.length > 0 ? (
                  <ul className="space-y-2">
                    {overrepresented.map((d) => (
                      <li key={d.category} className="flex justify-between text-sm">
                        <span className="text-emerald-900">{categoryLabels[d.category]}</span>
                        <span className="font-medium text-emerald-700">{d.gap.toFixed(1)}% gap</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-emerald-700">No significantly overrepresented categories</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
