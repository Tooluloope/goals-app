import { Fragment } from 'react';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { appUrls } from '@/lib/config';

export const metadata = {
  title: 'Pricing',
  description:
    'Flexible Alignia pricing for solo users, couples, and families. Start free and scale your goal tracking as you grow.',
};

const plans = [
  {
    name: 'Starter',
    price: '$0',
    cadence: 'per month',
    description: 'Everything you need to build momentum on your own goals.',
    cta: 'Get Started',
    ctaHref: appUrls.registerWithPlan('starter'),
    features: ['1 workspace', '3 active projects', 'Daily journal prompts', 'Basic habit tracking'],
  },
  {
    name: 'Pro',
    price: '$7',
    cadence: 'per month',
    description: 'Full power planning, reviews, and AI insights for solo achievers.',
    cta: 'Start Pro',
    ctaHref: appUrls.registerWithPlan('pro'),
    featured: true,
    features: [
      'Unlimited projects',
      'Weekly + monthly reviews',
      'Calendar integration',
      'Goal dependency mapping',
      'AI insights + summaries',
      'Priority support',
    ],
  },
  {
    name: 'Family',
    price: '$14',
    cadence: 'per month',
    description: 'Designed for families and teams coordinating multiple rhythms.',
    cta: 'Start Family',
    ctaHref: appUrls.registerWithPlan('family'),
    features: [
      'Up to 6 members',
      'Shared calendars + boards',
      'Calendar integration',
      'Advanced analytics',
      'Custom goal templates',
      'Admin controls',
    ],
  },
];

const essentials = [
  'Unlimited reviews and reflections',
  'Secure data and private workspaces',
  'Cross-device access',
  'Email and in-app reminders',
];

const faqs = [
  {
    question: 'Can I switch plans later?',
    answer: 'Yes. Upgrade or downgrade anytime and keep your data intact.',
  },
  {
    question: 'Do you offer annual billing?',
    answer: 'Annual billing is available inside the app with a discount.',
  },
  {
    question: 'Is there a free trial?',
    answer: 'Starter is always free. Paid plans include a 14-day trial.',
  },
];

type PlanValue = boolean | string;

const comparisonSections: Array<{
  title: string;
  rows: Array<{
    label: string;
    starter: PlanValue;
    pro: PlanValue;
    family: PlanValue;
  }>;
}> = [
  {
    title: 'Core planning',
    rows: [
      { label: 'Active goals/projects', starter: 'Up to 3', pro: 'Unlimited', family: 'Unlimited' },
      { label: 'Habits', starter: 'Up to 5', pro: 'Unlimited', family: 'Unlimited' },
      { label: 'Workspaces', starter: '1 personal', pro: '1 personal', family: 'Multiple' },
      { label: 'Task board + notifications', starter: true, pro: true, family: true },
    ],
  },
  {
    title: 'Reviews & rhythm',
    rows: [
      { label: 'Daily rhythm + journal', starter: false, pro: true, family: true },
      { label: 'Weekly reviews', starter: false, pro: true, family: true },
      { label: 'Monthly reviews', starter: false, pro: true, family: true },
    ],
  },
  {
    title: 'AI features',
    rows: [
      { label: 'AI assistant + insights', starter: false, pro: true, family: true },
      { label: 'AI summaries', starter: false, pro: true, family: true },
    ],
  },
  {
    title: 'Advanced planning',
    rows: [
      { label: 'Calendar', starter: false, pro: true, family: true },
      { label: 'Roadmap timeline', starter: false, pro: true, family: true },
      { label: 'Dependency mapping', starter: false, pro: true, family: true },
    ],
  },
  {
    title: 'Family + collaboration',
    rows: [
      { label: 'Family Hub', starter: false, pro: false, family: true },
      { label: 'Shared calendars + boards', starter: false, pro: false, family: true },
      { label: 'Up to 6 members', starter: false, pro: false, family: true },
    ],
  },
  {
    title: 'Support',
    rows: [
      { label: 'Email support', starter: true, pro: true, family: true },
      { label: 'Priority support', starter: false, pro: true, family: true },
    ],
  },
];

const renderPlanValue = (value: PlanValue) => {
  if (typeof value === 'string') {
    return (
      <span className="flex items-center justify-center text-sm font-medium text-foreground">
        {value}
      </span>
    );
  }

  if (value) {
    return (
      <span className="flex items-center justify-center">
        <CheckCircle2 className="h-5 w-5 text-primary" aria-hidden="true" />
      </span>
    );
  }

  return <span className="flex items-center justify-center text-xs text-muted-foreground">-</span>;
};

