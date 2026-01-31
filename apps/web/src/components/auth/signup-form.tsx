'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signIn, getSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, User, Star, Eye, EyeOff, Target } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { setShouldShowOnboarding } from '@/lib/onboarding';

const signupSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type SignupFormData = z.infer<typeof signupSchema>;

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  // Capture plan from URL query parameter
  useEffect(() => {
    const plan = searchParams?.get('plan');
    if (plan && ['pro', 'family'].includes(plan.toLowerCase())) {
      setSelectedPlan(plan.toUpperCase());
    }
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    setIsSubmitting(true);
    let didNavigate = false;
    try {
      // Detect user's timezone from browser
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // Use NextAuth signup provider
      const result = await signIn('signup', {
        name: data.name,
        email: data.email,
        password: data.password,
        timezone,
        redirect: false,
      });

      if (result?.error) {
        toast({
          title: 'Signup failed',
          description: 'An account with this email may already exist.',
          variant: 'destructive',
        });
      } else {
        const ensureSession = async () => {
          for (let attempt = 0; attempt < 3; attempt += 1) {
            const session = await getSession();
            if (session?.user?.id) return session;
            await new Promise((resolve) => setTimeout(resolve, 400));
          }
          return null;
        };

        const session = await ensureSession();
        if (!session) {
          toast({
            title: 'Signup pending',
            description: 'We could not start your session yet. Please try again.',
            variant: 'destructive',
          });
          return;
        }

        toast({
          title: 'Account created',
          description: 'Welcome! Your account has been created successfully.',
          variant: 'success',
        });
        setShouldShowOnboarding(true);

        // If user signed up for Pro or Family plan, redirect to Stripe checkout
        if (selectedPlan && ['PRO', 'FAMILY'].includes(selectedPlan)) {
          try {
            // Call API to create Stripe checkout session
            const checkoutResponse = await fetch('/api/stripe/create-checkout-session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                plan: selectedPlan,
                successUrl: `${window.location.origin}/dashboard?checkout=success`,
                cancelUrl: `${window.location.origin}/dashboard?checkout=cancelled`,
              }),
            });

            if (!checkoutResponse.ok) {
              throw new Error('Failed to create checkout session');
            }

            const { url } = await checkoutResponse.json();
            if (!url) {
              throw new Error('Checkout URL not returned');
            }

            // Redirect to Stripe checkout
            didNavigate = true;
            window.location.href = url;
            return;
          } catch (error) {
            console.error('Checkout error:', error);
            didNavigate = true;
            router.push('/dashboard?checkout=cancelled');
            return;
          }
        } else {
          // Free plan or no plan specified - go to dashboard
          // Check for redirect URL (e.g., from invite page)
          const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
          if (redirectUrl) {
            sessionStorage.removeItem('redirectAfterLogin');
            didNavigate = true;
            router.push(redirectUrl);
          } else {
            didNavigate = true;
            router.push('/dashboard');
          }
        }
      }
    } catch {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      if (!didNavigate) {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-row overflow-hidden">
      {/* Left Side: Form Area */}
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
          <div className="mx-auto flex w-full max-w-[480px] flex-col gap-6">
            {/* Headings */}
            <div className="flex flex-col gap-3">
              <h1 className="text-4xl font-black leading-[1.1] tracking-[-0.033em] text-foreground lg:text-5xl">
                Get started
                {selectedPlan && (
                  <span className="ml-2 inline-block rounded-full bg-primary/10 px-3 py-1 text-2xl font-bold text-primary">
                    {selectedPlan}
                  </span>
                )}
              </h1>
              <p className="text-lg font-normal leading-normal text-muted-foreground">
                {selectedPlan
                  ? `Create your account and start your ${selectedPlan.toLowerCase()} plan`
                  : 'Create your account and start achieving your family goals'}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
              {/* Name Input */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="name" className="text-sm font-medium text-foreground">
                  Full Name
                </Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    autoComplete="name"
                    disabled={isSubmitting}
                    className="h-14 rounded-xl border-input bg-background pl-12 text-base transition-all duration-200 focus:ring-2 focus:ring-primary"
                    {...register('name')}
                  />
                </div>
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
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
                    disabled={isSubmitting}
                    className="h-14 rounded-xl border-input bg-background pl-12 text-base transition-all duration-200 focus:ring-2 focus:ring-primary"
                    {...register('email')}
                  />
                </div>
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>

              {/* Password Input */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password"
                    autoComplete="new-password"
                    disabled={isSubmitting}
                    className="h-14 rounded-xl border-input bg-background pl-12 pr-12 text-base transition-all duration-200 focus:ring-2 focus:ring-primary"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>

              {/* Confirm Password Input */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                    disabled={isSubmitting}
                    className="h-14 rounded-xl border-input bg-background pl-12 pr-12 text-base transition-all duration-200 focus:ring-2 focus:ring-primary"
                    {...register('confirmPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Primary Button */}
              <Button
                type="submit"
                className="h-14 w-full rounded-xl text-base font-bold shadow-lg shadow-primary/20"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? 'Creating account...'
                  : selectedPlan
                    ? `Create Account & Start ${selectedPlan} Plan`
                    : 'Create Account'}
              </Button>
            </form>

            {/* Sign In Link */}
            <p className="text-center text-sm font-normal text-muted-foreground">
              Already have an account?{' '}
              <Link href="/auth/login" className="font-bold text-primary hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>

        {/* Left Footer */}
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
          {/* Image Container */}
          <div
            className="h-full w-full bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=2940&auto=format&fit=crop')",
            }}
          />
          {/* Overlay Gradient */}
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
              &quot;Setting up was so easy! Within minutes, our whole family was on board and
              tracking goals together.&quot;
            </p>
            <p className="text-sm font-medium opacity-80">&mdash; The Martinez Family</p>
          </div>
        </div>
      </div>
    </div>
  );
}
