import type { Metadata } from 'next';
import { config } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Insights on habits, goal setting, and family alignment.',
  alternates: {
    canonical: '/blog',
  },
  robots: {
    index: false,
    follow: true,
  },
  openGraph: {
    title: 'Alignia Blog',
    description: 'Insights on habits, goal setting, and family alignment.',
    url: `${config.siteUrl}/blog`,
  },
};

export default function BlogPage() {
  return (
    <section className="container py-16 md:py-24">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">Blog</h1>
        <p className="text-lg text-muted-foreground">
          We&apos;re preparing a library of practical guides and stories. Check back soon for fresh
          insights on goal setting and habit design.
        </p>
      </div>
    </section>
  );
}
