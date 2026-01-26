import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface User {
    id: string;
    defaultWorkspaceId?: string;
    timezone?: string;
    hasSetPassword?: boolean;
    isNewUser?: boolean;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      defaultWorkspaceId?: string;
      timezone?: string;
      hasSetPassword?: boolean;
      isNewUser?: boolean;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    defaultWorkspaceId?: string;
    timezone?: string;
    hasSetPassword?: boolean;
    isNewUser?: boolean;
  }
}
