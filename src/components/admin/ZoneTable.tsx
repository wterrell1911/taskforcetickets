'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ZoneData {
  zone: string;
  enforcementVolume: number;
  intakeVolume: number;
  conversionRate: number;
  opportunityScore: number;
}

interface ZoneTableProps {
  data: ZoneData[];
  onExport?: () => void;
}

type SortKey = keyof ZoneData;

export function ZoneTable({ data, onExport }: ZoneTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('opportunityScore');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [filter, setFilter] = useState('');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const filteredData = data.filter((row) =>
    row.zone.toLowerCase().includes(filter.toLowerCase())
  );

  const sortedData = [...filteredData].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];
    const modifier = sortDir === 'asc' ? 1 : -1;
    return aVal < bVal ? -modifier : aVal > bVal ? modifier : 0;
  });

  const SortHeader = ({ label, sortKeyName }: { label: string; sortKeyName: SortKey }) => (
    <th
      className="px-4 py-3 text-left text-sm font-semibold text-[#1A1A1A] cursor-pointer hover:bg-[#F8F8F8]"
      onClick={() => handleSort(sortKeyName)}
    >
      <div className="flex items-center gap-2">
        {label}
        {sortKey === sortKeyName && (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={sortDir === 'asc' ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'}
            />
          </svg>
        )}
      </div>
    </th>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#E5E5E5]">
      <div className="p-4 border-b border-[#E5E5E5] flex items-center justify-between">
        <h3 className="font-semibold text-[#1A1A1A]">Market Gap Analysis</h3>
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Filter zones..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-[#E5E5E5] rounded-lg text-sm focus:outline-none focus:border-[#FFD100]"
          />
          {onExport && (
            <button
              onClick={onExport}
              className="px-4 py-2 bg-[#1A1A1A] text-white rounded-lg text-sm font-medium hover:bg-[#1A1A1A]/90"
            >
              Export CSV
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#F8F8F8] border-b border-[#E5E5E5]">
            <tr>
              <SortHeader label="Zone" sortKeyName="zone" />
              <SortHeader label="Enforcement Vol." sortKeyName="enforcementVolume" />
              <SortHeader label="Our Intake Vol." sortKeyName="intakeVolume" />
              <SortHeader label="Conversion %" sortKeyName="conversionRate" />
              <SortHeader label="Opportunity Score" sortKeyName="opportunityScore" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E5E5]/50">
            {sortedData.map((row) => (
              <tr key={row.zone} className="hover:bg-[#F8F8F8]">
                <td className="px-4 py-3 font-medium text-[#1A1A1A]">{row.zone}</td>
                <td className="px-4 py-3 text-[#4A4A4A]">{row.enforcementVolume.toLocaleString()}</td>
                <td className="px-4 py-3 text-[#4A4A4A]">{row.intakeVolume.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      'px-2 py-1 rounded-full text-xs font-medium',
                      row.conversionRate >= 10
                        ? 'bg-emerald-100 text-emerald-700'
                        : row.conversionRate >= 5
                        ? 'bg-[#FFD100]/20 text-[#1A1A1A]'
                        : 'bg-[#CF2A27]/10 text-[#CF2A27]'
                    )}
                  >
                    {row.conversionRate.toFixed(1)}%
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-[#E5E5E5] rounded-full h-2 max-w-24">
                      <div
                        className="bg-[#FFD100] h-2 rounded-full"
                        style={{
                          width: `${Math.min((row.opportunityScore / Math.max(...data.map((d) => d.opportunityScore))) * 100, 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-[#4A4A4A]">{row.opportunityScore}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sortedData.length === 0 && (
        <div className="p-8 text-center text-[#4A4A4A]">
          No data available. Sync enforcement data or add manual entries to begin analysis.
        </div>
      )}
    </div>
  );
}
