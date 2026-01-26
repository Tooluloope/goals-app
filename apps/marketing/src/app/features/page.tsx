import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  CalendarCheck2,
  CheckCircle2,
  Network,
  Sparkles,
  Users,
} from 'lucide-react';
import { appUrls } from '@/lib/config';

export const metadata = {
  title: 'Features',
  description:
    'Explore Alignia features: goal tracking, habit rhythms, shared journals, and AI-powered insights for families and teams.',
};

const pillars = [
  {
    title: 'Goal Dependencies',
    description:
      'Map what must happen first. Alignia keeps your plans realistic by surfacing blockers and sequencing work.',
    icon: Network,
  },
  {
    title: 'Shared Rhythms',
    description:
      'Daily, weekly, and monthly reviews sync everyone on the same cadence with lightweight prompts.',
    icon: CalendarCheck2,
  },
  {
    title: 'Insight Engine',
    description: 'AI-driven summaries spotlight what moved the needle and where to focus next.',
    icon: BarChart3,
  },
];

const rhythmCards = [
  {
    title: 'Weekly Review',
    label: 'Reflect + plan',
    status: '76% complete',
  },
  {
    title: 'Family Journal',
    label: 'Shared wins',
    status: '12 entries',
  },
  {
    title: 'Habit Streaks',
    label: 'Momentum',
    status: '9 day streak',
  },
];

export default function FeaturesPage() {
  return (
    <div className="pt-20">
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(50%_50%_at_50%_40%,hsl(var(--primary)/0.12),transparent)]" />
        <div className="container">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border bg-background/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-primary shadow-sm">
                <Sparkles className="h-4 w-4" />
                Product Features
              </div>
              <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
                Build a shared rhythm for the goals that matter most.
              </h1>
              <p className="text-lg text-muted-foreground md:text-xl">
                Alignia blends personal focus with family visibility. Track goals, run reviews, and
                move forward together with clarity and accountability.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link
                  href={appUrls.register}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center justify-center rounded-lg border bg-background px-6 py-3 text-sm font-semibold transition-colors hover:bg-muted"
                >
                  View Pricing
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-6 pt-6 md:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-primary">84%</p>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Goal clarity gains
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-primary">4x</p>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Faster weekly planning
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-bold text-primary">15m</p>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Average review time
                  </p>
                </div>
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-lg">
              <div className="absolute -top-10 right-6 hidden rounded-2xl border bg-background/90 p-4 shadow-xl md:block">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Weekly Review</p>
                    <p className="text-xs text-muted-foreground">Goals aligned, blockers cleared</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border bg-background/80 p-6 shadow-2xl">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Family Command Center</p>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    Live
                  </span>
                </div>
                <div className="mt-6 space-y-4">
                  {rhythmCards.map((card) => (
                    <div
                      key={card.title}
                      className="rounded-xl border bg-background/70 p-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold">{card.title}</p>
                          <p className="text-xs text-muted-foreground">{card.label}</p>
                        </div>
                        <span className="text-xs font-semibold text-primary">{card.status}</span>
                      </div>
                      <div className="mt-3 h-1.5 w-full rounded-full bg-muted">
                        <div className="h-full w-3/4 rounded-full bg-primary" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute -bottom-10 left-4 hidden rounded-2xl border bg-background/90 p-4 shadow-xl md:block">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Shared Space</p>
                    <p className="text-xs text-muted-foreground">Up to 6 active members</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container grid items-center gap-12 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Intelligent Logic
            </div>
            <h2 className="text-3xl font-bold md:text-4xl">Smart dependencies, zero guesswork.</h2>
            <p className="text-muted-foreground">
              Alignia reveals the chain reaction behind every milestone. When something slips, the
              system updates the plan and shows exactly what to adjust next.
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                Dynamic rescheduling keeps your timeline realistic.
              </li>
              <li className="flex items-start gap-3 text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                Visual cues highlight blockers before they become emergencies.
              </li>
              <li className="flex items-start gap-3 text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                Shared accountability makes it easy to stay aligned.
              </li>
            </ul>
          </div>
          <div className="rounded-3xl border bg-muted/30 p-6 shadow-xl">
            <div className="space-y-4">
              <div className="rounded-xl border bg-background p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">Launch Landing Page</p>
                    <p className="text-xs text-muted-foreground">Blocked by Design Review</p>
                  </div>
                  <span className="rounded-full bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-500">
                    Delayed
                  </span>
                </div>
              </div>
              <div className="rounded-xl border bg-background p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">Rescheduled Design Review</p>
                    <p className="text-xs text-muted-foreground">Tuesday, 4:00 PM</p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    Resolved
                  </span>
                </div>
              </div>
              <div className="rounded-xl border bg-background p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Next up
                </p>
                <p className="mt-2 text-sm font-semibold">Launch Readiness Review</p>
                <p className="text-xs text-muted-foreground">Auto-scheduled after signoff</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-muted/30 py-20">
        <div className="container">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Family sync, without the chaos.</h2>
            <p className="mt-3 text-muted-foreground">
              Shared journals, habit heatmaps, and daily rhythms keep everyone grounded.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {pillars.map((pillar) => (
              <div
                key={pillar.title}
                className="group rounded-2xl border bg-background p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <pillar.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{pillar.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{pillar.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border bg-gradient-to-br from-primary/10 via-background to-background p-6 shadow-xl">
            <div className="rounded-2xl border bg-background p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                Year-in-review insights
              </p>
              <h3 className="mt-4 text-2xl font-bold">Your progress, visualized.</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Track consistency, highlights, and growth patterns across the year.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="rounded-xl border bg-muted/40 p-4">
                  <p className="text-2xl font-bold text-primary">1,240</p>
                  <p className="text-xs text-muted-foreground">Focused hours</p>
                </div>
                <div className="rounded-xl border bg-muted/40 p-4">
                  <p className="text-2xl font-bold text-primary">92%</p>
                  <p className="text-xs text-muted-foreground">Goal completion</p>
                </div>
                <div className="rounded-xl border bg-muted/40 p-4">
                  <p className="text-2xl font-bold text-primary">48</p>
                  <p className="text-xs text-muted-foreground">Weekly reviews</p>
                </div>
                <div className="rounded-xl border bg-muted/40 p-4">
                  <p className="text-2xl font-bold text-primary">310</p>
                  <p className="text-xs text-muted-foreground">Journal moments</p>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Future Insights
            </div>
            <h2 className="text-3xl font-bold md:text-4xl">Plan for the year you want.</h2>
            <p className="text-muted-foreground">
              Alignia keeps your vision visible with rolling reviews and intelligent goal
              recommendations. Everyone sees what matters and how to contribute.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                See Pricing
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={appUrls.register}
                className="inline-flex items-center justify-center rounded-lg border bg-background px-6 py-3 text-sm font-semibold transition-colors hover:bg-muted"
              >
                Start Free
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container">
          <div className="rounded-3xl bg-primary px-8 py-12 text-center text-primary-foreground shadow-2xl md:px-16">
            <h2 className="text-3xl font-bold md:text-4xl">Ready to align your goals?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-primary-foreground/80 md:text-base">
              Join teams and families who plan together, stay accountable, and celebrate the wins.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href={appUrls.register}
                className="inline-flex items-center justify-center rounded-lg bg-background px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary-foreground/90"
              >
                Get Started Free
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center rounded-lg border border-primary-foreground/40 px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-foreground/10"
              >
                Compare Plans
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
