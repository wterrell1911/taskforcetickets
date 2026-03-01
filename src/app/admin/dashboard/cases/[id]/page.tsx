'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { OCRReviewPanel } from '@/components/admin/OCRReviewPanel';
import { cn } from '@/lib/utils';
import {
  ExtractedTicketData,
  ExtractedLicenseData,
  ExtractedSupportingDocData,
} from '@/lib/ocr/ocr-provider';

type CaseStatus = 'pending' | 'pending_review' | 'accepted' | 'rejected' | 'completed' | 'refunded' | 'dismissed' | 'not_dismissed' | 'needs_info';
type DocumentTab = 'ticket' | 'license' | 'supporting';

const REJECTION_REASONS = [
  { id: 'incomplete', label: 'Incomplete Data', description: 'Missing required information or documents' },
  { id: 'cannot_determine', label: 'Cannot Make Determination', description: 'Unable to assess eligibility based on provided information' },
  { id: 'not_qualified', label: 'Does Not Qualify for Program', description: 'Case does not meet program requirements' },
  { id: 'cdl_referral', label: 'CDL Case - Contact Office', description: 'Commercial driver\'s license cases require direct legal representation' },
  { id: 'conflict', label: 'Conflict of Interest', description: 'Unable to represent due to existing representation conflict' },
] as const;

interface CaseDetail {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  court_date: string;
  court_jurisdiction: string | null;
  offense_tier: string;
  citation_number: string | null;
  officer_name: string | null;
  violation_location: string | null;
  court_location: string | null;
  court_time: string | null;
  amount_charged: number;
  status: CaseStatus;
  created_at: string;
  payment_status: string | null;
  internal_notes: string | null;
  // Decrypted fields (from API)
  license_number: string | null;
  date_of_birth: string | null;
  customer_address: string | null;
  // Document URLs (signed URLs from storage)
  ticket_url: string | null;
  license_url: string | null;
  supporting_url: string | null;
  // OCR data
  ocr_raw_text: string | null;
  ocr_confidence: number | null;
  ocr_extraction_warnings: string[];
  // Legal acknowledgments
  terms_accepted_at: string | null;
  deadline_acknowledged: boolean;
}

