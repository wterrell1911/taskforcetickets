'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';

interface SyncLog {
  id: string;
  source: string;
  startedAt: string;
  completedAt?: string;
  recordsProcessed: number;
  status: 'running' | 'completed' | 'failed';
  error?: string;
}

export default function SyncPage() {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<SyncLog | null>(null);
  const [syncResult, setSyncResult] = useState<{ success: boolean; recordsProcessed?: number; error?: string } | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchSyncStatus();
  }, []);

  async function fetchSyncStatus() {
    try {
      const res = await fetch('/api/admin/sync/mpd');
      const data = await res.json();
      setLastSync(data.lastSync);
    } catch (error) {
      console.error('Failed to fetch sync status:', error);
    }
  }

  const handleSync = async (fullSync: boolean = false) => {
    setSyncing(true);
    setSyncResult(null);

    try {
      const body: { startDate?: string; endDate?: string } = {};
      if (!fullSync && startDate) body.startDate = startDate;
      if (!fullSync && endDate) body.endDate = endDate;

      const res = await fetch('/api/admin/sync/mpd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      setSyncResult(data);
      fetchSyncStatus();
    } catch (error) {
      setSyncResult({
        success: false,
        error: error instanceof Error ? error.message : 'Sync failed',
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Data Sync</h1>
          <p className="text-[#4A4A4A] mt-1">
            Sync enforcement data from Memphis Data Hub (ArcGIS API)
          </p>
        </div>

        {/* Sync Status */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E5E5E5] p-6">
          <h2 className="font-semibold text-[#1A1A1A] mb-4">MPD Traffic Stops</h2>

          {lastSync ? (
            <div className="mb-6 p-4 bg-[#F8F8F8] rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[#4A4A4A]">Last Sync</p>
                  <p className="font-medium text-[#1A1A1A]">
                    {new Date(lastSync.startedAt).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-[#4A4A4A]">Status</p>
                  <span
                    className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      lastSync.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-700'
                        : lastSync.status === 'failed'
                        ? 'bg-[#CF2A27]/10 text-[#CF2A27]'
                        : 'bg-[#FFD100]/20 text-[#1A1A1A]'
                    }`}
                  >
                    {lastSync.status}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-[#4A4A4A]">Records</p>
                  <p className="font-medium text-[#1A1A1A]">
                    {lastSync.recordsProcessed.toLocaleString()}
                  </p>
                </div>
              </div>
              {lastSync.error && (
                <p className="mt-3 text-sm text-[#CF2A27]">{lastSync.error}</p>
              )}
            </div>
          ) : (
            <div className="mb-6 p-4 bg-[#F8F8F8] rounded-lg text-center text-[#4A4A4A]">
              No sync history yet
            </div>
          )}

          {/* Date Range Filter */}
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                Start Date (optional)
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-[#FFD100]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                End Date (optional)
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-3 border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-[#FFD100]"
              />
            </div>
          </div>

          {/* Sync Result */}
          {syncResult && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                syncResult.success
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-[#CF2A27]/10 text-[#CF2A27]'
              }`}
            >
              {syncResult.success
                ? `Successfully synced ${syncResult.recordsProcessed?.toLocaleString()} records`
                : `Sync failed: ${syncResult.error}`}
            </div>
          )}

          {/* Sync Buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => handleSync(false)}
              disabled={syncing}
              className="flex-1 bg-[#1A1A1A] text-white py-3 rounded-lg font-semibold hover:bg-[#1A1A1A]/90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {syncing ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Syncing...
                </>
              ) : (
                'Sync with Date Range'
              )}
            </button>
            <button
              onClick={() => handleSync(true)}
              disabled={syncing}
              className="px-6 py-3 border border-[#E5E5E5] text-[#1A1A1A] rounded-lg font-semibold hover:bg-[#F8F8F8] disabled:opacity-50"
            >
              Full Sync (Last 2 Years)
            </button>
          </div>
        </div>

        {/* API Info */}
        <div className="bg-[#FFD100]/10 rounded-xl p-6 border border-[#FFD100]/30">
          <h3 className="font-semibold text-[#1A1A1A] mb-3">About the Data Source</h3>
          <div className="text-sm text-[#4A4A4A] space-y-2">
            <p>
              <strong className="text-[#1A1A1A]">Source:</strong> Memphis Data Hub (data.memphistn.gov)
            </p>
            <p>
              <strong className="text-[#1A1A1A]">Dataset:</strong> MPD Traffic Stops
            </p>
            <p>
              <strong className="text-[#1A1A1A]">API:</strong> ArcGIS Feature Server
            </p>
            <p className="mt-4">
              The sync process pulls traffic stop records including location, event type,
              date/time, precinct, and ward data. Data is paginated (1,000 records per request)
              and rate-limited to be respectful of the API. Full dataset contains 700k+ records,
              so syncs default to last 2 years.
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
