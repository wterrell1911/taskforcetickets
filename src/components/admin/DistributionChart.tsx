'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface DistributionData {
  category: string;
  enforcementPercent: number;
  intakePercent: number;
  gap: number;
}

interface DistributionChartProps {
  data: DistributionData[];
}

const categoryLabels: Record<string, string> = {
  speed: 'Speeding',
  equipment: 'Equipment',
  registration: 'Registration',
  license: 'License',
  insurance: 'Insurance',
  other: 'Other',
};

export function DistributionChart({ data }: DistributionChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    name: categoryLabels[d.category] || d.category,
  }));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#E5E5E5] p-6">
      <h3 className="font-semibold text-[#1A1A1A] mb-2">Offense Distribution Comparison</h3>
      <p className="text-sm text-[#4A4A4A] mb-6">
        Compare what&apos;s being written vs. what we&apos;re processing
      </p>
      <div className="h-80">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
              <XAxis type="number" unit="%" tick={{ fontSize: 12 }} stroke="#4A4A4A" />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} stroke="#4A4A4A" width={100} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E5E5E5',
                  borderRadius: '8px',
                }}
                formatter={(value) => `${Number(value).toFixed(1)}%`}
              />
              <Legend />
              <Bar dataKey="enforcementPercent" fill="#CF2A27" name="Enforcement %" />
              <Bar dataKey="intakePercent" fill="#FFD100" name="Our Intake %" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-[#4A4A4A]">
            No distribution data available
          </div>
        )}
      </div>

      {/* Gap indicators */}
      {data.length > 0 && (
        <div className="mt-6 border-t border-[#E5E5E5] pt-4">
          <p className="text-sm font-medium text-[#1A1A1A] mb-3">Underrepresented in Intake:</p>
          <div className="flex flex-wrap gap-2">
            {data
              .filter((d) => d.gap > 2)
              .sort((a, b) => b.gap - a.gap)
              .map((d) => (
                <span
                  key={d.category}
                  className="px-3 py-1 bg-[#FFD100]/20 text-[#1A1A1A] rounded-full text-sm"
                >
                  {categoryLabels[d.category]} (+{d.gap.toFixed(1)}% gap)
                </span>
              ))}
            {data.filter((d) => d.gap > 2).length === 0 && (
              <span className="text-[#4A4A4A] text-sm">All categories well represented</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
