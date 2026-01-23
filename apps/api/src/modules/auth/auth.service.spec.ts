import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../../prisma/prisma.service';

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

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    passwordHash: 'hashed-password',
    timezone: 'UTC',
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
      },
      workspaceConfig: {
        create: jest.fn(),
      },
      refreshToken: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
        deleteMany: jest.fn(),
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: UsersService, useValue: mockUsersService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get(PrismaService);
    jwtService = module.get(JwtService);
    _configService = module.get(ConfigService);
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
            create: jest.fn().mockResolvedValue({ id: 'workspace-1', name: "Test User's Goals" }),
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

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
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
});
