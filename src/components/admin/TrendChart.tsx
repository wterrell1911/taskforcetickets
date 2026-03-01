'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface TrendData {
  date: string;
  enforcement: number;
  intake: number;
}

interface TrendChartProps {
  data: TrendData[];
  title?: string;
}

export function TrendChart({ data, title = 'Enforcement vs. Intake Trends' }: TrendChartProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#E5E5E5] p-6">
      <h3 className="font-semibold text-[#1A1A1A] mb-6">{title}</h3>
      <div className="h-80">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fontSize: 12 }}
                stroke="#4A4A4A"
              />
              <YAxis tick={{ fontSize: 12 }} stroke="#4A4A4A" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E5E5E5',
                  borderRadius: '8px',
                }}
                labelFormatter={formatDate}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="enforcement"
                stroke="#CF2A27"
                strokeWidth={2}
                name="Enforcement"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="intake"
                stroke="#FFD100"
                strokeWidth={2}
                name="Our Intake"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-[#4A4A4A]">
            No trend data available
          </div>
        )}
      </div>
    </div>
  );
}
