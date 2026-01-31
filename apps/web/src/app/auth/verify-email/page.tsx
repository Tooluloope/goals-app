import { Suspense } from 'react';

import { Loader2 } from 'lucide-react';

import { VerifyEmail } from '@/components/auth/verify-email';

function VerifyEmailLoading() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md text-center">
        <div className="space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
          <h1 className="text-2xl font-semibold">Loading...</h1>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailLoading />}>
      <VerifyEmail />
    </Suspense>
  );
}
