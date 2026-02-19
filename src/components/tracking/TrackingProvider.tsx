'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { pushEvent } from './GTMProvider';

interface TrackingProviderProps {
  children: React.ReactNode;
}

// Pages that get scroll depth and time on page tracking
const TRACKED_PAGES = [
  '/memphis-task-force-ticket',
  '/201-poplar-guide',
  '/blog',
];

function isTrackedPage(pathname: string): boolean {
  return TRACKED_PAGES.some(page => pathname.startsWith(page));
}

export function TrackingProvider({ children }: TrackingProviderProps) {
  const pathname = usePathname();
  const scrollMilestones = useRef<Set<number>>(new Set());
  const timeTracked = useRef<Set<number>>(new Set());
  const startTime = useRef<number>(Date.now());

  // Track page views on route change
  useEffect(() => {
    // Reset tracking state on page change
    scrollMilestones.current = new Set();
    timeTracked.current = new Set();
    startTime.current = Date.now();

    // Fire page_view event
    pushEvent('page_view', {
      page_path: pathname,
      page_title: document.title,
      referrer: document.referrer,
    });
  }, [pathname]);

  // Scroll depth tracking for key pages
  useEffect(() => {
    if (!isTrackedPage(pathname)) return;

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.round((scrollTop / docHeight) * 100);

      const milestones = [25, 50, 75, 100];
      for (const milestone of milestones) {
        if (scrollPercent >= milestone && !scrollMilestones.current.has(milestone)) {
          scrollMilestones.current.add(milestone);
          pushEvent('scroll_depth', {
            depth_percentage: milestone,
            page_path: pathname,
          });
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);

  // Time on page tracking for key pages
  useEffect(() => {
    if (!isTrackedPage(pathname)) return;

    const intervals = [30, 60]; // seconds
    
    const checkTime = () => {
      const elapsed = Math.floor((Date.now() - startTime.current) / 1000);
      
      for (const seconds of intervals) {
        if (elapsed >= seconds && !timeTracked.current.has(seconds)) {
          timeTracked.current.add(seconds);
          pushEvent('time_on_page', {
            time_seconds: seconds,
            page_path: pathname,
          });
        }
      }
    };

    const intervalId = setInterval(checkTime, 5000); // Check every 5 seconds
    return () => clearInterval(intervalId);
  }, [pathname]);

  return <>{children}</>;
}
