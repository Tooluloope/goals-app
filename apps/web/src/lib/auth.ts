import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import type { JWT } from 'next-auth/jwt';
import { createHmac, timingSafeEqual } from 'node:crypto';

const toBase64Url = (input: string) => Buffer.from(input, 'utf8').toString('base64url');

const fromBase64Url = (input: string) => Buffer.from(input, 'base64url').toString('utf8');

const signJwt = (payload: Record<string, unknown>, secret: string, maxAge?: number) => {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload } as Record<string, unknown>;

  if (typeof body.exp !== 'number' && typeof maxAge === 'number') {
    body.exp = now + maxAge;
  }
  if (typeof body.iat !== 'number') {
    body.iat = now;
  }

  const encodedHeader = toBase64Url(JSON.stringify(header));
  const encodedPayload = toBase64Url(JSON.stringify(body));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = createHmac('sha256', secret).update(signingInput).digest('base64url');

  return `${signingInput}.${signature}`;
};

const verifyJwt = (token: string, secret: string): JWT | null => {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, signature] = parts;
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = createHmac('sha256', secret).update(signingInput).digest('base64url');

  try {
    const sigBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expectedSignature);
    if (sigBuffer.length !== expectedBuffer.length) return null;
    if (!timingSafeEqual(sigBuffer, expectedBuffer)) return null;
  } catch {
    return null;
  }

  try {
    const payload = JSON.parse(fromBase64Url(encodedPayload)) as JWT;
    if (typeof payload.exp === 'number') {
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) return null;
    }
    return payload;
  } catch {
    return null;
  }
};

// Internal API call to NestJS for credential validation
async function validateCredentials(email: string, password: string) {
  const apiUrl =
    process.env.NESTJS_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  try {
    const response = await fetch(`${apiUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Error validating credentials:', error);
    return null;
  }
}

// Internal API call for magic link verification
async function verifyMagicLink(token: string) {
  const apiUrl =
    process.env.NESTJS_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  try {
    const response = await fetch(`${apiUrl}/api/auth/magic-link/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('Error verifying magic link:', error);
    return null;
  }
}

// Internal API call for signup
async function signupUser(name: string, email: string, password: string, timezone?: string) {
  const apiUrl =
    process.env.NESTJS_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  try {
    const response = await fetch(`${apiUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, timezone }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Signup failed' }));
      throw new Error(error.message || 'Signup failed');
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Error signing up:', error);
    throw error;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Trust the host header in development (required for NextAuth v5)
  trustHost: true,
  // No adapter needed - using JWT sessions with NestJS handling all database operations
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  jwt: {
    async encode({ token, secret, maxAge }) {
      if (!token) return '';
      const resolvedSecret = Array.isArray(secret) ? secret[0] : secret;
      return signJwt(token, resolvedSecret, maxAge);
    },
    async decode({ token, secret }) {
      if (!token) return null;
      const resolvedSecret = Array.isArray(secret) ? secret[0] : secret;
      return verifyJwt(token, resolvedSecret);
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  providers: [
    Credentials({
      id: 'credentials',
      name: 'Email & Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await validateCredentials(
          credentials.email as string,
          credentials.password as string
        );

        if (!user) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatar,
          defaultWorkspaceId: user.defaultWorkspaceId,
          timezone: user.timezone,
          hasSetPassword: user.hasSetPassword,
        };
      },
    }),
    Credentials({
      id: 'magic-link',
      name: 'Magic Link',
      credentials: {
        token: { label: 'Token', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.token) {
          return null;
        }

        const result = await verifyMagicLink(credentials.token as string);

        if (!result?.user) {
          return null;
        }

        return {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          image: result.user.avatar,
          defaultWorkspaceId: result.user.defaultWorkspaceId,
          timezone: result.user.timezone,
          hasSetPassword: result.user.hasSetPassword,
          isNewUser: result.isNewUser,
        };
      },
    }),
    Credentials({
      id: 'signup',
      name: 'Sign Up',
      credentials: {
        name: { label: 'Name', type: 'text' },
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        timezone: { label: 'Timezone', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.name || !credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const user = await signupUser(
            credentials.name as string,
            credentials.email as string,
            credentials.password as string,
            credentials.timezone as string | undefined
          );

          if (!user) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.avatar,
            defaultWorkspaceId: user.defaultWorkspaceId,
            timezone: user.timezone,
            hasSetPassword: user.hasSetPassword,
            isNewUser: true,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in - add user data to token
      if (user) {
        token.id = user.id;
        token.defaultWorkspaceId = user.defaultWorkspaceId;
        token.timezone = user.timezone;
        token.hasSetPassword = user.hasSetPassword;
        token.isNewUser = user.isNewUser;
      }

      // Handle session updates (e.g., after profile changes)
      if (trigger === 'update' && session) {
        token.name = session.name ?? token.name;
        token.email = session.email ?? token.email;
        token.defaultWorkspaceId = session.defaultWorkspaceId ?? token.defaultWorkspaceId;
        token.timezone = session.timezone ?? token.timezone;
        token.hasSetPassword = session.hasSetPassword ?? token.hasSetPassword;
        token.isNewUser = session.isNewUser ?? token.isNewUser;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.defaultWorkspaceId = token.defaultWorkspaceId as string;
        session.user.timezone = token.timezone as string;
        session.user.hasSetPassword = token.hasSetPassword as boolean;
        session.user.isNewUser = token.isNewUser as boolean | undefined;
      }
      return session;
    },
  },
});

// Export signup function for direct use in components
export { signupUser };
