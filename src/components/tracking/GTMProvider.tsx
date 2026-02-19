'use client';

import { useEffect } from 'react';

// Initialize dataLayer if it doesn't exist
declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

export function initDataLayer() {
  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || [];
  }
}

export function pushEvent(name: string, data?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: name,
      ...data,
    });
  }
}

interface GTMProviderProps {
  children: React.ReactNode;
}

export function GTMProvider({ children }: GTMProviderProps) {
  useEffect(() => {
    initDataLayer();
  }, []);

  return <>{children}</>;
}
