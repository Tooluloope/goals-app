import type { Metadata } from 'next';
import { config } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Get in touch with Alignia for support, partnerships, or media inquiries.',
  alternates: {
    canonical: '/contact',
  },
  openGraph: {
    title: 'Contact Alignia',
    description: 'Get in touch with Alignia for support, partnerships, or media inquiries.',
    url: `${config.siteUrl}/contact`,
  },
};

export default function ContactPage() {
  return (
    <section className="container py-16 md:py-24">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">Contact</h1>
        <p className="text-lg text-muted-foreground">
          We love hearing from the Alignia community. Send us a note and we&apos;ll get back within
          two business days.
        </p>
        <div className="rounded-2xl border bg-card p-6">
          <p className="text-sm text-muted-foreground">Email</p>
          <p className="text-lg font-semibold">hello@alignia.io</p>
        </div>
      </div>
    </section>
  );
}
