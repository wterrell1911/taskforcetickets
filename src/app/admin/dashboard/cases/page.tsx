'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { cn } from '@/lib/utils';

type CaseStatus = 'pending' | 'pending_review' | 'accepted' | 'rejected' | 'completed' | 'refunded';
type FilterStatus = CaseStatus | 'all' | 'active'; // 'active' = all except rejected

interface CaseSummary {
  id: string;
  clientName: string;
  email: string;
  phone?: string;
  courtDate: string;
  courtJurisdiction?: string;
  offenseCategory: string;
  price: number;
  status: CaseStatus;
  createdAt: string;
  hasOCRData: boolean;
  ocrConfidence: number | null;
  paymentStatus?: string;
  internalNotes?: string;
}

const statusColors: Record<CaseStatus, { bg: string; text: string }> = {
  pending: { bg: 'bg-[#FFD100]/20', text: 'text-[#1A1A1A]' },
  pending_review: { bg: 'bg-orange-100', text: 'text-orange-800' },
  accepted: { bg: 'bg-blue-100', text: 'text-blue-800' },
  rejected: { bg: 'bg-red-100', text: 'text-red-800' },
  completed: { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  refunded: { bg: 'bg-gray-100', text: 'text-gray-800' },
};

export default function CasesPage() {
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchCases();
  }, [statusFilter, searchQuery]);

  async function fetchCases() {
    try {
      const params = new URLSearchParams();
      if (statusFilter === 'active') {
        params.set('excludeStatus', 'rejected');
      } else if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }
      if (searchQuery) params.set('search', searchQuery);

      const response = await fetch(`/api/admin/cases?${params}`);
      if (!response.ok) throw new Error('Failed to fetch cases');

      const data = await response.json();
      setCases(data.cases || []);
      setSelectedIds(new Set()); // Clear selection on refresh
    } catch (error) {
      console.error('Error fetching cases:', error);
      setCases([]);
    } finally {
      setLoading(false);
    }
  }

  const filteredCases = cases.filter((c) => {
    let matchesStatus = false;
    if (statusFilter === 'all') {
      matchesStatus = true;
    } else if (statusFilter === 'active') {
      matchesStatus = c.status !== 'rejected';
    } else {
      matchesStatus = c.status === statusFilter;
    }
    const matchesSearch =
      searchQuery === '' ||
      c.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.includes(searchQuery);
    return matchesStatus && matchesSearch;
  });

  const pendingCount = cases.filter((c) => c.status === 'pending' || c.status === 'pending_review').length;
  const needsReviewCount = cases.filter((c) => c.status === 'pending_review').length;
  const lowConfidenceCount = cases.filter(
    (c) => c.hasOCRData && c.ocrConfidence !== null && c.ocrConfidence < 70
  ).length;

  // Selection handlers
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredCases.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredCases.map((c) => c.id)));
    }
  };

  // Bulk action handler
  async function handleBulkAction(action: 'accepted' | 'rejected') {
    if (selectedIds.size === 0) return;

    const confirmMsg =
      action === 'accepted'
        ? `Accept ${selectedIds.size} case(s)?`
        : `Reject ${selectedIds.size} case(s)? This will archive them.`;

    if (!confirm(confirmMsg)) return;

    setActionLoading(true);

    try {
      const results = await Promise.all(
        Array.from(selectedIds).map(async (id) => {
          const response = await fetch(`/api/admin/cases/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: action }),
          });
          return { id, success: response.ok };
        })
      );

      const successCount = results.filter((r) => r.success).length;
      const failCount = results.filter((r) => !r.success).length;

      if (failCount > 0) {
        alert(`${successCount} succeeded, ${failCount} failed`);
      }

      // Refresh cases
      await fetchCases();
    } catch (error) {
      console.error('Bulk action error:', error);
      alert('An error occurred');
    } finally {
      setActionLoading(false);
    }
  }

  const allSelected = filteredCases.length > 0 && selectedIds.size === filteredCases.length;
  const someSelected = selectedIds.size > 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A]">Case Management</h1>
            <p className="text-[#4A4A4A] mt-1">
              Review and process submitted cases
            </p>
          </div>
          <div className="flex items-center gap-3">
            {pendingCount > 0 && (
              <span className="px-3 py-1 bg-[#FFD100] rounded-full text-sm font-medium">
                {pendingCount} pending
              </span>
            )}
            {needsReviewCount > 0 && (
              <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                {needsReviewCount} needs review
              </span>
            )}
            {lowConfidenceCount > 0 && (
              <span className="px-3 py-1 bg-[#CF2A27]/10 text-[#CF2A27] rounded-full text-sm font-medium">
                {lowConfidenceCount} low OCR confidence
              </span>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-[#E5E5E5] p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by name, email, or case ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-[#E5E5E5] rounded-lg focus:ring-2 focus:ring-[#FFD100] focus:border-[#FFD100]"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#4A4A4A]">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
                className="px-3 py-2 border border-[#E5E5E5] rounded-lg focus:ring-2 focus:ring-[#FFD100] focus:border-[#FFD100]"
              >
                <option value="active">Active Cases</option>
                <option value="all">All Cases</option>
                <option value="pending">Pending</option>
                <option value="pending_review">Needs Review</option>
                <option value="accepted">Accepted</option>
                <option value="completed">Completed</option>
                <option value="refunded">Refunded</option>
                <option value="rejected">Rejected (Archived)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bulk Action Bar */}
        {someSelected && (
          <div className="bg-[#1A1A1A] text-white rounded-xl p-4 flex items-center justify-between">
            <span className="font-medium">{selectedIds.size} case(s) selected</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleBulkAction('accepted')}
                disabled={actionLoading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium disabled:opacity-50 transition-colors"
              >
                {actionLoading ? 'Processing...' : 'Accept Selected'}
              </button>
              <button
                onClick={() => handleBulkAction('rejected')}
                disabled={actionLoading}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium disabled:opacity-50 transition-colors"
              >
                {actionLoading ? 'Processing...' : 'Reject Selected'}
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg font-medium transition-colors"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        {/* Cases Table */}
        <div className="bg-white rounded-xl border border-[#E5E5E5] overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin h-8 w-8 border-4 border-[#FFD100] border-t-transparent rounded-full mx-auto" />
              <p className="text-[#4A4A4A] mt-3">Loading cases...</p>
            </div>
          ) : filteredCases.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="w-12 h-12 mx-auto text-[#4A4A4A] opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-[#4A4A4A] mt-3">No cases found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-[#F8F8F8] border-b border-[#E5E5E5]">
                  <th className="px-4 py-3 w-12">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-[#FFD100] focus:ring-[#FFD100]"
                    />
                  </th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-[#1A1A1A]">Client</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-[#1A1A1A]">Court Date</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-[#1A1A1A]">Offense</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-[#1A1A1A]">Price</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-[#1A1A1A]">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-[#1A1A1A]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCases.map((caseItem) => (
                  <tr
                    key={caseItem.id}
                    className={cn(
                      'border-b border-[#E5E5E5] hover:bg-[#F8F8F8] transition-colors',
                      selectedIds.has(caseItem.id) && 'bg-[#FFD100]/10'
                    )}
                  >
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(caseItem.id)}
                        onChange={() => toggleSelect(caseItem.id)}
                        className="w-4 h-4 rounded border-gray-300 text-[#FFD100] focus:ring-[#FFD100]"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-medium text-[#1A1A1A]">{caseItem.clientName}</p>
                        <p className="text-sm text-[#4A4A4A]">{caseItem.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-[#1A1A1A]">
                        {new Date(caseItem.courtDate).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="capitalize text-[#1A1A1A]">{caseItem.offenseCategory}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-medium text-[#1A1A1A]">${caseItem.price}</span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={cn(
                          'px-2 py-1 rounded-full text-xs font-medium capitalize',
                          statusColors[caseItem.status].bg,
                          statusColors[caseItem.status].text
                        )}
                      >
                        {caseItem.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/dashboard/cases/${caseItem.id}`}
                          className="text-sm font-medium text-[#1A1A1A] hover:text-[#FFD100] transition-colors"
                        >
                          Review
                        </Link>
                        {(caseItem.status === 'pending' || caseItem.status === 'pending_review') && (
                          <>
                            <span className="text-[#E5E5E5]">|</span>
                            <button
                              onClick={async () => {
                                if (!confirm(`Accept case for ${caseItem.clientName}?`)) return;
                                await fetch(`/api/admin/cases/${caseItem.id}`, {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ status: 'accepted' }),
                                });
                                fetchCases();
                              }}
                              className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                            >
                              Accept
                            </button>
                            <span className="text-[#E5E5E5]">|</span>
                            <button
                              onClick={async () => {
                                if (!confirm(`Reject case for ${caseItem.clientName}?`)) return;
                                await fetch(`/api/admin/cases/${caseItem.id}`, {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ status: 'rejected' }),
                                });
                                fetchCases();
                              }}
                              className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
