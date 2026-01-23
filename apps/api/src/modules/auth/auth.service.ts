import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { LoginDto, SignupDto, AuthTokens, DEFAULT_WORKSPACE_CONFIG } from '@goals/shared';
import { User } from '@goals/database';

// Response types for Auth
type UserWithoutPassword = Omit<User, 'passwordHash'>;

interface AuthResponse {
  user: UserWithoutPassword;
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService
  ) {}

  async validateUser(email: string, password: string): Promise<UserWithoutPassword | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user.id, user.email);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      user,
      ...tokens,
    };
  }

  async signup(signupDto: SignupDto): Promise<AuthResponse> {
    // Check if user exists
    const existing = await this.prisma.user.findUnique({
      where: { email: signupDto.email },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(signupDto.password, 10);

    const result = await this.prisma.$transaction(async (tx) => {
      // Create user
      const newUser = await tx.user.create({
        data: {
          email: signupDto.email,
          name: signupDto.name,
          passwordHash,
          timezone: signupDto.timezone || 'UTC', // Use provided timezone or default to UTC
          settings: {
            theme: 'light',
            compactMode: false,
            showWelcomeOnLogin: true,
          },
        },
      });

      // Create personal workspace
      const workspace = await tx.workspace.create({
        data: {
          name: `${signupDto.name}'s Goals`,
          type: 'personal',
          ownerId: newUser.id,
        },
      });

      // Add user as workspace member
      await tx.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId: newUser.id,
          role: 'owner',
        },
      });

      // Create workspace config with defaults
      await tx.workspaceConfig.create({
        data: {
          workspaceId: workspace.id,
          config: DEFAULT_WORKSPACE_CONFIG as any,
        },
      });

      // Update user with default workspace
      const updatedUser = await tx.user.update({
        where: { id: newUser.id },
        data: { defaultWorkspaceId: workspace.id },
      });

      return updatedUser;
    });

    const { passwordHash: _, ...userWithoutPassword } = result;
    const tokens = await this.generateTokens(result.id, result.email);
    await this.saveRefreshToken(result.id, tokens.refreshToken);

    return {
      user: userWithoutPassword,
      ...tokens,
    };
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Delete old token (use deleteMany to avoid error if already deleted)
    await this.prisma.refreshToken.deleteMany({ where: { id: storedToken.id } });

    // Generate new tokens
    const tokens = await this.generateTokens(storedToken.userId, storedToken.user.email);
    await this.saveRefreshToken(storedToken.userId, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { userId, token: refreshToken },
    });
  }

  private async generateTokens(userId: string, email: string): Promise<AuthTokens> {
    const payload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async saveRefreshToken(userId: string, token: string): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Use upsert to handle race conditions where the same token might be generated
    await this.prisma.refreshToken.upsert({
      where: { token },
      update: { expiresAt },
      create: { token, userId, expiresAt },
    });
  }
}
