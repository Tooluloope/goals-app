import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { User } from '@goals/database';
import * as jwt from 'jsonwebtoken';

type UserWithoutPassword = Omit<User, 'passwordHash'>;

interface NextAuthJwtPayload {
  id?: string;
  sub?: string;
  email?: string;
  name?: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class NextAuthStrategy extends PassportStrategy(Strategy, 'nextauth') {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService
  ) {
    super();
  }

  async validate(req: any): Promise<UserWithoutPassword> {
    // Try to get the NextAuth session token from different sources
    const token = this.extractToken(req);

    if (!token) {
      throw new UnauthorizedException('No authentication token provided');
    }

    try {
      const secret = this.configService.get<string>('NEXTAUTH_SECRET');
      if (!secret) {
        throw new UnauthorizedException('NextAuth secret not configured');
      }

      // Decode and verify the NextAuth JWT
      const decoded = jwt.verify(token, secret) as NextAuthJwtPayload;

      // Extract user ID from the token (NextAuth uses 'id' or 'sub')
      const userId = decoded.id || decoded.sub;
      if (!userId) {
        throw new UnauthorizedException('Invalid token: no user ID');
      }

      // Fetch the user from database
      const user = await this.usersService.findById(userId);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return user;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedException('Token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedException('Invalid token');
      }
      throw new UnauthorizedException('Authentication failed');
    }
  }

  private extractToken(req: any): string | null {
    // 1. Check Authorization header (Bearer token)
    const authHeader = req.headers?.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.slice(7);
    }

    // 2. Check for NextAuth session token in cookies
    // NextAuth uses different cookie names based on the environment
    const cookies = req.cookies || {};
    const sessionToken =
      cookies['next-auth.session-token'] || // Development (HTTP)
      cookies['__Secure-next-auth.session-token'] || // Production (HTTPS)
      cookies['authjs.session-token'] || // Auth.js v5 (HTTP)
      cookies['__Secure-authjs.session-token']; // Auth.js v5 (HTTPS)

    if (sessionToken) {
      return sessionToken;
    }

    // 3. Check custom header for cross-origin requests
    const customToken = req.headers?.['x-session-token'];
    if (customToken) {
      return customToken;
    }

    return null;
  }
}
