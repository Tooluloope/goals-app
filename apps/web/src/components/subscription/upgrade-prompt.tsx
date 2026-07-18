'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Sparkles, ShieldCheck, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/store/auth-store';
import { cn } from '@/lib/utils';
import type { SubscriptionPlan } from '@/lib/plan-guard';

type UpgradePromptProps = {
  requiredPlan: Exclude<SubscriptionPlan, 'FREE'>;
  title?: string;
  description?: string;
};

const PLAN_COPY: Record<
  UpgradePromptProps['requiredPlan'],
  {
    label: string;
    price: string;
    features: string[];
    icon: typeof Sparkles;
  }
> = {
  PRO: {
    label: 'Pro',
    price: '$12 / month',
    features: [
      'AI insights + recommendations',
      'Weekly + monthly reviews',
      'Advanced planning tools',
      'Unlimited goals and habits',
    ],
    icon: Sparkles,
  },
  FAMILY: {
    label: 'Family',
    price: '$29 / month',
    features: [
      'Up to 6 family members',
      'Shared calendars + boards',
      'Family Hub workspace',
      'Everything in Pro',
    ],
    icon: Users,
  },
};

export function UpgradePrompt({ requiredPlan, title, description }: UpgradePromptProps) {
  const [isUpgrading, setIsUpgrading] = useState(false);
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const plan = PLAN_COPY[requiredPlan];
  const Icon = plan.icon;

  const content = useMemo(
    () => ({
      title:
        title ||
        (requiredPlan === 'FAMILY'
          ? 'Upgrade to Family to collaborate together'
          : 'Unlock Pro features for this experience'),
      description:
        description ||
        (requiredPlan === 'FAMILY'
          ? 'Bring your family into a shared workspace with calendars, boards, and progress tracking.'
          : 'Access AI insights, structured reviews, and advanced planning tools.'),
    }),
    [description, requiredPlan, title]
  );

  const handleUpgrade = async () => {
    if (isUpgrading) return;
    setIsUpgrading(true);
    try {
      if (isAdmin) {
        await apiClient.adminActivatePlan(requiredPlan);
        window.location.reload();
        return;
      }
      const appUrl = window.location.origin;
      const { url } = await apiClient.createCheckoutSession(
        requiredPlan,
        `${appUrl}/settings#subscription`,
        `${appUrl}/settings#subscription`
      );
      window.location.href = url;
    } catch {
      setIsUpgrading(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
      <Card className="w-full max-w-2xl overflow-hidden border-primary/20 bg-gradient-to-br from-background via-background to-primary/5 shadow-lg">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-2xl">{content.title}</CardTitle>
              <p className="text-sm text-muted-foreground">{content.description}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-2xl border bg-background/80 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  {plan.label} plan
                </p>
                <p className="text-2xl font-bold">{isAdmin ? 'Free (Admin)' : plan.price}</p>
                {!isAdmin && (
                  <p className="text-xs text-muted-foreground">Includes a 14-day free trial.</p>
                )}
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ShieldCheck className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 grid gap-2 text-sm">
              {plan.features.map((feature) => (
                <div key={feature} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary/70" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              onClick={handleUpgrade}
              className={cn('w-full sm:w-auto', isUpgrading && 'opacity-70')}
              disabled={isUpgrading}
            >
              {isUpgrading
                ? isAdmin
                  ? 'Activating…'
                  : 'Redirecting…'
                : isAdmin
                  ? `Activate ${plan.label} (Admin)`
                  : `Upgrade to ${plan.label}`}
            </Button>
            <Button variant="outline" asChild className="w-full sm:w-auto">
              <Link href="/dashboard">Go back to dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
