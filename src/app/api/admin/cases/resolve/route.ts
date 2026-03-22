/**
 * POST /api/admin/cases/resolve
 * Upload disposition document and send resolution email to client
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { CaseResolvedEmail } from '@/lib/emails/templates/case-resolved';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const caseId = formData.get('caseId') as string;

    if (!file || !caseId) {
      return NextResponse.json(
        { error: 'File and caseId are required' },
        { status: 400 }
      );
    }

    // Fetch case details
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('customer_name, customer_email, citation_number, court_jurisdiction')
      .eq('id', caseId)
      .single();

    if (caseError || !caseData) {
      return NextResponse.json(
        { error: 'Case not found' },
        { status: 404 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const ext = file.name.split('.').pop() || 'pdf';
    const filename = `dispositions/${caseId}/${timestamp}-disposition.${ext}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('case-documents')
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }

    // Get public URL for the file
    const { data: urlData } = supabase.storage
      .from('case-documents')
      .getPublicUrl(filename);

    // Update case status to 'resolved' and store disposition URL
    const { error: updateError } = await supabase
      .from('cases')
      .update({
        status: 'dismissed',
        disposition_url: urlData.publicUrl,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', caseId);

    if (updateError) {
      console.error('Update error:', updateError);
      // Continue anyway - file is uploaded
    }

    // Send email to client with disposition
    try {
      // Fetch the file as base64 for email attachment
      const base64Content = buffer.toString('base64');

      await resend.emails.send({
        from: 'TaskForce Tickets <notifications@taskforcetickets.com>',
        to: caseData.customer_email,
        subject: `Your Case Has Been Resolved - ${caseData.citation_number || caseId}`,
        react: CaseResolvedEmail({
          customerName: caseData.customer_name,
          caseId: caseId,
          citationNumber: caseData.citation_number || 'N/A',
          courtJurisdiction: caseData.court_jurisdiction || 'Memphis',
        }),
        attachments: [
          {
            filename: `disposition-${caseData.citation_number || caseId}.${ext}`,
            content: base64Content,
          },
        ],
      });
    } catch (emailError) {
      console.error('Email error:', emailError);
      // Don't fail the whole request if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Disposition uploaded and client notified',
      dispositionUrl: urlData.publicUrl,
    });
  } catch (error) {
    console.error('Resolution error:', error);
    return NextResponse.json(
      { error: 'Failed to process resolution' },
      { status: 500 }
    );
  }
}
