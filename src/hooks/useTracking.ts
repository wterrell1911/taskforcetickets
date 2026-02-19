'use client';

import { useCallback } from 'react';
import { pushEvent } from '@/components/tracking/GTMProvider';
import { getAttribution } from '@/lib/tracking/attribution';

interface TrackEventData {
  [key: string]: unknown;
}

export function useTracking() {
  const trackEvent = useCallback((name: string, data?: TrackEventData) => {
    if (typeof window === 'undefined') return;

    const attribution = getAttribution();
    
    pushEvent(name, {
      ...data,
      page_path: window.location.pathname,
      page_title: document.title,
      timestamp: new Date().toISOString(),
      device_type: attribution.device_type,
    });
  }, []);

  const trackPhoneClick = useCallback((phoneNumber: string) => {
    const attribution = getAttribution();
    trackEvent('phone_click', {
      phone_number: phoneNumber,
      page_location: window.location.pathname,
      device_type: attribution.device_type,
    });
  }, [trackEvent]);

  const trackFormStart = useCallback((formName: string) => {
    const attribution = getAttribution();
    trackEvent('form_start', {
      form_name: formName,
      page_location: window.location.pathname,
      lead_source: attribution.utm_source,
    });
  }, [trackEvent]);

  const trackFormSubmit = useCallback((formName: string) => {
    const attribution = getAttribution();
    trackEvent('form_submit', {
      form_name: formName,
      page_location: window.location.pathname,
      lead_source: attribution.utm_source,
      utm_medium: attribution.utm_medium,
      utm_campaign: attribution.utm_campaign,
    });
  }, [trackEvent]);

  const trackCTAClick = useCallback((ctaText: string, ctaLocation: string) => {
    trackEvent('cta_click', {
      cta_text: ctaText,
      cta_location: ctaLocation,
      page_location: window.location.pathname,
    });
  }, [trackEvent]);

  return {
    trackEvent,
    trackPhoneClick,
    trackFormStart,
    trackFormSubmit,
    trackCTAClick,
  };
}
