/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Optimized for Docker production builds
  // Proxy API requests to backend - useful for tunnels
  // Note: NextAuth routes (/api/auth/*) are handled by Next.js, not proxied
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    return {
      beforeFiles: [
        // Proxy all API requests EXCEPT /api/auth/* (NextAuth routes)
        {
          source: '/api/:path((?!auth).*)',
          destination: `${apiUrl}/api/:path*`,
        },
      ],
    };
  },
};

module.exports = nextConfig;
