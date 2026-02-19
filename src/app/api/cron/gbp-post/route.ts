import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { generateWeeklyPost } from '@/lib/gbp/content-generator';
import { createGBPPost } from '@/lib/gbp/posts';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Generate post content
    console.log('Generating weekly GBP post content...');
    const content = await generateWeeklyPost();
    console.log('Generated content:', content);

    // Publish to GBP
    console.log('Publishing to Google Business Profile...');
    const gbpResponse = await createGBPPost(content);
    console.log('GBP response:', gbpResponse);

    // Log to database
    const { error: dbError } = await supabase.from('gbp_posts').insert({
      content,
      status: 'published',
      gbp_post_id: gbpResponse.name,
    });

    if (dbError) {
      console.error('Error logging to database:', dbError);
    }

    return NextResponse.json({
      success: true,
      content,
      gbpPostId: gbpResponse.name,
      state: gbpResponse.state,
    });
  } catch (error) {
    console.error('Error creating GBP post:', error);

    // Log failure to database
    await supabase.from('gbp_posts').insert({
      content: 'FAILED TO GENERATE',
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    // Send alert email
    const alertEmail = process.env.ALERT_EMAIL || process.env.WEEKLY_DIGEST_RECIPIENTS;
    if (alertEmail) {
      try {
        await resend.emails.send({
          from: 'TaskForce Tickets <alerts@taskforcetickets.com>',
          to: alertEmail.split(','),
          subject: '⚠️ GBP Post Failed',
          html: `
            <h2>GBP Post Failed</h2>
            <p>The weekly Google Business Profile post failed to publish.</p>
            <p><strong>Error:</strong> ${error instanceof Error ? error.message : 'Unknown error'}</p>
            <p><strong>Time:</strong> ${new Date().toISOString()}</p>
            <p>Please check the GBP credentials and API status.</p>
          `,
        });
      } catch (emailError) {
        console.error('Failed to send alert email:', emailError);
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
