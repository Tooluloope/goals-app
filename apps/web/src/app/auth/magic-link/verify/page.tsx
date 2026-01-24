import { Suspense } from 'react';
import { MagicLinkVerify } from '@/components/auth/magic-link-verify';

function MagicLinkVerifyContent() {
  return <MagicLinkVerify />;
}

export default function MagicLinkVerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <MagicLinkVerifyContent />
    </Suspense>
  );
}
