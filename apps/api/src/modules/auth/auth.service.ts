import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import type { User } from '@goals/database';
import type { AuthTokens, LoginDto, SignupDto } from '@goals/shared';
import { DEFAULT_WORKSPACE_CONFIG } from '@goals/shared';

import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { StripeService } from '../stripe/stripe.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

import type { ChangeEmailDto } from './dto/change-email.dto';
import type { ChangePasswordDto } from './dto/change-password.dto';

// Response types for Auth
type UserWithoutPassword = Omit<User, 'passwordHash'>;

interface AuthResponse {
  user: UserWithoutPassword;
  accessToken: string;
  refreshToken: string;
}

interface MagicLinkAuthResponse extends AuthResponse {
  isNewUser: boolean;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private prisma: PrismaService,
    private emailService: EmailService,
    private stripeService: StripeService,
    private subscriptionsService: SubscriptionsService
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

    const now = new Date();
    const isSuperAdmin = this.isSuperAdminEmail(user.email);

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: now,
        loginCount: { increment: 1 },
        ...(isSuperAdmin && user.role !== 'SUPER_ADMIN' ? { role: 'SUPER_ADMIN' } : {}),
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        defaultWorkspaceId: true,
        role: true,
        timezone: true,
        emailVerifiedAt: true,
        lastLoginAt: true,
        loginCount: true,
        settings: true,
        hasSetPassword: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const tokens = await this.generateTokens(user.id, user.email);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return {
      user: updatedUser,
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
      const now = new Date();
      // Create user
      const newUser = await tx.user.create({
        data: {
          email: signupDto.email,
          name: signupDto.name,
          passwordHash,
          timezone: signupDto.timezone || 'UTC', // Use provided timezone or default to UTC
          role: this.isSuperAdminEmail(signupDto.email) ? 'SUPER_ADMIN' : 'USER',
          lastLoginAt: now,
          loginCount: 1,
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
          name: `${signupDto.name}'s Workspace`,
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

    // Initialize subscription and usage quota for new user
    try {
      const stripeCustomer = await this.stripeService.createOrGetCustomer(
        result.id,
        result.email,
        result.name
      );
      await this.subscriptionsService.initializeForNewUser(result.id, stripeCustomer, 'FREE');
    } catch (error) {
      this.logger.error(`Failed to initialize subscription for new user ${result.id}:`, error);
      // Don't fail signup if subscription initialization fails
    }

    // Auto-join any pending workspace invites for this email
    const pendingInvites = await this.prisma.workspaceInvite.findMany({
      where: {
        email: result.email,
        status: 'pending',
        expiresAt: { gt: new Date() },
      },
    });

    if (pendingInvites.length > 0) {
      await this.prisma.$transaction(async (tx) => {
        for (const invite of pendingInvites) {
          const exists = await tx.workspaceMember.findUnique({
            where: {
              workspaceId_userId: { workspaceId: invite.workspaceId, userId: result.id },
            },
          });

          if (!exists) {
            await tx.workspaceMember.create({
              data: {
                workspaceId: invite.workspaceId,
                userId: result.id,
                role: invite.role,
              },
            });
          }

          await tx.workspaceInvite.update({
            where: { id: invite.id },
            data: { status: 'accepted', acceptedAt: new Date() },
          });
        }
      });
    }

    const tokens = await this.generateTokens(result.id, result.email);
    await this.saveRefreshToken(result.id, tokens.refreshToken);

    // Send welcome email (non-blocking)
    this.emailService.sendWelcomeEmail(result.email, result.name).catch((err) => {
      this.logger.error(`Failed to send welcome email to ${result.email}:`, err);
    });

    // Send verification email (non-blocking)
    this.sendEmailVerification(result.id, result.email, result.name).catch((err) => {
      this.logger.error(`Failed to send verification email to ${result.email}:`, err);
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

  async requestMagicLink(email: string, name?: string): Promise<{ message: string }> {
    // Check if user exists
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Invalidate any existing magic link tokens for this email
    await this.prisma.magicLinkToken.updateMany({
      where: { email, used: false },
      data: { used: true },
    });

    // Generate a secure random token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // Token expires in 15 minutes

    // Save the magic link token (include name for new user signup)
    await this.prisma.magicLinkToken.create({
      data: {
        token,
        email,
        name: user ? null : name, // Only store name if user doesn't exist
        userId: user?.id || null,
        expiresAt,
      },
    });

    // Send magic link email (non-blocking)
    this.emailService.sendMagicLinkEmail(email, user?.name || name || null, token).catch((err) => {
      this.logger.error(`Failed to send magic link email to ${email}:`, err);
    });

    return { message: 'If an account exists with this email, a magic link will be sent.' };
  }

  async verifyMagicLink(token: string): Promise<MagicLinkAuthResponse> {
    const magicLinkToken = await this.prisma.magicLinkToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!magicLinkToken || magicLinkToken.used || magicLinkToken.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired magic link');
    }

    // Mark token as used
    await this.prisma.magicLinkToken.update({
      where: { id: magicLinkToken.id },
      data: { used: true },
    });

    // If user exists, log them in
    if (magicLinkToken.user) {
      const now = new Date();
      const isSuperAdmin = this.isSuperAdminEmail(magicLinkToken.user.email);

      const updatedUser = await this.prisma.user.update({
        where: { id: magicLinkToken.user.id },
        data: {
          ...(magicLinkToken.user.emailVerifiedAt ? {} : { emailVerifiedAt: now }),
          lastLoginAt: now,
          loginCount: { increment: 1 },
          ...(isSuperAdmin && magicLinkToken.user.role !== 'SUPER_ADMIN'
            ? { role: 'SUPER_ADMIN' }
            : {}),
        },
      });

      const { passwordHash: _passwordHash, ...userWithoutPassword } = updatedUser;
      const tokens = await this.generateTokens(updatedUser.id, updatedUser.email);
      await this.saveRefreshToken(updatedUser.id, tokens.refreshToken);

      return {
        user: userWithoutPassword,
        ...tokens,
        isNewUser: false,
      };
    }

    // If user doesn't exist, we need to create an account
    // For magic link, we'll create a user with a random password (they can set it later)
    const randomPassword = crypto.randomBytes(32).toString('hex');
    const passwordHash = await bcrypt.hash(randomPassword, 10);
    // Use the name provided during magic link request, or fall back to email prefix
    const userName = magicLinkToken.name || magicLinkToken.email.split('@')[0];

    const result = await this.prisma.$transaction(async (tx) => {
      const now = new Date();
      // Create user (with hasSetPassword: false since they signed up via magic link)
      const newUser = await tx.user.create({
        data: {
          email: magicLinkToken.email,
          name: userName,
          passwordHash,
          hasSetPassword: false,
          emailVerifiedAt: new Date(),
          role: this.isSuperAdminEmail(magicLinkToken.email) ? 'SUPER_ADMIN' : 'USER',
          lastLoginAt: now,
          loginCount: 1,
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
          name: `${userName}'s Workspace`,
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

    // Auto-join any pending workspace invites for this email
    const pendingInvites = await this.prisma.workspaceInvite.findMany({
      where: {
        email: result.email,
        status: 'pending',
        expiresAt: { gt: new Date() },
      },
    });

    if (pendingInvites.length > 0) {
      await this.prisma.$transaction(async (tx) => {
        for (const invite of pendingInvites) {
          const exists = await tx.workspaceMember.findUnique({
            where: {
              workspaceId_userId: { workspaceId: invite.workspaceId, userId: result.id },
            },
          });

          if (!exists) {
            await tx.workspaceMember.create({
              data: {
                workspaceId: invite.workspaceId,
                userId: result.id,
                role: invite.role,
              },
            });
          }

          await tx.workspaceInvite.update({
            where: { id: invite.id },
            data: { status: 'accepted', acceptedAt: new Date() },
          });
        }
      });
    }

    const tokens = await this.generateTokens(result.id, result.email);
    await this.saveRefreshToken(result.id, tokens.refreshToken);

    // Send welcome email (non-blocking)
    this.emailService.sendWelcomeEmail(result.email, result.name).catch((err) => {
      this.logger.error(`Failed to send welcome email to ${result.email}:`, err);
    });

    return {
      user: userWithoutPassword,
      ...tokens,
      isNewUser: true,
    };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const verificationToken = await this.prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken || verificationToken.expires < new Date()) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    const userId = verificationToken.identifier;
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { emailVerifiedAt: user.emailVerifiedAt ?? new Date() },
      }),
      this.prisma.verificationToken.delete({
        where: { token },
      }),
    ]);

    return { message: 'Email verified successfully' };
  }

  async resendVerificationEmail(userId: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException();
    }

    if (user.emailVerifiedAt) {
      return { message: 'Email is already verified' };
    }

    await this.sendEmailVerification(user.id, user.email, user.name);
    return { message: 'Verification email sent' };
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

  private isSuperAdminEmail(email: string): boolean {
    const configured = this.configService.get<string>('SUPER_ADMIN_EMAIL');
    if (!configured) {
      return false;
    }
    return configured.trim().toLowerCase() === email.trim().toLowerCase();
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
      data: { email: data.email, emailVerifiedAt: null },
      select: { id: true, email: true },
    });

    this.sendEmailVerification(userId, data.email, user.name).catch((err) => {
      this.logger.error(`Failed to send verification email to ${data.email}:`, err);
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
      this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash, hasSetPassword: true },
      }),
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

  // Set password for users who signed up via magic link (no current password required)
  async setPassword(userId: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    // Only allow if user hasn't set a password yet (magic link signup)
    if (user.hasSetPassword) {
      throw new BadRequestException('Password already set. Use change password instead.');
    }

    if (newPassword.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { passwordHash, hasSetPassword: true },
      }),
      this.prisma.refreshToken.deleteMany({ where: { userId } }),
    ]);

    // Send password set confirmation email (non-blocking)
    this.emailService
      .sendPasswordChangedEmail(user.email, user.name)
      .catch((err) =>
        this.logger.error(`Failed to send password set email to ${user.email}:`, err)
      );

    return { message: 'Password set successfully. Please log in again.' };
  }

