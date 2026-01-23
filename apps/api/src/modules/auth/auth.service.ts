import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { EmailService } from '../email/email.service';
import { LoginDto, SignupDto, AuthTokens, DEFAULT_WORKSPACE_CONFIG } from '@goals/shared';
import { ChangeEmailDto } from './dto/change-email.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
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
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
    private emailService: EmailService
  ) {}

  async validateUser(email: string, password: string): Promise<UserWithoutPassword | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      const { passwordHash: _passwordHash, ...result } = user;
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

    const { passwordHash: _hash, ...userWithoutPassword } = result;
    const tokens = await this.generateTokens(result.id, result.email);
    await this.saveRefreshToken(result.id, tokens.refreshToken);

    // Send welcome email (non-blocking)
    this.emailService.sendWelcomeEmail(result.email, result.name).catch((err) => {
      this.logger.error(`Failed to send welcome email to ${result.email}:`, err);
    });

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

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user) {
      return {
        message: 'If an account exists with this email, a password reset link will be sent.',
      };
    }

    // Invalidate any existing reset tokens for this user
    await this.prisma.passwordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    // Generate a secure random token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30); // Token expires in 30 minutes

    // Save the reset token
    await this.prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    // Send password reset email (non-blocking)
    this.emailService.sendPasswordResetEmail(user.email, user.name, token).catch((err) => {
      this.logger.error(`Failed to send password reset email to ${user.email}:`, err);
    });

    return { message: 'If an account exists with this email, a password reset link will be sent.' };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update user password and mark token as used
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
      // Invalidate all refresh tokens for security
      this.prisma.refreshToken.deleteMany({
        where: { userId: resetToken.userId },
      }),
    ]);

    // Send password changed confirmation email (non-blocking)
    this.emailService
      .sendPasswordChangedEmail(resetToken.user.email, resetToken.user.name)
      .catch((err) => {
        this.logger.error(
          `Failed to send password changed email to ${resetToken.user.email}:`,
          err
        );
      });

    return { message: 'Password has been reset successfully' };
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

  async changeEmail(
    userId: string,
    data: ChangeEmailDto
  ): Promise<{ message: string; email: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    const passwordMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!passwordMatch) {
      throw new ForbiddenException('Incorrect password');
    }

    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing && existing.id !== userId) {
      throw new ConflictException('Email already in use');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { email: data.email },
      select: { id: true, email: true },
    });

    // Invalidate refresh tokens so user reauthenticates
    await this.prisma.refreshToken.deleteMany({ where: { userId } });

    return { message: 'Email updated successfully', email: updated.email };
  }

  async changePassword(userId: string, data: ChangePasswordDto): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    const match = await bcrypt.compare(data.currentPassword, user.passwordHash);
    if (!match) {
      throw new ForbiddenException('Current password is incorrect');
    }

    if (data.currentPassword === data.newPassword) {
      throw new BadRequestException('New password must differ from current');
    }

    const passwordHash = await bcrypt.hash(data.newPassword, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
      this.prisma.refreshToken.deleteMany({ where: { userId } }),
    ]);

    // Send password changed confirmation email (non-blocking)
    this.emailService
      .sendPasswordChangedEmail(user.email, user.name)
      .catch((err) =>
        this.logger.error(`Failed to send password changed email to ${user.email}:`, err)
      );

    return { message: 'Password updated successfully. Please log in again.' };
  }
}
