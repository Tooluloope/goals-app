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
    <section className="container py-16 md:py-24">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">About Alignia</h1>
        <p className="text-lg text-muted-foreground">
          Alignia is built for people who want clarity, momentum, and shared accountability. We
          combine daily rhythm tracking, intentional reviews, and AI-powered insights to help
          individuals and families stay aligned on the goals that matter most.
        </p>
        <p className="text-muted-foreground">
          Our mission is simple: turn your best intentions into consistent action. Whether
          you&apos;re building personal habits or coordinating family goals, Alignia gives you a
          calm, focused space to plan, reflect, and grow together.
        </p>
      </div>
    </section>
  );
}
