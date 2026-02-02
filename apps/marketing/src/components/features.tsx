import {
  Target,
  CheckSquare,
  Calendar,
  Brain,
  Users,
  BookOpen,
  BarChart3,
  Bell,
} from 'lucide-react';

const features = [
  {
    icon: Target,
    title: 'Goal Management',
    description:
      'Turn your vision into clear steps you can finish. Keep goals visible and moving forward.',
  },
  {
    icon: CheckSquare,
    title: 'Habit Tracking',
    description:
      'Build routines that match your values and actually stick, one small win at a time.',
  },
  {
    icon: BookOpen,
    title: 'Daily Journal',
    description:
      'Capture wins, emotions, and insights so you can grow with intention, not guesswork.',
  },
  {
    icon: Calendar,
    title: 'Weekly & Monthly Reviews',
    description: 'Close the loop each week. Learn faster, realign, and plan with confidence.',
  },
  {
    icon: Brain,
    title: 'AI-Powered Insights',
    description: 'Spot patterns, get guidance, and stay aligned when life shifts.',
  },
  {
    icon: Users,
    title: 'Family Workspaces',
    description: 'Share goals, build accountability, and celebrate progress together.',
  },
  {
    icon: BarChart3,
    title: 'Progress Analytics',
    description: 'See momentum at a glance and celebrate real, measurable growth.',
  },
  {
    icon: Bell,
    title: 'Smart Reminders',
    description: 'Gentle nudges that keep you on track without the overwhelm.',
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 md:py-28">
      <div className="container">
        {/* Section Header */}
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
            What Alignia does for you
          </h2>
          <p className="text-lg text-muted-foreground">
            Clarity, consistency, and confidence - all in one connected system.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-xl border bg-background p-6 transition-all hover:border-primary/50 hover:shadow-lg"
            >
              <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
