export type SubscriptionPlan = 'FREE' | 'PRO' | 'FAMILY';
export type PaidPlan = Exclude<SubscriptionPlan, 'FREE'>;

const PLAN_LEVEL: Record<SubscriptionPlan, number> = {
  FREE: 0,
  PRO: 1,
  FAMILY: 2,
};

type PlanRouteRequirement = {
  prefix: string;
  requiredPlan: PaidPlan;
  title?: string;
  description?: string;
};

const PLAN_ROUTE_REQUIREMENTS: PlanRouteRequirement[] = [
  {
    prefix: '/family',
    requiredPlan: 'FAMILY',
    title: 'Upgrade to FAMILY plan to collaborate with your family',
    description: 'Create shared workspaces, calendars, and boards for the whole family.',
  },
  {
    prefix: '/ai2',
    requiredPlan: 'PRO',
    title: 'Unlock AI-powered insights and recommendations',
    description: 'Get personalized guidance, summaries, and habit suggestions powered by AI.',
  },
  {
    prefix: '/ai',
    requiredPlan: 'PRO',
    title: 'Unlock AI-powered insights and recommendations',
    description: 'Get personalized guidance, summaries, and habit suggestions powered by AI.',
  },
  {
    prefix: '/rhythm',
    requiredPlan: 'PRO',
    title: 'Unlock daily journal prompts and reflection',
    description: 'Build momentum with guided daily rhythm check-ins and journal streaks.',
  },
  {
    prefix: '/rhythm2',
    requiredPlan: 'PRO',
    title: 'Unlock daily journal prompts and reflection',
    description: 'Build momentum with guided daily rhythm check-ins and journal streaks.',
  },
  {
    prefix: '/reviews/weekly',
    requiredPlan: 'PRO',
    title: 'Unlock structured weekly and monthly reviews',
    description: 'Stay aligned with guided reviews that surface wins and next steps.',
  },
  {
    prefix: '/reviews/monthly',
    requiredPlan: 'PRO',
    title: 'Unlock structured weekly and monthly reviews',
    description: 'Stay aligned with guided reviews that surface wins and next steps.',
  },
  {
    prefix: '/calendar',
    requiredPlan: 'PRO',
    title: 'Unlock advanced planning and visualization tools',
    description: 'Plan ahead with calendar views that connect goals and tasks.',
  },
  {
    prefix: '/roadmap',
    requiredPlan: 'PRO',
    title: 'Unlock advanced planning and visualization tools',
    description: 'Map progress across timelines to keep your goals on track.',
  },
  {
    prefix: '/dependencies',
    requiredPlan: 'PRO',
    title: 'Unlock advanced planning and visualization tools',
    description: 'Visualize goal dependencies and unblock what matters most.',
  },
];

export type PlanRequirement = {
  requiredPlan: PaidPlan;
  title?: string;
  description?: string;
};

export function getPlanRequirement(pathname: string): PlanRequirement | null {
  const match = PLAN_ROUTE_REQUIREMENTS.find((route) => pathname.startsWith(route.prefix));
  if (!match) return null;
  return {
    requiredPlan: match.requiredPlan,
    title: match.title,
    description: match.description,
  };
}

export function hasPlanAccess(
  userPlan: SubscriptionPlan | null | undefined,
  requiredPlan: PaidPlan
): boolean {
  if (!userPlan) return false;
  return PLAN_LEVEL[userPlan] >= PLAN_LEVEL[requiredPlan];
}
