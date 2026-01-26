import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { appUrls } from '@/lib/config';

const highlights = ['Track goals & habits', 'AI-powered insights', 'Family workspaces'];

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10 gradient-bg" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_40%_at_50%_60%,hsl(var(--primary)/0.12),transparent)]" />

      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background/50 px-4 py-1.5 text-sm backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            Now with AI-powered insights
          </div>

          {/* Headline */}
          <h1 className="mb-6 text-4xl font-bold tracking-tight md:text-6xl">
            Achieve Your Goals with <span className="gradient-text">Alignia</span>
          </h1>

          {/* Subheadline */}
          <p className="mb-8 text-lg text-muted-foreground md:text-xl">
            The personal goal tracking app for individuals and families. Set meaningful goals, build
            lasting habits, and track your progress with AI-powered insights.
          </p>

          {/* Highlights */}
          <div className="mb-8 flex flex-wrap items-center justify-center gap-4 text-sm">
            {highlights.map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href={appUrls.register}
              className="group flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:gap-3"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/features"
              className="rounded-lg border bg-background px-6 py-3 text-sm font-medium transition-colors hover:bg-muted"
            >
              See Features
            </Link>
          </div>

          {/* Social proof */}
          <p className="mt-8 text-sm text-muted-foreground">
            No credit card required. Start for free.
          </p>
        </div>

        {/* App Preview */}
        <div className="relative mx-auto mt-16 max-w-5xl">
          <div className="overflow-hidden rounded-xl border bg-background shadow-2xl">
            {/* Light mode image */}
            <Image
              src="/dashboard-preview-light.jpg"
              alt="Alignia Dashboard - Track your goals, habits, and progress"
              width={1920}
              height={1200}
              className="w-full h-auto dark:hidden"
              priority
            />
            {/* Dark mode image */}
            <Image
              src="/dashboard-preview-dark.png"
              alt="Alignia Dashboard - Track your goals, habits, and progress"
              width={1920}
              height={1200}
              className="w-full h-auto hidden dark:block"
              priority
            />
          </div>
          {/* Decorative gradient behind */}
          <div className="absolute -inset-4 -z-10 rounded-2xl bg-gradient-to-r from-primary/20 via-primary/5 to-blue-500/20 blur-3xl" />
        </div>
      </div>
    </section>
  );
}
