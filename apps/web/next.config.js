/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Optimized for Docker production builds
  // Proxy API requests to backend
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    return [
      // Proxy all API requests to NestJS EXCEPT NextAuth routes
      // NextAuth routes (session, signin, signout, etc.) are handled by Next.js
      {
        source: '/api/auth/logout',
        destination: `${apiUrl}/api/auth/logout`,
      },
      {
        source: '/api/auth/login',
        destination: `${apiUrl}/api/auth/login`,
      },
      {
        source: '/api/auth/signup',
        destination: `${apiUrl}/api/auth/signup`,
      },
      {
        source: '/api/auth/refresh',
        destination: `${apiUrl}/api/auth/refresh`,
      },
      {
        source: '/api/auth/change-email',
        destination: `${apiUrl}/api/auth/change-email`,
      },
      {
        source: '/api/auth/change-password',
        destination: `${apiUrl}/api/auth/change-password`,
      },
      {
        source: '/api/auth/set-password',
        destination: `${apiUrl}/api/auth/set-password`,
      },
      {
        source: '/api/auth/forgot-password',
        destination: `${apiUrl}/api/auth/forgot-password`,
      },
      {
        source: '/api/auth/reset-password',
        destination: `${apiUrl}/api/auth/reset-password`,
      },
      {
        source: '/api/auth/magic-link/request',
        destination: `${apiUrl}/api/auth/magic-link/request`,
      },
      {
        source: '/api/auth/magic-link/verify',
        destination: `${apiUrl}/api/auth/magic-link/verify`,
      },
      {
        source: '/api/auth/account',
        destination: `${apiUrl}/api/auth/account`,
      },
      // Proxy all other non-auth API routes
      {
        source: '/api/:path((?!auth).*)*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