export default function CaseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const caseId = params.id as string;

  const [caseData, setCaseData] = useState<CaseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<DocumentTab>('ticket');
  const [verifiedData, setVerifiedData] = useState<Record<string, Record<string, string>>>({});
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRejectionReason, setSelectedRejectionReason] = useState<string>('');
  const [customRejectionNote, setCustomRejectionNote] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    court_date: '',
    citation_number: '',
    court_location: '',
    court_time: '',
    internal_notes: '',
  });

  useEffect(() => {
    async function fetchCase() {
      try {
        const response = await fetch(`/api/admin/cases/${caseId}`);
        if (!response.ok) {
          throw new Error('Case not found');
        }
        const data = await response.json();
        setCaseData(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching case:', error);
        setCaseData(null);
        setLoading(false);
      }
    }
    fetchCase();
  }, [caseId]);

  const handleVerifiedDataChange = (docType: DocumentTab, data: Record<string, string>) => {
    setVerifiedData((prev) => ({
      ...prev,
      [docType]: data,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // TODO: Save verified data to API
      // await fetch(`/api/admin/cases/${caseId}`, {
      //   method: 'PATCH',
      //   body: JSON.stringify({ verifiedData }),
      // });
      await new Promise((resolve) => setTimeout(resolve, 500));
      alert('Changes saved successfully');
    } catch {
      alert('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const handleAccept = async () => {
    if (!confirm('Accept this case? The client will be notified.')) return;

    setSaving(true);
    try {
      // TODO: Update case status via API
      await new Promise((resolve) => setTimeout(resolve, 500));
      setCaseData((prev) => (prev ? { ...prev, status: 'accepted' } : null));
      alert('Case accepted');
    } catch {
      alert('Failed to accept case');
    } finally {
      setSaving(false);
    }
  };

  const handleRejectClick = () => {
    setSelectedRejectionReason('');
    setCustomRejectionNote('');
    setShowRejectModal(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedRejectionReason) {
      alert('Please select a rejection reason');
      return;
    }

    const reason = REJECTION_REASONS.find(r => r.id === selectedRejectionReason) as typeof REJECTION_REASONS[number] | undefined;
    const reasonLabel = reason?.label || 'Rejected';
    const reasonDescription = reason?.description || '';
    const fullReason = customRejectionNote
      ? `${reasonLabel}: ${customRejectionNote}`
      : reasonDescription || reasonLabel;

    setSaving(true);
    setShowRejectModal(false);
    try {
      const response = await fetch(`/api/admin/cases/${caseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          rejectionReason: fullReason,
          rejectionReasonId: selectedRejectionReason,
        }),
      });

      if (!response.ok) throw new Error('Failed to reject case');

      setCaseData((prev) => (prev ? { ...prev, status: 'rejected' } : null));
      alert('Case rejected - notification sent to client');
    } catch {
      alert('Failed to reject case');
    } finally {
      setSaving(false);
    }
  };

  const handleStartEdit = () => {
    if (!caseData) return;
    setEditForm({
      customer_name: caseData.customer_name || '',
      customer_email: caseData.customer_email || '',
      customer_phone: caseData.customer_phone || '',
      court_date: caseData.court_date ? caseData.court_date.split('T')[0] : '',
      citation_number: caseData.citation_number || '',
      court_location: caseData.court_location || '',
      court_time: caseData.court_time || '',
      internal_notes: caseData.internal_notes || '',
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/cases/${caseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          customer_name: editForm.customer_name,
          customer_email: editForm.customer_email,
          customer_phone: editForm.customer_phone,
          court_date: editForm.court_date,
          citation_number: editForm.citation_number,
          court_location: editForm.court_location,
          court_time: editForm.court_time,
          internal_notes: editForm.internal_notes,
        }),
      });

      if (!response.ok) throw new Error('Failed to update case');

      // Update local state
      setCaseData((prev) => prev ? {
        ...prev,
        customer_name: editForm.customer_name,
        customer_email: editForm.customer_email,
        customer_phone: editForm.customer_phone,
        court_date: editForm.court_date,
        citation_number: editForm.citation_number,
        court_location: editForm.court_location,
        court_time: editForm.court_time,
        internal_notes: editForm.internal_notes,
      } : null);

      setIsEditing(false);
      alert('Case updated successfully');
    } catch {
      alert('Failed to update case');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin h-10 w-10 border-4 border-[#FFD100] border-t-transparent rounded-full mx-auto" />
            <p className="text-[#4A4A4A] mt-4">Loading case...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!caseData) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-[#4A4A4A]">Case not found</p>
          <button
            onClick={() => router.push('/admin/dashboard/cases')}
            className="mt-4 text-[#FFD100] hover:underline"
          >
            Back to cases
          </button>
        </div>
      </AdminLayout>
    );
  }

  const getDocumentImageUrl = (tab: DocumentTab) => {
    switch (tab) {
      case 'ticket':
        return caseData.ticket_url;
      case 'license':
        return caseData.license_url;
      case 'supporting':
        return caseData.supporting_url;
    }
  };

  // Build extracted data objects from the case data
  const getExtractedData = (tab: DocumentTab): ExtractedTicketData | ExtractedLicenseData | ExtractedSupportingDocData | null => {
    switch (tab) {
      case 'ticket':
        return {
          documentType: 'ticket' as const,
          citationNumber: caseData.citation_number || null,
          courtDate: caseData.court_date || null,
          courtLocation: caseData.court_location || null,
          courtTime: caseData.court_time || null,
          violationLocation: caseData.violation_location || null,
          violationDate: null,
          violationTime: null,
          officerName: caseData.officer_name || null,
          officerBadge: null,
          violations: [],
          fineAmount: null,
          statuteNumbers: [],
          isCameraTicket: false,
          confidence: caseData.ocr_confidence || 0,
          rawText: caseData.ocr_raw_text || '',
          extractionWarnings: caseData.ocr_extraction_warnings || [],
        };
      case 'license':
        return {
          documentType: 'license' as const,
          licenseNumber: caseData.license_number || null,
          fullName: caseData.customer_name || null,
          firstName: null,
          lastName: null,
          middleName: null,
          dateOfBirth: caseData.date_of_birth || null,
          expirationDate: null,
          issueDate: null,
          address: caseData.customer_address || null,
          city: null,
          state: null,
          zipCode: null,
          licenseClass: null,
          restrictions: [],
          endorsements: [],
          confidence: caseData.ocr_confidence || 0,
          rawText: '',
          extractionWarnings: [],
        };
      case 'supporting':
        return caseData.supporting_url ? {
          documentType: 'supporting' as const,
          documentSubtype: null,
          policyNumber: null,
          insuranceCompany: null,
          effectiveDate: null,
          expirationDate: null,
          vehicleInfo: null,
          vinNumber: null,
          plateNumber: null,
          insuredName: null,
          confidence: 100,
          rawText: '',
          extractionWarnings: [],
        } : null;
    }
  };

  const getOCRConfidence = (tab: DocumentTab) => {
    if (tab === 'ticket') {
      return caseData.ocr_confidence ?? null;
    }
    // License and supporting docs don't have separate confidence scores currently
    return null;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin/dashboard/cases')}
              className="p-2 hover:bg-[#F8F8F8] rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-[#1A1A1A]">
                Case #{caseData.id.slice(0, 8).toUpperCase()}
              </h1>
              <p className="text-[#4A4A4A]">
                {caseData.customer_name} &middot; {caseData.customer_email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={cn(
                'px-3 py-1 rounded-full text-sm font-medium capitalize',
                caseData.status === 'pending' && 'bg-[#FFD100]/20 text-[#1A1A1A]',
                caseData.status === 'pending_review' && 'bg-orange-100 text-orange-800',
                caseData.status === 'accepted' && 'bg-blue-100 text-blue-800',
                caseData.status === 'rejected' && 'bg-red-100 text-red-800',
                caseData.status === 'completed' && 'bg-emerald-100 text-emerald-800',
                caseData.status === 'dismissed' && 'bg-emerald-100 text-emerald-800',
                caseData.status === 'refunded' && 'bg-gray-100 text-gray-800'
              )}
            >
              {caseData.status.replace('_', ' ')}
            </span>
            {!isEditing && (
              <button
                onClick={handleStartEdit}
                className="px-3 py-1 text-sm font-medium text-[#4A4A4A] hover:text-[#1A1A1A] border border-[#E5E5E5] rounded-lg hover:bg-[#F8F8F8] transition-colors"
              >
                Edit Info
              </button>
            )}
          </div>
        </div>

        {/* Case Summary */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-[#E5E5E5] p-4">
            <p className="text-sm text-[#4A4A4A]">Court Date</p>
            <p className="font-semibold text-[#1A1A1A]">
              {caseData.court_date ? new Date(caseData.court_date).toLocaleDateString() : 'Not set'}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-[#E5E5E5] p-4">
            <p className="text-sm text-[#4A4A4A]">Offense Category</p>
            <p className="font-semibold text-[#1A1A1A] capitalize">{caseData.offense_tier || 'N/A'}</p>
          </div>
          <div className="bg-white rounded-xl border border-[#E5E5E5] p-4">
            <p className="text-sm text-[#4A4A4A]">Price</p>
            <p className="font-semibold text-[#1A1A1A]">${caseData.amount_charged ? (caseData.amount_charged / 100).toFixed(2) : '0.00'}</p>
          </div>
          <div className="bg-white rounded-xl border border-[#E5E5E5] p-4">
            <p className="text-sm text-[#4A4A4A]">Submitted</p>
            <p className="font-semibold text-[#1A1A1A]">
              {caseData.created_at ? new Date(caseData.created_at).toLocaleDateString() : 'Unknown'}
            </p>
          </div>
        </div>

        {/* Document Tabs */}
        <div className="bg-white rounded-xl border border-[#E5E5E5]">
          <div className="border-b border-[#E5E5E5]">
            <div className="flex">
              {(['ticket', 'license', 'supporting'] as DocumentTab[]).map((tab) => {
                const confidence = getOCRConfidence(tab);
                const isLowConfidence = confidence !== null && confidence < 70;

                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      'flex items-center gap-2 px-6 py-4 font-medium transition-colors border-b-2 -mb-px',
                      activeTab === tab
                        ? 'border-[#FFD100] text-[#1A1A1A]'
                        : 'border-transparent text-[#4A4A4A] hover:text-[#1A1A1A]'
                    )}
                  >
                    <span className="capitalize">
                      {tab === 'supporting' ? 'Supporting Doc' : tab}
                    </span>
                    {confidence !== null && (
                      <span
                        className={cn(
                          'text-xs px-2 py-0.5 rounded-full',
                          isLowConfidence
                            ? 'bg-[#FFD100]/20 text-[#1A1A1A]'
                            : 'bg-emerald-100 text-emerald-700'
                        )}
                      >
                        {Math.round(confidence)}%
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-6" style={{ minHeight: '600px' }}>
            <OCRReviewPanel
              documentType={activeTab}
              imageUrl={getDocumentImageUrl(activeTab)}
              extractedData={getExtractedData(activeTab)}
              verifiedData={verifiedData[activeTab] || {}}
              onVerifiedDataChange={(data) => handleVerifiedDataChange(activeTab, data)}
            />
          </div>
        </div>

        {/* Edit Mode Bar */}
        {isEditing && (
          <div className="bg-[#FFD100]/10 border border-[#FFD100] rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-[#1A1A1A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span className="font-medium text-[#1A1A1A]">Editing Case Information</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancelEdit}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-[#4A4A4A] hover:text-[#1A1A1A] border border-[#E5E5E5] rounded-lg hover:bg-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-[#1A1A1A] rounded-lg hover:bg-[#1A1A1A]/90 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        )}

        {/* Client Info & Actions */}
        <div className="grid grid-cols-3 gap-6">
          {/* Client Contact */}
          <div className="bg-white rounded-xl border border-[#E5E5E5] p-6">
            <h3 className="font-semibold text-[#1A1A1A] mb-4">Client Contact</h3>
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-[#4A4A4A] mb-1">Name</label>
                  <input
                    type="text"
                    value={editForm.customer_name}
                    onChange={(e) => setEditForm({ ...editForm, customer_name: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E5E5E5] rounded-lg focus:ring-2 focus:ring-[#FFD100] focus:border-[#FFD100]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#4A4A4A] mb-1">Email</label>
                  <input
                    type="email"
                    value={editForm.customer_email}
                    onChange={(e) => setEditForm({ ...editForm, customer_email: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E5E5E5] rounded-lg focus:ring-2 focus:ring-[#FFD100] focus:border-[#FFD100]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#4A4A4A] mb-1">Phone</label>
                  <input
                    type="tel"
                    value={editForm.customer_phone}
                    onChange={(e) => setEditForm({ ...editForm, customer_phone: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E5E5E5] rounded-lg focus:ring-2 focus:ring-[#FFD100] focus:border-[#FFD100]"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-[#4A4A4A]">Name</p>
                  <p className="font-medium">{caseData.customer_name || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-[#4A4A4A]">Email</p>
                  <p className="font-medium">{caseData.customer_email || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-[#4A4A4A]">Phone</p>
                  <p className="font-medium">{caseData.customer_phone || 'Not provided'}</p>
                </div>
                {caseData.customer_address && (
                  <div>
                    <p className="text-sm text-[#4A4A4A]">Address</p>
                    <p className="font-medium">{caseData.customer_address}</p>
                  </div>
                )}
                {caseData.license_number && (
                  <div>
                    <p className="text-sm text-[#4A4A4A]">License Number</p>
                    <p className="font-medium font-mono">{caseData.license_number}</p>
                  </div>
                )}
                {caseData.date_of_birth && (
                  <div>
                    <p className="text-sm text-[#4A4A4A]">Date of Birth</p>
                    <p className="font-medium">{caseData.date_of_birth}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Ticket Info */}
          <div className="bg-white rounded-xl border border-[#E5E5E5] p-6">
            <h3 className="font-semibold text-[#1A1A1A] mb-4">Ticket Details</h3>
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-[#4A4A4A] mb-1">Citation Number</label>
                  <input
                    type="text"
                    value={editForm.citation_number}
                    onChange={(e) => setEditForm({ ...editForm, citation_number: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E5E5E5] rounded-lg focus:ring-2 focus:ring-[#FFD100] focus:border-[#FFD100]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#4A4A4A] mb-1">Court Date</label>
                  <input
                    type="date"
                    value={editForm.court_date}
                    onChange={(e) => setEditForm({ ...editForm, court_date: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E5E5E5] rounded-lg focus:ring-2 focus:ring-[#FFD100] focus:border-[#FFD100]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#4A4A4A] mb-1">Court Location</label>
                  <input
                    type="text"
                    value={editForm.court_location}
                    onChange={(e) => setEditForm({ ...editForm, court_location: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E5E5E5] rounded-lg focus:ring-2 focus:ring-[#FFD100] focus:border-[#FFD100]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#4A4A4A] mb-1">Court Time</label>
                  <input
                    type="time"
                    value={editForm.court_time}
                    onChange={(e) => setEditForm({ ...editForm, court_time: e.target.value })}
                    className="w-full px-3 py-2 border border-[#E5E5E5] rounded-lg focus:ring-2 focus:ring-[#FFD100] focus:border-[#FFD100]"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-[#4A4A4A]">Citation Number</p>
                  <p className="font-medium">{caseData.citation_number || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-[#4A4A4A]">Issuing Officer</p>
                  <p className="font-medium">{caseData.officer_name || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm text-[#4A4A4A]">Violation Location</p>
                  <p className="font-medium">{caseData.violation_location || 'Not provided'}</p>
                </div>
                {caseData.court_jurisdiction && (
                  <div>
                    <p className="text-sm text-[#4A4A4A]">Jurisdiction</p>
                    <p className="font-medium">{caseData.court_jurisdiction}</p>
                  </div>
                )}
                {caseData.court_location && (
                  <div>
                    <p className="text-sm text-[#4A4A4A]">Court Location</p>
                    <p className="font-medium">{caseData.court_location}</p>
                  </div>
                )}
                {caseData.court_time && (
                  <div>
                    <p className="text-sm text-[#4A4A4A]">Court Time</p>
                    <p className="font-medium">{caseData.court_time}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Acknowledgments & Notes */}
          <div className="bg-white rounded-xl border border-[#E5E5E5] p-6">
            <h3 className="font-semibold text-[#1A1A1A] mb-4">Status & Notes</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {caseData.terms_accepted_at ? (
                  <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                <span className="text-sm">Terms accepted</span>
                {caseData.terms_accepted_at && (
                  <span className="text-xs text-[#4A4A4A]">
                    ({new Date(caseData.terms_accepted_at).toLocaleString()})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {caseData.deadline_acknowledged ? (
                  <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                <span className="text-sm">Deadline acknowledged</span>
              </div>
              {caseData.payment_status && (
                <div>
                  <p className="text-sm text-[#4A4A4A]">Payment Status</p>
                  <p className="font-medium capitalize">{caseData.payment_status}</p>
                </div>
              )}
              {caseData.ocr_confidence !== null && (
                <div>
                  <p className="text-sm text-[#4A4A4A]">OCR Confidence</p>
                  <p className={cn(
                    'font-medium',
                    caseData.ocr_confidence >= 70 ? 'text-emerald-600' : 'text-orange-600'
                  )}>
                    {caseData.ocr_confidence}%
                  </p>
                </div>
              )}
              {caseData.internal_notes && (
                <div>
                  <p className="text-sm text-[#4A4A4A]">Internal Notes</p>
                  <p className="font-medium text-sm bg-[#F8F8F8] p-2 rounded mt-1">{caseData.internal_notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {(caseData.status === 'pending' || caseData.status === 'pending_review') && (
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-[#E5E5E5]">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 border border-[#E5E5E5] rounded-lg font-medium hover:bg-[#F8F8F8] transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={handleRejectClick}
              disabled={saving}
              className="px-6 py-2 bg-[#CF2A27] text-white rounded-lg font-medium hover:bg-[#CF2A27]/90 transition-colors disabled:opacity-50"
            >
              Reject Case
            </button>
            <button
              onClick={handleAccept}
              disabled={saving}
              className="px-6 py-2 bg-[#1A1A1A] text-white rounded-lg font-medium hover:bg-[#1A1A1A]/90 transition-colors disabled:opacity-50"
            >
              Accept Case
            </button>
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-xl font-bold text-[#1A1A1A] mb-4">Reject Case</h3>
            <p className="text-sm text-[#4A4A4A] mb-4">
              Select a reason for rejection. This will be communicated to the client.
            </p>

            <div className="space-y-2 mb-4">
              {REJECTION_REASONS.map((reason) => (
                <label
                  key={reason.id}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                    selectedRejectionReason === reason.id
                      ? 'border-[#CF2A27] bg-[#CF2A27]/5'
                      : 'border-[#E5E5E5] hover:border-[#CF2A27]/50'
                  )}
                >
                  <input
                    type="radio"
                    name="rejectionReason"
                    value={reason.id}
                    checked={selectedRejectionReason === reason.id}
                    onChange={(e) => setSelectedRejectionReason(e.target.value)}
                    className="mt-1 accent-[#CF2A27]"
                  />
                  <div>
                    <p className="font-medium text-[#1A1A1A]">{reason.label}</p>
                    <p className="text-sm text-[#4A4A4A]">{reason.description}</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-[#4A4A4A] mb-1">
                Additional Notes (optional)
              </label>
              <textarea
                value={customRejectionNote}
                onChange={(e) => setCustomRejectionNote(e.target.value)}
                placeholder="Add any specific details for the client..."
                className="w-full px-3 py-2 border border-[#E5E5E5] rounded-lg focus:ring-2 focus:ring-[#CF2A27] focus:border-[#CF2A27] resize-none"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 border border-[#E5E5E5] rounded-lg font-medium hover:bg-[#F8F8F8] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={!selectedRejectionReason || saving}
                className="px-4 py-2 bg-[#CF2A27] text-white rounded-lg font-medium hover:bg-[#CF2A27]/90 transition-colors disabled:opacity-50"
              >
                {saving ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
