import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { StripeService } from '../stripe/stripe.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { UsersService } from '../users/users.service';

import { AuthService } from './auth.service';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: any;
  let jwtService: any;
  let _configService: any;
  let emailService: any;

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    passwordHash: 'hashed-password',
    role: 'USER',
    timezone: 'UTC',
    lastLoginAt: new Date('2024-01-01T00:00:00.000Z'),
    loginCount: 2,
    settings: {},
    defaultWorkspaceId: 'workspace-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTokens = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  };

  beforeEach(async () => {
    const mockPrismaService = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      workspace: {
        create: jest.fn(),
      },
      workspaceMember: {
        create: jest.fn(),
        findUnique: jest.fn(),
      },
      workspaceConfig: {
        create: jest.fn(),
      },
      workspaceInvite: {
        findMany: jest.fn(),
        update: jest.fn(),
      },
      refreshToken: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
        deleteMany: jest.fn(),
      },
      verificationToken: {
        create: jest.fn().mockResolvedValue({}),
        deleteMany: jest.fn().mockResolvedValue({}),
        findUnique: jest.fn(),
        delete: jest.fn().mockResolvedValue({}),
      },
      $transaction: jest.fn(),
    };

    const mockJwtService = {
      signAsync: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const mockUsersService = {
      findById: jest.fn(),
    };

    const mockEmailService = {
      sendWelcomeEmail: jest.fn().mockResolvedValue({}),
      sendVerificationEmail: jest.fn().mockResolvedValue({}),
      sendPasswordResetEmail: jest.fn().mockResolvedValue({}),
      sendPasswordChangedEmail: jest.fn().mockResolvedValue({}),
      sendMagicLinkEmail: jest.fn().mockResolvedValue({}),
    };

    const mockStripeService = {
      createOrGetCustomer: jest.fn().mockResolvedValue('cus_123'),
      createCheckoutSession: jest.fn(),
      createPortalSession: jest.fn(),
      cancelSubscription: jest.fn(),
      handleSubscriptionUpdate: jest.fn(),
      handleSubscriptionDeleted: jest.fn(),
      constructWebhookEvent: jest.fn(),
    };

    const mockSubscriptionsService = {
      getOrCreateSubscription: jest.fn(),
      getSubscriptionStatus: jest.fn(),
      requiresPlan: jest.fn(),
      enforceplan: jest.fn(),
      canAccessAI: jest.fn(),
      canCreateFamilyWorkspace: jest.fn(),
      getPlanLimits: jest.fn(),
      initializeForNewUser: jest.fn().mockResolvedValue({}),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: StripeService, useValue: mockStripeService },
        { provide: SubscriptionsService, useValue: mockSubscriptionsService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get(PrismaService);
    jwtService = module.get(JwtService);
    _configService = module.get(ConfigService);
    emailService = module.get(EmailService);
    prismaService.workspaceInvite.findMany.mockResolvedValue([]);
    prismaService.user.update.mockResolvedValue(mockUser);
    prismaService.$transaction.mockImplementation(async (cb: any) => cb(prismaService));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should return user without password when credentials are valid', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password123');

      expect(result).toBeDefined();
      expect(result?.email).toBe(mockUser.email);
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('should return null when user is not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.validateUser('nonexistent@example.com', 'password');

      expect(result).toBeNull();
    });

    it('should return null when password is incorrect', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser('test@example.com', 'wrong-password');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return user and tokens on successful login', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.signAsync
        .mockResolvedValueOnce(mockTokens.accessToken)
        .mockResolvedValueOnce(mockTokens.refreshToken);
      prismaService.refreshToken.upsert.mockResolvedValue({} as any);

      const result = await service.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe(mockUser.email);
    });

    it('should throw UnauthorizedException on invalid credentials', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.login({ email: 'test@example.com', password: 'wrong' })).rejects.toThrow(
        UnauthorizedException
      );
    });
  });

  describe('signup', () => {
    it('should create user with workspace and return tokens', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      const mockCreatedUser = { ...mockUser };
      prismaService.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          user: {
            create: jest.fn().mockResolvedValue(mockCreatedUser),
            update: jest.fn().mockResolvedValue(mockCreatedUser),
          },
          workspace: {
            create: jest
              .fn()
              .mockResolvedValue({ id: 'workspace-1', name: "Test User's Workspace" }),
          },
          workspaceMember: {
            create: jest.fn().mockResolvedValue({}),
          },
          workspaceConfig: {
            create: jest.fn().mockResolvedValue({}),
          },
        });
      });

      jwtService.signAsync
        .mockResolvedValueOnce(mockTokens.accessToken)
        .mockResolvedValueOnce(mockTokens.refreshToken);
      prismaService.refreshToken.upsert.mockResolvedValue({} as any);

      const result = await service.signup({
        email: 'new@example.com',
        name: 'New User',
        password: 'password123',
      });

      // Allow non-blocking async calls (sendEmailVerification) to complete
      await new Promise(process.nextTick);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(prismaService.verificationToken.create).toHaveBeenCalled();
      expect(emailService.sendVerificationEmail).toHaveBeenCalled();
    });

    it('should throw ConflictException if email already exists', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.signup({
          email: 'test@example.com',
          name: 'Test',
          password: 'password123',
        })
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('refreshTokens', () => {
    it('should generate new tokens for valid refresh token', async () => {
      const storedToken = {
        id: 'token-1',
        token: 'valid-refresh-token',
        userId: mockUser.id,
        user: mockUser,
        expiresAt: new Date(Date.now() + 86400000), // tomorrow
        createdAt: new Date(),
      };

      prismaService.refreshToken.findUnique.mockResolvedValue(storedToken);
      prismaService.refreshToken.deleteMany.mockResolvedValue({ count: 1 });
      jwtService.signAsync
        .mockResolvedValueOnce('new-access-token')
        .mockResolvedValueOnce('new-refresh-token');
      prismaService.refreshToken.upsert.mockResolvedValue({} as any);

      const result = await service.refreshTokens('valid-refresh-token');

      expect(result).toHaveProperty('accessToken', 'new-access-token');
      expect(result).toHaveProperty('refreshToken', 'new-refresh-token');
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      prismaService.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.refreshTokens('invalid-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for expired refresh token', async () => {
      const expiredToken = {
        id: 'token-1',
        token: 'expired-token',
        userId: mockUser.id,
        user: mockUser,
        expiresAt: new Date(Date.now() - 86400000), // yesterday
        createdAt: new Date(),
      };

      prismaService.refreshToken.findUnique.mockResolvedValue(expiredToken);

      await expect(service.refreshTokens('expired-token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should delete refresh token on logout', async () => {
      prismaService.refreshToken.deleteMany.mockResolvedValue({ count: 1 });

      await service.logout(mockUser.id, 'refresh-token');

      expect(prismaService.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id, token: 'refresh-token' },
      });
    });
  });

  describe('forgotPassword', () => {
    beforeEach(() => {
      prismaService.passwordResetToken = {
        updateMany: jest.fn().mockResolvedValue({}),
        create: jest.fn().mockResolvedValue({}),
      };
    });

    it('should return success message when user exists', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.forgotPassword('test@example.com');

      expect(result.message).toContain('If an account exists');
      expect(prismaService.passwordResetToken.create).toHaveBeenCalled();
    });

    it('should return success message even when user does not exist (prevent enumeration)', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.forgotPassword('nonexistent@example.com');

      expect(result.message).toContain('If an account exists');
      expect(prismaService.passwordResetToken.create).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    const mockResetToken = {
      id: 'reset-1',
      token: 'valid-reset-token',
      userId: 'user-1',
      used: false,
      expiresAt: new Date(Date.now() + 86400000),
      user: mockUser,
    };

    beforeEach(() => {
      prismaService.passwordResetToken = {
        findUnique: jest.fn(),
        update: jest.fn(),
      };
    });

    it('should reset password with valid token', async () => {
      prismaService.passwordResetToken.findUnique.mockResolvedValue(mockResetToken);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');
      prismaService.$transaction.mockResolvedValue([{}, {}, {}]);

      const result = await service.resetPassword('valid-reset-token', 'newPassword123');

      expect(result.message).toBe('Password has been reset successfully');
    });

    it('should throw BadRequestException for invalid token', async () => {
      prismaService.passwordResetToken.findUnique.mockResolvedValue(null);

      await expect(service.resetPassword('invalid-token', 'newPassword123')).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw BadRequestException for used token', async () => {
      prismaService.passwordResetToken.findUnique.mockResolvedValue({
        ...mockResetToken,
        used: true,
      });

      await expect(service.resetPassword('used-token', 'newPassword123')).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw BadRequestException for expired token', async () => {
      prismaService.passwordResetToken.findUnique.mockResolvedValue({
        ...mockResetToken,
        expiresAt: new Date(Date.now() - 86400000),
      });

      await expect(service.resetPassword('expired-token', 'newPassword123')).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('requestMagicLink', () => {
    beforeEach(() => {
      prismaService.magicLinkToken = {
        updateMany: jest.fn().mockResolvedValue({}),
        create: jest.fn().mockResolvedValue({}),
      };
    });

    it('should create magic link for existing user', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.requestMagicLink('test@example.com');

      expect(result.message).toContain('If an account exists');
      expect(prismaService.magicLinkToken.create).toHaveBeenCalled();
    });

    it('should create magic link for new user with name', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.requestMagicLink('new@example.com', 'New User');

      expect(result.message).toContain('If an account exists');
      expect(prismaService.magicLinkToken.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            email: 'new@example.com',
            name: 'New User',
          }),
        })
      );
    });
  });

  describe('verifyMagicLink', () => {
    const mockMagicLinkToken = {
      id: 'magic-1',
      token: 'valid-magic-token',
      email: 'test@example.com',
      name: null,
      userId: 'user-1',
      used: false,
      expiresAt: new Date(Date.now() + 86400000),
      user: mockUser,
    };

    beforeEach(() => {
      prismaService.magicLinkToken = {
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      };
    });

    it('should authenticate existing user with magic link', async () => {
      prismaService.magicLinkToken.findUnique.mockResolvedValue(mockMagicLinkToken);
      jwtService.signAsync
        .mockResolvedValueOnce(mockTokens.accessToken)
        .mockResolvedValueOnce(mockTokens.refreshToken);
      prismaService.refreshToken.upsert.mockResolvedValue({});

      const result = await service.verifyMagicLink('valid-magic-token');

      expect(result.isNewUser).toBe(false);
      expect(result.user.email).toBe(mockUser.email);
      expect(result.accessToken).toBe(mockTokens.accessToken);
    });

    it('should create new user when magic link used for registration', async () => {
      const newUserMagicLink = {
        ...mockMagicLinkToken,
        user: null,
        userId: null,
        name: 'New User',
      };
      prismaService.magicLinkToken.findUnique.mockResolvedValue(newUserMagicLink);
      (bcrypt.hash as jest.Mock).mockResolvedValue('random-hash');

      const mockCreatedUser = { ...mockUser, id: 'new-user-id', hasSetPassword: false };
      prismaService.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          user: {
            create: jest.fn().mockResolvedValue(mockCreatedUser),
            update: jest.fn().mockResolvedValue(mockCreatedUser),
          },
          workspace: {
            create: jest.fn().mockResolvedValue({ id: 'workspace-1' }),
          },
          workspaceMember: {
            create: jest.fn().mockResolvedValue({}),
            findUnique: jest.fn().mockResolvedValue(null),
          },
          workspaceConfig: {
            create: jest.fn().mockResolvedValue({}),
          },
          workspaceInvite: {
            update: jest.fn().mockResolvedValue({}),
          },
        });
      });

      jwtService.signAsync
        .mockResolvedValueOnce(mockTokens.accessToken)
        .mockResolvedValueOnce(mockTokens.refreshToken);
      prismaService.refreshToken.upsert.mockResolvedValue({});

      const result = await service.verifyMagicLink('valid-magic-token');

      expect(result.isNewUser).toBe(true);
    });

    it('should throw BadRequestException for invalid magic link', async () => {
      prismaService.magicLinkToken.findUnique.mockResolvedValue(null);

      await expect(service.verifyMagicLink('invalid-token')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for used magic link', async () => {
      prismaService.magicLinkToken.findUnique.mockResolvedValue({
        ...mockMagicLinkToken,
        used: true,
      });

      await expect(service.verifyMagicLink('used-token')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for expired magic link', async () => {
      prismaService.magicLinkToken.findUnique.mockResolvedValue({
        ...mockMagicLinkToken,
        expiresAt: new Date(Date.now() - 86400000),
      });

      await expect(service.verifyMagicLink('expired-token')).rejects.toThrow(BadRequestException);
    });
  });

  describe('email verification', () => {
    it('should verify email with valid token', async () => {
      prismaService.verificationToken.findUnique.mockResolvedValue({
        token: 'verify-token',
        identifier: mockUser.id,
        expires: new Date(Date.now() + 86400000),
      });
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.user.update.mockResolvedValue({ ...mockUser, emailVerifiedAt: new Date() });
      prismaService.verificationToken.delete.mockResolvedValue({});
      prismaService.$transaction.mockImplementation(async (actions: any[]) => Promise.all(actions));

      const result = await service.verifyEmail('verify-token');

      expect(result.message).toContain('Email verified');
      expect(prismaService.user.update).toHaveBeenCalled();
      expect(prismaService.verificationToken.delete).toHaveBeenCalledWith({
        where: { token: 'verify-token' },
      });
    });

    it('should reject invalid verification token', async () => {
      prismaService.verificationToken.findUnique.mockResolvedValue(null);

      await expect(service.verifyEmail('invalid-token')).rejects.toThrow(BadRequestException);
    });

    it('should resend verification email for unverified user', async () => {
      prismaService.user.findUnique.mockResolvedValue({ ...mockUser, emailVerifiedAt: null });
      prismaService.verificationToken.deleteMany.mockResolvedValue({});
      prismaService.verificationToken.create.mockResolvedValue({});

      const result = await service.resendVerificationEmail(mockUser.id);

      expect(result.message).toContain('Verification email sent');
      expect(emailService.sendVerificationEmail).toHaveBeenCalled();
    });

    it('should return early if email already verified', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        emailVerifiedAt: new Date(),
      });

      const result = await service.resendVerificationEmail(mockUser.id);

      expect(result.message).toContain('already verified');
      expect(emailService.sendVerificationEmail).not.toHaveBeenCalled();
    });
  });

  describe('changeEmail', () => {
    it('should change email with valid password', async () => {
      prismaService.user.findUnique
        .mockResolvedValueOnce(mockUser) // First call - get current user
        .mockResolvedValueOnce(null); // Second call - check if new email exists
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      prismaService.user.update.mockResolvedValue({ id: 'user-1', email: 'new@example.com' });
      prismaService.refreshToken.deleteMany.mockResolvedValue({});

      const result = await service.changeEmail('user-1', {
        email: 'new@example.com',
        password: 'password123',
      });

      expect(result.email).toBe('new@example.com');
    });

    it('should throw UnauthorizedException when user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.changeEmail('user-1', { email: 'new@example.com', password: 'password123' })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw ForbiddenException for incorrect password', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.changeEmail('user-1', { email: 'new@example.com', password: 'wrongpassword' })
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException when email already in use', async () => {
      prismaService.user.findUnique
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce({ id: 'other-user' }); // Email exists for another user
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        service.changeEmail('user-1', { email: 'existing@example.com', password: 'password123' })
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('changePassword', () => {
    it('should change password with valid current password', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');
      prismaService.$transaction.mockResolvedValue([{}, {}]);

      const result = await service.changePassword('user-1', {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword123',
      });

      expect(result.message).toContain('Password updated successfully');
    });

    it('should throw UnauthorizedException when user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.changePassword('user-1', {
          currentPassword: 'oldpassword',
          newPassword: 'newpassword123',
        })
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw ForbiddenException for incorrect current password', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.changePassword('user-1', {
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword123',
        })
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when new password same as current', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(
        service.changePassword('user-1', {
          currentPassword: 'samepassword',
          newPassword: 'samepassword',
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('setPassword', () => {
    it('should set password for magic link user', async () => {
      const magicLinkUser = { ...mockUser, hasSetPassword: false };
      prismaService.user.findUnique.mockResolvedValue(magicLinkUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');
      prismaService.$transaction.mockResolvedValue([{}, {}]);

      const result = await service.setPassword('user-1', 'newpassword123');

      expect(result.message).toContain('Password set successfully');
    });

    it('should throw UnauthorizedException when user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.setPassword('user-1', 'newpassword123')).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should throw BadRequestException when user already has password', async () => {
      prismaService.user.findUnique.mockResolvedValue({ ...mockUser, hasSetPassword: true });

      await expect(service.setPassword('user-1', 'newpassword123')).rejects.toThrow(
        BadRequestException
      );
    });

    it('should throw BadRequestException for password too short', async () => {
      prismaService.user.findUnique.mockResolvedValue({ ...mockUser, hasSetPassword: false });

      await expect(service.setPassword('user-1', 'short')).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteAccount', () => {
    it('should delete account with valid password', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      prismaService.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          workspace: {
            findMany: jest
              .fn()
              .mockResolvedValue([
                { id: 'ws-1', type: 'personal', ownerId: 'user-1', members: [] },
              ]),
            delete: jest.fn().mockResolvedValue({}),
            update: jest.fn().mockResolvedValue({}),
          },
          workspaceMember: {
            update: jest.fn().mockResolvedValue({}),
          },
          user: {
            delete: jest.fn().mockResolvedValue({}),
          },
        });
      });

      const result = await service.deleteAccount('user-1', 'password123');

      expect(result.message).toBe('Account deleted successfully');
    });

    it('should throw UnauthorizedException when user not found', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.deleteAccount('user-1', 'password123')).rejects.toThrow(
        UnauthorizedException
      );
    });

    it('should throw ForbiddenException for incorrect password', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.deleteAccount('user-1', 'wrongpassword')).rejects.toThrow(
        ForbiddenException
      );
    });

    it('should transfer ownership of shared workspace when deleting account', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const workspaceUpdate = jest.fn().mockResolvedValue({});
      const memberUpdate = jest.fn().mockResolvedValue({});

      prismaService.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          workspace: {
            findMany: jest.fn().mockResolvedValue([
              {
                id: 'ws-1',
                type: 'family',
                ownerId: 'user-1',
                members: [
                  { id: 'member-1', userId: 'user-1', role: 'owner' },
                  { id: 'member-2', userId: 'user-2', role: 'member' },
                ],
              },
            ]),
            delete: jest.fn().mockResolvedValue({}),
            update: workspaceUpdate,
          },
          workspaceMember: {
            update: memberUpdate,
          },
          user: {
            delete: jest.fn().mockResolvedValue({}),
          },
        });
      });

      await service.deleteAccount('user-1', 'password123');

      // Should have transferred ownership
      expect(workspaceUpdate).toHaveBeenCalledWith({
        where: { id: 'ws-1' },
        data: { ownerId: 'user-2' },
      });
      expect(memberUpdate).toHaveBeenCalledWith({
        where: { id: 'member-2' },
        data: { role: 'owner' },
      });
    });

    it('should delete shared workspace with no other members', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const workspaceDelete = jest.fn().mockResolvedValue({});

      prismaService.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          workspace: {
            findMany: jest.fn().mockResolvedValue([
              {
                id: 'ws-1',
                type: 'family',
                ownerId: 'user-1',
                members: [{ id: 'member-1', userId: 'user-1', role: 'owner' }],
              },
            ]),
            delete: workspaceDelete,
            update: jest.fn().mockResolvedValue({}),
          },
          workspaceMember: {
            update: jest.fn().mockResolvedValue({}),
          },
          user: {
            delete: jest.fn().mockResolvedValue({}),
          },
        });
      });

      await service.deleteAccount('user-1', 'password123');

      // Should have deleted the workspace since no other members
      expect(workspaceDelete).toHaveBeenCalledWith({ where: { id: 'ws-1' } });
    });
  });

  describe('signup - auto-join pending invites', () => {
    it('should auto-join pending workspace invites on signup', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

      const mockCreatedUser = { ...mockUser };
      prismaService.$transaction.mockImplementation(async (callback: any) => {
        return callback({
          user: {
            create: jest.fn().mockResolvedValue(mockCreatedUser),
            update: jest.fn().mockResolvedValue(mockCreatedUser),
          },
          workspace: {
            create: jest.fn().mockResolvedValue({ id: 'workspace-1' }),
          },
          workspaceMember: {
            create: jest.fn().mockResolvedValue({}),
            findUnique: jest.fn().mockResolvedValue(null),
          },
          workspaceConfig: {
            create: jest.fn().mockResolvedValue({}),
          },
          workspaceInvite: {
            update: jest.fn().mockResolvedValue({}),
          },
        });
      });

      // Mock pending invites
      prismaService.workspaceInvite.findMany.mockResolvedValue([
        {
          id: 'invite-1',
          workspaceId: 'invited-ws-1',
          email: 'test@example.com',
          role: 'member',
        },
      ]);

      jwtService.signAsync
        .mockResolvedValueOnce(mockTokens.accessToken)
        .mockResolvedValueOnce(mockTokens.refreshToken);
      prismaService.refreshToken.upsert.mockResolvedValue({});

      await service.signup({
        email: 'test@example.com',
        name: 'New User',
        password: 'password123',
      });

      // Verify transaction was called to handle invites
      expect(prismaService.$transaction).toHaveBeenCalledTimes(2);
    });
  });
});
