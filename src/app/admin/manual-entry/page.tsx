'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';

interface ViolationEntry {
  type: string;
  count: number;
}

interface AgencyEntry {
  agency: string;
  count: number;
}

interface ManualEntryBatch {
  id: string;
  source: string;
  dateRangeStart: string;
  dateRangeEnd: string;
  totalCitations: number;
  topViolations: ViolationEntry[];
  agencyBreakdown?: AgencyEntry[];
  notes?: string;
  enteredBy: string;
  createdAt: string;
}

export default function ManualEntryPage() {
  const [source, setSource] = useState<'shelby_county' | 'thp'>('shelby_county');
  const [dateRangeStart, setDateRangeStart] = useState('');
  const [dateRangeEnd, setDateRangeEnd] = useState('');
  const [totalCitations, setTotalCitations] = useState('');
  const [violations, setViolations] = useState<ViolationEntry[]>([
    { type: '', count: 0 },
  ]);
  const [agencies, setAgencies] = useState<AgencyEntry[]>([]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [batches, setBatches] = useState<ManualEntryBatch[]>([]);

  useEffect(() => {
    fetchBatches();
  }, []);

  async function fetchBatches() {
    try {
      const res = await fetch('/api/admin/manual-entry');
      const data = await res.json();
      setBatches(data.batches || []);
    } catch (error) {
      console.error('Failed to fetch batches:', error);
    }
  }

  const addViolation = () => {
    setViolations([...violations, { type: '', count: 0 }]);
  };

  const removeViolation = (index: number) => {
    setViolations(violations.filter((_, i) => i !== index));
  };

  const updateViolation = (index: number, field: 'type' | 'count', value: string | number) => {
    const updated = [...violations];
    if (field === 'type') {
      updated[index].type = value as string;
    } else {
      updated[index].count = Number(value);
    }
    setViolations(updated);
  };

  const addAgency = () => {
    setAgencies([...agencies, { agency: '', count: 0 }]);
  };

  const removeAgency = (index: number) => {
    setAgencies(agencies.filter((_, i) => i !== index));
  };

  const updateAgency = (index: number, field: 'agency' | 'count', value: string | number) => {
    const updated = [...agencies];
    if (field === 'agency') {
      updated[index].agency = value as string;
    } else {
      updated[index].count = Number(value);
    }
    setAgencies(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess(false);

    try {
      const res = await fetch('/api/admin/manual-entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source,
          dateRangeStart,
          dateRangeEnd,
          totalCitations: Number(totalCitations),
          topViolations: violations.filter((v) => v.type && v.count > 0),
          agencyBreakdown: agencies.filter((a) => a.agency && a.count > 0),
          notes,
          enteredBy: 'admin',
        }),
      });

      if (res.ok) {
        setSuccess(true);
        // Reset form
        setDateRangeStart('');
        setDateRangeEnd('');
        setTotalCitations('');
        setViolations([{ type: '', count: 0 }]);
        setAgencies([]);
        setNotes('');
        fetchBatches();
      }
    } catch (error) {
      console.error('Failed to submit:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Manual Data Entry</h1>
          <p className="text-[#4A4A4A] mt-1">
            Enter aggregate stats from IJOW dashboard or other sources
          </p>
        </div>

        {/* Entry Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-[#E5E5E5] p-6">
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Source */}
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Data Source</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as 'shelby_county' | 'thp')}
                className="w-full px-4 py-3 border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-[#FFD100]"
              >
                <option value="shelby_county">Shelby County Sheriff</option>
                <option value="thp">TN Highway Patrol</option>
              </select>
            </div>

            {/* Total Citations */}
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                Total Citations
              </label>
              <input
                type="number"
                value={totalCitations}
                onChange={(e) => setTotalCitations(e.target.value)}
                className="w-full px-4 py-3 border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-[#FFD100]"
                placeholder="e.g., 1250"
                required
              />
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                Date Range Start
              </label>
              <input
                type="date"
                value={dateRangeStart}
                onChange={(e) => setDateRangeStart(e.target.value)}
                className="w-full px-4 py-3 border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-[#FFD100]"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Date Range End</label>
              <input
                type="date"
                value={dateRangeEnd}
                onChange={(e) => setDateRangeEnd(e.target.value)}
                className="w-full px-4 py-3 border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-[#FFD100]"
                required
              />
            </div>
          </div>

          {/* Top Violations */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-[#1A1A1A]">
                Top Violations (with counts)
              </label>
              <button
                type="button"
                onClick={addViolation}
                className="text-sm text-[#1A1A1A] hover:text-[#FFD100] font-medium"
              >
                + Add Violation
              </button>
            </div>
            <div className="space-y-3">
              {violations.map((v, i) => (
                <div key={i} className="flex gap-3">
                  <input
                    type="text"
                    value={v.type}
                    onChange={(e) => updateViolation(i, 'type', e.target.value)}
                    className="flex-1 px-4 py-2 border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-[#FFD100]"
                    placeholder="e.g., Speeding"
                  />
                  <input
                    type="number"
                    value={v.count || ''}
                    onChange={(e) => updateViolation(i, 'count', e.target.value)}
                    className="w-32 px-4 py-2 border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-[#FFD100]"
                    placeholder="Count"
                  />
                  {violations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeViolation(i)}
                      className="text-[#CF2A27] hover:text-[#CF2A27]/80 px-2"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Agency Breakdown (optional) */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-[#1A1A1A]">
                Agency Breakdown (optional)
              </label>
              <button
                type="button"
                onClick={addAgency}
                className="text-sm text-[#1A1A1A] hover:text-[#FFD100] font-medium"
              >
                + Add Agency
              </button>
            </div>
            <div className="space-y-3">
              {agencies.map((a, i) => (
                <div key={i} className="flex gap-3">
                  <input
                    type="text"
                    value={a.agency}
                    onChange={(e) => updateAgency(i, 'agency', e.target.value)}
                    className="flex-1 px-4 py-2 border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-[#FFD100]"
                    placeholder="e.g., Shelby County Sheriff"
                  />
                  <input
                    type="number"
                    value={a.count || ''}
                    onChange={(e) => updateAgency(i, 'count', e.target.value)}
                    className="w-32 px-4 py-2 border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-[#FFD100]"
                    placeholder="Count"
                  />
                  <button
                    type="button"
                    onClick={() => removeAgency(i)}
                    className="text-[#CF2A27] hover:text-[#CF2A27]/80 px-2"
                  >
                    Remove
                  </button>
                </div>
              ))}
              {agencies.length === 0 && (
                <p className="text-sm text-[#4A4A4A]">No agency breakdown added</p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#1A1A1A] mb-2">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-[#FFD100] resize-none"
              rows={3}
              placeholder="Any additional context or observations..."
            />
          </div>

          {success && (
            <div className="mb-4 p-4 bg-emerald-50 text-emerald-700 rounded-lg">
              Entry saved successfully!
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#1A1A1A] text-white py-3 rounded-lg font-semibold hover:bg-[#1A1A1A]/90 disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Save Entry'}
          </button>
        </form>

        {/* Source Reference */}
        <div className="bg-[#FFD100]/10 rounded-xl p-6 border border-[#FFD100]/30">
          <h3 className="font-semibold text-[#1A1A1A] mb-3">Data Source Reference</h3>
          <p className="text-sm text-[#4A4A4A] mb-4">
            Get aggregate traffic citation data from the IJOW dashboard:
          </p>
          <a
            href="https://ccre.shinyapps.io/ijow"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[#1A1A1A] hover:text-[#1A1A1A]/80 font-medium"
          >
            Open IJOW Dashboard
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>

        {/* Previous Entries */}
        {batches.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-[#E5E5E5]">
            <div className="p-4 border-b border-[#E5E5E5]">
              <h3 className="font-semibold text-[#1A1A1A]">Previous Entries</h3>
            </div>
            <div className="divide-y divide-[#E5E5E5]/50">
              {batches.slice(0, 10).map((batch) => (
                <div key={batch.id} className="p-4 hover:bg-[#F8F8F8]">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-[#1A1A1A]">
                        {batch.source === 'shelby_county' ? 'Shelby County' : 'TN Highway Patrol'}
                      </span>
                      <span className="text-[#4A4A4A] mx-2">•</span>
                      <span className="text-[#4A4A4A]">
                        {batch.dateRangeStart} to {batch.dateRangeEnd}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-[#1A1A1A]">
                        {batch.totalCitations.toLocaleString()} citations
                      </span>
                      <p className="text-xs text-[#4A4A4A]">
                        Entered {new Date(batch.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
