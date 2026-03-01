import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/db/supabase';

/**
 * GET /api/admin/cases
 * Fetch all cases for admin dashboard
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getAdminClient();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status');
    const excludeStatus = searchParams.get('excludeStatus');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('cases')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by status if provided
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Exclude status if provided (e.g., exclude rejected for "active" filter)
    if (excludeStatus) {
      query = query.neq('status', excludeStatus);
    }

    // Search by name or email if provided
    if (search) {
      query = query.or(`customer_name.ilike.%${search}%,customer_email.ilike.%${search}%`);
    }

    const { data: cases, error } = await query;

    if (error) {
      console.error('Failed to fetch cases:', error);
      return NextResponse.json(
        { error: 'Failed to fetch cases' },
        { status: 500 }
      );
    }

    // Transform to match frontend expectations
    const transformedCases = (cases || []).map((c) => ({
      id: c.id,
      clientName: c.customer_name,
      email: c.customer_email,
      phone: c.customer_phone,
      courtDate: c.court_date,
      courtJurisdiction: c.court_jurisdiction,
      offenseCategory: c.offense_tier,
      price: c.amount_charged ? c.amount_charged / 100 : 0, // Convert cents to dollars
      status: c.status,
      createdAt: c.created_at,
      hasOCRData: !!c.ocr_raw_text,
      ocrConfidence: c.ocr_confidence,
      ocrWarnings: c.ocr_extraction_warnings,
      paymentStatus: c.payment_status,
      internalNotes: c.internal_notes,
      // Document paths
      ticketDocumentPath: c.ticket_document_path,
      licenseDocumentPath: c.license_document_path,
      supportingDocumentPath: c.supporting_document_path,
      // Additional fields
      citationNumber: c.citation_number,
      courtLocation: c.court_location,
      courtTime: c.court_time,
      violationLocation: c.violation_location,
      officerName: c.officer_name,
      // Encrypted fields (masked for list view)
      hasLicenseNumber: !!c.license_number_encrypted,
      licenseNumberMasked: c.license_number_masked,
      hasDateOfBirth: !!c.date_of_birth_encrypted,
      hasAddress: !!c.customer_address_encrypted,
    }));

    return NextResponse.json({
      cases: transformedCases,
      total: transformedCases.length,
    });
  } catch (error) {
    console.error('Cases API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
