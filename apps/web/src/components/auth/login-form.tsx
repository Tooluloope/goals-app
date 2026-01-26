'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Sparkles, Star, Eye, EyeOff, Target } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUIStore } from '@/store/ui-store';
import { useToast } from '@/hooks/use-toast';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const { setShowNotificationSummary } = useUIStore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast({
          title: 'Login failed',
          description: 'Invalid email or password. Please try again.',
          variant: 'destructive',
        });
      } else {
        setShowNotificationSummary(true);
        const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
        if (redirectUrl) {
          sessionStorage.removeItem('redirectAfterLogin');
          router.push(redirectUrl);
        } else {
          router.push('/dashboard');
        }
        router.refresh(); // Refresh to update server components
      }
    } catch {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
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
          <div className="mx-auto flex w-full max-w-[480px] flex-col gap-8">
            {/* Headings */}
            <div className="flex flex-col gap-3">
              <h1 className="text-4xl font-black leading-[1.1] tracking-[-0.033em] text-foreground lg:text-5xl">
                Welcome back
              </h1>
              <p className="text-lg font-normal leading-normal text-muted-foreground">
                Track your family&apos;s goals and vision
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
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

              {/* Password Input */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-foreground">
                    Password
                  </Label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm font-semibold text-primary hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    autoComplete="current-password"
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

              {/* Primary Button */}
              <Button
                type="submit"
                className="h-14 w-full rounded-xl text-base font-bold shadow-lg shadow-primary/20"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 py-2">
              <div className="h-px flex-1 bg-border" />
              <p className="text-sm font-medium text-muted-foreground">or</p>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Magic Link Button */}
            <Button
              type="button"
              variant="outline"
              className="group h-14 w-full gap-3 rounded-xl text-base font-medium"
              onClick={() => router.push('/auth/magic-link')}
            >
              <Sparkles className="h-5 w-5 text-primary transition-transform group-hover:scale-110" />
              <span>Sign in with Magic Link</span>
            </Button>

            {/* Sign Up Link */}
            <p className="text-center text-sm font-normal text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="font-bold text-primary hover:underline">
                Sign Up
              </Link>
            </p>
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
          {/* Image Container */}
          <div
            className="h-full w-full bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=2832&auto=format&fit=crop')",
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
              &quot;Planning our year has never been this inspiring. We hit 90% of our family goals
              last year!&quot;
            </p>
            <p className="text-sm font-medium opacity-80">— The Anderson Family</p>
          </div>
        </div>
      </div>
    </div>
  );
}
