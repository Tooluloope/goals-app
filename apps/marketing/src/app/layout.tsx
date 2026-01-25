import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Navbar, Footer } from '@/components';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Alignia - Achieve Your Goals',
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
  ],
  authors: [{ name: 'Alignia' }],
  openGraph: {
    title: 'Alignia - Achieve Your Goals',
    description:
      'The personal goal tracking app for individuals and families. Set meaningful goals, build lasting habits, and track your progress with AI-powered insights.',
    url: 'https://alignia.io',
    siteName: 'Alignia',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Alignia - Achieve Your Goals',
    description: 'The personal goal tracking app for individuals and families.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
