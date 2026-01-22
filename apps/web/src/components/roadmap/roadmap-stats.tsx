'use client';

import { Target, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface RoadmapStatsProps {
  totalGoals: number;
  completedGoals: number;
  inProgressGoals: number;
  completionRate: number;
}

export function RoadmapStats({
  totalGoals,
  completedGoals,
  inProgressGoals,
  completionRate,
}: RoadmapStatsProps) {
  const stats = [
    {
      label: 'Total Goals',
      value: totalGoals,
      icon: Target,
      iconColor: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      label: 'Completed',
      value: completedGoals,
      icon: CheckCircle2,
      iconColor: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      label: 'In Progress',
      value: inProgressGoals,
      icon: Clock,
      iconColor: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'Completion Rate',
      value: `${completionRate}%`,
      icon: TrendingUp,
      iconColor: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className={`rounded-full p-3 ${stat.bgColor}`}>
                <Icon className={`h-6 w-6 ${stat.iconColor}`} />
              </div>
              <div>
                <p className="text-3xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
