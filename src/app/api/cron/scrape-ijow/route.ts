import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * GET /api/cron/scrape-ijow
 * Triggered by cron to scrape IJOW dashboard
 *
 * Note: This requires puppeteer which may not work on Vercel serverless.
 * For production, consider:
 * 1. Running on a VPS with cron
 * 2. Using a service like GitHub Actions
 * 3. Using Vercel's edge functions with a headless browser service
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // For local development, run the scraper script
    if (process.env.NODE_ENV === 'development') {
      const { stdout, stderr } = await execAsync('npx tsx scripts/scrape-ijow.ts', {
        cwd: process.cwd(),
        timeout: 120000, // 2 minute timeout
      });

      return NextResponse.json({
        success: true,
        message: 'Scraper completed',
        output: stdout,
        errors: stderr || null,
      });
    }

    // For production, return instructions
    return NextResponse.json({
      success: false,
      message: 'Puppeteer scraping not available in serverless environment',
      instructions: [
        'Run the scraper locally: npx tsx scripts/scrape-ijow.ts',
        'Or set up a GitHub Action to run weekly',
        'Or deploy to a VPS with cron',
      ],
    });
  } catch (error) {
    console.error('Scraper error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Scraper failed',
      },
      { status: 500 }
    );
  }
}
