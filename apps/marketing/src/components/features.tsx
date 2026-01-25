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
      'Set and track meaningful goals with visual boards. Break down big goals into actionable tasks and milestones.',
  },
  {
    icon: CheckSquare,
    title: 'Habit Tracking',
    description:
      'Build lasting habits with daily tracking, streak counters, and gentle reminders to keep you on track.',
  },
  {
    icon: BookOpen,
    title: 'Daily Journal',
    description:
      'Reflect on your day with guided prompts. Track your mood, wins, challenges, and gratitude.',
  },
  {
    icon: Calendar,
    title: 'Weekly & Monthly Reviews',
    description: 'Regular reflection cycles help you learn from the past and plan for the future.',
  },
  {
    icon: Brain,
    title: 'AI-Powered Insights',
    description:
      'Get personalized advice, summaries, and pattern detection powered by advanced AI.',
  },
  {
    icon: Users,
    title: 'Family Workspaces',
    description:
      'Share goals with family members. Track progress together and celebrate wins as a team.',
  },
  {
    icon: BarChart3,
    title: 'Progress Analytics',
    description: 'Visualize your progress with charts and statistics. See how far you have come.',
  },
  {
    icon: Bell,
    title: 'Smart Reminders',
    description:
      'Never miss a deadline with intelligent email reminders for tasks, habits, and reviews.',
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 md:py-28">
      <div className="container">
        {/* Section Header */}
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
            Everything you need to achieve your goals
          </h2>
          <p className="text-lg text-muted-foreground">
            A comprehensive toolkit designed to help you set, track, and achieve your personal and
            professional goals.
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
