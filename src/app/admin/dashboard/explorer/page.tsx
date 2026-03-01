'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';

interface QueryResult {
  totalFiltered: number;
  byYear: Record<number, number>;
  byMonth: Record<string, number>;
  byPrecinct: Record<string, number>;
  byZipCode: Record<string, number>;
  byDisposition: Record<string, number>;
  byPlanningDistrict: Record<string, number>;
  byDayOfWeek: Record<number, number>;
  byHour: Record<number, number>;
  comparison?: {
    year1: number;
    year2: number;
    year1Count: number;
    year2Count: number;
    change: number;
    changePercent: number;
    byPrecinct: Array<{
      precinct: string;
      year1: number;
      year2: number;
      change: number;
      changePercent: number;
    }>;
    byMonth: Array<{
      month: number;
      year1: number;
      year2: number;
      change: number;
    }>;
  };
}

interface TrafficStats {
  totalRecords: number;
  stats: {
    byPrecinct: Record<string, number>;
    byZipCode: Record<string, number>;
    byYear: Record<number, number>;
    byPlanningDistrict: Record<string, number>;
  };
}

interface ShelbyData {
  scrapedAt: string;
  summary: {
    totalTHP: number;
    totalSheriff: number;
    totalCombined: number;
    dateRange: { start: string; end: string };
    weekCount: number;
  };
  weekly: Array<{ week: string; thp: number; sheriff: number; total: number }>;
  monthly: Array<{ month: string; thp: number; sheriff: number; total: number }>;
}

