import type { Metadata } from 'next';
import { config } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Read how Alignia collects, uses, and protects your information.',
  alternates: {
    canonical: '/privacy',
  },
  openGraph: {
    title: 'Privacy Policy',
    description: 'Read how Alignia collects, uses, and protects your information.',
    url: `${config.siteUrl}/privacy`,
  },
};

export default function PrivacyPage() {
  return (
    <section className="container py-16 md:py-24">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="text-muted-foreground">
          We respect your privacy and keep data collection minimal. We collect only what&apos;s
          needed to provide the service, secure your account, and improve Alignia. We never sell
          your personal information.
        </p>
        <div className="space-y-4 text-muted-foreground">
          <p>
            Data you add—like goals, habits, and journal entries—remains yours. You can update or
            delete your account at any time from Settings.
          </p>
          <p>If you have any questions about this policy, reach out to hello@alignia.xyz.</p>
        </div>
      </div>
    </section>
  );
}
