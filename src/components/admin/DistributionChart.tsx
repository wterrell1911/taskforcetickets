'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface OutcomeData {
  code: string;
  label: string;
  count: number;
  percent: number;
}

interface DistributionChartProps {
  data: OutcomeData[];
}

// Citations are the addressable market — highlight them; everything else muted.
function barColor(code: string): string {
  if (code === 'CITATION') return '#CF2A27';
  if (code === 'ADV' || code === 'CTSY') return '#FFD100';
  return '#9CA3AF';
}

export function DistributionChart({ data }: DistributionChartProps) {
  // Show the most significant outcomes; collapse the long tail into "Other".
  const TOP = 7;
  const sorted = [...data].sort((a, b) => b.count - a.count);
  const head = sorted.slice(0, TOP);
  const tail = sorted.slice(TOP);
  const chartData = [...head];
  if (tail.length > 0) {
    chartData.push({
      code: 'OTHER',
      label: `Other (${tail.length} codes)`,
      count: tail.reduce((s, d) => s + d.count, 0),
      percent: Math.round(tail.reduce((s, d) => s + d.percent, 0) * 10) / 10,
    });
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#E5E5E5] p-6">
      <h3 className="font-semibold text-[#1A1A1A] mb-2">Stop Outcomes</h3>
      <p className="text-sm text-[#4A4A4A] mb-6">
        How Memphis traffic stops are resolved (by disposition code)
      </p>
      <div className="h-80">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
              <XAxis type="number" unit="%" tick={{ fontSize: 12 }} stroke="#4A4A4A" />
              <YAxis
                dataKey="label"
                type="category"
                tick={{ fontSize: 12 }}
                stroke="#4A4A4A"
                width={150}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E5E5E5',
                  borderRadius: '8px',
                }}
                formatter={(value, _name, item) => [
                  `${Number(value).toFixed(1)}% (${item?.payload?.count?.toLocaleString()} stops)`,
                  'Share',
                ]}
              />
              <Bar dataKey="percent" name="Share">
                {chartData.map((d) => (
                  <Cell key={d.code} fill={barColor(d.code)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-[#4A4A4A]">
            No outcome data available
          </div>
        )}
      </div>
    </div>
  );
}
