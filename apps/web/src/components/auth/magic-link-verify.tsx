'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getSession, signIn } from 'next-auth/react';
import { Loader2, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useUIStore } from '@/store/ui-store';
import { setShouldShowOnboarding } from '@/lib/onboarding';

type VerifyState = 'loading' | 'success' | 'error';

export function MagicLinkVerify() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setShowNotificationSummary } = useUIStore();
  const [state, setState] = useState<VerifyState>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const verificationAttempted = useRef(false);

  useEffect(() => {
    // Prevent double execution in React StrictMode
    if (verificationAttempted.current) return;
    verificationAttempted.current = true;

    const token = searchParams.get('token');

    if (!token) {
      setState('error');
      setErrorMessage('No magic link token provided');
      return;
    }

    const verifyToken = async () => {
      try {
        // Use NextAuth magic-link provider
        const result = await signIn('magic-link', {
          token,
          redirect: false,
        });

        const session = await getSession();

        if (result?.error && !session?.user?.id) {
          setState('error');
          setErrorMessage('Invalid or expired magic link');
          return;
        }

        setState('success');

        const isNewUser = Boolean(session?.user?.isNewUser);

        // Show notification summary for returning users
        if (!isNewUser) {
          setShowNotificationSummary(true);
          setShouldShowOnboarding(false);
        }

        // Set flag for new users (the session will have isNewUser)
        // We'll trigger onboarding via the providers.tsx check
        if (isNewUser) {
          setShouldShowOnboarding(true);
        }

        // Redirect after a short delay to show success message
        setTimeout(() => {
          const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
          if (redirectUrl) {
            sessionStorage.removeItem('redirectAfterLogin');
            router.push(redirectUrl);
          } else {
            router.push('/dashboard');
          }
          router.refresh(); // Refresh to update server components
        }, 1500);
      } catch (error) {
        setState('error');
        if (error instanceof Error) {
          setErrorMessage(error.message || 'Invalid or expired magic link');
        } else {
          setErrorMessage('Invalid or expired magic link');
        }
      }
    };

    verifyToken();
  }, [searchParams, setShowNotificationSummary, router]);

  return (
    <div className="relative flex min-h-screen w-full flex-row overflow-hidden">
      {/* Left Side: Content Area */}
      <div className="flex w-full flex-col border-r border-border bg-background lg:w-1/2 xl:w-5/12">
        {/* Header / Logo */}
        <div className="px-8 py-6 lg:px-12">
          <Link href="/" className="flex cursor-pointer items-center gap-3 text-foreground">
            <div className="size-8 text-primary">
              <svg
                className="h-full w-full"
                fill="none"
                viewBox="0 0 48 48"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold leading-tight tracking-[-0.015em]">Alignia</h2>
          </Link>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col justify-center px-8 lg:px-16 xl:px-24">
          <div className="mx-auto flex w-full max-w-[480px] flex-col items-center gap-8">
            {state === 'loading' && (
              <>
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
                <div className="flex flex-col gap-3 text-center">
                  <h1 className="text-4xl font-black leading-[1.1] tracking-[-0.033em] text-foreground">
                    Signing you in...
                  </h1>
                  <p className="text-lg font-normal leading-normal text-muted-foreground">
                    Please wait while we verify your magic link
                  </p>
                </div>
              </>
            )}

            {state === 'success' && (
              <>
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                </div>
                <div className="flex flex-col gap-3 text-center">
                  <h1 className="text-4xl font-black leading-[1.1] tracking-[-0.033em] text-foreground">
                    Welcome!
                  </h1>
                  <p className="text-lg font-normal leading-normal text-muted-foreground">
                    You&apos;ve been signed in successfully. Redirecting...
                  </p>
                </div>
              </>
            )}

            {state === 'error' && (
              <>
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
                  <XCircle className="h-10 w-10 text-destructive" />
                </div>
                <div className="flex flex-col gap-3 text-center">
                  <h1 className="text-4xl font-black leading-[1.1] tracking-[-0.033em] text-foreground">
                    Link expired
                  </h1>
                  <p className="text-lg font-normal leading-normal text-muted-foreground">
                    {errorMessage}
                  </p>
                </div>
                <div className="flex w-full flex-col gap-4">
                  <Link href="/auth/magic-link" className="w-full">
                    <Button className="h-14 w-full rounded-xl text-base font-bold shadow-lg shadow-primary/20">
                      Request a new magic link
                    </Button>
                  </Link>
                  <Link href="/auth/login" className="w-full">
                    <Button
                      variant="outline"
                      className="h-14 w-full rounded-xl text-base font-medium"
                    >
                      <ArrowLeft className="mr-2 h-5 w-5" />
                      Sign in with password
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-8 py-6 text-xs text-muted-foreground lg:px-12">
          <span>&copy; 2026 Alignia Inc.</span>
          <div className="flex gap-4">
            <Link href="#" className="transition-colors hover:text-primary">
              Privacy
            </Link>
            <Link href="#" className="transition-colors hover:text-primary">
              Terms
            </Link>
          </div>
        </div>
      </div>

      {/* Right Side: Image Area */}
      <div className="relative hidden bg-muted lg:block lg:w-1/2 xl:w-7/12">
        <div className="absolute inset-0 h-full w-full">
          <div
            className="h-full w-full bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=2832&auto=format&fit=crop')",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        </div>
      </div>
    </div>
  );
}
