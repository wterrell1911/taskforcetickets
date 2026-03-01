'use client';

import { useEffect } from 'react';
import { captureAttribution } from '@/lib/tracking/attribution';

export function AttributionCapture() {
  useEffect(() => {
    captureAttribution();
  }, []);

  // This component renders nothing
  return null;
}
