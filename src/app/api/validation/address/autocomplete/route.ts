/**
 * GET /api/validation/address/autocomplete
 * Get address autocomplete suggestions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAddressSuggestions } from '@/lib/validation/address-validator';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const states = searchParams.get('states'); // Comma-separated state codes

    if (!query || query.length < 3) {
      return NextResponse.json({ suggestions: [] });
    }

    const result = await getAddressSuggestions(query, {
      includeOnlyStates: states ? states.split(',') : ['TN', 'AR', 'MS'], // Default to service area
      maxResults: 10,
    });

    return NextResponse.json({
      success: true,
      suggestions: result.suggestions,
      error: result.error,
    });
  } catch (error) {
    console.error('Address autocomplete error:', error);
    return NextResponse.json(
      { success: false, suggestions: [], error: 'Autocomplete unavailable' },
      { status: 500 }
    );
  }
}
