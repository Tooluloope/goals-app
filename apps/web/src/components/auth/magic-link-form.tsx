'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, ArrowLeft, Star, Sparkles, CheckCircle2, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';

const magicLinkSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  name: z.string().optional(),
});

type MagicLinkFormData = z.infer<typeof magicLinkSchema>;

export function MagicLinkForm() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<MagicLinkFormData>({
    resolver: zodResolver(magicLinkSchema),
  });

  const onSubmit = async (data: MagicLinkFormData) => {
    setIsSubmitting(true);
    try {
      await apiClient.requestMagicLink(data.email, data.name || undefined);
      setIsEmailSent(true);
      toast({
        title: 'Magic link sent',
        description: 'Check your inbox for the sign-in link.',
        variant: 'success',
      });
    } catch {
      // Always show success message to prevent email enumeration
      setIsEmailSent(true);
      toast({
        title: 'Magic link sent',
        description: 'If an account exists, you will receive a sign-in link.',
        variant: 'success',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success state after email is sent
  if (isEmailSent) {
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
            <div className="mx-auto flex w-full max-w-[480px] flex-col gap-8">
              {/* Success Icon */}
              <div className="flex justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                </div>
              </div>

              {/* Headings */}
              <div className="flex flex-col gap-3 text-center">
                <h1 className="text-4xl font-black leading-[1.1] tracking-[-0.033em] text-foreground">
                  Check your email
                </h1>
                <p className="text-lg font-normal leading-normal text-muted-foreground">
                  We&apos;ve sent a magic link to{' '}
                  <span className="font-semibold text-foreground">{getValues('email')}</span>
                </p>
              </div>

              {/* Info Box */}
              <div className="rounded-xl bg-muted p-6">
                <p className="text-sm text-muted-foreground">
                  Click the link in your email to sign in instantly. The link expires in 15 minutes
                  for security. Didn&apos;t receive it? Check your spam folder.
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-4">
                <Button
                  variant="outline"
                  className="h-14 w-full rounded-xl"
                  onClick={() => setIsEmailSent(false)}
                >
                  Try a different email
                </Button>
                <Link href="/auth/login" className="w-full">
                  <Button variant="ghost" className="h-14 w-full rounded-xl">
                    <ArrowLeft className="mr-2 h-5 w-5" />
                    Back to sign in
                  </Button>
                </Link>
              </div>
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

  return (
    <div className="relative flex min-h-screen w-full flex-row overflow-hidden">
      {/* Left Side: Form Area */}
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
          <div className="mx-auto flex w-full max-w-[480px] flex-col gap-8">
            {/* Headings */}
            <div className="flex flex-col gap-3">
              <h1 className="text-4xl font-black leading-[1.1] tracking-[-0.033em] text-foreground lg:text-5xl">
                Magic link sign in
              </h1>
              <p className="text-lg font-normal leading-normal text-muted-foreground">
                Enter your email and we&apos;ll send you a link to sign in instantly
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
              {/* Name Input (for new users) */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="name" className="text-sm font-medium text-foreground">
                  Your Name <span className="text-muted-foreground">(for new accounts)</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    autoComplete="name"
                    className="h-14 rounded-xl border-input bg-background pl-12 text-base transition-all duration-200 focus:ring-2 focus:ring-primary"
                    {...register('name')}
                  />
                </div>
              </div>

              {/* Email Input */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    autoComplete="email"
                    className="h-14 rounded-xl border-input bg-background pl-12 text-base transition-all duration-200 focus:ring-2 focus:ring-primary"
                    {...register('email')}
                  />
                </div>
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>

              {/* Primary Button */}
              <Button
                type="submit"
                className="group h-14 w-full gap-3 rounded-xl text-base font-bold shadow-lg shadow-primary/20"
                disabled={isSubmitting}
              >
                <Sparkles className="h-5 w-5 transition-transform group-hover:scale-110" />
                {isSubmitting ? 'Sending...' : 'Send Magic Link'}
              </Button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 py-2">
              <div className="h-px flex-1 bg-border" />
              <p className="text-sm font-medium text-muted-foreground">or</p>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Alternative Sign In */}
            <Link href="/auth/login" className="w-full">
              <Button variant="outline" className="h-14 w-full rounded-xl text-base font-medium">
                <ArrowLeft className="mr-2 h-5 w-5" />
                Sign in with password
              </Button>
            </Link>

            {/* Sign Up Link */}
            <p className="text-center text-sm font-normal text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="font-bold text-primary hover:underline">
                Sign Up
              </Link>
            </p>
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

        {/* Quote on Image */}
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <div className="max-w-lg rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm">
            <div className="mb-3 flex gap-1 text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-current" />
              ))}
            </div>
            <p className="mb-2 text-xl font-bold leading-relaxed">
              &quot;No more forgetting passwords! Magic link makes signing in so effortless.&quot;
            </p>
            <p className="text-sm font-medium opacity-80">&mdash; The Williams Family</p>
          </div>
        </div>
      </div>
    </div>
  );
}