  private async sendEmailVerification(userId: string, email: string, name: string): Promise<void> {
    await this.prisma.verificationToken.deleteMany({
      where: { identifier: userId },
    });

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date();
    expires.setHours(expires.getHours() + 24);

    await this.prisma.verificationToken.create({
      data: {
        identifier: userId,
        token,
        expires,
      },
    });

    this.emailService.sendVerificationEmail(email, name, token).catch((err) => {
      this.logger.error(`Failed to send verification email to ${email}:`, err);
    });
  }

  async deleteAccount(userId: string, password: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      throw new ForbiddenException('Incorrect password');
    }

    await this.prisma.$transaction(async (tx) => {
      // Get all workspaces owned by this user
      const ownedWorkspaces = await tx.workspace.findMany({
        where: { ownerId: userId },
        include: { members: true },
      });

      for (const workspace of ownedWorkspaces) {
        if (workspace.type === 'personal') {
          // Delete personal workspaces entirely
          await tx.workspace.delete({ where: { id: workspace.id } });
        } else {
          // For family/shared workspaces, transfer ownership or delete
          const otherMembers = workspace.members.filter((m) => m.userId !== userId);
          if (otherMembers.length > 0) {
            // Transfer ownership to the first other member
            const newOwner = otherMembers[0];
            await tx.workspace.update({
              where: { id: workspace.id },
              data: { ownerId: newOwner.userId },
            });
            // Update their role to owner
            await tx.workspaceMember.update({
              where: { id: newOwner.id },
              data: { role: 'owner' },
            });
          } else {
            // No other members, delete the workspace
            await tx.workspace.delete({ where: { id: workspace.id } });
          }
        }
      }

      // Delete the user (cascade will handle most related data)
      await tx.user.delete({ where: { id: userId } });
    });

    this.logger.log(`Account deleted for user ${user.email}`);

    return { message: 'Account deleted successfully' };
  }
}
