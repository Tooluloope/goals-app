import type { Metadata } from 'next';
import { config } from '@/lib/config';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Review the terms that govern your use of Alignia.',
  alternates: {
    canonical: '/terms',
  },
  openGraph: {
    title: 'Terms of Service',
    description: 'Review the terms that govern your use of Alignia.',
    url: `${config.siteUrl}/terms`,
  },
};

export default function TermsPage() {
  return (
    <section className="container py-16 md:py-24">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
        <p className="text-muted-foreground">
          By using Alignia, you agree to use the service responsibly and keep your account secure.
          You own the content you create and grant Alignia permission to store and process it so we
          can deliver the product experience.
        </p>
        <p className="text-muted-foreground">
          We may update these terms occasionally. We&apos;ll notify you when there are material
          changes. If you have questions, contact hello@alignia.xyz.
        </p>
      </div>
    </section>
  );
}
