import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Alignia - Goal Tracking App',
    short_name: 'Alignia',
    description:
      'The personal goal tracking app for individuals and families. Build habits, track goals, and achieve more with AI-powered insights.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#6366f1',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
