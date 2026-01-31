'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, Target, ArrowLeft, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';

const errorMessages: Record<string, string> = {
  Configuration: 'There is a problem with the server configuration.',
  AccessDenied: 'You do not have permission to sign in.',
  Verification: 'The verification token has expired or has already been used.',
  OAuthSignin: 'Error in constructing an authorization URL.',
  OAuthCallback: 'Error in handling the response from the OAuth provider.',
  OAuthCreateAccount: 'Could not create OAuth provider user in the database.',
  EmailCreateAccount: 'Could not create email provider user in the database.',
  Callback: 'Error in the OAuth callback handler route.',
  OAuthAccountNotLinked: 'The email is already linked to another account.',
  EmailSignin: 'Failed to send the email with the magic link.',
  CredentialsSignin: 'Invalid email or password. Please check your credentials and try again.',
  SessionRequired: 'Please sign in to access this page.',
  Default: 'An error occurred during authentication. Please try again.',
};

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams?.get('error') ?? null;

  const errorMessage = error
    ? errorMessages[error] || errorMessages.Default
    : errorMessages.Default;

  return (
    <>
      {/* Error Icon */}
      <div className="flex justify-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-10 w-10 text-destructive" />
        </div>
      </div>

      {/* Headings */}
      <div className="flex flex-col gap-3 text-center">
        <h1 className="text-4xl font-black leading-[1.1] tracking-[-0.033em] text-foreground lg:text-5xl">
          Authentication Error
        </h1>
        <p className="text-lg font-normal leading-normal text-muted-foreground">{errorMessage}</p>
        {error && <p className="text-sm text-muted-foreground/60">Error code: {error}</p>}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-4">
        <Button
          asChild
          className="h-14 w-full rounded-xl text-base font-bold shadow-lg shadow-primary/20"
        >
          <Link href="/auth/login">Try Again</Link>
        </Button>

        <Button
          asChild
          variant="outline"
          className="h-14 w-full gap-3 rounded-xl text-base font-medium"
        >
          <Link href="/">
            <ArrowLeft className="h-5 w-5" />
            Back to Home
          </Link>
        </Button>
      </div>
    </>
  );
}

function LoadingContent() {
  return (
    <div className="flex justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <div className="relative flex min-h-screen w-full flex-row overflow-hidden">
      {/* Left Side: Error Content */}
      <div className="flex w-full flex-col border-r border-border bg-background lg:w-1/2 xl:w-5/12">
        {/* Header / Logo */}
        <div className="px-8 py-6 lg:px-12">
          <Link href="/" className="flex cursor-pointer items-center gap-3 text-foreground">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <Target className="h-5 w-5 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-bold leading-tight tracking-[-0.015em]">Alignia</h2>
          </Link>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col justify-center px-8 lg:px-16 xl:px-24">
          <div className="mx-auto flex w-full max-w-[480px] flex-col gap-8">
            <Suspense fallback={<LoadingContent />}>
              <ErrorContent />
            </Suspense>
          </div>
        </div>

        {/* Left Footer */}
        <div className="flex items-center justify-between px-8 py-6 text-xs text-muted-foreground lg:px-12">
          <span>© 2026 Alignia Inc.</span>
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
