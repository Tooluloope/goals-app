import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { appUrls } from '@/lib/config';

export function CTA() {
  return (
    <section className="py-20 md:py-28">
      <div className="container">
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl bg-primary p-8 text-center md:p-16">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.1),transparent)]" />

          <div className="relative">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-primary-foreground md:text-4xl">
              Ready to achieve your goals?
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-lg text-primary-foreground/80">
              Join thousands of people who are building better habits, tracking meaningful goals,
              and achieving more with Alignia.
            </p>
            <Link
              href={appUrls.register}
              className="group inline-flex items-center gap-2 rounded-lg bg-background px-6 py-3 text-sm font-medium text-foreground transition-all hover:bg-background/90 hover:gap-3"
            >
              Start Your Free Account
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <p className="mt-4 text-sm text-primary-foreground/60">
              Free forever. No credit card required.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
