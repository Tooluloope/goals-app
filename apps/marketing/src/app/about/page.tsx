import type { Metadata } from 'next';
import { config } from '@/lib/config';

export const metadata: Metadata = {
  title: 'About Alignia',
  description:
    'Learn why Alignia exists and how we help individuals and families stay aligned on what matters most.',
  alternates: {
    canonical: '/about',
  },
  openGraph: {
    title: 'About Alignia',
    description:
      'Learn why Alignia exists and how we help individuals and families stay aligned on what matters most.',
    url: `${config.siteUrl}/about`,
  },
};

export default function AboutPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="container py-16 md:py-24">
        <div className="mx-auto max-w-4xl text-center space-y-6">
          <div className="inline-block rounded-lg bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            About Alignia
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Turn Intentions Into
            <span className="text-primary"> Consistent Action</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground md:text-xl">
            Alignia is built for people who want clarity, momentum, and shared accountability. We
            help individuals and families stay aligned on the goals that matter most.
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="border-t bg-muted/30 py-16 md:py-24">
        <div className="container">
          <div className="mx-auto max-w-3xl space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tight">Why Alignia Exists</h2>
              <p className="text-lg text-muted-foreground">
                We built Alignia because we experienced the frustration of having goals but lacking
                the structure to achieve them consistently. Too many planning tools focus on the
                &quot;what&quot; without helping with the &quot;how&quot; and the &quot;why.&quot;
              </p>
              <p className="text-muted-foreground">
                Life moves fast. Between personal ambitions, family responsibilities, and daily
                chaos, it&apos;s easy to lose sight of what truly matters. We created Alignia to be
                the calm, focused space where your best intentions don&apos;t just live in your
                head—they become part of your daily rhythm.
              </p>
              <p className="text-muted-foreground">
                Whether you&apos;re building personal habits, coordinating family goals, or simply
                trying to maintain momentum on what matters, Alignia combines daily rhythm tracking,
                intentional reviews, and AI-powered insights to keep you moving forward.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="container py-16 md:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl font-bold tracking-tight">Our Values</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              These principles guide everything we build and every decision we make.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <svg
                  className="h-6 w-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold">Simplicity Over Complexity</h3>
              <p className="text-muted-foreground">
                We believe in tools that enhance your life, not complicate it. Every feature is
                designed to reduce friction, not add it.
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <svg
                  className="h-6 w-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold">Progress Over Perfection</h3>
              <p className="text-muted-foreground">
                Small, consistent steps beat grand plans that never start. We help you build
                momentum, not just make plans.
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <svg
                  className="h-6 w-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold">Alignment Over Isolation</h3>
              <p className="text-muted-foreground">
                Whether working solo or with family, shared visibility and accountability create
                powerful momentum toward common goals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t bg-muted/30 py-16 md:py-24">
        <div className="container">
          <div className="mx-auto max-w-5xl">
            <div className="text-center space-y-4 mb-12">
              <h2 className="text-3xl font-bold tracking-tight">What Makes Alignia Different</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                We&apos;ve built Alignia with features that actually help you achieve your goals,
                not just track them.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-lg border bg-card p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <svg
                      className="h-5 w-5 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold">Daily Rhythm Tracking</h3>
                </div>
                <p className="text-muted-foreground">
                  Build consistency with daily check-ins that take seconds, not hours. Track your
                  progress without the overhead.
                </p>
              </div>
              <div className="rounded-lg border bg-card p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <svg
                      className="h-5 w-5 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold">AI-Powered Insights</h3>
                </div>
                <p className="text-muted-foreground">
                  Get personalized insights and suggestions based on your patterns. Let AI help you
                  identify what&apos;s working and what needs adjustment.
                </p>
              </div>
              <div className="rounded-lg border bg-card p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <svg
                      className="h-5 w-5 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold">Intentional Reviews</h3>
                </div>
                <p className="text-muted-foreground">
                  Regular weekly and monthly reviews help you reflect, adjust, and stay aligned with
                  what truly matters.
                </p>
              </div>
              <div className="rounded-lg border bg-card p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <svg
                      className="h-5 w-5 text-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold">Family Coordination</h3>
                </div>
                <p className="text-muted-foreground">
                  Share goals, celebrate wins, and support each other. Perfect for families who want
                  to grow together.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container py-16 md:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-lg border bg-gradient-to-br from-primary/5 to-primary/10 p-8 md:p-12">
            <div className="text-center space-y-8">
              <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                Building Momentum, One Day at a Time
              </h2>
              <div className="grid gap-8 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="text-4xl font-bold text-primary">100%</div>
                  <p className="text-sm text-muted-foreground">
                    Focused on your success, not distractions
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="text-4xl font-bold text-primary">&lt;2 min</div>
                  <p className="text-sm text-muted-foreground">Average daily check-in time</p>
                </div>
                <div className="space-y-2">
                  <div className="text-4xl font-bold text-primary">24/7</div>
                  <p className="text-sm text-muted-foreground">
                    Access your goals anytime, anywhere
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t bg-muted/30 py-16 md:py-24">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Ready to Turn Your Goals Into Action?
              </h2>
              <p className="text-lg text-muted-foreground">
                Join Alignia today and start building the momentum you&apos;ve been looking for.
                It&apos;s time to stop planning and start doing.
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <a
                href="/signup"
                className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
              >
                Get Started Free
              </a>
              <a
                href="/features"
                className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Explore Features
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
