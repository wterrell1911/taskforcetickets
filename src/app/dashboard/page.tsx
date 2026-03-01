'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface DashboardData {
  period: string;
  startDate: string;
  endDate: string;
  ga4: {
    sessions: number;
    users: number;
    pageviews: number;
    bounceRate: number;
    avgSessionDuration: number;
    topPages: Array<{ path: string; views: number }>;
    trafficSources: Array<{ source: string; sessions: number }>;
  } | null;
  searchConsole: {
    totalClicks: number;
    totalImpressions: number;
    avgCTR: number;
    avgPosition: number;
    topQueries: Array<{
      query: string;
      clicks: number;
      impressions: number;
      ctr: number;
      position: number;
    }>;
  } | null;
  callRail: {
    totalCalls: number;
    uniqueCallers: number;
    avgDuration: number;
    callsByDay: Array<{ date: string; count: number }>;
    recentCalls: Array<{
      id: string;
      callerName: string | null;
      callerNumber: string;
      duration: number;
      source: string;
      startedAt: string;
    }>;
  } | null;
  leads: {
    recent: Array<{
      id: string;
      name: string;
      source_type: string;
      marketing_source: string;
      created_at: string;
    }>;
    total: number;
    bySource: Array<{ source: string; count: number }>;
  };
  connected: {
    ga4: boolean;
    searchConsole: boolean;
    callRail: boolean;
  };
}

const COLORS = ['#FFD100', '#1A1A1A', '#4A4A4A', '#888888', '#CCCCCC'];

function KPICard({
  title,
  value,
  subtitle,
  connected = true,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  connected?: boolean;
}) {
  if (!connected) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-sm font-medium text-gray-500 mb-2">{title}</h3>
        <p className="text-gray-400 text-sm">Not Connected</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-sm font-medium text-gray-500 mb-2">{title}</h3>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const response = await fetch(`/api/dashboard/metrics?period=${period}`);
        const json = await response.json();
        setData(json);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [period]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded-xl mb-8"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Error loading dashboard data</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Marketing Dashboard</h1>
            <p className="text-gray-500">
              {data.startDate} to {data.endDate}
            </p>
          </div>
          <div className="flex gap-2">
            {['7d', '30d', '90d'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  period === p
                    ? 'bg-[#FFD100] text-black'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <KPICard title="Total Leads" value={data.leads.total} />
          <KPICard
            title="Phone Calls"
            value={data.callRail?.totalCalls || 0}
            subtitle={`${data.callRail?.uniqueCallers || 0} unique callers`}
            connected={data.connected.callRail}
          />
          <KPICard
            title="Form Submissions"
            value={data.leads.bySource.find((s) => s.source === 'form')?.count || 0}
          />
          <KPICard
            title="Website Sessions"
            value={data.ga4?.sessions.toLocaleString() || 0}
            connected={data.connected.ga4}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Calls Over Time */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold mb-4">Calls Over Time</h3>
            {data.connected.callRail && data.callRail?.callsByDay ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={data.callRail.callsByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#FFD100" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                CallRail not connected
              </div>
            )}
          </div>

          {/* Lead Sources Pie Chart */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold mb-4">Lead Sources</h3>
            {data.leads.bySource.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={data.leads.bySource}
                    dataKey="count"
                    nameKey="source"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  >
                    {data.leads.bySource.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                No lead data yet
              </div>
            )}
          </div>
        </div>

        {/* Tables Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Keywords */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold mb-4">Top Keywords</h3>
            {data.connected.searchConsole && data.searchConsole?.topQueries ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-500 border-b">
                      <th className="pb-2">Keyword</th>
                      <th className="pb-2 text-right">Clicks</th>
                      <th className="pb-2 text-right">Position</th>
                      <th className="pb-2 text-right">CTR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.searchConsole.topQueries.slice(0, 10).map((query, i) => (
                      <tr key={i} className="border-b border-gray-50">
                        <td className="py-2 text-sm">{query.query}</td>
                        <td className="py-2 text-sm text-right">{query.clicks}</td>
                        <td className="py-2 text-sm text-right">{query.position.toFixed(1)}</td>
                        <td className="py-2 text-sm text-right">{(query.ctr * 100).toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                Search Console not connected
              </div>
            )}
          </div>

          {/* Recent Leads */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold mb-4">Recent Leads</h3>
            {data.leads.recent.length > 0 ? (
              <div className="space-y-3">
                {data.leads.recent.map((lead) => (
                  <div key={lead.id} className="flex justify-between items-center py-2 border-b border-gray-50">
                    <div>
                      <p className="font-medium text-sm">{lead.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">
                        {lead.source_type} • {lead.marketing_source}
                      </p>
                    </div>
                    <p className="text-xs text-gray-400">{formatDate(lead.created_at)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                No leads yet
              </div>
            )}
          </div>
        </div>

        {/* Call Log */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold mb-4">Recent Calls</h3>
          {data.connected.callRail && data.callRail?.recentCalls ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b">
                    <th className="pb-2">Caller</th>
                    <th className="pb-2">Phone</th>
                    <th className="pb-2">Source</th>
                    <th className="pb-2 text-right">Duration</th>
                    <th className="pb-2 text-right">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {data.callRail.recentCalls.map((call) => (
                    <tr key={call.id} className="border-b border-gray-50">
                      <td className="py-2 text-sm">{call.callerName || 'Unknown'}</td>
                      <td className="py-2 text-sm">{call.callerNumber}</td>
                      <td className="py-2 text-sm">{call.source}</td>
                      <td className="py-2 text-sm text-right">{formatDuration(call.duration)}</td>
                      <td className="py-2 text-sm text-right">{formatDate(call.startedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center text-gray-400">
              CallRail not connected
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-400">
          <p>Powered by 302 Digital Advisory</p>
        </div>
      </div>
    </div>
  );
}
