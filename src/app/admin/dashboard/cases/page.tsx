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
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('active'); // Default to active (excludes rejected)
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
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
      } catch (error) {
        console.error('Error fetching cases:', error);
        setCases([]);
      } finally {
        setLoading(false);
      }
    }

    fetchCases();
  }, [statusFilter, searchQuery]);

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
                  <th className="text-left px-6 py-3 text-sm font-semibold text-[#1A1A1A]">Client</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-[#1A1A1A]">Court Date</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-[#1A1A1A]">Offense</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-[#1A1A1A]">Price</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-[#1A1A1A]">OCR Status</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-[#1A1A1A]">Status</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold text-[#1A1A1A]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCases.map((caseItem) => (
                  <tr
                    key={caseItem.id}
                    className="border-b border-[#E5E5E5] hover:bg-[#F8F8F8] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-[#1A1A1A]">{caseItem.clientName}</p>
                        <p className="text-sm text-[#4A4A4A]">{caseItem.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[#1A1A1A]">
                        {new Date(caseItem.courtDate).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="capitalize text-[#1A1A1A]">{caseItem.offenseCategory}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-[#1A1A1A]">${caseItem.price}</span>
                    </td>
                    <td className="px-6 py-4">
                      {caseItem.hasOCRData ? (
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              'w-2 h-2 rounded-full',
                              caseItem.ocrConfidence && caseItem.ocrConfidence >= 70
                                ? 'bg-emerald-500'
                                : 'bg-[#FFD100]'
                            )}
                          />
                          <span
                            className={cn(
                              'text-sm',
                              caseItem.ocrConfidence && caseItem.ocrConfidence >= 70
                                ? 'text-emerald-600'
                                : 'text-[#1A1A1A]'
                            )}
                          >
                            {caseItem.ocrConfidence}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-[#4A4A4A]">No OCR</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={cn(
                          'px-2 py-1 rounded-full text-xs font-medium capitalize',
                          statusColors[caseItem.status].bg,
                          statusColors[caseItem.status].text
                        )}
                      >
                        {caseItem.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/admin/dashboard/cases/${caseItem.id}`}
                        className="text-sm font-medium text-[#1A1A1A] hover:text-[#FFD100] transition-colors"
                      >
                        Review
                      </Link>
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