export default function PricingPage() {
  return (
    <div className="pt-20">
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(50%_60%_at_50%_40%,hsl(var(--primary)/0.12),transparent)]" />
        <div className="container text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Pricing</p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-6xl">
            Simple plans that grow with you.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Start for free, upgrade when you need more collaboration and deeper insights.
          </p>
          <div className="mt-8 inline-flex items-center rounded-full border bg-background px-4 py-2 text-xs font-semibold text-muted-foreground">
            Annual billing available with a discount.
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container">
          <div className="grid gap-8 lg:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative flex h-full flex-col rounded-2xl border bg-background p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg ${
                  plan.featured ? 'border-primary/60 shadow-xl' : ''
                }`}
              >
                {plan.featured ? (
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground">
                    Most Popular
                  </span>
                ) : null}
                <div className="space-y-3">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                    {plan.name}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">{plan.cadence}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>
                <Link
                  href={plan.ctaHref}
                  className={`mt-6 inline-flex items-center justify-center rounded-lg px-4 py-3 text-sm font-semibold transition-colors ${
                    plan.featured
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                      : 'border bg-background hover:bg-muted'
                  }`}
                >
                  {plan.cta}
                </Link>
                <div className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container">
          <div className="mb-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              Compare plans
            </p>
            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
              Everything you need, organized by capability
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-muted-foreground md:text-base">
              See exactly what&apos;s included in each plan. Compare features across core planning,
              AI, advanced workflows, and collaboration.
            </p>
          </div>

          <div className="overflow-x-auto rounded-3xl border bg-background">
            <table className="w-full min-w-[720px] border-separate border-spacing-0">
              <thead>
                <tr className="bg-muted/40">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                    Features
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold">Starter</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold">Pro</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold">Family</th>
                </tr>
              </thead>
              <tbody>
                {comparisonSections.map((section) => (
                  <Fragment key={section.title}>
                    <tr>
                      <td
                        colSpan={4}
                        className="border-t bg-primary/5 px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary"
                      >
                        {section.title}
                      </td>
                    </tr>
                    {section.rows.map((row) => (
                      <tr key={`${section.title}-${row.label}`} className="border-t">
                        <td className="px-6 py-4 text-sm text-foreground">{row.label}</td>
                        <td className="px-6 py-4 text-center">{renderPlanValue(row.starter)}</td>
                        <td className="px-6 py-4 text-center">{renderPlanValue(row.pro)}</td>
                        <td className="px-6 py-4 text-center">{renderPlanValue(row.family)}</td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="bg-muted/30 py-20">
        <div className="container grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h2 className="text-3xl font-bold md:text-4xl">Everything you need to stay aligned.</h2>
            <p className="mt-3 text-muted-foreground">
              Every plan includes secure workspaces, guided reviews, and the Alignia core toolkit.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {essentials.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 rounded-xl border bg-background p-4"
                >
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border bg-background p-8 shadow-xl">
            <h3 className="text-lg font-semibold">Need help deciding?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              We can recommend the best plan based on your team size and workflow.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Link
                href={appUrls.register}
                className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Start Free
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-lg border bg-background px-4 py-3 text-sm font-semibold transition-colors hover:bg-muted"
              >
                Talk to sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Frequently asked questions</h2>
            <p className="mt-3 text-muted-foreground">
              Quick answers to help you plan your subscription.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {faqs.map((faq) => (
              <div key={faq.question} className="rounded-2xl border bg-background p-6 shadow-sm">
                <h3 className="text-base font-semibold">{faq.question}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container">
          <div className="rounded-3xl bg-primary px-8 py-12 text-center text-primary-foreground shadow-2xl md:px-16">
            <h2 className="text-3xl font-bold md:text-4xl">Start building your rhythm today.</h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-primary-foreground/80 md:text-base">
              Get started for free and upgrade when you are ready to bring your whole team.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href={appUrls.register}
                className="inline-flex items-center justify-center rounded-lg bg-background px-6 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary-foreground/90"
              >
                Get Started Free
              </Link>
              <Link
                href="/features"
                className="inline-flex items-center justify-center rounded-lg border border-primary-foreground/40 px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-foreground/10"
              >
                Explore Features
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
