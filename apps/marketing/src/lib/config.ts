// Environment configuration for marketing site
// These values are inlined at build time by Next.js

export const config = {
  // Dashboard app URL (where users sign in/register)
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://app.alignia.xyz',

  // Marketing site URL
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://www.alignia.xyz',
} as const;

// Helper to build app URLs
export const appUrls = {
  login: `${config.appUrl}/auth/login`,
  register: `${config.appUrl}/auth/signup`,
  registerWithPlan: (plan: string) => `${config.appUrl}/auth/signup?plan=${plan}`,
} as const;
