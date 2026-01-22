'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AreaData {
  name: string;
  total: number;
  completed: number;
  completionRate: number;
  color: string;
}

interface MonthlyData {
  month: string;
  completed: number;
  started: number;
}

interface ProgressChartsProps {
  areaData: AreaData[];
  monthlyData: MonthlyData[];
}

export function AreaProgressChart({ data }: { data: AreaData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Progress by Area</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis type="number" domain={[0, 100]} unit="%" />
              <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value) => [`${value}%`, 'Completion']}
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Bar
                dataKey="completionRate"
                fill="hsl(var(--primary))"
                radius={[0, 4, 4, 0]}
                maxBarSize={30}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          {data.map((area) => (
            <div key={area.name} className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: area.color || 'hsl(var(--primary))' }}
              />
              <span className="text-muted-foreground">
                {area.name}: {area.completed}/{area.total}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function MonthlyProgressChart({ data }: { data: MonthlyData[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Monthly Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="completed"
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ fill: '#22c55e', strokeWidth: 2 }}
                name="Completed"
              />
              <Line
                type="monotone"
                dataKey="started"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ fill: '#6366f1', strokeWidth: 2 }}
                name="Started"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProgressCharts({ areaData, monthlyData }: ProgressChartsProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <AreaProgressChart data={areaData} />
      <MonthlyProgressChart data={monthlyData} />
    </div>
  );
}