const YEARS = [2025, 2024, 2023, 2022, 2021];
const DISPOSITIONS = [
  { code: 'CITATION', label: 'Citation' },
  { code: 'ADV', label: 'Advisory/Warning' },
  { code: 'ARREST', label: 'Arrest' },
  { code: 'CIA', label: 'CIA' },
  { code: 'CTSY', label: 'Courtesy' },
];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function ExplorerPage() {
  const [stats, setStats] = useState<TrafficStats | null>(null);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [shelbyData, setShelbyData] = useState<ShelbyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'mpd' | 'shelby'>('mpd');

  // Filters
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [selectedPrecincts, setSelectedPrecincts] = useState<string[]>([]);
  const [selectedZipCodes, setSelectedZipCodes] = useState<string[]>([]);
  const [selectedDispositions, setSelectedDispositions] = useState<string[]>([]);
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);

  // Comparison mode
  const [compareMode, setCompareMode] = useState(false);
  const [compareYear1, setCompareYear1] = useState(2024);
  const [compareYear2, setCompareYear2] = useState(2025);

  // Fetch base stats for filter options
  useEffect(() => {
    async function fetchStats() {
      const [mpdRes, shelbyRes] = await Promise.all([
        fetch('/api/admin/traffic-stats'),
        fetch('/api/admin/shelby-citations'),
      ]);

      if (mpdRes.ok) {
        const data = await mpdRes.json();
        setStats(data);
      }

      if (shelbyRes.ok) {
        const data = await shelbyRes.json();
        if (data.summary) {
          setShelbyData(data);
        }
      }
    }
    fetchStats();
  }, []);

  const runQuery = useCallback(async () => {
    setLoading(true);
    try {
      const body: Record<string, unknown> = {};

      if (selectedYears.length > 0) body.years = selectedYears;
      if (selectedPrecincts.length > 0) body.precincts = selectedPrecincts;
      if (selectedZipCodes.length > 0) body.zipCodes = selectedZipCodes;
      if (selectedDispositions.length > 0) body.dispositions = selectedDispositions;
      if (selectedDistricts.length > 0) body.planningDistricts = selectedDistricts;
      if (compareMode) body.compareYears = [compareYear1, compareYear2];

      const res = await fetch('/api/admin/traffic-stops/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data);
      }
    } catch (error) {
      console.error('Query failed:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedYears, selectedPrecincts, selectedZipCodes, selectedDispositions, selectedDistricts, compareMode, compareYear1, compareYear2]);

  // Run initial query
  useEffect(() => {
    runQuery();
  }, [runQuery]);

  const precincts = stats ? Object.keys(stats.stats.byPrecinct).sort() : [];
  const zipCodes = stats ? Object.keys(stats.stats.byZipCode).sort() : [];
  const districts = stats ? Object.keys(stats.stats.byPlanningDistrict).sort() : [];

  const toggleFilter = (
    value: string | number,
    selected: (string | number)[],
    setSelected: (v: (string | number)[]) => void
  ) => {
    if (selected.includes(value)) {
      setSelected(selected.filter((v) => v !== value));
    } else {
      setSelected([...selected, value]);
    }
  };

  const clearFilters = () => {
    setSelectedYears([]);
    setSelectedPrecincts([]);
    setSelectedZipCodes([]);
    setSelectedDispositions([]);
    setSelectedDistricts([]);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A]">Traffic Data Explorer</h1>
            <p className="text-[#4A4A4A] mt-1">
              Analyze traffic enforcement data from Memphis and Shelby County
            </p>
          </div>
        </div>

        {/* Data Source Tabs */}
        <div className="flex gap-2 border-b border-[#E5E5E5]">
          <button
            onClick={() => setActiveTab('mpd')}
            className={`px-4 py-3 font-medium transition-colors relative ${
              activeTab === 'mpd'
                ? 'text-[#1A1A1A]'
                : 'text-[#4A4A4A] hover:text-[#1A1A1A]'
            }`}
          >
            MPD Traffic Stops
            {activeTab === 'mpd' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FFD100]" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('shelby')}
            className={`px-4 py-3 font-medium transition-colors relative ${
              activeTab === 'shelby'
                ? 'text-[#1A1A1A]'
                : 'text-[#4A4A4A] hover:text-[#1A1A1A]'
            }`}
          >
            Shelby County / THP Citations
            {shelbyData?.summary && (
              <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                {shelbyData.summary.totalCombined.toLocaleString()} records
              </span>
            )}
            {activeTab === 'shelby' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FFD100]" />
            )}
          </button>
        </div>

        {/* MPD Data Section */}
        {activeTab === 'mpd' && (
          <>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[#4A4A4A]">
              {stats?.totalRecords.toLocaleString() || '...'} MPD traffic stops
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={compareMode}
                onChange={(e) => setCompareMode(e.target.checked)}
                className="w-4 h-4 rounded border-[#E5E5E5]"
              />
              <span className="text-sm text-[#1A1A1A]">Compare Years</span>
            </label>
            {compareMode && (
              <div className="flex items-center gap-2">
                <select
                  value={compareYear1}
                  onChange={(e) => setCompareYear1(parseInt(e.target.value))}
                  className="px-3 py-2 border border-[#E5E5E5] rounded-lg text-sm"
                >
                  {YEARS.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <span className="text-[#4A4A4A]">vs</span>
                <select
                  value={compareYear2}
                  onChange={(e) => setCompareYear2(parseInt(e.target.value))}
                  className="px-3 py-2 border border-[#E5E5E5] rounded-lg text-sm"
                >
                  {YEARS.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E5E5E5] p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[#1A1A1A]">Filters</h2>
            <button
              onClick={clearFilters}
              className="text-sm text-[#4A4A4A] hover:text-[#1A1A1A]"
            >
              Clear All
            </button>
          </div>

          <div className="grid md:grid-cols-5 gap-6">
            {/* Years */}
            <div>
              <h3 className="text-sm font-medium text-[#4A4A4A] mb-2">Year</h3>
              <div className="flex flex-wrap gap-2">
                {YEARS.map((year) => (
                  <button
                    key={year}
                    onClick={() => toggleFilter(year, selectedYears, setSelectedYears as (v: (string | number)[]) => void)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      selectedYears.includes(year)
                        ? 'bg-[#1A1A1A] text-white'
                        : 'bg-[#F8F8F8] text-[#4A4A4A] hover:bg-[#E5E5E5]'
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>

            {/* Precincts */}
            <div>
              <h3 className="text-sm font-medium text-[#4A4A4A] mb-2">Precinct</h3>
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                {precincts.map((p) => (
                  <button
                    key={p}
                    onClick={() => toggleFilter(p, selectedPrecincts, setSelectedPrecincts as (v: (string | number)[]) => void)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      selectedPrecincts.includes(p)
                        ? 'bg-[#1A1A1A] text-white'
                        : 'bg-[#F8F8F8] text-[#4A4A4A] hover:bg-[#E5E5E5]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Dispositions */}
            <div>
              <h3 className="text-sm font-medium text-[#4A4A4A] mb-2">Disposition</h3>
              <div className="flex flex-wrap gap-2">
                {DISPOSITIONS.map((d) => (
                  <button
                    key={d.code}
                    onClick={() => toggleFilter(d.code, selectedDispositions, setSelectedDispositions as (v: (string | number)[]) => void)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      selectedDispositions.includes(d.code)
                        ? 'bg-[#1A1A1A] text-white'
                        : 'bg-[#F8F8F8] text-[#4A4A4A] hover:bg-[#E5E5E5]'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Districts */}
            <div>
              <h3 className="text-sm font-medium text-[#4A4A4A] mb-2">Planning District</h3>
              <select
                multiple
                value={selectedDistricts}
                onChange={(e) => setSelectedDistricts(Array.from(e.target.selectedOptions, (o) => o.value))}
                className="w-full h-24 px-2 py-1 border border-[#E5E5E5] rounded-lg text-sm"
              >
                {districts.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* ZIP Codes */}
            <div>
              <h3 className="text-sm font-medium text-[#4A4A4A] mb-2">ZIP Code</h3>
              <select
                multiple
                value={selectedZipCodes}
                onChange={(e) => setSelectedZipCodes(Array.from(e.target.selectedOptions, (o) => o.value))}
                className="w-full h-24 px-2 py-1 border border-[#E5E5E5] rounded-lg text-sm"
              >
                {zipCodes.map((z) => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-[#E5E5E5] p-12 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-[#FFD100] border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-[#4A4A4A]">Analyzing data...</p>
          </div>
        ) : result && (
          <>
            {/* Total */}
            <div className="bg-[#FFD100] rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#1A1A1A]/70 text-sm">Filtered Results</p>
                  <p className="text-4xl font-bold text-[#1A1A1A]">
                    {result.totalFiltered.toLocaleString()}
                  </p>
                  <p className="text-[#1A1A1A]/70 text-sm mt-1">
                    traffic stops match your criteria
                  </p>
                </div>
                {stats && (
                  <div className="text-right">
                    <p className="text-[#1A1A1A]/70 text-sm">
                      {((result.totalFiltered / stats.totalRecords) * 100).toFixed(1)}% of total
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Year-over-Year Comparison */}
            {result.comparison && (
              <div className="bg-white rounded-xl shadow-sm border border-[#E5E5E5] p-6">
                <h2 className="font-semibold text-[#1A1A1A] mb-4">
                  {result.comparison.year1} vs {result.comparison.year2} Comparison
                </h2>

                <div className="grid md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-[#F8F8F8] rounded-lg p-4 text-center">
                    <p className="text-sm text-[#4A4A4A]">{result.comparison.year1}</p>
                    <p className="text-2xl font-bold text-[#1A1A1A]">
                      {result.comparison.year1Count.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-[#F8F8F8] rounded-lg p-4 text-center">
                    <p className="text-sm text-[#4A4A4A]">{result.comparison.year2}</p>
                    <p className="text-2xl font-bold text-[#1A1A1A]">
                      {result.comparison.year2Count.toLocaleString()}
                    </p>
                  </div>
                  <div className={`rounded-lg p-4 text-center ${
                    result.comparison.change > 0 ? 'bg-red-50' : 'bg-emerald-50'
                  }`}>
                    <p className="text-sm text-[#4A4A4A]">Change</p>
                    <p className={`text-2xl font-bold ${
                      result.comparison.change > 0 ? 'text-red-600' : 'text-emerald-600'
                    }`}>
                      {result.comparison.change > 0 ? '+' : ''}{result.comparison.change.toLocaleString()}
                      <span className="text-sm ml-1">
                        ({result.comparison.changePercent > 0 ? '+' : ''}{result.comparison.changePercent}%)
                      </span>
                    </p>
                  </div>
                </div>

                {/* Monthly Comparison Chart */}
                <h3 className="text-sm font-medium text-[#4A4A4A] mb-3">Monthly Breakdown</h3>
                <div className="grid grid-cols-12 gap-2 mb-6">
                  {result.comparison.byMonth.map((m) => {
                    const max = Math.max(...result.comparison!.byMonth.map((x) => Math.max(x.year1, x.year2)));
                    const h1 = (m.year1 / max) * 100;
                    const h2 = (m.year2 / max) * 100;
                    return (
                      <div key={m.month} className="text-center">
                        <div className="h-24 flex items-end justify-center gap-1 mb-1">
                          <div
                            className="w-3 bg-[#4A4A4A] rounded-t"
                            style={{ height: `${h1}%` }}
                            title={`${result.comparison!.year1}: ${m.year1.toLocaleString()}`}
                          />
                          <div
                            className="w-3 bg-[#FFD100] rounded-t"
                            style={{ height: `${h2}%` }}
                            title={`${result.comparison!.year2}: ${m.year2.toLocaleString()}`}
                          />
                        </div>
                        <p className="text-xs text-[#4A4A4A]">{MONTHS[m.month - 1]}</p>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-[#4A4A4A] rounded" />
                    <span>{result.comparison.year1}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-[#FFD100] rounded" />
                    <span>{result.comparison.year2}</span>
                  </div>
                </div>

                {/* Precinct Changes */}
                <h3 className="text-sm font-medium text-[#4A4A4A] mt-6 mb-3">By Precinct</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {result.comparison.byPrecinct.map((p) => (
                    <div key={p.precinct} className="flex items-center justify-between p-3 bg-[#F8F8F8] rounded-lg">
                      <div>
                        <p className="font-medium text-[#1A1A1A]">{p.precinct}</p>
                        <p className="text-xs text-[#4A4A4A]">
                          {p.year1.toLocaleString()} → {p.year2.toLocaleString()}
                        </p>
                      </div>
                      <div className={`text-right ${p.change > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        <p className="font-medium">
                          {p.change > 0 ? '+' : ''}{p.change.toLocaleString()}
                        </p>
                        <p className="text-xs">
                          {p.changePercent > 0 ? '+' : ''}{p.changePercent}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Breakdown Charts */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* By Precinct */}
              <div className="bg-white rounded-xl shadow-sm border border-[#E5E5E5] p-6">
                <h3 className="font-semibold text-[#1A1A1A] mb-4">By Precinct</h3>
                <div className="space-y-3">
                  {Object.entries(result.byPrecinct)
                    .sort((a, b) => b[1] - a[1])
                    .map(([precinct, count]) => {
                      const max = Math.max(...Object.values(result.byPrecinct));
                      const pct = (count / max) * 100;
                      return (
                        <div key={precinct}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-[#1A1A1A]">{precinct}</span>
                            <span className="text-[#4A4A4A]">{count.toLocaleString()}</span>
                          </div>
                          <div className="h-2 bg-[#E5E5E5] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#FFD100] rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* By Disposition */}
              <div className="bg-white rounded-xl shadow-sm border border-[#E5E5E5] p-6">
                <h3 className="font-semibold text-[#1A1A1A] mb-4">By Disposition</h3>
                <div className="space-y-3">
                  {Object.entries(result.byDisposition)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 8)
                    .map(([disposition, count]) => {
                      const pct = (count / result.totalFiltered) * 100;
                      return (
                        <div key={disposition}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-[#1A1A1A]">{disposition}</span>
                            <span className="text-[#4A4A4A]">
                              {count.toLocaleString()} ({pct.toFixed(1)}%)
                            </span>
                          </div>
                          <div className="h-2 bg-[#E5E5E5] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#1A1A1A] rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* By Day of Week */}
              <div className="bg-white rounded-xl shadow-sm border border-[#E5E5E5] p-6">
                <h3 className="font-semibold text-[#1A1A1A] mb-4">By Day of Week</h3>
                <div className="flex items-end justify-between h-32">
                  {DAYS.map((day, i) => {
                    const count = result.byDayOfWeek[i] || 0;
                    const max = Math.max(...Object.values(result.byDayOfWeek));
                    const pct = max > 0 ? (count / max) * 100 : 0;
                    return (
                      <div key={day} className="flex flex-col items-center flex-1">
                        <div
                          className="w-8 bg-[#FFD100] rounded-t"
                          style={{ height: `${pct}%`, minHeight: '4px' }}
                        />
                        <p className="text-xs text-[#4A4A4A] mt-2">{day}</p>
                        <p className="text-xs text-[#1A1A1A] font-medium">{(count / 1000).toFixed(0)}k</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* By Hour */}
              <div className="bg-white rounded-xl shadow-sm border border-[#E5E5E5] p-6">
                <h3 className="font-semibold text-[#1A1A1A] mb-4">By Hour of Day</h3>
                <div className="flex items-end justify-between h-32 overflow-x-auto">
                  {Array.from({ length: 24 }, (_, i) => {
                    const count = result.byHour[i] || 0;
                    const max = Math.max(...Object.values(result.byHour));
                    const pct = max > 0 ? (count / max) * 100 : 0;
                    return (
                      <div key={i} className="flex flex-col items-center min-w-[20px]">
                        <div
                          className="w-4 bg-[#1A1A1A] rounded-t"
                          style={{ height: `${pct}%`, minHeight: '2px' }}
                        />
                        <p className="text-[10px] text-[#4A4A4A] mt-1">{i}</p>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-[#4A4A4A] text-center mt-2">Hour (24h)</p>
              </div>
            </div>

            {/* Top ZIP Codes */}
            <div className="bg-white rounded-xl shadow-sm border border-[#E5E5E5] p-6">
              <h3 className="font-semibold text-[#1A1A1A] mb-4">Top ZIP Codes</h3>
              <div className="grid md:grid-cols-5 gap-4">
                {Object.entries(result.byZipCode)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 10)
                  .map(([zip, count], i) => (
                    <div key={zip} className="bg-[#F8F8F8] rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-5 h-5 bg-[#FFD100] rounded text-xs flex items-center justify-center font-bold">
                          {i + 1}
                        </span>
                        <span className="font-medium text-[#1A1A1A]">{zip}</span>
                      </div>
                      <p className="text-lg font-bold text-[#1A1A1A]">{count.toLocaleString()}</p>
                      <p className="text-xs text-[#4A4A4A]">
                        {((count / result.totalFiltered) * 100).toFixed(1)}% of filtered
                      </p>
                    </div>
                  ))}
              </div>
            </div>
          </>
        )}
        </>
        )}

        {/* Shelby County / THP Section */}
        {activeTab === 'shelby' && (
          <>
            {!shelbyData?.summary ? (
              <div className="bg-white rounded-xl shadow-sm border border-[#E5E5E5] p-12 text-center">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="font-semibold text-[#1A1A1A] mb-2">No Shelby County Data Available</h3>
                <p className="text-[#4A4A4A] mb-4">
                  Run the IJOW scraper to fetch THP and Sheriff citation data.
                </p>
                <code className="bg-[#F8F8F8] px-4 py-2 rounded text-sm">
                  npx tsx scripts/scrape-ijow.ts
                </code>
              </div>
            ) : (
              <>
                {/* Summary Cards */}
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="bg-[#FFD100] rounded-xl p-6">
                    <p className="text-[#1A1A1A]/70 text-sm">Total Citations</p>
                    <p className="text-3xl font-bold text-[#1A1A1A]">
                      {shelbyData.summary.totalCombined.toLocaleString()}
                    </p>
                    <p className="text-[#1A1A1A]/70 text-xs mt-1">
                      {shelbyData.summary.weekCount} weeks of data
                    </p>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-[#E5E5E5] p-6">
                    <p className="text-[#4A4A4A] text-sm">Shelby County Sheriff</p>
                    <p className="text-3xl font-bold text-[#1A1A1A]">
                      {shelbyData.summary.totalSheriff.toLocaleString()}
                    </p>
                    <p className="text-[#4A4A4A] text-xs mt-1">
                      {((shelbyData.summary.totalSheriff / shelbyData.summary.totalCombined) * 100).toFixed(1)}% of total
                    </p>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-[#E5E5E5] p-6">
                    <p className="text-[#4A4A4A] text-sm">Tennessee Highway Patrol</p>
                    <p className="text-3xl font-bold text-[#1A1A1A]">
                      {shelbyData.summary.totalTHP.toLocaleString()}
                    </p>
                    <p className="text-[#4A4A4A] text-xs mt-1">
                      {((shelbyData.summary.totalTHP / shelbyData.summary.totalCombined) * 100).toFixed(1)}% of total
                    </p>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-[#E5E5E5] p-6">
                    <p className="text-[#4A4A4A] text-sm">Date Range</p>
                    <p className="text-lg font-bold text-[#1A1A1A]">
                      {new Date(shelbyData.summary.dateRange.start).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-[#4A4A4A] text-xs mt-1">
                      to {new Date(shelbyData.summary.dateRange.end).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* Monthly Comparison Chart */}
                <div className="bg-white rounded-xl shadow-sm border border-[#E5E5E5] p-6">
                  <h3 className="font-semibold text-[#1A1A1A] mb-4">Monthly Citations by Agency</h3>
                  <div className="space-y-4">
                    {shelbyData.monthly.map((m) => {
                      const maxTotal = Math.max(...shelbyData.monthly.map(x => x.total));
                      const sheriffPct = (m.sheriff / maxTotal) * 100;
                      const thpPct = (m.thp / maxTotal) * 100;
                      const monthLabel = new Date(m.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                      return (
                        <div key={m.month}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-[#1A1A1A] font-medium">{monthLabel}</span>
                            <span className="text-[#4A4A4A]">{m.total.toLocaleString()} total</span>
                          </div>
                          <div className="flex gap-1 h-6">
                            <div
                              className="bg-[#1A1A1A] rounded-l flex items-center justify-end px-2"
                              style={{ width: `${sheriffPct}%`, minWidth: m.sheriff > 0 ? '40px' : '0' }}
                            >
                              {m.sheriff > 100 && (
                                <span className="text-xs text-white">{m.sheriff.toLocaleString()}</span>
                              )}
                            </div>
                            <div
                              className="bg-[#FFD100] rounded-r flex items-center px-2"
                              style={{ width: `${thpPct}%`, minWidth: m.thp > 0 ? '40px' : '0' }}
                            >
                              {m.thp > 100 && (
                                <span className="text-xs text-[#1A1A1A]">{m.thp.toLocaleString()}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-center gap-6 text-sm mt-4 pt-4 border-t border-[#E5E5E5]">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-[#1A1A1A] rounded" />
                      <span>Sheriff</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-[#FFD100] rounded" />
                      <span>THP</span>
                    </div>
                  </div>
                </div>

                {/* Weekly Trend */}
                <div className="bg-white rounded-xl shadow-sm border border-[#E5E5E5] p-6">
                  <h3 className="font-semibold text-[#1A1A1A] mb-4">Weekly Citation Trend</h3>
                  <div className="h-48 flex items-end gap-1 overflow-x-auto pb-2">
                    {shelbyData.weekly.map((w, i) => {
                      const maxWeek = Math.max(...shelbyData.weekly.map(x => x.total));
                      const sheriffH = (w.sheriff / maxWeek) * 100;
                      const thpH = (w.thp / maxWeek) * 100;
                      const weekDate = new Date(w.week);
                      const showLabel = i % 4 === 0;
                      return (
                        <div key={w.week} className="flex flex-col items-center min-w-[16px]" title={`Week of ${w.week}: Sheriff ${w.sheriff}, THP ${w.thp}`}>
                          <div className="flex flex-col justify-end h-40">
                            <div
                              className="w-3 bg-[#FFD100]"
                              style={{ height: `${thpH}%`, minHeight: w.thp > 0 ? '2px' : '0' }}
                            />
                            <div
                              className="w-3 bg-[#1A1A1A]"
                              style={{ height: `${sheriffH}%`, minHeight: w.sheriff > 0 ? '2px' : '0' }}
                            />
                          </div>
                          {showLabel && (
                            <p className="text-[9px] text-[#4A4A4A] mt-1 -rotate-45 origin-top-left whitespace-nowrap">
                              {weekDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Data Source Info */}
                <div className="bg-[#F8F8F8] rounded-xl p-4 text-center">
                  <p className="text-sm text-[#4A4A4A]">
                    Data scraped from <a href="https://ccre.shinyapps.io/ijow/" target="_blank" rel="noopener noreferrer" className="text-[#1A1A1A] underline">IJOW Dashboard</a>
                    {' '}on {new Date(shelbyData.scrapedAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
