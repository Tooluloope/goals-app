'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md space-y-4 text-center">
        <h1 className="text-3xl font-semibold">Something went wrong</h1>
        <p className="text-sm text-muted-foreground">
          We hit an unexpected error while loading this page.
        </p>
        <div className="flex flex-col gap-3">
          <Button onClick={reset}>Try again</Button>
          <Link href="/">
            <Button variant="outline" className="w-full">
              Back to home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
