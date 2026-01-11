'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';

interface ImportHistory {
  id: string;
  filename: string;
  recordCount: number;
  dateRangeStart: string;
  dateRangeEnd: string;
  importedAt: string;
  status: 'completed' | 'failed';
}

interface CurrentStats {
  totalRecords: number;
  lastUpdated: string;
  byPrecinct: Record<string, number>;
  byZipCode: Record<string, number>;
  byYear: Record<number, number>;
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string>('');
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    stats?: {
      total: number;
      citations: number;
      warnings: number;
      precincts: number;
      zipCodes: number;
    };
  } | null>(null);
  const [history, setHistory] = useState<ImportHistory[]>([]);
  const [currentStats, setCurrentStats] = useState<CurrentStats | null>(null);

  const fetchImportInfo = useCallback(async () => {
    try {
      // Fetch from traffic-stats API which reads the optimized stats file
      const statsRes = await fetch('/api/admin/traffic-stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        if (statsData.totalRecords > 0) {
          setCurrentStats({
            totalRecords: statsData.totalRecords,
            lastUpdated: statsData.lastUpdated,
            byPrecinct: statsData.stats?.byPrecinct || {},
            byZipCode: statsData.stats?.byZipCode || {},
            byYear: statsData.stats?.byYear || {},
          });
        }
      }

      const historyRes = await fetch('/api/admin/import/traffic-stops');
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setHistory(historyData.history || []);
      }
    } catch (error) {
      console.error('Failed to fetch import info:', error);
    }
  }, []);

  useEffect(() => {
    fetchImportInfo();
  }, [fetchImportInfo]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress('Uploading file...');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      setProgress('Processing CSV (this may take a minute for large files)...');

      const res = await fetch('/api/admin/import/traffic-stops', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setResult({
          success: true,
          message: `Successfully imported ${data.imported.toLocaleString()} records`,
          stats: data.stats,
        });
        setFile(null);
        // Reset file input
        const fileInput = document.getElementById('csv-file') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        // Refresh import info
        fetchImportInfo();
      } else {
        setResult({
          success: false,
          message: data.error || 'Import failed',
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Import failed',
      });
    } finally {
      setUploading(false);
      setProgress('');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get top 5 precincts by volume
  const topPrecincts = currentStats
    ? Object.entries(currentStats.byPrecinct)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
    : [];

  // Get top 5 ZIP codes by volume
  const topZipCodes = currentStats
    ? Object.entries(currentStats.byZipCode)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
    : [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Import Traffic Stops</h1>
          <p className="text-[#4A4A4A] mt-1">
            Upload MPD Traffic Stops CSV data for analytics overlay
          </p>
        </div>

        {/* Current Data Summary */}
        {currentStats && (
          <div className="bg-white rounded-xl shadow-sm border border-[#E5E5E5] p-6">
            <h2 className="font-semibold text-[#1A1A1A] mb-4">Current Data</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-[#F8F8F8] rounded-lg p-4">
                <p className="text-sm text-[#4A4A4A]">Total Records</p>
                <p className="text-2xl font-bold text-[#1A1A1A]">
                  {currentStats.totalRecords.toLocaleString()}
                </p>
              </div>
              <div className="bg-[#F8F8F8] rounded-lg p-4">
                <p className="text-sm text-[#4A4A4A]">Precincts</p>
                <p className="text-2xl font-bold text-[#1A1A1A]">
                  {Object.keys(currentStats.byPrecinct).length}
                </p>
              </div>
              <div className="bg-[#F8F8F8] rounded-lg p-4">
                <p className="text-sm text-[#4A4A4A]">ZIP Codes</p>
                <p className="text-2xl font-bold text-[#1A1A1A]">
                  {Object.keys(currentStats.byZipCode).length}
                </p>
              </div>
              <div className="bg-[#F8F8F8] rounded-lg p-4">
                <p className="text-sm text-[#4A4A4A]">Last Updated</p>
                <p className="text-sm font-medium text-[#1A1A1A]">
                  {formatDate(currentStats.lastUpdated)}
                </p>
              </div>
            </div>

            {/* Year breakdown */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-[#4A4A4A] mb-2">By Year</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(currentStats.byYear)
                  .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
                  .map(([year, count]) => (
                    <span
                      key={year}
                      className="px-3 py-1 bg-[#FFD100]/20 text-[#1A1A1A] rounded-full text-sm"
                    >
                      {year}: {count.toLocaleString()}
                    </span>
                  ))}
              </div>
            </div>

            {/* Top precincts and ZIP codes */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-[#4A4A4A] mb-2">Top Precincts</h3>
                <div className="space-y-2">
                  {topPrecincts.map(([precinct, count]) => (
                    <div key={precinct} className="flex justify-between text-sm">
                      <span className="text-[#1A1A1A]">{precinct}</span>
                      <span className="text-[#4A4A4A]">{count.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-[#4A4A4A] mb-2">Top ZIP Codes</h3>
                <div className="space-y-2">
                  {topZipCodes.map(([zip, count]) => (
                    <div key={zip} className="flex justify-between text-sm">
                      <span className="text-[#1A1A1A]">{zip}</span>
                      <span className="text-[#4A4A4A]">{count.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Upload Section */}
        <div className="bg-white rounded-xl shadow-sm border border-[#E5E5E5] p-6">
          <h2 className="font-semibold text-[#1A1A1A] mb-4">Upload New Data</h2>

          <div className="mb-6">
            <label
              htmlFor="csv-file"
              className="block text-sm font-medium text-[#1A1A1A] mb-2"
            >
              Select CSV File
            </label>
            <input
              type="file"
              id="csv-file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-[#4A4A4A] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#FFD100] file:text-[#1A1A1A] hover:file:bg-[#FFD100]/80"
            />
            {file && (
              <p className="mt-2 text-sm text-[#4A4A4A]">
                Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          {/* Progress */}
          {progress && (
            <div className="mb-6 p-4 bg-[#FFD100]/10 rounded-lg">
              <div className="flex items-center gap-3">
                <svg className="animate-spin h-5 w-5 text-[#1A1A1A]" viewBox="0 0 24 24">
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
                <span className="text-[#1A1A1A]">{progress}</span>
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div
              className={`mb-6 p-4 rounded-lg ${
                result.success
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-[#CF2A27]/10 text-[#CF2A27]'
              }`}
            >
              <p className="font-medium">{result.message}</p>
              {result.stats && (
                <div className="mt-3 text-sm space-y-1">
                  <p>Citations: {result.stats.citations.toLocaleString()}</p>
                  <p>Warnings: {result.stats.warnings.toLocaleString()}</p>
                  <p>Precincts: {result.stats.precincts}</p>
                  <p>ZIP Codes: {result.stats.zipCodes}</p>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full bg-[#1A1A1A] text-white py-3 rounded-lg font-semibold hover:bg-[#1A1A1A]/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? 'Importing...' : 'Import CSV'}
          </button>

          <p className="mt-4 text-sm text-[#4A4A4A]">
            <strong>Note:</strong> Importing a new CSV will replace all existing traffic stop data.
            Large files (500K+ records) may take a minute to process.
          </p>
        </div>

        {/* Import History */}
        {history.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-[#E5E5E5] p-6">
            <h2 className="font-semibold text-[#1A1A1A] mb-4">Import History</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[#4A4A4A] border-b border-[#E5E5E5]">
                    <th className="pb-3">File</th>
                    <th className="pb-3">Records</th>
                    <th className="pb-3">Date Range</th>
                    <th className="pb-3">Imported</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => (
                    <tr key={item.id} className="border-b border-[#E5E5E5]">
                      <td className="py-3 text-[#1A1A1A]">{item.filename}</td>
                      <td className="py-3 text-[#1A1A1A]">
                        {item.recordCount.toLocaleString()}
                      </td>
                      <td className="py-3 text-[#4A4A4A]">
                        {new Date(item.dateRangeStart).toLocaleDateString()} -{' '}
                        {new Date(item.dateRangeEnd).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-[#4A4A4A]">{formatDate(item.importedAt)}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-[#CF2A27]/10 text-[#CF2A27]'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CSV Format Info */}
        <div className="bg-[#F8F8F8] rounded-xl p-6 border border-[#E5E5E5]">
          <h3 className="font-semibold text-[#1A1A1A] mb-3">Expected CSV Format</h3>
          <p className="text-sm text-[#4A4A4A] mb-4">
            The CSV should have the following columns (from Memphis Data Hub):
          </p>
          <div className="bg-[#1A1A1A] text-[#FFD100] p-4 rounded-lg text-sm font-mono overflow-x-auto">
            OBJECTID, Event Number, Event Type, Reported_Datetime, Disposition Code,
            Location, Latitude, Longitude, ZIP Code, Council District, Super District,
            Tract, Tract Name, Planning District, MPD Precinct, MPD Ward, x, y
          </div>
          <p className="text-sm text-[#4A4A4A] mt-4">
            Download the latest data from{' '}
            <a
              href="https://data.memphistn.gov"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1A1A1A] font-medium hover:underline"
            >
              Memphis Data Hub
            </a>
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
