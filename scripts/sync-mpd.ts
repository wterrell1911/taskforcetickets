/**
 * Weekly MPD traffic stops sync.
 * Intended to run from .github/workflows/weekly-mpd-sync.yml.
 *
 * Required env vars:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Optional env vars (default: rolling 30-day window):
 *   SYNC_START_DATE   (YYYY-MM-DD)
 *   SYNC_END_DATE     (YYYY-MM-DD)
 *
 * Local usage:
 *   set -a && source .env.local && set +a && npx tsx scripts/sync-mpd.ts
 */

import { syncMPDData } from '@/lib/socrata';

async function main(): Promise<void> {
  const required = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    console.error(`[sync-mpd] Missing env vars: ${missing.join(', ')}`);
    process.exit(1);
  }

  const startDate = process.env.SYNC_START_DATE;
  const endDate = process.env.SYNC_END_DATE;

  console.log('[sync-mpd] Starting MPD sync', {
    startDate: startDate ?? '(default: last 30 days)',
    endDate: endDate ?? '(default: now)',
  });

  const started = Date.now();
  const result = await syncMPDData({
    startDate,
    endDate,
    onProgress: (message, count) => {
      console.log(`[sync-mpd] ${message}: ${count}`);
    },
  });
  const elapsedSec = ((Date.now() - started) / 1000).toFixed(1);

  if (result.success) {
    console.log(`[sync-mpd] SUCCESS in ${elapsedSec}s — ${result.recordsProcessed} records`);
    process.exit(0);
  }

  console.error(`[sync-mpd] FAILURE in ${elapsedSec}s — ${result.error ?? 'unknown error'}`);
  process.exit(1);
}

main().catch((err) => {
  console.error('[sync-mpd] Uncaught error:', err);
  process.exit(1);
});
