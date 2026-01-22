'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);

  const startNavigation = useCallback(() => {
    setIsNavigating(true);
    setProgress(0);

    // Animate progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        // Slow down as we approach 90%
        const increment = Math.max(1, (90 - prev) / 10);
        return Math.min(90, prev + increment);
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const completeNavigation = useCallback(() => {
    setProgress(100);
    setTimeout(() => {
      setIsNavigating(false);
      setProgress(0);
    }, 200);
  }, []);

  // Detect navigation changes
  useEffect(() => {
    completeNavigation();
  }, [pathname, searchParams, completeNavigation]);

  // Listen for navigation start via link clicks
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');

      if (link && link.href && !link.target && !link.download) {
        const url = new URL(link.href);
        if (url.origin === window.location.origin && url.pathname !== pathname) {
          cleanup = startNavigation();
        }
      }
    };

    document.addEventListener('click', handleClick);
    return () => {
      document.removeEventListener('click', handleClick);
      cleanup?.();
    };
  }, [pathname, startNavigation]);

  if (!isNavigating) return null;

  return (
    <div className="fixed left-0 right-0 top-0 z-[100] h-1">
      <div
        className={cn(
          'h-full bg-primary transition-all duration-200 ease-out',
          progress === 100 && 'opacity-0'
        )}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
