import type { Metadata, Viewport } from 'next';
import { Space_Grotesk } from 'next/font/google';
import './globals.css';
import { Navbar, Footer } from '@/components';
import { config } from '@/lib/config';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  weight: ['300', '400', '500', '600', '700'],
});

export const viewport: Viewport = {
  themeColor: '#6366f1',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(config.siteUrl),
  title: {
    default: 'Alignia - Achieve Your Goals',
    template: '%s | Alignia',
  },
  description:
    'The personal goal tracking app for individuals and families. Set meaningful goals, build lasting habits, and track your progress with AI-powered insights.',
  keywords: [
    'goal tracking',
    'habit tracker',
    'productivity',
    'goal setting',
    'personal development',
    'family goals',
    'AI insights',
    'daily journal',
    'weekly review',
    'goal management',
    'habit building',
  ],
  authors: [{ name: 'Alignia', url: config.siteUrl }],
  creator: 'Alignia',
  publisher: 'Alignia',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon', type: 'image/png' },
    ],
    apple: [{ url: '/apple-icon', type: 'image/png' }],
  },
  openGraph: {
    title: 'Alignia - Achieve Your Goals',
    description:
      'The personal goal tracking app for individuals and families. Set meaningful goals, build lasting habits, and track your progress with AI-powered insights.',
    url: config.siteUrl,
    siteName: 'Alignia',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Alignia - Goal Tracking App',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Alignia - Achieve Your Goals',
    description:
      'The personal goal tracking app for individuals and families. Build habits, track goals, achieve more.',
    images: ['/twitter-image'],
    creator: '@alignia',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add these when you have the verification codes
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
};

// Structured Data (JSON-LD)
const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Alignia',
    url: config.siteUrl,
    logo: `${config.siteUrl}/icon.svg`,
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Alignia',
    url: config.siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${config.siteUrl}/?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Alignia',
    description:
      'The personal goal tracking app for individuals and families. Set meaningful goals, build lasting habits, and track your progress with AI-powered insights.',
    url: config.siteUrl,
    applicationCategory: 'Productivity',
    operatingSystem: 'Web',
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'USD',
      lowPrice: 0,
      highPrice: 14,
      offerCount: 3,
    },
    author: {
      '@type': 'Organization',
      name: 'Alignia',
      url: config.siteUrl,
    },
  },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={spaceGrotesk.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-background font-space-grotesk antialiased">
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
