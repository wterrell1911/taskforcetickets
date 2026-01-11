import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  className?: string;
}

export function StatCard({ title, value, subtitle, trend, className }: StatCardProps) {
  return (
    <div className={cn('bg-white rounded-xl p-6 shadow-sm border border-[#E5E5E5]', className)}>
      <p className="text-sm text-[#4A4A4A] mb-1">{title}</p>
      <div className="flex items-end gap-3">
        <p className="text-3xl font-bold text-[#1A1A1A]">{value}</p>
        {trend && (
          <span
            className={cn(
              'text-sm font-medium flex items-center gap-1 mb-1',
              trend.direction === 'up' ? 'text-emerald-600' : 'text-[#CF2A27]'
            )}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={trend.direction === 'up' ? 'M5 10l7-7m0 0l7 7m-7-7v18' : 'M19 14l-7 7m0 0l-7-7m7 7V3'}
              />
            </svg>
            {trend.value}%
          </span>
        )}
      </div>
      {subtitle && <p className="text-sm text-[#4A4A4A] mt-1">{subtitle}</p>}
    </div>
  );
}
