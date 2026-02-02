import Link from 'next/link';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { appUrls } from '@/lib/config';

const tiers = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Build clarity and a steady routine without the noise.',
    features: [
      'Up to 5 habits',
      'Up to 3 goals',
      'Daily journal',
      'Basic dashboard stats',
      '1 personal workspace',
      'Email reminders',
    ],
    cta: 'Get Started',
    href: appUrls.register,
    popular: false,
  },
  {
    name: 'Pro',
    price: '$7',
    period: '/month',
    description: 'For sustained momentum, insights, and deeper reflection.',
    features: [
      'Unlimited habits',
      'Unlimited goals',
      'AI Chat & insights',
      'AI summaries',
      'Weekly & monthly reviews',
      'Advanced analytics',
      'Data export',
      'Priority support',
    ],
    cta: 'Start Pro Trial',
    href: appUrls.registerWithPlan('pro'),
    popular: true,
  },
  {
    name: 'Family',
    price: '$14',
    period: '/month',
    description: 'For families who want shared alignment and accountability.',
    features: [
      'Everything in Pro',
      'Up to 6 family members',
      'Shared workspaces',
      'Member invitations',
      'Family progress dashboard',
      'Collaborative goals',
    ],
    cta: 'Start Family Trial',
    href: appUrls.registerWithPlan('family'),
    popular: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="py-20 md:py-28 bg-muted/30">
      <div className="container">
        {/* Section Header */}
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
            Choose the outcomes you want
          </h2>
          <p className="text-lg text-muted-foreground">
            Start free for clarity. Upgrade for momentum. Add family for shared alignment.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={cn(
                'relative flex flex-col rounded-2xl border bg-background p-8',
                tier.popular && 'border-primary shadow-lg ring-1 ring-primary'
              )}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-sm font-medium text-primary-foreground">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-semibold">{tier.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{tier.price}</span>
                  <span className="text-muted-foreground">{tier.period}</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{tier.description}</p>
              </div>

              <ul className="mb-8 flex-1 space-y-3">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={tier.href}
                className={cn(
                  'rounded-lg px-4 py-3 text-center text-sm font-medium transition-colors',
                  tier.popular
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'border bg-background hover:bg-muted'
                )}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* FAQ teaser */}
        <p className="mt-12 text-center text-sm text-muted-foreground">
          Have questions?{' '}
          <Link href="/contact" className="text-primary hover:underline">
            Contact us
          </Link>{' '}
          or check our FAQ.
        </p>
      </div>
    </section>
  );
}
