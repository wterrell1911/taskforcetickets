// UTM and attribution tracking utilities

const STORAGE_KEY = 'tft_attribution';

export interface Attribution {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  gclid: string | null;
  fbclid: string | null;
  referrer: string | null;
  landing_page: string | null;
  device_type: 'mobile' | 'desktop' | 'tablet';
  captured_at: string;
}

function getDeviceType(): 'mobile' | 'desktop' | 'tablet' {
  if (typeof window === 'undefined') return 'desktop';
  
  const ua = navigator.userAgent.toLowerCase();
  
  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    return 'tablet';
  }
  
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) {
    return 'mobile';
  }
  
  return 'desktop';
}

function getUrlParam(param: string): string | null {
  if (typeof window === 'undefined') return null;
  
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

export function captureAttribution(): void {
  if (typeof window === 'undefined') return;
  
  // Only capture on first visit in session (don't overwrite existing)
  const existing = sessionStorage.getItem(STORAGE_KEY);
  if (existing) return;
  
  const attribution: Attribution = {
    utm_source: getUrlParam('utm_source'),
    utm_medium: getUrlParam('utm_medium'),
    utm_campaign: getUrlParam('utm_campaign'),
    utm_term: getUrlParam('utm_term'),
    utm_content: getUrlParam('utm_content'),
    gclid: getUrlParam('gclid'),
    fbclid: getUrlParam('fbclid'),
    referrer: document.referrer || null,
    landing_page: window.location.pathname,
    device_type: getDeviceType(),
    captured_at: new Date().toISOString(),
  };
  
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
}

export function getAttribution(): Attribution {
  if (typeof window === 'undefined') {
    return {
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_term: null,
      utm_content: null,
      gclid: null,
      fbclid: null,
      referrer: null,
      landing_page: null,
      device_type: 'desktop',
      captured_at: new Date().toISOString(),
    };
  }
  
  const stored = sessionStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // Return default if parse fails
    }
  }
  
  // If no stored attribution, capture now and return
  captureAttribution();
  const newStored = sessionStorage.getItem(STORAGE_KEY);
  if (newStored) {
    try {
      return JSON.parse(newStored);
    } catch {
      // Fall through to default
    }
  }
  
  return {
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    utm_term: null,
    utm_content: null,
    gclid: null,
    fbclid: null,
    referrer: null,
    landing_page: window.location.pathname,
    device_type: getDeviceType(),
    captured_at: new Date().toISOString(),
  };
}
