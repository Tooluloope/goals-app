'use client';

import { useEffect, useEffectEvent, useRef, useState } from 'react';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { CheckCircle2, Loader2, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';

type VerifyState = 'loading' | 'success' | 'error';

export function VerifyEmail() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<VerifyState>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const attempted = useRef(false);
  const refreshUser = useAuthStore((state) => state.refreshUser);

  const onVerificationSuccess = useEffectEvent(async () => {
    if (apiClient.hasTokens()) {
      await refreshUser();
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 1200);
    }
  });

  const onVerificationError = useEffectEvent((error: unknown) => {
    setState('error');
    setErrorMessage(
      error instanceof Error ? error.message : 'Invalid or expired verification link'
    );
  });

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;

    const token = searchParams.get('token');

    if (!token) {
      setState('error');
      setErrorMessage('No verification token provided.');
      return;
    }

    apiClient
      .verifyEmail(token)
      .then(() => {
        setState('success');
        onVerificationSuccess();
      })
      .catch(onVerificationError);
  }, [searchParams, onVerificationSuccess, onVerificationError]);

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md text-center">
        {state === 'loading' && (
          <div className="space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <h1 className="text-2xl font-semibold">Verifying your email</h1>
            <p className="text-sm text-muted-foreground">
              Please wait while we confirm your email address.
            </p>
          </div>
        )}

        {state === 'success' && (
          <div className="space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-semibold">Email verified</h1>
            <p className="text-sm text-muted-foreground">
              You&apos;re all set. You can now access your account.
            </p>
            <Button className="w-full" onClick={() => router.push('/auth/login')}>
              Continue to login
            </Button>
          </div>
        )}

        {state === 'error' && (
          <div className="space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-2xl font-semibold">Verification failed</h1>
            <p className="text-sm text-muted-foreground">{errorMessage}</p>
            <Link href="/auth/login" className="block">
              <Button className="w-full">Back to login</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
